import { VERIFICATION_STATUS } from '@/Constants';

/**
 * Check if driver can go online
 */
export const canGoOnline = (driverProfile, adminSettings) => {
  const checks = {
    verified: false,
    hasVehicle: false,
    hasSubscription: false,
    hasFloat: false,
  };

  const errors = [];

  // Check verification
  if (driverProfile?.verificationStatus !== VERIFICATION_STATUS.APPROVED) {
    errors.push({
      type: 'verification',
      message: 'You must be verified before going online',
      action: 'complete_verification',
    });
  } else {
    checks.verified = true;
  }

  // Check vehicle
  if (!driverProfile?.assignedVehicle) {
    errors.push({
      type: 'vehicle',
      message: 'You must add a vehicle before going online',
      action: 'add_vehicle',
    });
  } else {
    checks.hasVehicle = true;
  }

  // Check subscription (if subscription system is enabled)
  if (adminSettings?.subscriptionSystemEnabled) {
    const subscriptionStatus = driverProfile?.subscriptionStatus;
    const validStatuses = ['active', 'trial'];

    if (!validStatuses.includes(subscriptionStatus)) {
      errors.push({
        type: 'subscription',
        message: 'You need an active subscription to go online',
        action: 'subscribe',
      });
    } else {
      checks.hasSubscription = true;
    }
  } else {
    checks.hasSubscription = true; // Not required
  }

  // Check float (if float system is enabled and subscription not active)
  if (adminSettings?.floatSystemEnabled && !checks.hasSubscription) {
    const floatBalance = driverProfile?.floatBalance || 0;

    if (floatBalance < 0 && !adminSettings.allowNegativeFloat) {
      errors.push({
        type: 'float',
        message: 'Your float balance is negative. Please top up to continue',
        action: 'topup_float',
      });
    } else if (
      floatBalance < -adminSettings.negativeFloatLimit &&
      adminSettings.allowNegativeFloat
    ) {
      errors.push({
        type: 'float',
        message: 'You have exceeded your negative float limit',
        action: 'topup_float',
      });
    } else {
      checks.hasFloat = true;
    }
  } else {
    checks.hasFloat = true; // Not required
  }

  const canGoOnline = errors.length === 0;

  return {
    allowed: canGoOnline,
    checks,
    errors,
    primaryError: errors[0] || null,
  };
};

/**
 * Check if driver can accept rides
 */
export const canAcceptRide = (driverProfile, adminSettings) => {
  const onlineCheck = canGoOnline(driverProfile, adminSettings);

  if (!onlineCheck.allowed) {
    return {
      allowed: false,
      reason: onlineCheck.primaryError?.message,
      action: onlineCheck.primaryError?.action,
    };
  }

  // Additional checks for accepting rides
  if (!driverProfile?.isOnline) {
    return {
      allowed: false,
      reason: 'You must be online to accept rides',
      action: 'go_online',
    };
  }

  if (driverProfile?.currentRide) {
    return {
      allowed: false,
      reason: 'You already have an active ride',
      action: 'complete_current_ride',
    };
  }

  return {
    allowed: true,
  };
};

/**
 * Get payment system type for driver
 */
export const getPaymentSystemType = (driverProfile, adminSettings) => {
  if (adminSettings?.subscriptionSystemEnabled && adminSettings?.floatSystemEnabled) {
    // Hybrid mode - check driver's current status
    const subscriptionStatus = driverProfile?.subscriptionStatus;
    if (['active', 'trial'].includes(subscriptionStatus)) {
      return 'subscription'; // Driver is on subscription
    }
    return 'float'; // Driver using float system
  }

  if (adminSettings?.subscriptionSystemEnabled) {
    return 'subscription';
  }

  return 'float';
};