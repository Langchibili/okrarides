//Okrarides\driver\lib\hooks\useSubscription.js
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

  // Listen for subscription socket events
  useEffect(() => {
    if (!connected) return;

    const handleSubscriptionExpiring = (data) => {
      console.warn('Subscription expiring:', data);
    };

    const handleSubscriptionExpired = () => {
      setCurrentSubscription((prev) => ({
        ...prev,
        subscriptionStatus: 'expired',
      }));
      updateUser({
        driverProfile: {
          ...user?.driverProfile,
          subscriptionStatus: 'expired',
        },
      });
    };

    const handleSubscriptionActivated = (data) => {
      // Fired by backend when OkraPay payment succeeds and subscription is activated
      setCurrentSubscription(data?.subscription ?? data);
      updateUser({
        driverProfile: {
          ...user?.driverProfile,
          subscriptionStatus: data?.subscription?.subscriptionStatus ?? 'active',
          currentSubscription: data?.subscription ?? data,
        },
      });
    };

    on(SOCKET_EVENTS.SUBSCRIPTION_EXPIRING,  handleSubscriptionExpiring);
    on(SOCKET_EVENTS.SUBSCRIPTION_EXPIRED,   handleSubscriptionExpired);
    on(SOCKET_EVENTS.SUBSCRIPTION_ACTIVATED, handleSubscriptionActivated);

    return () => {
      off(SOCKET_EVENTS.SUBSCRIPTION_EXPIRING,  handleSubscriptionExpiring);
      off(SOCKET_EVENTS.SUBSCRIPTION_EXPIRED,   handleSubscriptionExpired);
      off(SOCKET_EVENTS.SUBSCRIPTION_ACTIVATED, handleSubscriptionActivated);
    };
  }, [connected, user, updateUser]);

  // ── Fetch plans ────────────────────────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/subscriptions/plans');

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

  // ── Fetch current subscription ─────────────────────────────────────────────
  const fetchCurrentSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/subscriptions/me');

      if (response.subscription !== undefined) {
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

  // ── Free trial ─────────────────────────────────────────────────────────────
  const startFreeTrial = useCallback(async (planId) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/start-trial', { planId });

      if (response.success) {
        setCurrentSubscription(response.data ?? response.subscription ?? null);
        updateUser({
          driverProfile: {
            ...user?.driverProfile,
            subscriptionStatus: 'trial',
            currentSubscription: response.data ?? response.subscription,
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

  // ── Create subscription intent (for OkraPayModal) ─────────────────────────
  //
  // Calls POST /subscriptions/subscribe which creates a PENDING subscription
  // and returns:
  //   { success: true, subscriptionId: <id>, amount: <price>, data: {...} }
  //
  // The backend only activates the subscription (status → 'active') AFTER
  // OkraPay confirms payment via handleSubscriptionPaymentSuccess.
  //
  // Returns { subscriptionId, amount } for the caller (plans/page.jsx) to
  // pass to OkraPayModal.
  const createSubscriptionIntent = useCallback(async (planId) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/subscribe', { planId });

      if (response.success) {
        // Validate that we received a subscriptionId to pass to OkraPayModal
        if (!response.subscriptionId) {
          throw new Error('Backend did not return a subscriptionId. Cannot open payment modal.');
        }
        setError(null);
        // Return the full response — caller needs subscriptionId + amount
        return {
          success:        true,
          subscriptionId: response.subscriptionId,
          amount:         response.amount,
          data:           response.data,
        };
      } else {
        throw new Error(response.error || 'Failed to create subscription');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Legacy subscribe (kept for compatibility) ──────────────────────────────
  const subscribe = useCallback(async (planId) => {
    return createSubscriptionIntent(planId);
  }, [createSubscriptionIntent]);

  // ── Renew ──────────────────────────────────────────────────────────────────
  const renewSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/renew');

      if (response.success) {
        setError(null);
        return response;
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

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const cancelSubscription = useCallback(async (reason) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/cancel', { reason });

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

  // ── Auto-renew toggle ──────────────────────────────────────────────────────
  const toggleAutoRenew = useCallback(async (autoRenew) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/subscriptions/toggle-auto-renew', { autoRenew });

      if (response.success) {
        setCurrentSubscription((prev) => ({ ...prev, autoRenew }));
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
    createSubscriptionIntent,
    subscribe,
    renewSubscription,
    cancelSubscription,
    toggleAutoRenew,
    isActive:      currentSubscription?.subscriptionStatus === 'active',
    isTrial:       currentSubscription?.subscriptionStatus === 'trial',
    isExpired:     currentSubscription?.subscriptionStatus === 'expired',
    daysRemaining: currentSubscription
      ? Math.max(0, Math.ceil(
          (new Date(currentSubscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
        ))
      : 0,
  };
};

export default useSubscription;