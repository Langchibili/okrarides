// PATH: lib/hooks/usePartner.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getDashboard } from '@/lib/api/partner';

export function usePartner() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const partnerProfile = user?.partnerProfile ?? null;
  const isApproved = partnerProfile?.verificationStatus === 'approved';
  const currency = user?.country?.currency?.symbol ?? 'K';
  const phoneCode = String(user?.country?.phoneCode ?? '260').replace(/\D/g, '');
  const currencyCode = user?.country?.currency?.code ?? 'ZMW';
  const acceptedMM = user?.country?.acceptedMobileMoneyPayments ?? null;

  const loadDashboard = useCallback(async () => {
    if (!isApproved) return;
    setLoading(true);
    try {
      const data = await getDashboard();
      setDashboard(data);
    } finally {
      setLoading(false);
    }
  }, [isApproved]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    partnerProfile,
    isApproved,
    dashboard,
    loading,
    currency,
    currencyCode,
    phoneCode,
    acceptedMM,
    refreshDashboard: loadDashboard,
  };
}
