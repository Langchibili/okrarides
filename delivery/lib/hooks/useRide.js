'use client';
// PATH: driver/lib/hooks/useRide.js
//
// ADDITIONS vs previous version:
//  1. STATUS POLLING — every appsServerPollingIntervalInSeconds (default 20 s)
//     while there is an active ride. Syncs local state; auto-navigates home
//     when paymentStatus===completed or rideStatus===completed.
//  2. PAYMENT_RECEIVED listener (RN + Socket.IO + window message)
//  3. awaiting_payment guard in loadActiveRide — no redirect on driver side
//     (driver stays on active-ride page; rider is redirected to pay page)

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import { ridesAPI } from '@/lib/api/rides';
import { useSocket } from '@/lib/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/Constants';
import { useRouter } from 'next/navigation';

// ── Read polling interval from window.__adminSettings or default ──────────────
function getPollingInterval() {
  try {
    const v = window.__adminSettings?.appsServerPollingIntervalInSeconds;
    if (v && Number(v) > 0) return Number(v) * 1000;
  } catch {}
  return 20_000;
}

const ACTIVE_RIDE_STATUSES = new Set(['accepted', 'arrived', 'passenger_onboard', 'awaiting_payment']);

export const useRide = () => {
  const [currentRide,  setCurrentRide]  = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  const { on, off, emit, connected } = useSocket();
  const router = useRouter();

  const statusPollRef   = useRef(null);
  const mountedRef      = useRef(true);
  const currentRideRef  = useRef(null); // keep a ref so interval closure is always fresh

  useEffect(() => { currentRideRef.current = currentRide; }, [currentRide]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearInterval(statusPollRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS POLLING — auto-syncs driver UI with backend
  // ═══════════════════════════════════════════════════════════════════════════
  const startStatusPoll = useCallback((rideId) => {
    clearInterval(statusPollRef.current);
    statusPollRef.current = setInterval(async () => {
      if (!mountedRef.current || !rideId) return;
      try {
        const res = await apiClient.get(`/rides/${rideId}?populate=rider,vehicle`);
        const backend = res?.data;
        if (!backend || !mountedRef.current) return;

        // Trip completed or payment confirmed → go home
        if (backend.paymentStatus === 'completed' || backend.rideStatus === 'completed') {
          clearInterval(statusPollRef.current);
          setCurrentRide(null);
          router.push('/home');
          return;
        }

        // Cancelled
        if (backend.rideStatus === 'cancelled') {
          clearInterval(statusPollRef.current);
          setCurrentRide(null);
          return;
        }

        setCurrentRide(prev => prev ? { ...prev, ...backend } : prev);
      } catch (err) {
        console.error('[useRide driver] poll error:', err);
      }
    }, getPollingInterval());
  }, [router]);

  const stopStatusPoll = useCallback(() => {
    clearInterval(statusPollRef.current);
    statusPollRef.current = null;
  }, []);

  // Start / stop polling when currentRide changes
  useEffect(() => {
    if (currentRide?.id && ACTIVE_RIDE_STATUSES.has(currentRide.rideStatus)) {
      startStatusPoll(currentRide.id);
    } else {
      stopStatusPoll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRide?.id, currentRide?.rideStatus]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SOCKET EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!connected) return;

    const matchRide = (data) =>
      !currentRideRef.current ||
      !data?.rideId ||
      String(data.rideId) === String(currentRideRef.current?.id);

    // Incoming ride request
    const handleRideRequest = (data) => {
      setIncomingRide(data);
      const audio = new Audio('/sounds/ride-request.mp3');
      audio.play().catch(() => {});
      if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
    };

    // Ride cancelled
    const handleRideCancelled = (data) => {
      if (incomingRide?.rideId === data.rideId) setIncomingRide(null);
      if (currentRideRef.current?.id === data.rideId) {
        setCurrentRide(null);
        stopStatusPoll();
      }
    };

    // Ride taken by another driver
    const handleRideTaken = (data) => {
      if (incomingRide?.rideId === data.rideId) setIncomingRide(null);
    };

    // ── PAYMENT_RECEIVED — rider paid ─────────────────────────────────────
    const handlePaymentReceived = (data) => {
      if (!matchRide(data)) return;
      stopStatusPoll();
      setCurrentRide(null);
      router.push('/home');
    };

    on(SOCKET_EVENTS.RIDE.REQUEST_NEW,    handleRideRequest);
    on(SOCKET_EVENTS.RIDE.REQUEST_RECEIVED, handleRideRequest);
    on(SOCKET_EVENTS.RIDE.CANCELLED,      handleRideCancelled);
    on(SOCKET_EVENTS.RIDE.TAKEN,          handleRideTaken);
    on(SOCKET_EVENTS.PAYMENT.RECEIVED,    handlePaymentReceived);

    return () => {
      off(SOCKET_EVENTS.RIDE.REQUEST_NEW);
      off(SOCKET_EVENTS.RIDE.REQUEST_RECEIVED);
      off(SOCKET_EVENTS.RIDE.CANCELLED);
      off(SOCKET_EVENTS.RIDE.TAKEN);
      off(SOCKET_EVENTS.PAYMENT.RECEIVED);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, incomingRide?.rideId, on, off, stopStatusPoll, router]);

  // ── window message relay (from App.tsx / device socket) ──────────────────
  useEffect(() => {
    const handler = (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!msg?.type) return;
        const rideId = msg.payload?.rideId;
        const matchesActive = !rideId || !currentRideRef.current?.id ||
          String(rideId) === String(currentRideRef.current.id);
        if (!matchesActive) return;

        if (msg.type === 'PAYMENT_RECEIVED') {
          stopStatusPoll();
          setCurrentRide(null);
          router.push('/home');
        }
      } catch {}
    };
    if (typeof window !== 'undefined') window.addEventListener('message', handler);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('message', handler); };
  }, [stopStatusPoll, router]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RIDE ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const acceptRide = useCallback(async (rideId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/accept`);
      if (response && (response.id || response.success || response.data)) {
        setCurrentRide(response.data ?? response);
        setIncomingRide(null);
        setError(null);
        emit(SOCKET_EVENTS.RIDE.ACCEPT, { rideId });
        return response;
      }
      throw new Error(response?.error || 'Failed to accept ride');
    } catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [emit]);

  const declineRide = useCallback(async (rideId, reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/decline`, { reason });
      setIncomingRide(null);
      setError(null);
      emit(SOCKET_EVENTS.RIDE.DECLINE, { rideId, reason });
      return response;
    } catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [emit]);

  const startTrip = useCallback(async (rideId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/start`);
      if (response && (response.id || response.success || response.data)) {
        setCurrentRide(response.data ?? response);
        setError(null);
        return response;
      }
      throw new Error(response?.error || 'Failed to start trip');
    } catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const completeTrip = useCallback(async (rideId, completionData) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/complete`, completionData);
      if (response && (response.id || response.success || response.data)) {
        stopStatusPoll();
        setCurrentRide(null);
        setError(null);
        return response;
      }
      throw new Error(response?.error || 'Failed to complete trip');
    } catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [stopStatusPoll]);

  const cancelRide = useCallback(async (rideId, reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/cancel`, { reason, cancelledBy: 'driver' });
      if (response && (response.id || response.success || response.data)) {
        stopStatusPoll();
        setCurrentRide(null);
        setIncomingRide(null);
        setError(null);
        return response;
      }
      throw new Error(response?.error || 'Failed to cancel ride');
    } catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, [stopStatusPoll]);

  const confirmArrival = useCallback(async (rideId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/confirm-arrival`);
      if (response && (response.id || response.success || response.data)) {
        setCurrentRide(response.data ?? response);
        setError(null);
        return response;
      }
      throw new Error(response?.error || 'Failed to confirm arrival');
    } catch (err) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const loadActiveRide = useCallback(async () => {
    try {
      const result = await ridesAPI.getActiveRide();
      if (result?.success && result.data) {
        setCurrentRide(result.data);
      }
    } catch (err) {
      console.error('Error loading active ride:', err);
    }
  }, []);

  // Load on mount
  useEffect(() => { loadActiveRide(); }, [loadActiveRide]);

  return {
    currentRide,
    incomingRide,
    loading,
    error,
    acceptRide,
    declineRide,
    startTrip,
    completeTrip,
    cancelRide,
    confirmArrival,
    loadActiveRide,
    hasActiveRide:   !!currentRide,
    hasIncomingRide: !!incomingRide,
  };
};

export default useRide;