// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { ridesAPI } from '@/lib/api/rides';
// import { RIDE_STATUS } from '@/Constants';

// export const useRide = (rideId = null) => {
//   const [ride, setRide] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [activeRide, setActiveRide] = useState(null);

//   // Load ride by ID
//   const loadRide = useCallback(async (id) => {
//     if (!id) return;
    
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await ridesAPI.getRide(id);
//       setRide(data);
//       return data;
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Load active ride
//   const loadActiveRide = useCallback(async () => {
//     try {
//       const data = await ridesAPI.getActiveRide();
//       setActiveRide(data);
//       return data;
//     } catch (err) {
//       console.error('Error loading active ride:', err);
//       return null;
//     }
//   }, []);

//   // Get price estimate
//   const getEstimate = useCallback(async (pickupLocation, dropoffLocation, rideTypes) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const estimate = await ridesAPI.getEstimate({
//         pickupLocation,
//         dropoffLocation,
//         rideTypes,
//       });
//       return estimate;
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Create new ride
//   const createRide = useCallback(async (rideData) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const newRide = await ridesAPI.createRide(rideData);
//       setRide(newRide);
//       setActiveRide(newRide);
//       return newRide;
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Cancel ride
//   const cancelRide = useCallback(async (id, reason) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const cancelledRide = await ridesAPI.cancelRide(id, reason);
      
//       // Update local state
//       if (ride?.id === id) {
//         setRide(cancelledRide);
//       }
//       if (activeRide?.id === id) {
//         setActiveRide(null);
//       }
      
//       return cancelledRide;
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [ride, activeRide]);

//   // Rate driver
//   const rateDriver = useCallback(async (rideId, rating, review, tags = []) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const ratingData = await ridesAPI.rateDriver(rideId, rating, review, tags);
//       return ratingData;
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Track ride (polling - WebSocket alternative)
//   const startTracking = useCallback((id, onUpdate) => {
//     const interval = setInterval(async () => {
//       try {
//         const trackData = await ridesAPI.trackRide(id);
//         if (onUpdate) {
//           onUpdate(trackData);
//         }
//         setRide(trackData.ride);
        
//         // Stop tracking if ride is completed or cancelled
//         if ([RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED].includes(trackData.ride.status)) {
//           clearInterval(interval);
//         }
//       } catch (err) {
//         console.error('Tracking error:', err);
//       }
//     }, 3000); // Poll every 3 seconds

//     return () => clearInterval(interval);
//   }, []);

//   // Load ride on mount if rideId provided
//   useEffect(() => {
//     if (rideId) {
//       loadRide(rideId);
//     }
//   }, [rideId, loadRide]);

//   // Load active ride on mount
//   useEffect(() => {
//     loadActiveRide();
//   }, [loadActiveRide]);

//   return {
//     ride,
//     activeRide,
//     loading,
//     error,
//     loadRide,
//     loadActiveRide,
//     getEstimate,
//     createRide,
//     cancelRide,
//     rateDriver,
//     startTracking,
//   };
// };

// export default useRide;

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ridesAPI } from '@/lib/api/rides';
import { RIDE_STATUS } from '@/Constants';

// Optional: Import if you have WebSocket service
// import realtimeService from '@/lib/services/realtimeService';

/**
 * Comprehensive Ride Management Hook
 * Handles complete ride lifecycle from estimation to completion
 */
