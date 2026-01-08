'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useWebSocket } from './useWebSocket';
import { SOCKET_EVENTS } from '@/Constants';

export const useRide = () => {
  const [currentRide, setCurrentRide] = useState(null);
  const [incomingRide, setIncomingRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket, isConnected } = useWebSocket();

  // Listen for ride requests
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRideRequest = (data) => {
      setIncomingRide(data);
    };

    const handleRideCancelled = (data) => {
      if (incomingRide?.rideId === data.rideId) {
        setIncomingRide(null);
      }
      if (currentRide?.id === data.rideId) {
        setCurrentRide(null);
      }
    };

    socket.on(SOCKET_EVENTS.RIDE_REQUEST_NEW, handleRideRequest);
    socket.on(SOCKET_EVENTS.RIDE_CANCELLED, handleRideCancelled);

    return () => {
      socket.off(SOCKET_EVENTS.RIDE_REQUEST_NEW, handleRideRequest);
      socket.off(SOCKET_EVENTS.RIDE_CANCELLED, handleRideCancelled);
    };
  }, [socket, isConnected, incomingRide, currentRide]);

  const acceptRide = useCallback(async (rideId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/accept`);
      
      if (response.success) {
        setCurrentRide(response.ride);
        setIncomingRide(null);
        setError(null);
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
  }, []);

  const declineRide = useCallback(async (rideId, reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/decline`, {
        reason,
      });
      
      setIncomingRide(null);
      setError(null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startTrip = useCallback(async (rideId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/start`);
      
      if (response.success) {
        setCurrentRide(response.ride);
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
      
      if (response.success) {
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
      const response = await apiClient.post(`/rides/${rideId}/cancel`, {
        reason,
      });
      
      if (response.success) {
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

  const confirmArrival = useCallback(async (rideId, arrivalType) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/rides/${rideId}/confirm-arrival`, {
        arrivalType,
      });
      
      if (response.success) {
        setCurrentRide(response.ride);
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
    hasActiveRide: !!currentRide,
    hasIncomingRide: !!incomingRide,
  };
};

export default useRide;
