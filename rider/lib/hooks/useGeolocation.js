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
  const [permissionStatus, setPermissionStatus] = useState('prompt');

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
    console.error('Geolocation error:', err);
    setError({
      code: err.code,
      message: err.message,
    });
    setLoading(false);
  }, []);

  // Request permission first
  const requestPermission = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        setError({
          code: 0,
          message: 'Geolocation is not supported by this browser',
        });
        setLoading(false);
        return false;
      }

      // Check permission status
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(result.state);
        
        if (result.state === 'denied') {
          setError({
            code: 1,
            message: 'Location permission denied. Please enable location in your browser settings.',
          });
          setLoading(false);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Permission check error:', err);
      return true; // Continue anyway
    }
  }, []);

  useEffect(() => {
    let watchId;
    
    const startTracking = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const geoOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge,
      };

      if (watch) {
        watchId = navigator.geolocation.watchPosition(
          onSuccess,
          onError,
          geoOptions
        );
      } else {
        navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
      }
    };

    startTracking();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, watch, onSuccess, onError, requestPermission]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy,
      timeout,
      maximumAge
    });
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError, requestPermission]);

  return {
    location,
    error,
    loading,
    refresh,
    permissionStatus,
  };
};

export default useGeolocation;