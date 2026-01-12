'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';
import { useDriver } from './useDriver';
import { VERIFICATION_STATUS } from '@/Constants';

export const useAuthGuard = (options = {}) => {
  const {
    requireAuth = true,
    requireVerification = false,
    requireSubscription = false,
    redirectTo = '/login',
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { driverProfile, adminSettings } = useDriver();

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // Check authentication
    if (requireAuth && !isAuthenticated()) {
      router.push(redirectTo);
      return;
    }

    if (requireVerification) {
      if(user?.driverProfile?.verificationStatus !== VERIFICATION_STATUS.APPROVED){
         router.push('/onboarding/setup-driver');
         return;
      }
      if (requireAuth && isAuthenticated() && !user?.driverProfile) {
        console.log('here',requireAuth , isAuthenticated() , !user?.driverProfile)
        router.push('/onboarding/setup-driver');
        return;
      }
      
    }

    // Check verification status
    // if (requireVerification) {
    //   const verificationStatus = driverProfile?.verificationStatus;

    //   if (verificationStatus !== VERIFICATION_STATUS.APPROVED) {
    //     // Allow access to verification-related pages
    //     const allowedPaths = [
    //       '/verification',
    //       '/verification/documents',
    //       '/vehicle/add',
    //       '/profile',
    //     ];

    //     if (!allowedPaths.some((path) => pathname.startsWith(path))) {
    //       router.push('/verification');
    //       return;
    //     }
    //   }
    // }

    // Check subscription (if system is subscription-based)
    if (requireSubscription && adminSettings?.subscriptionSystemEnabled) {
      const subscriptionStatus = driverProfile?.subscriptionStatus;
      const allowedStatuses = ['active', 'trial'];

      if (!allowedStatuses.includes(subscriptionStatus)) {
        // Allow access to subscription pages
        const allowedPaths = ['/subscription', '/profile'];

        if (!allowedPaths.some((path) => pathname.startsWith(path))) {
          router.push('/subscription/plans');
          return;
        }
      }
    }
  }, [
    authLoading,
    isAuthenticated,
    user,
    driverProfile,
    adminSettings,
    requireAuth,
    requireVerification,
    requireSubscription,
    router,
    pathname,
    redirectTo,
  ]);

  return {
    isAuthenticated: isAuthenticated(),
    user,
    driverProfile,
    loading: authLoading,
  };
};

export default useAuthGuard;

