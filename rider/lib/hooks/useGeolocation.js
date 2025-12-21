'use client';

import { useState, useEffect, useCallback } from 'react';

export const useGeolocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;
  
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const onSuccess = useCallback((position) => {
    setLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    });
    setError(null);
    setLoading(false);
  }, []);
  
  const onError = useCallback((err) => {
    setError({
      code: err.code,
      message: err.message,
    });
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      setLoading(false);
      return;
    }
    
    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };
    
    let watchId;
    
    if (watch) {
      watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        geoOptions
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        geoOptions
      );
    }
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, watch, onSuccess, onError]);
  
  // Manual refresh
  const refresh = useCallback(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);
  
  return {
    location,
    error,
    loading,
    refresh,
  };
};

export default useGeolocation;

