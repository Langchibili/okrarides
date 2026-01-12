// // driver/lib/hooks/useRide.js
// 'use client';

// import { useState, useCallback, useEffect } from 'react';
// import { apiClient } from '@/lib/api/client';
// import { useWebSocket } from './useWebSocket';
// import { SOCKET_EVENTS } from '@/Constants';

// export const useRide = () => {
//   const [currentRide, setCurrentRide] = useState(null);
//   const [incomingRide, setIncomingRide] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const { socket, isConnected } = useWebSocket();

//   // Listen for ride requests
//   useEffect(() => {
//     if (!socket || !isConnected) return;

//     const handleRideRequest = (data) => {
//       setIncomingRide(data);
//     };

//     const handleRideCancelled = (data) => {
//       if (incomingRide?.rideId === data.rideId) {
//         setIncomingRide(null);
//       }
//       if (currentRide?.id === data.rideId) {
//         setCurrentRide(null);
//       }
//     };

//     socket.on(SOCKET_EVENTS.RIDE_REQUEST_NEW, handleRideRequest);
//     socket.on(SOCKET_EVENTS.RIDE_CANCELLED, handleRideCancelled);

//     return () => {
//       socket.off(SOCKET_EVENTS.RIDE_REQUEST_NEW, handleRideRequest);
//       socket.off(SOCKET_EVENTS.RIDE_CANCELLED, handleRideCancelled);
//     };
//   }, [socket, isConnected, incomingRide, currentRide]);

//   const acceptRide = useCallback(async (rideId) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.post(`/rides/${rideId}/accept`);
      