export function useRide(initialRideId = null) {
  // State management
  const [ride, setRide] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for cleanup
  const pollingIntervalRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  const mountedRef = useRef(true);
  
  // WebSocket availability check
  const hasWebSocket = useRef(false);
  
  // Check if WebSocket service is available
  useEffect(() => {
    try {
      // Dynamically check if realtimeService exists
      if (typeof window !== 'undefined' && window.realtimeService) {
        hasWebSocket.current = true;
      }
    } catch (e) {
      hasWebSocket.current = false;
    }
  }, []);

  // ============================================
  // STEP 1: Get Fare Estimate
  // ============================================
  const getFareEstimate = useCallback(async (pickupLocation, dropoffLocation, rideType = 'taxi', rideTypes = ['taxi']) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ridesAPI.estimateFare(pickupLocation, dropoffLocation, rideType, rideTypes);
      console.log('result',result)
      if (!result.success) {
        setError(result.error);
        return null;
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to estimate fare';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Alias for backward compatibility
  const getEstimate = useCallback(async (pickupLocation, dropoffLocation, rideTypes) => {
    return getFareEstimate(pickupLocation, dropoffLocation, 'taxi', rideTypes);
  }, [getFareEstimate]);

  // ============================================
  // STEP 2: Validate Promo Code
  // ============================================
  const validatePromoCode = useCallback(async (code, subtotal = null) => {
    try {
      const result = await ridesAPI.validatePromoCode(code, subtotal);
      
      if (!result.success) {
        setError(result.error);
        return null;
      }
      
      return result.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to validate promo code';
      setError(errorMessage);
      return null;
    }
  }, []);

  // ============================================
  // STEP 3: Create Ride Request
  // ============================================
  const requestRide = useCallback(async (rideData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ridesAPI.createRide(rideData);
      
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      const newRide = result.data;
      setRide(newRide);
      setActiveRide(newRide);
      
      // Join WebSocket room if available
      if (hasWebSocket.current && window.realtimeService) {
        window.realtimeService.joinRideRoom(newRide.id);
      }
      
      // Start polling for driver assignment
      if (newRide.status === 'pending') {
        startPollingRideStatus(newRide.id);
      }
      
      return { success: true, data: newRide };
    } catch (err) {
      const errorMessage = err.message || 'Failed to create ride';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Alias for backward compatibility
  const createRide = useCallback(async (rideData) => {
    const result = await requestRide(rideData);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }, [requestRide]);

  // ============================================
  // STEP 4: Poll for Driver Assignment & Status
  // ============================================
  const startPollingRideStatus = useCallback((rideId, maxAttempts = 120) => {
    // Clear any existing polling
    stopPollingRideStatus();
    
    let attempts = 0;
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        stopPollingRideStatus();
        return;
      }
      
      attempts++;
      
      try {
        const result = await ridesAPI.checkRideStatus(rideId);
        
        if (result.success && mountedRef.current) {
          const updatedRide = result.data;
          setRide(updatedRide);
          setActiveRide(updatedRide);
          
          // If driver assigned or no drivers available, stop polling
          if (updatedRide.status === 'accepted' || 
              updatedRide.status === 'no_drivers_available' ||
              updatedRide.status === 'cancelled') {
            stopPollingRideStatus();
            
            // Show notification if driver assigned
            if (updatedRide.status === 'accepted' && updatedRide.driver) {
              showNotification(
                'Driver Found!',
                `${updatedRide.driver.firstName} is on the way`
              );
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
      
      // Stop polling after max attempts
      if (attempts >= maxAttempts) {
        stopPollingRideStatus();
        if (mountedRef.current) {
          setError('Finding driver is taking longer than expected');
        }
      }
    }, 2000); // Poll every 2 seconds
  }, []);

  const stopPollingRideStatus = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // ============================================
  // STEP 5: Track Ride (Real-time Location)
  // ============================================
  const startTracking = useCallback((rideId, onUpdate) => {
    // Clear any existing tracking
    stopTracking();
    
    trackingIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        stopTracking();
        return;
      }
      
      try {
        const result = await ridesAPI.trackRide(rideId);
        
        if (result.success && mountedRef.current) {
          const trackData = result.data;
          
          setRide(prev => ({
            ...prev,
            ...trackData.ride,
            currentDriverLocation: trackData.driverLocation,
            eta: trackData.eta,
            distance: trackData.distance,
          }));
          
          setActiveRide(prev => ({
            ...prev,
            ...trackData.ride,
            currentDriverLocation: trackData.driverLocation,
            eta: trackData.eta,
            distance: trackData.distance,
          }));
          
          // Call custom update handler
          if (onUpdate) {
            onUpdate(trackData);
          }
          
          // Stop tracking if ride is completed or cancelled
          const status = trackData.ride?.status || trackData.status;
          if ([RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED].includes(status)) {
            stopTracking();
          }
        }
      } catch (err) {
        console.error('Tracking error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return stopTracking;
  }, []);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  // ============================================
  // STEP 6: Cancel Ride
  // ============================================
  const cancelRide = useCallback(async (rideId, reason, explanation = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ridesAPI.cancelRide(rideId, reason, explanation);
      
      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      // Update local state
      if (ride?.id === rideId) {
        setRide(result.data);
      }
      if (activeRide?.id === rideId) {
        setActiveRide(null);
      }
      
      // Stop polling and tracking
      stopPollingRideStatus();
      stopTracking();
      
      // Leave WebSocket room if available
      if (hasWebSocket.current && window.realtimeService) {
        window.realtimeService.leaveRideRoom(rideId);
      }
      
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err.message || 'Failed to cancel ride';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [ride, activeRide, stopPollingRideStatus, stopTracking]);

  // ============================================
  // STEP 7: Confirm Pickup
  // ============================================
  const confirmPickup = useCallback(async (rideId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ridesAPI.confirmPickup(rideId);
      
      if (result.success) {
        const updatedData = {
          status: 'passenger_onboard',
          tripStartedAt: result.data.tripStartedAt,
        };
        
        setRide(prev => ({ ...prev, ...updatedData }));
        setActiveRide(prev => ({ ...prev, ...updatedData }));
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to confirm pickup';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // STEP 8: Complete Ride
  // ============================================
  const completeRide = useCallback(async (rideId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ridesAPI.completeRide(rideId);
      
      if (result.success) {
        setRide(prev => ({ ...prev, ...result.data }));
        setActiveRide(prev => ({ ...prev, ...result.data }));
        
        // Stop tracking
        stopTracking();
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to complete ride';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [stopTracking]);

  // ============================================
  // STEP 9: Rate Driver
  // ============================================
  const rateDriver = useCallback(async (rideId, rating, review = '', tags = []) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ridesAPI.rateDriver(rideId, rating, review, tags);
      
      if (result.success) {
        // Clear active ride after rating
        if (activeRide?.id === rideId) {
          setActiveRide(null);
        }
        
        // Leave WebSocket room if available
        if (hasWebSocket.current && window.realtimeService) {
          window.realtimeService.leaveRideRoom(rideId);
        }
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to rate driver';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [activeRide]);

  // ============================================
  // Load Specific Ride
  // ============================================
  const loadRide = useCallback(async (rideId) => {
    if (!rideId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await ridesAPI.getRide(rideId);
      
      if (result.success) {
        setRide(result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load ride';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // Load Active Ride
  // ============================================
  const loadActiveRide = useCallback(async () => {
    try {
      const result = await ridesAPI.getActiveRide();
      
      if (result.success && result.data) {
        setActiveRide(result.data);
        
        // Join WebSocket room if available
        if (hasWebSocket.current && window.realtimeService) {
          window.realtimeService.joinRideRoom(result.data.id);
        }
        
        // Start polling if ride is pending
        if (result.data.status === 'pending') {
          startPollingRideStatus(result.data.id);
        }
        
        return result.data;
      }
      
      return null;
    } catch (err) {
      console.error('Error loading active ride:', err);
      return null;
    }
  }, [startPollingRideStatus]);

  // ============================================
  // Load Ride History
  // ============================================
  const loadRideHistory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await ridesAPI.getRideHistory(params);
      
      if (result.success) {
        setRideHistory(result.data);
        return {
          data: result.data,
          meta: result.meta,
        };
      } else {
        setError(result.error);
        return { data: [], meta: null };
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load ride history';
      setError(errorMessage);
      return { data: [], meta: null };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // Additional Helper Methods
  // ============================================
  const getTaxiTypes = useCallback(async () => {
    try {
      const result = await ridesAPI.getTaxiTypes();
      return result.success ? result.data : [];
    } catch (err) {
      console.error('Failed to load taxi types:', err);
      return [];
    }
  }, []);

  const getRideClasses = useCallback(async (taxiTypeId = null) => {
    try {
      const result = await ridesAPI.getRideClasses(taxiTypeId);
      return result.success ? result.data : [];
    } catch (err) {
      console.error('Failed to load ride classes:', err);
      return [];
    }
  }, []);

  const reportIssue = useCallback(async (rideId, issue) => {
    try {
      const result = await ridesAPI.reportIssue(rideId, issue);
      return result;
    } catch (err) {
      console.error('Failed to report issue:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const getReceipt = useCallback(async (rideId) => {
    try {
      const result = await ridesAPI.getReceipt(rideId);
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Failed to get receipt:', err);
      return null;
    }
  }, []);

  const shareTracking = useCallback(async (rideId) => {
    try {
      const result = await ridesAPI.shareRideTracking(rideId);
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Failed to share tracking:', err);
      return null;
    }
  }, []);

  // ============================================
  // WebSocket Event Handlers (if available)
  // ============================================
  useEffect(() => {
    if (!activeRide || !hasWebSocket.current || !window.realtimeService) return;
    
    const realtimeService = window.realtimeService;
    
    const handleDriverAssigned = (data) => {
      if (data.rideId === activeRide.id) {
        const updatedData = {
          status: 'accepted',
          driver: data.driver,
          vehicle: data.vehicle,
          eta: data.eta,
          distance: data.distance,
        };
        
        setRide(prev => ({ ...prev, ...updatedData }));
        setActiveRide(prev => ({ ...prev, ...updatedData }));
        
        // Stop polling since driver is assigned
        stopPollingRideStatus();
        
        // Show notification
        showNotification(
          'Driver Found!',
          `${data.driver.firstName} is on the way`
        );
      }
    };
    
    const handleDriverLocationUpdate = (data) => {
      if (data.rideId === activeRide.id) {
        const updatedData = {
          currentDriverLocation: data.location,
          eta: data.eta,
          distance: data.distance,
        };
        
        setRide(prev => ({ ...prev, ...updatedData }));
        setActiveRide(prev => ({ ...prev, ...updatedData }));
      }
    };
    
    const handleDriverArrived = (data) => {
      if (data.rideId === activeRide.id) {
        const updatedData = {
          status: 'arrived',
          arrivedAt: data.arrivedAt,
        };
        
        setRide(prev => ({ ...prev, ...updatedData }));
        setActiveRide(prev => ({ ...prev, ...updatedData }));
        
        // Show notification and vibrate
        showNotification(
          'Driver Arrived!',
          'Your driver has arrived at the pickup location'
        );
        
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    };
    
    const handleTripStarted = (data) => {
      if (data.rideId === activeRide.id) {
        const updatedData = {
          status: 'passenger_onboard',
          tripStartedAt: data.tripStartedAt,
        };
        
        setRide(prev => ({ ...prev, ...updatedData }));
        setActiveRide(prev => ({ ...prev, ...updatedData }));
      }
    };
    
    const handleTripCompleted = (data) => {
      if (data.rideId === activeRide.id) {
        const updatedData = {
          status: 'completed',
          tripCompletedAt: data.tripCompletedAt,
          finalFare: data.finalFare,
          actualDistance: data.actualDistance,
          actualDuration: data.actualDuration,
        };
        
        setRide(prev => ({ ...prev, ...updatedData }));
        setActiveRide(prev => ({ ...prev, ...updatedData }));
        
        stopTracking();
      }
    };
    
    const handleRideCancelled = (data) => {
      if (data.rideId === activeRide.id) {
        setActiveRide(null);
        stopPollingRideStatus();
        stopTracking();
        
        showNotification(
          'Ride Cancelled',
          data.reason || 'Your ride has been cancelled'
        );
      }
    };
    
    // Register listeners
    realtimeService.on('driverAssigned', handleDriverAssigned);
    realtimeService.on('driverLocationUpdate', handleDriverLocationUpdate);
    realtimeService.on('driverArrived', handleDriverArrived);
    realtimeService.on('tripStarted', handleTripStarted);
    realtimeService.on('tripCompleted', handleTripCompleted);
    realtimeService.on('rideCancelled', handleRideCancelled);
    
    // Cleanup
    return () => {
      realtimeService.off('driverAssigned', handleDriverAssigned);
      realtimeService.off('driverLocationUpdate', handleDriverLocationUpdate);
      realtimeService.off('driverArrived', handleDriverArrived);
      realtimeService.off('tripStarted', handleTripStarted);
      realtimeService.off('tripCompleted', handleTripCompleted);
      realtimeService.off('rideCancelled', handleRideCancelled);
    };
  }, [activeRide, stopPollingRideStatus, stopTracking]);

  // ============================================
  // Initial Load Effects
  // ============================================
  
  // Load specific ride if ID provided
  useEffect(() => {
    if (initialRideId) {
      loadRide(initialRideId);
    }
  }, [initialRideId, loadRide]);

  // Load active ride on mount
  useEffect(() => {
    loadActiveRide();
  }, [loadActiveRide]);

  // ============================================
  // Cleanup on Unmount
  // ============================================
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      stopPollingRideStatus();
      stopTracking();
      
      if (activeRide && hasWebSocket.current && window.realtimeService) {
        window.realtimeService.leaveRideRoom(activeRide.id);
      }
    };
  }, [activeRide, stopPollingRideStatus, stopTracking]);

  return {
    // State
    ride,
    activeRide,
    rideHistory,
    loading,
    error,
    
    // Main ride lifecycle methods
    getFareEstimate,
    getEstimate, // Alias
    validatePromoCode,
    requestRide,
    createRide, // Alias
    cancelRide,
    confirmPickup,
    completeRide,
    rateDriver,
    
    // Data loading methods
    loadRide,
    loadActiveRide,
    loadRideHistory,
    
    // Tracking methods
    startTracking,
    stopTracking,
    startPollingRideStatus,
    stopPollingRideStatus,
    
    // Helper methods
    getTaxiTypes,
    getRideClasses,
    reportIssue,
    getReceipt,
    shareTracking,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Show browser notification if permission granted
 */
function showNotification(title, body) {
  if (typeof window === 'undefined') return;
  
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'ride-update',
      requireInteraction: false,
    });
  }
}

// Export as default
export default useRide;