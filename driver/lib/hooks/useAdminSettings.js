// lib/hooks/useAdminSettings.js
'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { getAdminSettings } from '@/lib/api/adminSettings'
import * as AdminSettingsHelpers from '@/lib/api/adminSettings'

// Create context for admin settings
const AdminSettingsContext = createContext(null)

/**
 * Provider component to wrap your app
 * Usage: Wrap your app with this provider in layout.js
 */
export function AdminSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  const fetchSettings = useCallback(async (force = false) => {
    // If we have settings and last fetched was less than 5 minutes ago, don't refetch
    if (!force && settings && lastFetched) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      if (lastFetched > fiveMinutesAgo) {
        return settings
      }
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getAdminSettings()
      setSettings(data)
      setLastFetched(Date.now())
      
      // Store in localStorage for offline access
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSettings', JSON.stringify(data))
        localStorage.setItem('adminSettingsTimestamp', Date.now().toString())
      }
      
      return data
    } catch (err) {
      console.error('Failed to fetch admin settings:', err)
      setError(err.message)
      
      // Try to load from localStorage if available
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('adminSettings')
        if (cached) {
          try {
            const parsedSettings = JSON.parse(cached)
            setSettings(parsedSettings)
            return parsedSettings
          } catch (parseErr) {
            console.error('Failed to parse cached settings:', parseErr)
          }
        }
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [settings, lastFetched])

  // Fetch on mount
  useEffect(() => {
    fetchSettings()
  }, []) // Only run once on mount

  const value = {
    settings,
    loading,
    error,
    refresh: () => fetchSettings(true),
    lastFetched,
  }

  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  )
}

/**
 * Hook to use admin settings
 * Must be used within AdminSettingsProvider
 */