//       if (response.success) {
//         setCurrentRide(response.ride);
//         setIncomingRide(null);
//         setError(null);
//         return response;
//       } else {
//         throw new Error(response.error || 'Failed to accept ride');
//       }
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const declineRide = useCallback(async (rideId, reason) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.post(`/rides/${rideId}/decline`, {
//         reason,
//       });
      
//       setIncomingRide(null);
//       setError(null);
//       return response;
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const startTrip = useCallback(async (rideId) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.post(`/rides/${rideId}/start`);
      
//       if (response.success) {
//         setCurrentRide(response.ride);
//         setError(null);
//         return response;
//       } else {
//         throw new Error(response.error || 'Failed to start trip');
//       }
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const completeTrip = useCallback(async (rideId, completionData) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.post(`/rides/${rideId}/complete`, completionData);
      
//       if (response.success) {
//         setCurrentRide(null);
//         setError(null);
//         return response;
//       } else {
//         throw new Error(response.error || 'Failed to complete trip');
//       }
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const cancelRide = useCallback(async (rideId, reason) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.post(`/rides/${rideId}/cancel`, {
//         reason,
//       });
      
//       if (response.success) {
//         setCurrentRide(null);
//         setIncomingRide(null);
//         setError(null);
//         return response;
//       } else {
//         throw new Error(response.error || 'Failed to cancel ride');
//       }
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const confirmArrival = useCallback(async (rideId, arrivalType) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.post(`/rides/${rideId}/confirm-arrival`, {
//         arrivalType,
//       });
      
//       if (response.success) {
//         setCurrentRide(response.ride);
//         setError(null);
//         return response;
//       } else {
//         throw new Error(response.error || 'Failed to confirm arrival');
//       }
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   return {
//     currentRide,
//     incomingRide,
//     loading,
//     error,
//     acceptRide,
//     declineRide,
//     startTrip,
//     completeTrip,
//     cancelRide,
//     confirmArrival,
//     hasActiveRide: !!currentRide,
//     hasIncomingRide: !!incomingRide,
//   };
// };

// export default useRide;

'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { ridesAPI } from '@/lib/api/rides';
import { useSocket } from '@/lib/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/Constants';

export const useRide = () => {
  const [currentRide, setCurrentRide] = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { on, off, emit, connected } = useSocket();

  // Listen for ride requests
  useEffect(() => {
    if (!connected) return;

    const handleRideRequest = (data) => {
      console.log('socket data'.data)
      setIncomingRide(data);
      
      // Play notification sound
      const audio = new Audio('/sounds/ride-request.mp3');
      audio.play().catch(err => console.log('Audio play failed:', err));
      
      // Vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate([500, 200, 500]);
      }
    };

    const handleRideCancelled = (data) => {
      if (incomingRide?.rideId === data.rideId) {
        setIncomingRide(null);
      }
      if (currentRide?.id === data.rideId) {
        setCurrentRide(null);
      }
    };

    const handleRideTaken = (data) => {
      if (incomingRide?.rideId === data.rideId) {
        setIncomingRide(null);
      }
    };

    on(SOCKET_EVENTS.RIDE.REQUEST_NEW, handleRideRequest);
    on(SOCKET_EVENTS.RIDE.REQUEST_RECEIVED, handleRideRequest);
    on(SOCKET_EVENTS.RIDE.CANCELLED, handleRideCancelled);
    on(SOCKET_EVENTS.RIDE.TAKEN, handleRideTaken);

    return () => {
      off(SOCKET_EVENTS.RIDE.REQUEST_NEW);
      off(SOCKET_EVENTS.RIDE.REQUEST_RECEIVED);
      off(SOCKET_EVENTS.RIDE.CANCELLED);
      off(SOCKET_EVENTS.RIDE.TAKEN);
    };
  }, [connected, incomingRide, currentRide, on, off]);

  const acceptRide = useCallback(async (rideId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/accept`);
      
      if ((response && response.hasOwnProperty('id')) || response.success || response?.data) {
        setCurrentRide(response.data);
        setIncomingRide(null);
        setError(null);
        
        // Emit socket event
        emit(SOCKET_EVENTS.RIDE.ACCEPT, { rideId });
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to accept ride');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [emit]);

  const declineRide = useCallback(async (rideId, reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/decline`, { reason });
      
      setIncomingRide(null);
      setError(null);
      
      // Emit socket event
      emit(SOCKET_EVENTS.RIDE.DECLINE, { rideId, reason });
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [emit]);

  const startTrip = useCallback(async (rideId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/start`);
      if ((response && response.hasOwnProperty('id')) || response.success || response?.data) {
        setCurrentRide(response.data);
        setError(null);
        return response;
      } else {
        throw new Error(response.error || 'Failed to start trip');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeTrip = useCallback(async (rideId, completionData) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/complete`, completionData);
      if ((response && response.hasOwnProperty('id')) || response.success || response?.data) {
        setCurrentRide(null);
        setError(null);
        return response;
      } else {
        throw new Error(response.error || 'Failed to complete trip');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelRide = useCallback(async (rideId, reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/cancel`, { reason, cancelledBy: 'driver' });
      if ((response && response.hasOwnProperty('id')) || response.success || response?.data) {
        setCurrentRide(null);
        setIncomingRide(null);
        setError(null);
        return response;
      } else {
        throw new Error(response.error || 'Failed to cancel ride');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmArrival = useCallback(async (rideId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/confirm-arrival`);
      if ((response && response.hasOwnProperty('id')) || response.success || response?.data) {
        setCurrentRide(response.data);
      setError(null);
      return response;
    } else {
      throw new Error(response.error || 'Failed to confirm arrival');
    }
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

const loadActiveRide = useCallback(async () => {
  try {
    const result = await ridesAPI.getActiveRide();
    
    if ((result && result.hasOwnProperty('id')) || result.success || result?.data) {
      setCurrentRide(result.data);
    }
  } catch (err) {
    console.error('Error loading active ride:', err);
    return null;
  }
}, [])

 // Load active ride on mount
  useEffect(() => {
    console.log('hit')
    loadActiveRide();
  }, [loadActiveRide]);

return {
  currentRide,
  incomingRide,
  currentRide,
  loading,
  error,
  acceptRide,
  declineRide,
  startTrip,
  completeTrip,
  cancelRide,
  confirmArrival,
  hasActiveRide: !!currentRide,
  hasIncomingRide: !!incomingRide,
};
};

export default useRide;