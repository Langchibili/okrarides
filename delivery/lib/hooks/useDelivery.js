// PATH: driver/lib/hooks/useDelivery.js
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import { deliveriesAPI } from '@/lib/api/deliveries';
import { useSocket } from '@/lib/socket/SocketProvider';
import { useRouter } from 'next/navigation';

// ─── Socket event constants (delivery-specific) ──────────────────────────────
const DEL_EVENTS = {
  REQUEST_NEW:      'delivery:request:new',
  REQUEST_RECEIVED: 'delivery:request:received',
  ACCEPTED:         'delivery:accepted',
  TAKEN:            'delivery:taken',
  CANCELLED:        'delivery:cancelled',
  STARTED:          'delivery:started',
  COMPLETED:        'delivery:completed',
  PAYMENT_REQUESTED:'delivery:payment:requested',
  NO_DRIVERS:       'delivery:no_drivers',
  PAYMENT_RECEIVED: 'payment:received',
};

function getPollingInterval() {
  try {
    const v = window.__adminSettings?.appsServerPollingIntervalInSeconds;
    if (v && Number(v) > 0) return Number(v) * 1000;
  } catch {}
  return 20_000;
}

const ACTIVE_STATUSES = new Set(['accepted', 'arrived', 'passenger_onboard', 'awaiting_payment']);

