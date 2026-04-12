// PATH: driver/lib/hooks/useDeliveryDriver.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api/client';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { VERIFICATION_STATUS } from '@/Constants';

export const useDeliveryDriver = () => {
  const { user, isAuthenticated } = useAuth();
  const { isNative, sendToNative } = useReactNative();
  const {
    paymentSystemType,
    isSubscriptionSystemEnabled,
    isFloatSystemEnabled,
    canDriverReceiveCashRide,
  } = useAdminSettings();

  const [deliveryProfile, setDeliveryProfile] = useState(null);
  // driverProfile still needed for float/subscription checks
  const [driverProfile, setDriverProfile]     = useState(null);
  const [isOnline, setIsOnline]               = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [hasVehicle, setHasVehicle] = useState(false)
  
  useEffect(() => {
    if (isAuthenticated() && user) loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfiles = async () => {
  try {
    setLoading(true);

    // ──────────────────────────────────────────────────────────────
    // STEP 1: Get the user account with basic population (*)
    // ──────────────────────────────────────────────────────────────
    const userRes = await apiClient.get('/users/me?populate=*');
    let user = userRes?.data || userRes;   // handle both Strapi formats
    // ────────────────────────────────────── ────────────────────────
    // STEP 2: Fetch Driver Profile individually with full population
    // ──────────────────────────────────────────────────────────────
    if (user?.driverProfile?.id) {
      const driverRes = await apiClient.get('/users/me?populate=driverProfile.currentSubscription');
      // Attach the fully populated driver profile back to the user object
      user.driverProfile = driverRes?.data?.driverProfile || driverRes?.driverProfile;
    }

    // ──────────────────────────────────────────────────────────────
    // STEP 3: Fetch Delivery Profile individually with full population
    // ──────────────────────────────────────────────────────────────
    if (user?.deliveryProfile?.id) {
      const deliveryRes = await apiClient.get('/users/me?'+ 
        'populate[deliveryProfile][populate][motorbike][populate]=vehicle&' +
        'populate[deliveryProfile][populate][taxi][populate]=vehicle&' +
        'populate[deliveryProfile][populate][truck][populate]=vehicle&' +
        'populate[deliveryProfile][populate][motorcycle][populate]=vehicle')
      user.deliveryProfile = deliveryRes?.data?.deliveryProfile  || deliveryRes?.deliveryProfile 
    }

    if(user?.deliveryProfile?.taxi?.vehicle || user?.deliveryProfile?.truck?.vehicle ||  user?.deliveryProfile?.motorcycle?.vehicle || user?.deliveryProfile?.motorbike?.vehicle){
        setHasVehicle(true)
    }
    else{
        setHasVehicle(false)
    }
    //setHasVehicle
    // ──────────────────────────────────────────────────────────────
    // STEP 4: Update your state with the enriched user
    // ──────────────────────────────────────────────────────────────
    setDeliveryProfile(user?.deliveryProfile ?? null);
    setDriverProfile(user?.driverProfile ?? null);
    setIsOnline(user?.deliveryProfile?.isOnline ?? false);
    // Return the fully enriched user object (as you asked)
    return user;

  } catch (err) {
    console.error('Error loading profiles:', err);
    // Optional: you can still set empty states here if you want
  } finally {
    setLoading(false);
  }
};

  // ─── Toggle online (delivery-driver-specific endpoint) ──────────────────────
  const toggleOnline = useCallback(async (newStatus) => {
    try {
      const response = await apiClient.post('/delivery-driver/toggle-online');
      if (response.success) {
        setIsOnline(response.isOnline ?? newStatus);

        if (isNative && sendToNative) {
          if (response.isOnline ?? newStatus) {
            sendToNative('START_LOCATION_TRACKING', { interval: 10_000 });
          } else {
            sendToNative('STOP_LOCATION_TRACKING', {});
          }
        }
        return { allowed: true, isOnline: response.isOnline ?? newStatus };
      }
      return { allowed: false, message: response.error };
    } catch (err) {
      console.error('Error toggling delivery online:', err);
      return { allowed: false, message: err.message };
    }
  }, [isNative, sendToNative]);

  // ─── Eligibility ─────────────────────────────────────────────────────────────
  const canGoOnline = useCallback(() => {
    if (!deliveryProfile) return false;
    const isVerified    = driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED;
    const activeType    = deliveryProfile.activeVehicleType;
    const hasVehicle    = activeType && activeType !== 'none' && !!deliveryProfile[activeType]?.vehicle;
    const hasSub        = isSubscriptionSystemEnabled
      ? ['active', 'trial'].includes(driverProfile?.subscriptionStatus)
      : true;
    const hasFloat      = isFloatSystemEnabled
      ? canDriverReceiveCashRide(driverProfile?.floatBalance ?? 0)
      : true;
    return isVerified && hasVehicle && hasSub && hasFloat;
  }, [deliveryProfile, driverProfile, isSubscriptionSystemEnabled, isFloatSystemEnabled, canDriverReceiveCashRide]);

  // ─── Derived flags ───────────────────────────────────────────────────────────
  const needsVerification = driverProfile?.verificationStatus !== 'approved';
  const needsVehicle      = !hasVehicle
  const needsSubscription = isSubscriptionSystemEnabled &&
    !['active', 'trial'].includes(driverProfile?.subscriptionStatus);
  const needsFloat        = isFloatSystemEnabled &&
    !canDriverReceiveCashRide(driverProfile?.floatBalance ?? 0);

  // Active vehicle info for display
  const activeVehicleType = deliveryProfile?.activeVehicleType;
  const activeVehicle     = activeVehicleType && activeVehicleType !== 'none'
    ? deliveryProfile?.[activeVehicleType]?.vehicle ?? null
    : null;
    
  return {
    deliveryProfile,
    driverProfile,
    isOnline,
    loadingDeliveryProfile: loading,
    toggleOnline,
    canGoOnline,
    needsVerification,
    needsVehicle,
    needsSubscription,
    needsFloat,
    activeVehicleType,
    activeVehicle,
    paymentSystemType,
    refreshProfile: loadProfiles,
  };
};

export default useDeliveryDriver;