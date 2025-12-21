'use client';

import { useState, useEffect, useCallback } from 'react';
import { ridesAPI } from '@/lib/api/rides';
import { RIDE_STATUS } from '@/Constants';

export const useRide = (rideId = null) => {
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeRide, setActiveRide] = useState(null);

  // Load ride by ID
  const loadRide = useCallback(async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await ridesAPI.getRide(id);
      setRide(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load active ride
  const loadActiveRide = useCallback(async () => {
    try {
      const data = await ridesAPI.getActiveRide();
      setActiveRide(data);
      return data;
    } catch (err) {
      console.error('Error loading active ride:', err);
      return null;
    }
  }, []);

  // Get price estimate
  const getEstimate = useCallback(async (pickupLocation, dropoffLocation, rideTypes) => {
    try {
      setLoading(true);
      setError(null);
      const estimate = await ridesAPI.getEstimate({
        pickupLocation,
        dropoffLocation,
        rideTypes,
      });
      return estimate;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new ride
  const createRide = useCallback(async (rideData) => {
    try {
      setLoading(true);
      setError(null);
      const newRide = await ridesAPI.createRide(rideData);
      setRide(newRide);
      setActiveRide(newRide);
      return newRide;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel ride
  const cancelRide = useCallback(async (id, reason) => {
    try {
      setLoading(true);
      setError(null);
      const cancelledRide = await ridesAPI.cancelRide(id, reason);
      
      // Update local state
      if (ride?.id === id) {
        setRide(cancelledRide);
      }
      if (activeRide?.id === id) {
        setActiveRide(null);
      }
      
      return cancelledRide;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ride, activeRide]);

  // Rate driver
  const rateDriver = useCallback(async (rideId, rating, review, tags = []) => {
    try {
      setLoading(true);
      setError(null);
      const ratingData = await ridesAPI.rateDriver(rideId, rating, review, tags);
      return ratingData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Track ride (polling - WebSocket alternative)
  const startTracking = useCallback((id, onUpdate) => {
    const interval = setInterval(async () => {
      try {
        const trackData = await ridesAPI.trackRide(id);
        if (onUpdate) {
          onUpdate(trackData);
        }
        setRide(trackData.ride);
        
        // Stop tracking if ride is completed or cancelled
        if ([RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED].includes(trackData.ride.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Tracking error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Load ride on mount if rideId provided
  useEffect(() => {
    if (rideId) {
      loadRide(rideId);
    }
  }, [rideId, loadRide]);

  // Load active ride on mount
  useEffect(() => {
    loadActiveRide();
  }, [loadActiveRide]);

  return {
    ride,
    activeRide,
    loading,
    error,
    loadRide,
    loadActiveRide,
    getEstimate,
    createRide,
    cancelRide,
    rateDriver,
    startTracking,
  };
};

export default useRide;
