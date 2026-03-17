// lib/hooks/useDriverNative.js - Custom hook for driver app
import { useEffect, useState, useCallback } from 'react';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { useAuth } from '@/lib/hooks/useAuth';

export const useDriverNative = () => {
  const { user, isAuthenticated } = useAuth();
  const nativeContext = useReactNative();
  const [locationPermission, setLocationPermission] = useState(null);

  // NOTE: We do NOT auto-initialize services here!
  // Services are initialized manually in login/signup after authentication

  // Check location permission status
  useEffect(() => {
    const checkLocationStatus = async () => {
      if (nativeContext.servicesInitialized) {
        const locPerm = await nativeContext.checkPermission('location');
        setLocationPermission(locPerm);
      }
    };

    checkLocationStatus();
  }, [nativeContext.servicesInitialized, nativeContext]);

  // Handle location updates from native
  useEffect(() => {
    if (!nativeContext.servicesInitialized) return;

    const unsubscribe = nativeContext.on('LOCATION_UPDATE', (location) => {
      console.log('📍 Location update received:', location);
      // Update location in your app state/context
    });

    return () => unsubscribe();
  }, [nativeContext.servicesInitialized, nativeContext]);

  // Start tracking when driver goes online
  const startTracking = useCallback(async () => {
    if (locationPermission !== 'granted') {
      await requestLocationPermission();
      return;
    }

    await nativeContext.startLocationTracking(5000);
  }, [nativeContext, locationPermission, requestLocationPermission]);

  // Stop tracking when driver goes offline
  const stopTracking = useCallback(async () => {
    await nativeContext.stopLocationTracking();
  }, [nativeContext]);

  return {
    ...nativeContext,
    initialized,
    locationPermission,
    requestLocationPermission,
    requestNotificationPermission,
    requestDrawOverPermission,
    startTracking,
    stopTracking,
  };
}
