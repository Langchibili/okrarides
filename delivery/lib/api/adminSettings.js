// lib/api/adminSettings.js
import { apiClient } from './client'

/**
 * Fetch admin settings
 * Admin settings is a single-type, so no ID needed
 */
export const getAdminSettings = async () => {
  try {
    const response = await apiClient.get('/admn-setting', {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.data || response
  } catch (error) {
    console.error('Get admin settings error:', error)
    throw new Error(
      error.response?.error?.message || error.message || 'Failed to fetch admin settings'
    )
  }
}

/**
 * Update admin settings (admin only)
 */
export const updateAdminSettings = async (data) => {
  try {
    const response = await apiClient.put('/admn-setting', { data })
    return response.data || response
  } catch (error) {
    console.error('Update admin settings error:', error)
    throw new Error(
      error.response?.error?.message || error.message || 'Failed to update admin settings'
    )
  }
}

// ─── Payment System ───────────────────────────────────────────────────────────

export const getPaymentSystemType = (settings) => {
  return settings?.paymentSystemType || 'float_based'
}

export const isFloatSystemEnabled = (settings) => {
  const type = getPaymentSystemType(settings)
  return type === 'float_based' || type === 'hybrid'
}

export const isSubscriptionSystemEnabled = (settings) => {
  const type = getPaymentSystemType(settings)
  return type === 'subscription_based' || type === 'hybrid'
}

// ─── Withdrawal Settings ──────────────────────────────────────────────────────

/**
 * Which balance pool drivers withdraw from.
 *   'float'    → withdrawableFloatBalance  (driver-paid top-up only, not promo)
 *   'earnings' → currentBalance            (ride earnings)
 *
 * Default: 'earnings'
 */
export const getWithdrawableBalance = (settings) => {
  return settings?.withdrawableBalance || 'earnings'
}

/**
 * Returns true when the withdrawable pool is float-based.
 */
export const isWithdrawFromFloat = (settings) => {
  return getWithdrawableBalance(settings) === 'float'
}

/**
 * Minimum amount a driver can request in a single withdrawal.
 * Default: 50
 */
export const getMinimumWithdrawAmount = (settings) => {
  return parseFloat(settings?.minimumWithdrawAmount ?? 50)
}

// ─── Free Trial ───────────────────────────────────────────────────────────────

export const isFreeTrialEnabled = (settings) => {
  return settings?.freeTrialEnabled ?? false
}

export const getDefaultFreeTrialDays = (settings) => {
  return settings?.defaultFreeTrialDays || 7
}

// ─── Float Settings ───────────────────────────────────────────────────────────

export const getMinimumFloatTopup = (settings) => {
  return settings?.minimumFloatTopup || 10
}

export const getMaximumFloatTopup = (settings) => {
  return settings?.maximumFloatTopup || 1000
}

export const isNegativeFloatAllowed = (settings) => {
  return settings?.allowNegativeFloat ?? false
}

export const getNegativeFloatLimit = (settings) => {
  return settings?.negativeFloatLimit || 0
}

export const shouldBlockCashRidesOnInsufficientFloat = (settings) => {
  return settings?.blockCashRidesOnInsufficientFloat ?? true
}

// ─── Commission Settings ──────────────────────────────────────────────────────

export const getCommissionType = (settings) => {
  return settings?.commissionType || 'percentage'
}

export const getDefaultCommissionPercentage = (settings) => {
  return settings?.defaultCommissionPercentage || 15
}

export const getDefaultFlatCommission = (settings) => {
  return settings?.defaultFlatCommission || 0
}

export const isTieredCommissionEnabled = (settings) => {
  return settings?.tieredCommissionEnabled ?? false
}

export const getCommissionTiers = (settings) => {
  return settings?.commissionTiers || []
}

// ─── Affiliate System ─────────────────────────────────────────────────────────

export const isAffiliateSystemEnabled = (settings) => {
  return settings?.affiliateSystemEnabled ?? true
}

export const getPointsPerRiderReferral = (settings) => {
  return settings?.pointsPerRiderReferral || 10
}

export const getPointsPerDriverReferral = (settings) => {
  return settings?.pointsPerDriverReferral || 50
}

export const getPointsPerRiderFirstRide = (settings) => {
  return settings?.pointsPerRiderFirstRide || 20
}

export const getMoneyPerPoint = (settings) => {
  return settings?.moneyPerPoint || 0.1
}

export const getMinimumPointsForRedemption = (settings) => {
  return settings?.minimumPointsForRedemption || 100
}

// ─── Ride Settings ────────────────────────────────────────────────────────────

export const getMaxSimultaneousDriverRequests = (settings) => {
  return settings?.maxSimultaneousDriverRequests || 1
}

export const getRideRequestTimeoutSeconds = (settings) => {
  return settings?.rideRequestTimeoutSeconds || 30
}

export const getDriverCancellationCooldownMinutes = (settings) => {
  return settings?.driverCancellationCooldownMinutes || 15
}

export const getRideCompletionProximity = (settings) => {
  return settings?.rideCompletionProximity || 100
}

export const isManualCompletionAllowed = (settings) => {
  return settings?.allowManualCompletion ?? false
}

export const isArrivalConfirmationRequired = (settings) => {
  return settings?.requireArrivalConfirmation ?? true
}

// ─── Document Requirements ────────────────────────────────────────────────────

export const isDriverLicenseRequired = (settings) => {
  return settings?.requireDriverLicense ?? true
}

export const isNationalIdRequired = (settings) => {
  return settings?.requireNationalId ?? true
}

export const isProofOfAddressRequired = (settings) => {
  return settings?.requireProofOfAddress ?? true
}

export const isInsuranceRequired = (settings) => {
  return settings?.requireInsurance ?? true
}

export const isRoadTaxRequired = (settings) => {
  return settings?.requireRoadTax ?? true
}

export const isFitnessDocumentRequired = (settings) => {
  return settings?.requireFitnessDocument ?? true
}

export const isVehicleRegistrationRequired = (settings) => {
  return settings?.requireVehicleRegistration ?? false
}

// ─── Device Unlock ────────────────────────────────────────────────────────────

export const getTargetRidesForUnlock = (settings) => {
  return settings?.targetRidesForUnlock || 1000
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const isSmsEnabled = (settings) => {
  return settings?.smsEnabled ?? true
}

export const isEmailEnabled = (settings) => {
  return settings?.emailEnabled ?? false
}

export const isPushNotificationsEnabled = (settings) => {
  return settings?.pushNotificationsEnabled ?? true
}

export const isWhatsappEnabled = (settings) => {
  return settings?.whatsappEnabled ?? false
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

export const isCashEnabled = (settings) => {
  return settings?.cashEnabled ?? true
}

export const isOkrapayEnabled = (settings) => {
  return settings?.okrapayEnabled ?? true
}

export function isAllowFloatTopUpWithOkraPay(settings) {
  if (!settings) return false
  return settings.okrapayEnabled !== false && settings.allowFloatTopUpWithOkraPay !== false
}

export function isAllowRidePaymentWithOkraPay(settings) {
  if (!settings) return false
  return settings.okrapayEnabled !== false && settings.allowRidePaymentWithOkraPay !== false
}

// ─── Platform Info ────────────────────────────────────────────────────────────

export const getPlatformName = (settings) => {
  return settings?.platformName || 'Okra Rides'
}

export const getSupportEmail = (settings) => {
  return settings?.supportEmail || ''
}

export const getSupportPhone = (settings) => {
  return settings?.supportPhone || ''
}

export const getDefaultCurrency = (settings) => {
  return settings?.defaultCurrency || null
}

export const getRideBookingRadius = (settings) => {
  return settings?.rideBookingRadius || 10
}

// ─── Utility functions ────────────────────────────────────────────────────────

export const calculateCommission = (settings, fareAmount) => {
  if (!settings) return 0

  const commissionType = getCommissionType(settings)

  switch (commissionType) {
    case 'percentage': {
      const percentage = getDefaultCommissionPercentage(settings)
      return (fareAmount * percentage) / 100
    }
    case 'flat_rate':
      return getDefaultFlatCommission(settings)

    case 'tiered': {
      if (!isTieredCommissionEnabled(settings)) {
        return (fareAmount * getDefaultCommissionPercentage(settings)) / 100
      }
      const tiers = getCommissionTiers(settings)
      const tier = tiers.find(
        (t) => fareAmount >= t.minFare && (t.maxFare === null || fareAmount <= t.maxFare)
      )
      if (tier) {
        if (tier.commissionFlat) return tier.commissionFlat
        if (tier.commissionPercentage) return (fareAmount * tier.commissionPercentage) / 100
      }
      return (fareAmount * getDefaultCommissionPercentage(settings)) / 100
    }
    default:
      return 0
  }
}

export const convertPointsToMoney = (settings, points) => {
  return points * getMoneyPerPoint(settings)
}

export const convertMoneyToPoints = (settings, money) => {
  const moneyPerPoint = getMoneyPerPoint(settings)
  return moneyPerPoint > 0 ? money / moneyPerPoint : 0
}

export const canRedeemPoints = (settings, userPoints) => {
  return userPoints >= getMinimumPointsForRedemption(settings)
}

export const canDriverReceiveCashRide = (settings, driverFloatBalance) => {
  if (!shouldBlockCashRidesOnInsufficientFloat(settings)) return true
  if (isNegativeFloatAllowed(settings)) {
    return driverFloatBalance > -getNegativeFloatLimit(settings)
  }
  return driverFloatBalance > 0
}
// ─── Support Contacts ─────────────────────────────────────────────────────────

/**
 * Array of support phone numbers.
 * Each item may be a plain string or an object { name, number }
 */
export const getAdminSupportNumbers = (settings) => {
  return settings?.adminSupportNumbers || [];
};

/**
 * Array of support email addresses.
 * Each item may be a plain string or an object { name, email }
 */
export const getAdminSupportEmails = (settings) => {
  return settings?.adminSupportEmails || [];
};
export default {
  getAdminSupportNumbers,
  getAdminSupportEmails,
  getAdminSettings,
  updateAdminSettings,
  // Withdrawal
  getWithdrawableBalance,
  isWithdrawFromFloat,
  getMinimumWithdrawAmount,
  // OkraPay
  isAllowFloatTopUpWithOkraPay,
  isAllowRidePaymentWithOkraPay,
  // Payment System
  getPaymentSystemType,
  isFloatSystemEnabled,
  isSubscriptionSystemEnabled,
  isFreeTrialEnabled,
  getDefaultFreeTrialDays,
  getMinimumFloatTopup,
  getMaximumFloatTopup,
  isNegativeFloatAllowed,
  getNegativeFloatLimit,
  shouldBlockCashRidesOnInsufficientFloat,
  getCommissionType,
  getDefaultCommissionPercentage,
  getDefaultFlatCommission,
  isTieredCommissionEnabled,
  getCommissionTiers,
  isAffiliateSystemEnabled,
  getPointsPerRiderReferral,
  getPointsPerDriverReferral,
  getPointsPerRiderFirstRide,
  getMoneyPerPoint,
  getMinimumPointsForRedemption,
  getMaxSimultaneousDriverRequests,
  getRideRequestTimeoutSeconds,
  getDriverCancellationCooldownMinutes,
  getRideCompletionProximity,
  isManualCompletionAllowed,
  isArrivalConfirmationRequired,
  isDriverLicenseRequired,
  isNationalIdRequired,
  isProofOfAddressRequired,
  isInsuranceRequired,
  isRoadTaxRequired,
  isFitnessDocumentRequired,
  isVehicleRegistrationRequired,
  getTargetRidesForUnlock,
  isSmsEnabled,
  isEmailEnabled,
  isPushNotificationsEnabled,
  isWhatsappEnabled,
  isCashEnabled,
  isOkrapayEnabled,
  getPlatformName,
  getSupportEmail,
  getSupportPhone,
  getDefaultCurrency,
  getRideBookingRadius,
  calculateCommission,
  convertPointsToMoney,
  convertMoneyToPoints,
  canRedeemPoints,
  canDriverReceiveCashRide,
}