export const useDelivery = () => {
  const [currentDelivery, setCurrentDelivery]   = useState(null);
  const [incomingDelivery, setIncomingDelivery] = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);

  const { on, off, emit, connected } = useSocket();
  const router = useRouter();

  const pollRef               = useRef(null);
  const mountedRef            = useRef(true);
  const currentDeliveryRef    = useRef(null);

  useEffect(() => { currentDeliveryRef.current = currentDelivery; }, [currentDelivery]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
    };
  }, []);

  // ─── Status polling ──────────────────────────────────────────────────────────
  const startPoll = useCallback((deliveryId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      if (!mountedRef.current || !deliveryId) return;
      try {
        const res = await apiClient.get(`/deliveries/${deliveryId}`);
        const backend = res?.data ?? res;
        if (!backend || !mountedRef.current) return;

        if (backend.paymentStatus === 'completed' || backend.rideStatus === 'completed') {
          clearInterval(pollRef.current);
          setCurrentDelivery(null);
          router.push('/home');
          return;
        }
        if (backend.rideStatus === 'cancelled') {
          clearInterval(pollRef.current);
          setCurrentDelivery(null);
          return;
        }
        setCurrentDelivery(prev => prev ? { ...prev, ...backend } : prev);
      } catch (err) {
        console.error('[useDelivery] poll error:', err);
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

  // ─── Socket event handlers ───────────────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;

    const matchActive = (data) =>
      !currentDeliveryRef.current ||
      !data?.deliveryId ||
      String(data.deliveryId) === String(currentDeliveryRef.current?.id);

    const handleRequest = (data) => {
      setIncomingDelivery(data)
      const audio = new Audio('/sounds/ride-request.mp3');
      audio.play().catch(() => {});
      if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
    };

    const handleCancelled = (data) => {
      if (incomingDelivery?.deliveryId === data.deliveryId) setIncomingDelivery(null);
      if (currentDeliveryRef.current?.id === data.deliveryId) {
        setCurrentDelivery(null);
        stopPoll();
      }
    };

    const handleTaken = (data) => {
      if (incomingDelivery?.deliveryId === data.deliveryId) setIncomingDelivery(null);
    };

    const handlePaymentReceived = (data) => {
      if (!matchActive(data)) return;
      stopPoll();
      setCurrentDelivery(null);
      router.push('/home');
    };

    on(DEL_EVENTS.REQUEST_NEW,      handleRequest);
    on(DEL_EVENTS.REQUEST_RECEIVED, handleRequest);
    on(DEL_EVENTS.CANCELLED,        handleCancelled);
    on(DEL_EVENTS.TAKEN,            handleTaken);
    on(DEL_EVENTS.PAYMENT_RECEIVED, handlePaymentReceived);

    return () => {
      off(DEL_EVENTS.REQUEST_NEW);
      off(DEL_EVENTS.REQUEST_RECEIVED);
      off(DEL_EVENTS.CANCELLED);
      off(DEL_EVENTS.TAKEN);
      off(DEL_EVENTS.PAYMENT_RECEIVED);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, incomingDelivery?.deliveryId, on, off, stopPoll, router]);

  // ─── Window message relay ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!msg?.type) return;
        const deliveryId = msg.payload?.deliveryId ?? msg.payload?.rideId;
        const matchesActive =
          !deliveryId ||
          !currentDeliveryRef.current?.id ||
          String(deliveryId) === String(currentDeliveryRef.current.id);
        if (!matchesActive) return;
        if (msg.type === 'PAYMENT_RECEIVED' || msg.type === 'delivery:completed') {
          stopPoll();
          setCurrentDelivery(null);
          router.push('/home');
        }
      } catch {}
    };
    if (typeof window !== 'undefined') window.addEventListener('message', handler);
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('message', handler);
    };
  }, [stopPoll, router]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const acceptDelivery = useCallback(async (deliveryId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/deliveries/${deliveryId}/accept`);
      console.log('response acceptDelivery',response)
      if (response && (response.id || response.success || response.data)) {
        setCurrentDelivery(response.data ?? response);
        setIncomingDelivery(null);
        setError(null);
        emit(DEL_EVENTS.ACCEPTED, { deliveryId });
        return response;
      }
      throw new Error(response?.error || 'Failed to accept delivery');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [emit]);

  const declineDelivery = useCallback(async (deliveryId, reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/deliveries/${deliveryId}/decline`, { reason });
      console.log('response declineDelivery',response)
      setIncomingDelivery(null);
      setError(null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmArrival = useCallback(async (deliveryId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/deliveries/${deliveryId}/confirm-arrival`);
      if (response && (response.id || response.success || response.data)) {
        setCurrentDelivery(response.data ?? response);
        setError(null);
        return response;
      }
      throw new Error(response?.error || 'Failed to confirm arrival');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startDelivery = useCallback(async (deliveryId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/deliveries/${deliveryId}/start`);
      if (response && (response.id || response.success || response.data)) {
        setCurrentDelivery(response.data ?? response);
        setError(null);
        return response;
      }
      throw new Error(response?.error || 'Failed to start delivery');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeDelivery = useCallback(async (deliveryId, data = {}) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/deliveries/${deliveryId}/complete`, data);
      if (response && (response.id || response.success || response.data)) {
        stopPoll();
        setCurrentDelivery(null);
        setError(null);
        return response;
      }
      throw new Error(response?.error || 'Failed to complete delivery');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [stopPoll]);

  const cancelDelivery = useCallback(async (deliveryId, reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/deliveries/${deliveryId}/cancel`, { reason, cancelledBy: 'deliverer' });
      if (response && (response.id || response.success || response.data)) {
        stopPoll();
        setCurrentDelivery(null);
        setIncomingDelivery(null);
        setError(null);
        return response;
      }
      throw new Error(response?.error || 'Failed to cancel delivery');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [stopPoll]);

  const loadActiveDelivery = useCallback(async () => {
    try {
      const result = await deliveriesAPI.getActiveDelivery();
      if (result?.success && result.data) {
        setCurrentDelivery(result.data);
      }
    } catch (err) {
      console.error('Error loading active delivery:', err);
    }
  }, []);

  useEffect(() => { loadActiveDelivery(); }, [loadActiveDelivery]);

  return {
    currentDelivery,
    incomingDelivery,
    loading,
    error,
    acceptDelivery,
    declineDelivery,
    confirmArrival,
    startDelivery,
    completeDelivery,
    cancelDelivery,
    loadActiveDelivery,
    hasActiveDelivery: !!currentDelivery,
    hasIncomingDelivery: !!incomingDelivery,
  };
};

export default useDelivery;