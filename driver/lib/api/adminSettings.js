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
    // Note: You may need to adjust the response structure based on your API
    // If your API returns { data: {...} }, use response.data
    // If it returns the data directly, use response
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

/**
 * Helper functions to get specific settings
 */

// Payment System
export const getPaymentSystemType = (settings) => {
  return settings?.paymentSystemType || 'float_based'
}

export const isFloatSystemEnabled = (settings) => {
  return settings?.floatSystemEnabled ?? true
}

export const isSubscriptionSystemEnabled = (settings) => {
  return settings?.subscriptionSystemEnabled ?? false
}

// Free Trial
export const isFreeTrialEnabled = (settings) => {
  return settings?.freeTrialEnabled ?? false
}

export const getDefaultFreeTrialDays = (settings) => {
  return settings?.defaultFreeTrialDays || 7
}

// Float Settings
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

// Commission Settings
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

// Affiliate System
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

// Ride Settings
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

// Document Requirements
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

// Device Unlock
export const getTargetRidesForUnlock = (settings) => {
  return settings?.targetRidesForUnlock || 1000
}

// Notifications
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

// Payment Methods
export const isCashEnabled = (settings) => {
  return settings?.cashEnabled ?? true
}

export const isOkrapayEnabled = (settings) => {
  return settings?.okrapayEnabled ?? true
}

// Platform Info
export const getPlatformName = (settings) => {
  return settings?.platformName || 'Okra Rides'
}

export const getSupportEmail = (settings) => {
  return settings?.supportEmail || ''
}

export const getSupportPhone = (settings) => {
  return settings?.supportPhone || ''
}

// Default Currency
export const getDefaultCurrency = (settings) => {
  return settings?.defaultCurrency || null
}

/**
 * Calculate commission based on settings and fare amount
 */
export const calculateCommission = (settings, fareAmount) => {
  if (!settings) return 0

  const commissionType = getCommissionType(settings)

  switch (commissionType) {
    case 'percentage':
      const percentage = getDefaultCommissionPercentage(settings)
      return (fareAmount * percentage) / 100

    case 'flat_rate':
      return getDefaultFlatCommission(settings)

    case 'tiered':
      if (!isTieredCommissionEnabled(settings)) {
        return (fareAmount * getDefaultCommissionPercentage(settings)) / 100
      }

      const tiers = getCommissionTiers(settings)
      // Find applicable tier
      const tier = tiers.find(
        (t) =>
          fareAmount >= t.minFare &&
          (t.maxFare === null || fareAmount <= t.maxFare)
      )

      if (tier) {
        if (tier.commissionFlat) {
          return tier.commissionFlat
        }
        if (tier.commissionPercentage) {
          return (fareAmount * tier.commissionPercentage) / 100
        }
      }

      // Fallback to default percentage
      return (fareAmount * getDefaultCommissionPercentage(settings)) / 100

    default:
      return 0
  }
}

/**
 * Calculate affiliate points to money conversion
 */
export const convertPointsToMoney = (settings, points) => {
  const moneyPerPoint = getMoneyPerPoint(settings)
  return points * moneyPerPoint
}

/**
 * Calculate money to points conversion
 */
export const convertMoneyToPoints = (settings, money) => {
  const moneyPerPoint = getMoneyPerPoint(settings)
  return moneyPerPoint > 0 ? money / moneyPerPoint : 0
}

/**
 * Check if user can redeem points
 */
export const canRedeemPoints = (settings, userPoints) => {
  const minPoints = getMinimumPointsForRedemption(settings)
  return userPoints >= minPoints
}

/**
 * Check if driver can receive ride based on float balance
 */
export const canDriverReceiveCashRide = (settings, driverFloatBalance) => {
  if (!shouldBlockCashRidesOnInsufficientFloat(settings)) {
    return true
  }

  if (isNegativeFloatAllowed(settings)) {
    const negativeLimit = getNegativeFloatLimit(settings)
    return driverFloatBalance > -negativeLimit
  }

  return driverFloatBalance > 0
}

export default {
  getAdminSettings,
  updateAdminSettings,
  // Helper functions
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
  // Utility functions
  calculateCommission,
  convertPointsToMoney,
  convertMoneyToPoints,
  canRedeemPoints,
  canDriverReceiveCashRide,
}