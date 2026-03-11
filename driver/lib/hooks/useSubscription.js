'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSocket } from '@/lib/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/Constants';

export const useSubscription = () => {
  const { user, updateUser } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { on, off, emit, connected } = useSocket();

  useEffect(() => {
    if (user?.driverProfile?.currentSubscription) {
      fetchCurrentSubscription();
    }
  }, [user]);

  // Listen for subscription events
  useEffect(() => {
    if (!connected) return;

    const handleSubscriptionExpiring = (data) => {
      // Show warning notification
      console.warn('Subscription expiring:', data);
    };

    const handleSubscriptionExpired = (data) => {
      // Update subscription status
      setCurrentSubscription((prev) => ({
        ...prev,
        subscriptionStatus: 'expired',
      }));
      updateUser({
        driverProfile: {
          ...user.driverProfile,
          subscriptionStatus: 'expired',
        },
      });
    };

    on(SOCKET_EVENTS.SUBSCRIPTION_EXPIRING, handleSubscriptionExpiring);
    on(SOCKET_EVENTS.SUBSCRIPTION_EXPIRED, handleSubscriptionExpired);

    return () => {
      off(SOCKET_EVENTS.SUBSCRIPTION_EXPIRING, handleSubscriptionExpiring);
      off(SOCKET_EVENTS.SUBSCRIPTION_EXPIRED, handleSubscriptionExpired);
    };
  }, [connected, user, updateUser]);

  const fetchPlans = useCallback(async () => {
  try {
    setLoading(true);
    const response = await apiClient.get('/subscriptions/plans');

    // Handle raw array (e.g. Strapi returns the array directly)
    // OR a wrapped response like { success: true, plans: [...] }
    const plansData = Array.isArray(response)
      ? response
      : response?.plans ?? null;

    if (plansData) {
      setPlans(plansData);
      setError(null);
      return plansData;
    } else {
      throw new Error(response?.error || 'Failed to fetch plans');
    }
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  const fetchCurrentSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/subscriptions/me');
      
      if (response.success) {
        setCurrentSubscription(response.subscription);
        setError(null);
        return response.subscription;
      } else {
        throw new Error(response.error || 'Failed to fetch subscription');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startFreeTrial = useCallback(async (planId) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/start-trial', {
        planId,
      });
      
      if (response.success) {
        setCurrentSubscription(response.subscription);
        updateUser({
          driverProfile: {
            ...user.driverProfile,
            subscriptionStatus: 'trial',
            currentSubscription: response.subscription,
          },
        });
        setError(null);
        return response;
      } else {
        throw new Error(response.error || 'Failed to start trial');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  const subscribe = useCallback(async (planId) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/subscribe', {
        planId,
      });
      
      if (response.success) {
        setError(null);
        return response; // Returns paymentUrl for redirect
      } else {
        throw new Error(response.error || 'Failed to subscribe');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const renewSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/renew');
      
      if (response.success) {
        setError(null);
        return response; // Returns paymentUrl for redirect
      } else {
        throw new Error(response.error || 'Failed to renew');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/cancel', {
        reason,
      });
      
      if (response.success) {
        setCurrentSubscription((prev) => ({
          ...prev,
          subscriptionStatus: 'cancelled',
          autoRenew: false,
        }));
        setError(null);
        return response;
      } else {
        throw new Error(response.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAutoRenew = useCallback(async (autoRenew) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/toggle-auto-renew', {
        autoRenew,
      });
      
      if (response.success) {
        setCurrentSubscription((prev) => ({
          ...prev,
          autoRenew,
        }));
        setError(null);
        return response;
      } else {
        throw new Error(response.error || 'Failed to toggle auto-renew');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    currentSubscription,
    plans,
    loading,
    error,
    fetchPlans,
    fetchCurrentSubscription,
    startFreeTrial,
    subscribe,
    renewSubscription,
    cancelSubscription,
    toggleAutoRenew,
    isActive: currentSubscription?.subscriptionStatus === 'active',
    isTrial: currentSubscription?.subscriptionStatus === 'trial',
    isExpired: currentSubscription?.subscriptionStatus === 'expired',
    daysRemaining: currentSubscription ? 
      Math.ceil((new Date(currentSubscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : 
      0,
  };
};

export default useSubscription;

