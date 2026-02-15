// //driver/lib/hooks/useDriver.js
// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { apiClient } from '@/lib/api/client';
// import { useSocket } from '@/lib/socket/SocketProvider';
// import { SOCKET_EVENTS } from '@/Constants';

// export const useDriver = () => {
//   const { user, updateUser } = useAuth();
  
//   const [driverProfile, setDriverProfile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   // Socket integration
//   const { on, off, emit, updateLocation: socketUpdateLocation } = useSocket();

//   useEffect(() => {
//     const getDriver = async () => {
//       try {
//         setLoading(true);
//         const response = await apiClient.get('/users/me?populate[driverProfile][populate]=*');
//         if (response.driverProfile) {
//           setDriverProfile(response.driverProfile);
//         }
//         setError(null);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
//     getDriver()
//   }, [user]);

//   const refreshDriverProfile = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await apiClient.get('/users/me?populate[driverProfile][populate]=*');
//       if (response.driverProfile) {
//         setDriverProfile(response.driverProfile);
//         updateUser({ driverProfile: response.driverProfile });
//       }
//       setError(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, [updateUser]);

//   const toggleOnline = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await apiClient.post('/driver/toggle-online');
      
//       if (response.success) {
//         await refreshDriverProfile();
//         // Emit socket event
//         if (newOnlineStatus) {
//           emit(SOCKET_EVENTS.DRIVER.ONLINE, {
//             driverId: user.id,
//             location: user.currentLocation,
//           });
//         } else {
//           emit(SOCKET_EVENTS.DRIVER.OFFLINE, {
//             driverId: user.id,
//           });
//         }
//         return response;
//       } else {
//         throw new Error(response.error || 'Failed to toggle online status');
//       }
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [refreshDriverProfile]);

//   const updateLocation = useCallback(async (location) => {
//     try {
//       const response = await apiClient.post('/driver/update-location', {
//         location,
//       });
//       return response;
//     } catch (err) {
//       console.error('Error updating location:', err);
//       throw err;
//     }
//   }, []);

//   const updatePreferences = useCallback(async (preferences) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.put('/driver/preferences', preferences);
//       if (response.success) {
//         await refreshDriverProfile();
//       }
//       return response;
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   }, [refreshDriverProfile]);
 
//   // Socket Event Listeners
//   useEffect(() => {
//     if (!user?.id) return;

//     // Listen for forced offline
//     const handleForcedOffline = (data) => {
//       setDriverProfile((prev) => ({
//         ...prev,
//         isOnline: false,
//         isAvailable: false,
//       }));
      
//       // Show alert
//       if (typeof window !== 'undefined') {
//         alert(data.message || 'You have been taken offline');
//       }
//     };

//     // Listen for subscription expiring
//     const handleSubscriptionExpiring = (data) => {
//       console.warn('Subscription expiring:', data);
//       // You can show a snackbar/toast here
//     };

//     // Listen for subscription expired
//     const handleSubscriptionExpired = (data) => {
//       setDriverProfile((prev) => ({
//         ...prev,
//         subscriptionStatus: 'expired',
//         isOnline: false,
//         isAvailable: false,
//       }));
      
//       if (typeof window !== 'undefined') {
//         alert(data.message || 'Your subscription has expired');
//       }
//     };

//     on(SOCKET_EVENTS.DRIVER.FORCED_OFFLINE, handleForcedOffline);
//     on(SOCKET_EVENTS.SUBSCRIPTION.EXPIRING_WARNING, handleSubscriptionExpiring);
//     on(SOCKET_EVENTS.SUBSCRIPTION.EXPIRED, handleSubscriptionExpired);

//     return () => {
//       off(SOCKET_EVENTS.DRIVER.FORCED_OFFLINE);
//       off(SOCKET_EVENTS.SUBSCRIPTION.EXPIRING_WARNING);
//       off(SOCKET_EVENTS.SUBSCRIPTION.EXPIRED);
//     };
//   }, [user?.id, on, off]);

//   return {
//     driverProfile,
//     loading,
//     error,
//     refreshDriverProfile,
//     toggleOnline,
//     updateLocation,
//     updatePreferences,
//     isOnline: driverProfile?.isOnline || false,
//     isAvailable: driverProfile?.isAvailable || false,
//     subscriptionStatus: driverProfile?.subscriptionStatus || 'inactive',
//     verificationStatus: driverProfile?.verificationStatus || 'not_started',
//   };
// };

//driver/lib/hooks/useDriver.js
// export default useDriver;

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api/client';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';

export const useDriver = () => {
  const { user, isAuthenticated } = useAuth();
  const { isNative, sendToNative } = useReactNative();
  const [driverProfile, setDriverProfile] = useState(null);
  const [adminSettings, setAdminSettings] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated() && user) {
      loadDriverProfile();
      loadAdminSettings();
    }
  }, [user, isAuthenticated]);

  const loadDriverProfile = async () => {
    try {
      setLoading(true);
      const driverProfileResponse = await apiClient.get('/users/me?populate[driverProfile][populate]=*')
      const driverProfile = driverProfileResponse?.response?.driverProfile ?? driverProfileResponse?.driverProfile
      if(driverProfile){
        setDriverProfile(driverProfile)
        setIsOnline(driverProfile.isOnline || false)
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const response = await apiClient.get('/admn-setting');
      if (response?.data) {
        setAdminSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const toggleOnline = async (newStatus) => {
    try {
      const response = await apiClient.post('/driver/toggle-online', {
        isOnline: newStatus
      });

      if (response.success) {
        setIsOnline(newStatus);
        
        // Control native location tracking
        if (isNative && sendToNative) {
          if (newStatus) {
            // Going online - start tracking
            const interval = adminSettings?.getOnlineDriverCurrentLocationCronIntervalInSecs || 10;
            sendToNative('START_LOCATION_TRACKING', {
              interval: interval * 1000
            });
          } else {
            // Going offline - stop tracking
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
    
    const checks = {
      verification: driverProfile.verificationStatus === 'approved',
      vehicle: !!driverProfile.assignedVehicle,
      subscription: adminSettings?.subscriptionSystemEnabled 
        ? ['active', 'trial'].includes(driverProfile.subscriptionStatus)
        : true,
      float: adminSettings?.paymentSystemType === 'float_based'
        ? (driverProfile.floatBalance || 0) >= (adminSettings?.minimumFloatBalance || 0)
        : true,
    };

    return Object.values(checks).every(Boolean);
  }, [driverProfile, adminSettings]);

  const needsVerification = driverProfile?.verificationStatus !== 'approved';
  const needsVehicle = !driverProfile?.assignedVehicle;
  // sendToNative('LOG_DATA', {info: 'needsVerification',needsVerification})
  // sendToNative('LOG_DATA', {info: 'needsVehicle',needsVehicle})
  const needsSubscription = adminSettings?.subscriptionSystemEnabled &&
    !['active', 'trial'].includes(driverProfile?.subscriptionStatus);
  const needsFloat = adminSettings?.paymentSystemType === 'float_based' &&
    (driverProfile?.floatBalance || 0) < (adminSettings?.minimumFloatBalance || 0);
  const paymentSystemType = adminSettings?.paymentSystemType || 'subscription_based';

  return {
    driverProfile,
    adminSettings,
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