// Okra\Okrarides\driver\lib\hooks\useDriver.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api/client';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';

export const useDriver = () => {
  const { user, isAuthenticated } = useAuth();
  const { isNative, sendToNative } = useReactNative();
  const {
    paymentSystemType,
    isSubscriptionSystemEnabled,
    isFloatSystemEnabled,
    minimumFloatTopup,
    isNegativeFloatAllowed,
    negativeFloatLimit,
    getOnlineDriverCurrentLocationCronIntervalInSecs,
    canDriverReceiveCashRide,
  } = useAdminSettings();

  const [driverProfile, setDriverProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated() && user) {
      loadDriverProfile();
    }
  }, [user, isAuthenticated]);

  const loadDriverProfile = async () => {
    try {
      setLoading(true);
      const driverProfileResponse = await apiClient.get('/users/me?populate[driverProfile][populate]=*');
      const profile = driverProfileResponse?.response?.driverProfile ?? driverProfileResponse?.driverProfile;
      if (profile) {
        setDriverProfile(profile);
        setIsOnline(profile.isOnline || false);
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async (newStatus) => {
    try {
      const response = await apiClient.post('/driver/toggle-online', { isOnline: newStatus });

      if (response.success) {
        setIsOnline(newStatus);

        if (isNative && sendToNative) {
          if (newStatus) {
            sendToNative('START_LOCATION_TRACKING', {
              interval: (getOnlineDriverCurrentLocationCronIntervalInSecs || 10) * 1000,
            });
          } else {
            sendToNative('STOP_LOCATION_TRACKING', {});
          }
        }

        return { allowed: true, isOnline: newStatus };
      }

      return { allowed: false, message: response.error };
    } catch (error) {
      console.error('Error toggling online:', error);
      return { allowed: false, message: error.message };
    }
  };

  const canGoOnline = useCallback(() => {
    if (!driverProfile) return false;

    const isVerified = driverProfile.verificationStatus === 'approved';
    const hasVehicle = !!driverProfile.assignedVehicle;

    const hasValidSubscription = isSubscriptionSystemEnabled
      ? ['active', 'trial'].includes(driverProfile.subscriptionStatus)
      : true;

    const hasValidFloat = isFloatSystemEnabled
      ? canDriverReceiveCashRide(driverProfile.floatBalance || 0)
      : true;

    return isVerified && hasVehicle && hasValidSubscription && hasValidFloat;
  }, [driverProfile, isSubscriptionSystemEnabled, isFloatSystemEnabled, canDriverReceiveCashRide]);

  // ─── Derived status flags ──────────────────────────────────────────────────
  const needsVerification = driverProfile?.verificationStatus !== 'approved';
  const needsVehicle = !driverProfile?.assignedVehicle;

  const needsSubscription =
    isSubscriptionSystemEnabled &&
    !['active', 'trial'].includes(driverProfile?.subscriptionStatus);

  const needsFloat =
    isFloatSystemEnabled &&
    !canDriverReceiveCashRide(driverProfile?.floatBalance || 0);

  return {
    driverProfile,
    isOnline,
    loadingDriverProfile: loading,
    toggleOnline,
    canGoOnline,
    needsVerification,
    needsVehicle,
    needsSubscription,
    needsFloat,
    paymentSystemType,
    refreshProfile: loadDriverProfile,
  };
};

export default useDriver;