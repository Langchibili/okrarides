// PATH: rider/lib/hooks/useDeliveryBooking.js
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket/SocketProvider';
import {
  estimateDeliveryFare,
  createDelivery,
  getDelivery,
  cancelDelivery,
  getActiveDelivery,
} from '@/lib/api/deliveries';

// Delivery socket events (emitted by backend)
const DEL = {
  ACCEPTED:         'delivery:accepted',
  DRIVER_ARRIVED:   'delivery:driver:arrived',
  STARTED:          'delivery:started',
  COMPLETED:        'delivery:completed',
  CANCELLED:        'delivery:cancelled',
  NO_DRIVERS:       'delivery:no_drivers',
  PAYMENT_REQUESTED:'delivery:payment:requested',
};

function getPollingInterval() {
  try {
    const v = window.__adminSettings?.appsServerPollingIntervalInSeconds;
    if (v && Number(v) > 0) return Number(v) * 1000;
  } catch {}
  return 20_000;
}

const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'arrived', 'passenger_onboard', 'awaiting_payment']);

export function useDeliveryBooking() {
  const router = useRouter();
  const { on, off, emit, connected } = useSocket();

  // ─── State ────────────────────────────────────────────────────────────────
  const [currentDelivery, setCurrentDelivery]   = useState(null);
  const [estimate, setEstimate]                 = useState(null);
  const [estimating, setEstimating]             = useState(false);
  const [booking, setBooking]                   = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [noDeliverersAvailable, setNoDeliverersAvailable] = useState(false);

  const pollRef         = useRef(null);
  const mountedRef      = useRef(true);
  const currentRef      = useRef(null);

  useEffect(() => { currentRef.current = currentDelivery; }, [currentDelivery]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
    };
  }, []);

  // ─── Status polling ───────────────────────────────────────────────────────
  const startPoll = useCallback((deliveryId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      if (!mountedRef.current || !deliveryId) return;
      try {
        const res = await getDelivery(deliveryId);
        const d   = res?.data ?? res;
        if (!d || !mountedRef.current) return;

        if (d.rideStatus === 'completed' || d.paymentStatus === 'completed') {
          clearInterval(pollRef.current);
          router.push(`/deliveries/${deliveryId}`);
          return;
        }
        if (d.rideStatus === 'cancelled') {
          clearInterval(pollRef.current);
          setCurrentDelivery(null);
          return;
        }
        setCurrentDelivery(prev => prev ? { ...prev, ...d } : d);
      } catch (err) {
        console.error('[useDeliveryBooking] poll error:', err);
      }
    }, getPollingInterval());
  }, [router]);

  const stopPoll = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }, []);

  useEffect(() => {
    if (currentDelivery?.id && ACTIVE_STATUSES.has(currentDelivery.rideStatus)) {
      startPoll(currentDelivery.id);
    } else {
      stopPoll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDelivery?.id, currentDelivery?.rideStatus]);

  // ─── Socket events ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;

    const match = (data) =>
      !currentRef.current?.id || !data?.deliveryId ||
      String(data.deliveryId) === String(currentRef.current.id);

    const handleAccepted = (data) => {
      if (!match(data)) return;
      setCurrentDelivery(prev => prev ? { ...prev, rideStatus: 'accepted', deliverer: data.deliverer ?? prev.deliverer } : prev);
      // Navigate from finding-deliverer → tracking
      if (currentRef.current?.id) {
        router.push(`/deliveries/${currentRef.current.id}/tracking`);
      }
    };

    const handleArrived = (data) => {
      if (!match(data)) return;
      setCurrentDelivery(prev => prev ? { ...prev, rideStatus: 'arrived' } : prev);
    };

    const handleStarted = (data) => {
      if (!match(data)) return;
      setCurrentDelivery(prev => prev ? { ...prev, rideStatus: 'passenger_onboard' } : prev);
    };

    const handleCompleted = (data) => {
      if (!match(data)) return;
      stopPoll();
      router.push(`/deliveries/${currentRef.current?.id ?? data.deliveryId}`);
    };

    const handleCancelled = (data) => {
      if (!match(data)) return;
      stopPoll();
      setCurrentDelivery(null);
      setError('Delivery was cancelled.');
    };

    const handleNoDrivers = (data) => {
      if (!match(data)) return;
      stopPoll();
      setCurrentDelivery(null);
      setNoDeliverersAvailable(true);
    };

    const handlePaymentRequested = (data) => {
      if (!match(data)) return;
      setCurrentDelivery(prev => prev ? { ...prev, rideStatus: 'awaiting_payment' } : prev);
    };

    on(DEL.ACCEPTED,          handleAccepted);
    on(DEL.DRIVER_ARRIVED,    handleArrived);
    on(DEL.STARTED,           handleStarted);
    on(DEL.COMPLETED,         handleCompleted);
    on(DEL.CANCELLED,         handleCancelled);
    on(DEL.NO_DRIVERS,        handleNoDrivers);
    on(DEL.PAYMENT_REQUESTED, handlePaymentRequested);

    return () => {
      off(DEL.ACCEPTED);
      off(DEL.DRIVER_ARRIVED);
      off(DEL.STARTED);
      off(DEL.COMPLETED);
      off(DEL.CANCELLED);
      off(DEL.NO_DRIVERS);
      off(DEL.PAYMENT_REQUESTED);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, on, off, stopPoll, router]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const getEstimate = useCallback(async ({ pickupLocation, dropoffLocation, packageType }) => {
    setEstimating(true);
    setError(null);
    setEstimate(null);
    try {
      const res  = await estimateDeliveryFare({ pickupLocation, dropoffLocation, packageType });
      const data = res?.data ?? res;
      setEstimate(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to get estimate');
      return null;
    } finally {
      setEstimating(false);
    }
  }, []);

  const bookDelivery = useCallback(async (deliveryData) => {
    setBooking(true);
    setError(null);
    setNoDeliverersAvailable(false);
    try {
      const res  = await createDelivery(deliveryData);
      const data = res?.data ?? res;
      if (!data?.id) throw new Error('Failed to create delivery');
      setCurrentDelivery(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to book delivery');
      throw err;
    } finally {
      setBooking(false);
    }
  }, []);

  const cancelCurrentDelivery = useCallback(async (reason = 'Sender cancelled') => {
    const id = currentRef.current?.id;
    if (!id) return;
    try {
      setLoading(true);
      await cancelDelivery(id, reason);
      stopPoll();
      setCurrentDelivery(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [stopPoll]);

  const loadActiveDelivery = useCallback(async () => {
    try {
      const res = await getActiveDelivery();
      const d   = res?.data ?? null;
      if (d) setCurrentDelivery(d);
      return d;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => { loadActiveDelivery(); }, [loadActiveDelivery]);

  return {
    currentDelivery,
    setCurrentDelivery,
    estimate,
    estimating,
    booking,
    loading,
    error,
    setError,
    noDeliverersAvailable,
    setNoDeliverersAvailable,
    getEstimate,
    bookDelivery,
    cancelCurrentDelivery,
    loadActiveDelivery,
    hasActiveDelivery: !!currentDelivery,
  };
}

export default useDeliveryBooking;