export function useAdminSettings() {
  const context = useContext(AdminSettingsContext)

  if (context === undefined) {
    throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  }

  const { settings, loading, error, refresh, lastFetched } = context || {}

  // Return all helper functions with settings pre-applied
  return {
    // Core
    settings,
    loading,
    error,
    refresh,
    lastFetched,

    // Payment System
    paymentSystemType: AdminSettingsHelpers.getPaymentSystemType(settings),
    isFloatSystemEnabled: AdminSettingsHelpers.isFloatSystemEnabled(settings),
    isSubscriptionSystemEnabled: AdminSettingsHelpers.isSubscriptionSystemEnabled(settings),

    // Free Trial
    isFreeTrialEnabled: AdminSettingsHelpers.isFreeTrialEnabled(settings),
    defaultFreeTrialDays: AdminSettingsHelpers.getDefaultFreeTrialDays(settings),

    // Float Settings
    minimumFloatTopup: AdminSettingsHelpers.getMinimumFloatTopup(settings),
    maximumFloatTopup: AdminSettingsHelpers.getMaximumFloatTopup(settings),
    isNegativeFloatAllowed: AdminSettingsHelpers.isNegativeFloatAllowed(settings),
    negativeFloatLimit: AdminSettingsHelpers.getNegativeFloatLimit(settings),
    blockCashRidesOnInsufficientFloat: AdminSettingsHelpers.shouldBlockCashRidesOnInsufficientFloat(settings),

    // Commission Settings
    commissionType: AdminSettingsHelpers.getCommissionType(settings),
    defaultCommissionPercentage: AdminSettingsHelpers.getDefaultCommissionPercentage(settings),
    defaultFlatCommission: AdminSettingsHelpers.getDefaultFlatCommission(settings),
    isTieredCommissionEnabled: AdminSettingsHelpers.isTieredCommissionEnabled(settings),
    commissionTiers: AdminSettingsHelpers.getCommissionTiers(settings),

    // Affiliate System
    isAffiliateSystemEnabled: AdminSettingsHelpers.isAffiliateSystemEnabled(settings),
    pointsPerRiderReferral: AdminSettingsHelpers.getPointsPerRiderReferral(settings),
    pointsPerDriverReferral: AdminSettingsHelpers.getPointsPerDriverReferral(settings),
    pointsPerRiderFirstRide: AdminSettingsHelpers.getPointsPerRiderFirstRide(settings),
    moneyPerPoint: AdminSettingsHelpers.getMoneyPerPoint(settings),
    minimumPointsForRedemption: AdminSettingsHelpers.getMinimumPointsForRedemption(settings),

    // Ride Settings
    maxSimultaneousDriverRequests: AdminSettingsHelpers.getMaxSimultaneousDriverRequests(settings),
    rideRequestTimeoutSeconds: AdminSettingsHelpers.getRideRequestTimeoutSeconds(settings),
    driverCancellationCooldownMinutes: AdminSettingsHelpers.getDriverCancellationCooldownMinutes(settings),
    rideCompletionProximity: AdminSettingsHelpers.getRideCompletionProximity(settings),
    isManualCompletionAllowed: AdminSettingsHelpers.isManualCompletionAllowed(settings),
    isArrivalConfirmationRequired: AdminSettingsHelpers.isArrivalConfirmationRequired(settings),

    // Document Requirements
    isDriverLicenseRequired: AdminSettingsHelpers.isDriverLicenseRequired(settings),
    isNationalIdRequired: AdminSettingsHelpers.isNationalIdRequired(settings),
    isProofOfAddressRequired: AdminSettingsHelpers.isProofOfAddressRequired(settings),
    isInsuranceRequired: AdminSettingsHelpers.isInsuranceRequired(settings),
    isRoadTaxRequired: AdminSettingsHelpers.isRoadTaxRequired(settings),
    isFitnessDocumentRequired: AdminSettingsHelpers.isFitnessDocumentRequired(settings),
    isVehicleRegistrationRequired: AdminSettingsHelpers.isVehicleRegistrationRequired(settings),

    // Device Unlock
    targetRidesForUnlock: AdminSettingsHelpers.getTargetRidesForUnlock(settings),

    // Notifications
    isSmsEnabled: AdminSettingsHelpers.isSmsEnabled(settings),
    isEmailEnabled: AdminSettingsHelpers.isEmailEnabled(settings),
    isPushNotificationsEnabled: AdminSettingsHelpers.isPushNotificationsEnabled(settings),
    isWhatsappEnabled: AdminSettingsHelpers.isWhatsappEnabled(settings),

    // Payment Methods
    isCashEnabled: AdminSettingsHelpers.isCashEnabled(settings),
    isOkrapayEnabled: AdminSettingsHelpers.isOkrapayEnabled(settings),

    // Platform Info
    platformName: AdminSettingsHelpers.getPlatformName(settings),
    supportEmail: AdminSettingsHelpers.getSupportEmail(settings),
    supportPhone: AdminSettingsHelpers.getSupportPhone(settings),
    defaultCurrency: AdminSettingsHelpers.getDefaultCurrency(settings),

    // Utility Functions
    calculateCommission: (fareAmount) => AdminSettingsHelpers.calculateCommission(settings, fareAmount),
    convertPointsToMoney: (points) => AdminSettingsHelpers.convertPointsToMoney(settings, points),
    convertMoneyToPoints: (money) => AdminSettingsHelpers.convertMoneyToPoints(settings, money),
    canRedeemPoints: (userPoints) => AdminSettingsHelpers.canRedeemPoints(settings, userPoints),
    canDriverReceiveCashRide: (driverFloatBalance) => 
      AdminSettingsHelpers.canDriverReceiveCashRide(settings, driverFloatBalance),
  }
}

/**
 * Alternative hook without provider (fetches on each use)
 * Use this if you don't want to use the provider pattern
 * Note: This will fetch settings on every component mount
 */
