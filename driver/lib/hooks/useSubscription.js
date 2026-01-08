'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWebSocket } from './useWebSocket';
import { SOCKET_EVENTS } from '@/Constants';

export const useSubscription = () => {
  const { user, updateUser } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (user?.driverProfile?.currentSubscription) {
      fetchCurrentSubscription();
    }
  }, [user]);

  // Listen for subscription events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleSubscriptionExpiring = (data) => {
      // Show warning notification
      console.warn('Subscription expiring:', data);
    };

    const handleSubscriptionExpired = (data) => {
      // Update subscription status
      setCurrentSubscription((prev) => ({
        ...prev,
        status: 'expired',
      }));
      updateUser({
        driverProfile: {
          ...user.driverProfile,
          subscriptionStatus: 'expired',
        },
      });
    };

    socket.on(SOCKET_EVENTS.SUBSCRIPTION_EXPIRING, handleSubscriptionExpiring);
    socket.on(SOCKET_EVENTS.SUBSCRIPTION_EXPIRED, handleSubscriptionExpired);

    return () => {
      socket.off(SOCKET_EVENTS.SUBSCRIPTION_EXPIRING, handleSubscriptionExpiring);
      socket.off(SOCKET_EVENTS.SUBSCRIPTION_EXPIRED, handleSubscriptionExpired);
    };
  }, [socket, isConnected, user, updateUser]);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/subscriptions/plans');
      
      if (response.success) {
        setPlans(response.plans);
        setError(null);
        return response.plans;
      } else {
        throw new Error(response.error || 'Failed to fetch plans');
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
          status: 'cancelled',
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
    isActive: currentSubscription?.status === 'active',
    isTrial: currentSubscription?.status === 'trial',
    isExpired: currentSubscription?.status === 'expired',
    daysRemaining: currentSubscription ? 
      Math.ceil((new Date(currentSubscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : 
      0,
  };
};

export default useSubscription;

