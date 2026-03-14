//Okra\Okrarides\rider\lib\hooks\useRide.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ridesAPI } from '@/lib/api/rides';
import { useSocket } from '@/lib/socket/SocketProvider';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { RIDE_STATUS } from '@/Constants';
import { SOCKET_EVENTS } from '@/Constants';
import { useRouter } from 'next/navigation';
import { apiClient } from '../api/client';

export function useRide(initialRideId = null) {
  const [ride, setRide]               = useState(null);
  const [activeRide, setActiveRide]   = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const { on: socketOn, off: socketOff } = useSocket();
  const { on: rnOn }                     = useReactNative();

  const pollingIntervalRef  = useRef(null);
  const trackingIntervalRef = useRef(null);
  const mountedRef          = useRef(true);
  const hasWebSocket        = useRef(false);
  const router              = useRouter();

  const activeRideIdRef = useRef(null);
  useEffect(() => {
    activeRideIdRef.current = activeRide?.id ?? null;
  }, [activeRide?.id]);

  const stopPollingRideStatus = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.realtimeService) hasWebSocket.current = true;
    } catch { hasWebSocket.current = false; }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // REACT NATIVE BRIDGE LISTENERS
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // ── useRide CHECKPOINT A ────────────────────────────────────────────

    const forCurrentRide = (payload) =>
      !activeRideIdRef.current ||
      !payload?.rideId ||
      payload.rideId === activeRideIdRef.current;

    // ── RIDE_ACCEPTED ───────────────────────────────────────────────────
    const unsubAccepted = rnOn('RIDE_ACCEPTED', (payload) => {
      if (!forCurrentRide(payload)) {
        return;
      }
      const update = {
        rideStatus: 'accepted',
        driver:   payload.driver   ?? undefined,
        vehicle:  payload.vehicle  ?? undefined,
        eta:      payload.eta      ?? undefined,
        distance: payload.distance ?? undefined,
      };
      setRide(prev       => prev ? { ...prev, ...update } : prev);
      setActiveRide(prev => prev ? { ...prev, ...update } : prev);
      stopPollingRideStatus();
      showNotification('Driver Found!', `${payload.driver?.firstName ?? 'Your driver'} is on the way`);
    });

    // ── DRIVER_LOCATION_UPDATED ─────────────────────────────────────────
    // No alert here — fires too frequently. Just console.log.
    const unsubLocation = rnOn('DRIVER_LOCATION_UPDATED', (payload) => {
      console.log('[useRide] DRIVER_LOCATION_UPDATED handler fired', payload);
      if (!forCurrentRide(payload)) return;
      const loc = payload.location ?? payload;
      const update = {
        currentDriverLocation: loc,
        eta:      payload.eta      ?? undefined,
        distance: payload.distance ?? undefined,
      };
      setRide(prev       => prev ? { ...prev, ...update } : prev);
      setActiveRide(prev => prev ? { ...prev, ...update } : prev);
    });

    // ── DRIVER_ARRIVED ──────────────────────────────────────────────────
    const unsubArrived = rnOn('DRIVER_ARRIVED', (payload) => {
      if (!forCurrentRide(payload)) {
        return;
      }
      const update = { rideStatus: 'arrived', arrivedAt: payload.arrivedAt ?? new Date().toISOString() };
      setRide(prev       => prev ? { ...prev, ...update } : prev);
      setActiveRide(prev => prev ? { ...prev, ...update } : prev);
      showNotification('Driver Arrived!', 'Your driver is waiting at the pickup location');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    });

    // ── TRIP_STARTED ────────────────────────────────────────────────────
    const unsubTripStarted = rnOn('TRIP_STARTED', (payload) => {
      if (!forCurrentRide(payload)) {
        return;
      }
      const update = { rideStatus: 'passenger_onboard', tripStartedAt: payload.tripStartedAt ?? new Date().toISOString() };
      setRide(prev       => prev ? { ...prev, ...update } : prev);
      setActiveRide(prev => prev ? { ...prev, ...update } : prev);
    });

    // ── TRIP_COMPLETED ──────────────────────────────────────────────────
    const unsubTripCompleted = rnOn('TRIP_COMPLETED', (payload) => {
      if (!forCurrentRide(payload)) {
        return;
      }
      const update = {
        rideStatus:      'completed',
        tripCompletedAt: payload.tripCompletedAt ?? new Date().toISOString(),
        finalFare:       payload.finalFare       ?? undefined,
        actualDistance:  payload.actualDistance  ?? undefined,
        actualDuration:  payload.actualDuration  ?? undefined,
      };
      setRide(prev       => prev ? { ...prev, ...update } : prev);
      setActiveRide(prev => prev ? { ...prev, ...update } : prev);
      stopTracking();
    });

      // ── PAYMENT_REQUESTED ──────────────────────────────────────────────────
  // Driver clicked "Request Payment" → navigate rider to the pay page.
  const unsubPaymentRequested = rnOn('PAYMENT_REQUESTED', (payload) => {
    if (!forCurrentRide(payload)) return;

    // Update local ride state so the tracking page reflects the new status
    const update = { rideStatus: 'awaiting_payment', paymentRequestedAt: new Date().toISOString() };
    setRide(prev       => prev ? { ...prev, ...update } : prev);
    setActiveRide(prev => prev ? { ...prev, ...update } : prev);

    const rideId = payload?.rideId ?? activeRideIdRef.current;
    if (rideId) {
      router.push(`/trips/${rideId}/pay`);
    }
  });

  // ── PAYMENT_SUCCESS (ride payment) ─────────────────────────────────────
  // OkraPay gateway webhook fired → backend emitted payment:success →
  // device relay delivered PAYMENT_SUCCESS → navigate to trip summary.
  const unsubPaymentSuccess = rnOn('PAYMENT_SUCCESS', (payload) => {
    // Only handle ride-payment events (not float topup / wallet topup)
    if (payload?.type && payload.type !== 'ride_payment') return;
    if (!forCurrentRide(payload)) return;

    const rideId = payload?.rideId ?? activeRideIdRef.current;
    if (rideId) {
      router.push(`/trips/${rideId}`);
    }
  });

    // ── RIDE_CANCELLED ──────────────────────────────────────────────────
    const unsubCancelled = rnOn('RIDE_CANCELLED', (payload) => {
      if (!forCurrentRide(payload)) {
        return;
      }
      setActiveRide(null);
      stopPollingRideStatus();
      stopTracking();
      showNotification('Ride Cancelled', payload.reason || 'Your ride has been cancelled');
    });

    // ── RIDE_TAKEN ──────────────────────────────────────────────────────
    const unsubTaken = rnOn('RIDE_TAKEN', (payload) => {
      if (!forCurrentRide(payload)) return;
      setRide(prev       => prev ? { ...prev, rideStatus: 'taken' } : prev);
      setActiveRide(prev => prev ? { ...prev, rideStatus: 'taken' } : prev);
    });

    // ── APP_RESUMED ─────────────────────────────────────────────────────
    const unsubResumed = rnOn('APP_RESUMED', () => {
      loadActiveRide();
    });

    // ── CHECKPOINT A complete ───────────────────────────────────────────

    return () => {
      unsubAccepted?.();
      unsubLocation?.();
      unsubArrived?.();
      unsubTripStarted?.();
      unsubTripCompleted?.();
      unsubCancelled?.();
      unsubTaken?.();
      unsubResumed?.();
      unsubPaymentRequested?.();
      unsubPaymentSuccess?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rnOn, stopPollingRideStatus, stopTracking]);

  // ═══════════════════════════════════════════════════════════════════════
  // SOCKET.IO LISTENERS  (browser / PWA — direct connection)
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!activeRide) return;

    const handleRideAccepted = (data) => {
      if (data.rideId !== activeRide.id) return;
      setRide(prev       => ({ ...prev, ...data, rideStatus: 'accepted' }));
      setActiveRide(prev => ({ ...prev, ...data, rideStatus: 'accepted' }));
      showNotification('Driver Found!', `${data.driver?.firstName} is on the way`);
      router.push(`/tracking?rideId=${data.rideId}`);
    };
    const handleDriverLocationUpdate = (data) => {
      if (data.rideId !== activeRide.id) return;
      setRide(prev       => ({ ...prev, currentDriverLocation: data.location, eta: data.eta, distance: data.distance }));
      setActiveRide(prev => ({ ...prev, currentDriverLocation: data.location, eta: data.eta, distance: data.distance }));
    };
    const handleDriverArrived = (data) => {
      if (data.rideId !== activeRide.id) return;
      setRide(prev       => ({ ...prev, rideStatus: 'arrived', arrivedAt: data.arrivedAt }));
      setActiveRide(prev => ({ ...prev, rideStatus: 'arrived', arrivedAt: data.arrivedAt }));
      showNotification('Driver Arrived!', 'Your driver has arrived at the pickup location');
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    };
    const handleTripStarted = (data) => {
      if (data.rideId !== activeRide.id) return;
      setRide(prev       => ({ ...prev, rideStatus: 'passenger_onboard', tripStartedAt: data.tripStartedAt }));
      setActiveRide(prev => ({ ...prev, rideStatus: 'passenger_onboard', tripStartedAt: data.tripStartedAt }));
    };
    const handleTripCompleted = (data) => {
      if (data.rideId !== activeRide.id) return;
      setRide(prev       => ({ ...prev, rideStatus: 'completed', ...data }));
      setActiveRide(prev => ({ ...prev, rideStatus: 'completed', ...data }));
      stopTracking();
    };
    const handlePaymentRequested = (data) => {
      if (data.rideId !== activeRide.id) return;
      const update = { rideStatus: 'awaiting_payment', paymentRequestedAt: data.paymentRequestedAt };
      setRide(prev       => ({ ...prev, ...update }));
      setActiveRide(prev => ({ ...prev, ...update }));
      router.push(`/trips/${data.rideId}/pay`);
    };

    const handlePaymentSuccess = (data) => {
      if (data.rideId !== activeRide.id) return;
      if (data.type && data.type !== 'ride_payment') return;
      router.push(`/trips/${data.rideId}`);
    };
    const handleRideCancelled = (data) => {
      if (data.rideId !== activeRide.id) return;
      setActiveRide(null);
      stopPollingRideStatus();
      stopTracking();
      showNotification('Ride Cancelled', data.reason || 'Your ride has been cancelled');
    };

    socketOn(SOCKET_EVENTS.RIDE.ACCEPTED,           handleRideAccepted);
    socketOn(SOCKET_EVENTS.DRIVER.LOCATION_UPDATED,  handleDriverLocationUpdate);
    socketOn(SOCKET_EVENTS.DRIVER.ARRIVED,           handleDriverArrived);
    socketOn(SOCKET_EVENTS.RIDE.TRIP_STARTED,        handleTripStarted);
    socketOn(SOCKET_EVENTS.RIDE.TRIP_COMPLETED,      handleTripCompleted);
    socketOn(SOCKET_EVENTS.RIDE.CANCELLED,           handleRideCancelled);
    socketOn(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED, handlePaymentRequested);
    socketOn(SOCKET_EVENTS.PAYMENT.SUCCESS,        handlePaymentSuccess);

    return () => {
      socketOff(SOCKET_EVENTS.RIDE.ACCEPTED);
      socketOff(SOCKET_EVENTS.DRIVER.LOCATION_UPDATED);
      socketOff(SOCKET_EVENTS.DRIVER.ARRIVED);
      socketOff(SOCKET_EVENTS.RIDE.TRIP_STARTED);
      socketOff(SOCKET_EVENTS.RIDE.TRIP_COMPLETED);
      socketOff(SOCKET_EVENTS.RIDE.CANCELLED);
      socketOff(SOCKET_EVENTS.RIDE.PAYMENT_REQUESTED);
      socketOff(SOCKET_EVENTS.PAYMENT.SUCCESS);
    };
  }, [activeRide?.id, socketOn, socketOff, stopTracking, stopPollingRideStatus, router]);

  // ============================================
  // STEP 1: Get Fare Estimate
  // ============================================
  const getFareEstimate = useCallback(async (pickupLocation, dropoffLocation, rideType = 'taxi', rideTypes = ['taxi']) => {
    setLoading(true); setError(null);
    try {
      const result = await ridesAPI.estimateFare(pickupLocation, dropoffLocation, rideType, rideTypes);
      if (!result.success) { setError(result.error); return null; }
      return result.data;
    } catch (err) { setError(err.message || 'Failed to estimate fare'); throw err; }
    finally { setLoading(false); }
  }, []);

  const getEstimate = useCallback(async (pickupLocation, dropoffLocation, rideTypes) =>
    getFareEstimate(pickupLocation, dropoffLocation, 'taxi', rideTypes)
  , [getFareEstimate]);

  // ============================================
  // STEP 2: Validate Promo Code
  // ============================================
  const validatePromoCode = useCallback(async (code, subtotal = null) => {
    try {
      const result = await ridesAPI.validatePromoCode(code, subtotal);
      if (!result.success) { setError(result.error); return null; }
      return result.data;
    } catch (err) { setError(err.message || 'Failed to validate promo code'); return null; }
  }, []);

  // ============================================
  // STEP 3: Create Ride Request
  // ============================================
  const requestRide = useCallback(async (rideData) => {
    setLoading(true); setError(null);
    try {
      const result = await ridesAPI.createRide(rideData);
      if (!result.success) { setError(result.error); return { success: false, error: result.error }; }
      const newRide = result.data;
      setRide(newRide); setActiveRide(newRide);
      if (hasWebSocket.current && window.realtimeService) window.realtimeService.joinRideRoom(newRide.id);
      if (newRide.rideStatus === 'pending') startPollingRideStatus(newRide.id);
      return { success: true, data: newRide };
    } catch (err) {
      const msg = err.message || 'Failed to create ride'; setError(msg); return { success: false, error: msg };
    } finally { setLoading(false); }
  }, []);

  const createRide = useCallback(async (rideData) => {
    const result = await requestRide(rideData);
    if (result.success) return result.data;
    throw new Error(result.error);
  }, [requestRide]);

  // ============================================
  // STEP 4: Poll for Driver Assignment & Status
  // ============================================
  const startPollingRideStatus = useCallback((rideId, maxAttempts = 120) => {
    stopPollingRideStatus();
    let attempts = 0;
    pollingIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) { stopPollingRideStatus(); return; }
      attempts++;
      try {
        const result = await ridesAPI.checkRideStatus(rideId);
        if (result.success && mountedRef.current) {
          const updated = result.data;
          setRide(updated); setActiveRide(updated);
          if (['accepted', 'no_drivers_available', 'cancelled'].includes(updated.rideStatus)) {
            stopPollingRideStatus();
            if (updated.rideStatus === 'accepted' && updated.driver)
              showNotification('Driver Found!', `${updated.driver.firstName} is on the way`);
          }
        }
      } catch (err) { console.error('Polling error:', err); }
      if (attempts >= maxAttempts) {
        stopPollingRideStatus();
        if (mountedRef.current) setError('Finding driver is taking longer than expected');
      }
    }, 2000);
  }, [stopPollingRideStatus]);

  // ============================================
  // STEP 5: Track Ride (Real-time Location — API polling fallback)
  // ============================================
  const startTracking = useCallback((rideId, onUpdate) => {
    stopTracking();
    trackingIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) { stopTracking(); return; }
      try {
        const result = await ridesAPI.trackRide(rideId);
        if (result.success && mountedRef.current) {
          const td = result.data;
          const base = { ...td.ride, currentDriverLocation: td.driverLocation, eta: td.eta, distance: td.distance };
          setRide(prev       => ({ ...prev, ...base }));
          setActiveRide(prev => ({ ...prev, ...base }));
          if (onUpdate) onUpdate(td);
          const status = td.ride?.rideStatus || td.rideStatus;
          if ([RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED].includes(status)) stopTracking();
        }
      } catch (err) { console.error('Tracking error:', err); }
    }, 3000);
    return stopTracking;
  }, [stopTracking]);

  // ============================================
  // STEP 6: Cancel Ride
  // ============================================
  const cancelRide = useCallback(async (rideId, reason, explanation = '') => {
    setLoading(true); setError(null);
    try {
      const result = await ridesAPI.cancelRide(rideId, reason, explanation);
      if (!result.success) { setError(result.error); return { success: false, error: result.error }; }
      if (ride?.id === rideId) setRide(result.data);
      if (activeRide?.id === rideId) setActiveRide(null);
      stopPollingRideStatus(); stopTracking();
      if (hasWebSocket.current && window.realtimeService) window.realtimeService.leaveRideRoom(rideId);
      return { success: true, data: result.data };
    } catch (err) {
      const msg = err.message || 'Failed to cancel ride'; setError(msg); return { success: false, error: msg };
    } finally { setLoading(false); }
  }, [ride, activeRide, stopPollingRideStatus, stopTracking]);

  // ============================================
  // STEP 7: Confirm Pickup
  // ============================================
  const confirmPickup = useCallback(async (rideId) => {
    setLoading(true); setError(null);
    try {
      const result = await ridesAPI.confirmPickup(rideId);
      if (result.success) {
        const update = { rideStatus: 'passenger_onboard', tripStartedAt: result.data.tripStartedAt };
        setRide(prev       => ({ ...prev, ...update }));
        setActiveRide(prev => ({ ...prev, ...update }));
      } else { setError(result.error); }
      return result;
    } catch (err) {
      const msg = err.message || 'Failed to confirm pickup'; setError(msg); return { success: false, error: msg };
    } finally { setLoading(false); }
  }, []);

  // ============================================
  // STEP 8: Complete Ride
  // ============================================
  const completeRide = useCallback(async (rideId) => {
    setLoading(true); setError(null);
    try {
      const result = await ridesAPI.completeRide(rideId);
      if (result.success) {
        setRide(prev => ({ ...prev, ...result.data }));
        setActiveRide(prev => ({ ...prev, ...result.data }));
        stopTracking();
      } else setError(result.error);
      return result;
    } catch (err) {
      const msg = err.message || 'Failed to complete ride'; setError(msg); return { success: false, error: msg };
    } finally { setLoading(false); }
  }, [stopTracking]);

  // ============================================
  // STEP 9: Rate Driver
  // ============================================
  const rateDriver = useCallback(async (rideId, rating, review = '', tags = []) => {
    setLoading(true); setError(null);
    try {
      const result = await ridesAPI.rateDriver(rideId, rating, review, tags);
      if (result.success) {
        if (activeRide?.id === rideId) setActiveRide(null);
        if (hasWebSocket.current && window.realtimeService) window.realtimeService.leaveRideRoom(rideId);
      } else setError(result.error);
      return result;
    } catch (err) {
      const msg = err.message || 'Failed to rate driver'; setError(msg); return { success: false, error: msg };
    } finally { setLoading(false); }
  }, [activeRide]);

  // ============================================
  // Load Specific Ride
  // ============================================
  const loadRide = useCallback(async (rideId) => {
    if (!rideId) return null;
    setLoading(true); setError(null);
    try {
      const result = await ridesAPI.getRide(rideId);
      if (result.success) { setRide(result.data); return result.data; }
      setError(result.error); return null;
    } catch (err) { setError(err.message || 'Failed to load ride'); throw err; }
    finally { setLoading(false); }
  }, []);

  const loadRideDriverProfilePicUrl = useCallback(async (driverId) => {
    if (!driverId) return null;
    setLoading(true); setError(null);
    try {
      const result = await apiClient.get('/users/'+driverId+"?populate=profilePicture");
      if (result && result.profilePicture) { 
        return result.profilePicture
      }
      setError(result.error); return null;
    } catch (err) { setError(err.message || 'Failed to driver profilePicture'); throw err; }
    finally { setLoading(false); }
  }, []);

  // ============================================
  // Get Active Ride
  // ============================================
  const loadActiveRide = useCallback(async () => {
    try {
      const result = await ridesAPI.getActiveRide();
      if (result.success && result.data) {
        setActiveRide(result.data);
        if (hasWebSocket.current && window.realtimeService) window.realtimeService.joinRideRoom(result.data.id);
        if (result.data.rideStatus === 'pending') startPollingRideStatus(result.data.id);
        return result.data;
      }
      return null;
    } catch (err) { console.error('Error loading active ride:', err); return null; }
  }, [startPollingRideStatus]);

  // ============================================
  // Load Ride History
  // ============================================
  const loadRideHistory = useCallback(async (params = {}) => {
    setLoading(true); setError(null);
    try {
      const result = await ridesAPI.getRideHistory(params);
      if (result.success) { setRideHistory(result.data); return { data: result.data, meta: result.meta }; }
      setError(result.error); return { data: [], meta: null };
    } catch (err) { setError(err.message || 'Failed to load ride history'); return { data: [], meta: null }; }
    finally { setLoading(false); }
  }, []);

  // ============================================
  // Helper Methods
  // ============================================
  const getTaxiTypes  = useCallback(async () => { try { const r = await ridesAPI.getTaxiTypes();           return r.success ? r.data : []; } catch { return []; } }, []);
  const getRideClasses= useCallback(async (id=null) => { try { const r = await ridesAPI.getRideClasses(id); return r.success ? r.data : []; } catch { return []; } }, []);
  const reportIssue   = useCallback(async (rideId, issue) => { try { return await ridesAPI.reportIssue(rideId, issue); } catch (e) { return { success: false, error: e.message }; } }, []);
  const getReceipt    = useCallback(async (rideId) => { try { const r = await ridesAPI.getReceipt(rideId);         return r.success ? r.data : null; } catch { return null; } }, []);
  const shareTracking = useCallback(async (rideId) => { try { const r = await ridesAPI.shareRideTracking(rideId);  return r.success ? r.data : null; } catch { return null; } }, []);

  // ============================================
  // window.realtimeService WebSocket handlers
  // ============================================
  useEffect(() => {
    if (!activeRide || !hasWebSocket.current || !window.realtimeService) return;
    const rs = window.realtimeService;
    const byId = (fn) => (data) => { if (data.rideId === activeRide.id) fn(data); };
    const onAssigned  = byId(d => { setRide(p=>({...p, rideStatus:'accepted', driver:d.driver, vehicle:d.vehicle, eta:d.eta, distance:d.distance})); setActiveRide(p=>({...p, rideStatus:'accepted', driver:d.driver, vehicle:d.vehicle, eta:d.eta, distance:d.distance})); stopPollingRideStatus(); showNotification('Driver Found!',`${d.driver.firstName} is on the way`); });
    const onLoc       = byId(d => { setRide(p=>({...p, currentDriverLocation:d.location, eta:d.eta, distance:d.distance})); setActiveRide(p=>({...p, currentDriverLocation:d.location, eta:d.eta, distance:d.distance})); });
    const onArrived   = byId(d => { setRide(p=>({...p, rideStatus:'arrived', arrivedAt:d.arrivedAt})); setActiveRide(p=>({...p, rideStatus:'arrived', arrivedAt:d.arrivedAt})); showNotification('Driver Arrived!','Your driver is at the pickup location'); if('vibrate'in navigator) navigator.vibrate([200,100,200]); });
    const onStarted   = byId(d => { setRide(p=>({...p, rideStatus:'passenger_onboard', tripStartedAt:d.tripStartedAt})); setActiveRide(p=>({...p, rideStatus:'passenger_onboard', tripStartedAt:d.tripStartedAt})); });
    const onCompleted = byId(d => { setRide(p=>({...p, rideStatus:'completed', ...d})); setActiveRide(p=>({...p, rideStatus:'completed', ...d})); stopTracking(); });
    const onCancelled = byId(() => { setActiveRide(null); stopPollingRideStatus(); stopTracking(); showNotification('Ride Cancelled','Your ride has been cancelled'); });
    rs.on('driverAssigned', onAssigned); rs.on('driverLocationUpdate', onLoc); rs.on('driverArrived', onArrived);
    rs.on('tripStarted', onStarted); rs.on('tripCompleted', onCompleted); rs.on('rideCancelled', onCancelled);
    return () => {
      rs.off('driverAssigned', onAssigned); rs.off('driverLocationUpdate', onLoc); rs.off('driverArrived', onArrived);
      rs.off('tripStarted', onStarted); rs.off('tripCompleted', onCompleted); rs.off('rideCancelled', onCancelled);
    };
  }, [activeRide?.id, stopPollingRideStatus, stopTracking]);

  // ============================================
  // Initial Load
  // ============================================
  useEffect(() => { if (initialRideId) loadRide(initialRideId); }, [initialRideId, loadRide]);
  useEffect(() => { loadActiveRide(); }, [loadActiveRide]);

  // ============================================
  // Cleanup on Unmount
  // ============================================
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPollingRideStatus(); stopTracking();
      if (activeRide && hasWebSocket.current && window.realtimeService) window.realtimeService.leaveRideRoom(activeRide.id);
    };
  }, [activeRide, stopPollingRideStatus, stopTracking]);

  return {
    ride, activeRide, rideHistory, loading, error,
    getFareEstimate, getEstimate, validatePromoCode,
    requestRide, createRide, cancelRide, confirmPickup, completeRide, rateDriver,
    loadRide, loadActiveRide, loadRideHistory,
    startTracking, stopTracking, startPollingRideStatus, stopPollingRideStatus,
    getTaxiTypes, getRideClasses, reportIssue, getReceipt, shareTracking,loadRideDriverProfilePicUrl
  };
}

function showNotification(title, body) {
  if (typeof window === 'undefined') return;
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192x192.png', badge: '/icons/badge-72x72.png', tag: 'ride-update', requireInteraction: false });
  }
}

export default useRide;