export function useAdminSettingsStandalone() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Check localStorage first
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('adminSettings')
        const timestamp = localStorage.getItem('adminSettingsTimestamp')
        
        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp)
          // Use cached if less than 5 minutes old
          if (age < 5 * 60 * 1000) {
            const parsedSettings = JSON.parse(cached)
            setSettings(parsedSettings)
            setLoading(false)
            return
          }
        }
      }

      const data = await getAdminSettings()
      setSettings(data)

      // Cache in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSettings', JSON.stringify(data))
        localStorage.setItem('adminSettingsTimestamp', Date.now().toString())
      }
    } catch (err) {
      console.error('Failed to fetch admin settings:', err)
      setError(err.message)

      // Try to use cached version even if expired
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('adminSettings')
        if (cached) {
          try {
            setSettings(JSON.parse(cached))
          } catch (parseErr) {
            console.error('Failed to parse cached settings:', parseErr)
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,

    // All helper functions
    paymentSystemType: AdminSettingsHelpers.getPaymentSystemType(settings),
    isFloatSystemEnabled: AdminSettingsHelpers.isFloatSystemEnabled(settings),
    isSubscriptionSystemEnabled: AdminSettingsHelpers.isSubscriptionSystemEnabled(settings),
    isFreeTrialEnabled: AdminSettingsHelpers.isFreeTrialEnabled(settings),
    defaultFreeTrialDays: AdminSettingsHelpers.getDefaultFreeTrialDays(settings),
    minimumFloatTopup: AdminSettingsHelpers.getMinimumFloatTopup(settings),
    maximumFloatTopup: AdminSettingsHelpers.getMaximumFloatTopup(settings),
    isNegativeFloatAllowed: AdminSettingsHelpers.isNegativeFloatAllowed(settings),
    negativeFloatLimit: AdminSettingsHelpers.getNegativeFloatLimit(settings),
    blockCashRidesOnInsufficientFloat: AdminSettingsHelpers.shouldBlockCashRidesOnInsufficientFloat(settings),
    commissionType: AdminSettingsHelpers.getCommissionType(settings),
    defaultCommissionPercentage: AdminSettingsHelpers.getDefaultCommissionPercentage(settings),
    defaultFlatCommission: AdminSettingsHelpers.getDefaultFlatCommission(settings),
    isTieredCommissionEnabled: AdminSettingsHelpers.isTieredCommissionEnabled(settings),
    commissionTiers: AdminSettingsHelpers.getCommissionTiers(settings),
    isAffiliateSystemEnabled: AdminSettingsHelpers.isAffiliateSystemEnabled(settings),
    pointsPerRiderReferral: AdminSettingsHelpers.getPointsPerRiderReferral(settings),
    pointsPerDriverReferral: AdminSettingsHelpers.getPointsPerDriverReferral(settings),
    pointsPerRiderFirstRide: AdminSettingsHelpers.getPointsPerRiderFirstRide(settings),
    moneyPerPoint: AdminSettingsHelpers.getMoneyPerPoint(settings),
    minimumPointsForRedemption: AdminSettingsHelpers.getMinimumPointsForRedemption(settings),
    maxSimultaneousDriverRequests: AdminSettingsHelpers.getMaxSimultaneousDriverRequests(settings),
    rideRequestTimeoutSeconds: AdminSettingsHelpers.getRideRequestTimeoutSeconds(settings),
    driverCancellationCooldownMinutes: AdminSettingsHelpers.getDriverCancellationCooldownMinutes(settings),
    rideCompletionProximity: AdminSettingsHelpers.getRideCompletionProximity(settings),
    isManualCompletionAllowed: AdminSettingsHelpers.isManualCompletionAllowed(settings),
    isArrivalConfirmationRequired: AdminSettingsHelpers.isArrivalConfirmationRequired(settings),
    isDriverLicenseRequired: AdminSettingsHelpers.isDriverLicenseRequired(settings),
    isNationalIdRequired: AdminSettingsHelpers.isNationalIdRequired(settings),
    isProofOfAddressRequired: AdminSettingsHelpers.isProofOfAddressRequired(settings),
    isInsuranceRequired: AdminSettingsHelpers.isInsuranceRequired(settings),
    isRoadTaxRequired: AdminSettingsHelpers.isRoadTaxRequired(settings),
    isFitnessDocumentRequired: AdminSettingsHelpers.isFitnessDocumentRequired(settings),
    targetRidesForUnlock: AdminSettingsHelpers.getTargetRidesForUnlock(settings),
    isSmsEnabled: AdminSettingsHelpers.isSmsEnabled(settings),
    isEmailEnabled: AdminSettingsHelpers.isEmailEnabled(settings),
    isPushNotificationsEnabled: AdminSettingsHelpers.isPushNotificationsEnabled(settings),
    isWhatsappEnabled: AdminSettingsHelpers.isWhatsappEnabled(settings),
    isCashEnabled: AdminSettingsHelpers.isCashEnabled(settings),
    isOkrapayEnabled: AdminSettingsHelpers.isOkrapayEnabled(settings),
    platformName: AdminSettingsHelpers.getPlatformName(settings),
    supportEmail: AdminSettingsHelpers.getSupportEmail(settings),
    supportPhone: AdminSettingsHelpers.getSupportPhone(settings),
    defaultCurrency: AdminSettingsHelpers.getDefaultCurrency(settings),
    calculateCommission: (fareAmount) => AdminSettingsHelpers.calculateCommission(settings, fareAmount),
    convertPointsToMoney: (points) => AdminSettingsHelpers.convertPointsToMoney(settings, points),
    convertMoneyToPoints: (money) => AdminSettingsHelpers.convertMoneyToPoints(settings, money),
    canRedeemPoints: (userPoints) => AdminSettingsHelpers.canRedeemPoints(settings, userPoints),
    canDriverReceiveCashRide: (driverFloatBalance) => 
      AdminSettingsHelpers.canDriverReceiveCashRide(settings, driverFloatBalance),
  }
}

export default useAdminSettings