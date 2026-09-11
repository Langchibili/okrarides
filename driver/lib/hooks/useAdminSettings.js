'use client'
// lib/hooks/useAdminSettings.js

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { getAdminSettings } from '@/lib/api/adminSettings'
import * as AdminSettingsHelpers from '@/lib/api/adminSettings'

const AdminSettingsContext = createContext(null)

function derivePaymentSystemFlags(paymentSystemType) {
  return {
    isFloatSystemEnabled:        paymentSystemType === 'float_based' || paymentSystemType === 'hybrid',
    isSubscriptionSystemEnabled: paymentSystemType === 'subscription_based' || paymentSystemType === 'hybrid',
  }
}

// ─── Shared return shape ──────────────────────────────────────────────────────
// Centralised so both the Provider hook and the Standalone hook expose the
// exact same fields without duplicating the mapping.

function buildReturnValue({ settings, loading, error, refresh, lastFetched }) {
  const paymentSystemType = AdminSettingsHelpers.getPaymentSystemType(settings)
  const { isFloatSystemEnabled, isSubscriptionSystemEnabled } = derivePaymentSystemFlags(paymentSystemType)

  return {
    // Core
    settings,
    loading,
    error,
    refresh,
    lastFetched,

    // Payment System
    paymentSystemType,
    isFloatSystemEnabled,
    isSubscriptionSystemEnabled,
    // Support Contacts
    adminSupportNumbers: AdminSettingsHelpers.getAdminSupportNumbers(settings),
    adminSupportEmails:  AdminSettingsHelpers.getAdminSupportEmails(settings),
    // ── Withdrawal ────────────────────────────────────────────────────────────
    // 'float'    → driver withdraws from withdrawableFloatBalance
    // 'earnings' → driver withdraws from currentBalance / earnings
    withdrawableBalance:    AdminSettingsHelpers.getWithdrawableBalance(settings),
    isWithdrawFromFloat:    AdminSettingsHelpers.isWithdrawFromFloat(settings),
    minimumWithdrawAmount:  AdminSettingsHelpers.getMinimumWithdrawAmount(settings),

    // Free Trial
    isFreeTrialEnabled:    AdminSettingsHelpers.isFreeTrialEnabled(settings),
    defaultFreeTrialDays:  AdminSettingsHelpers.getDefaultFreeTrialDays(settings),

    // Float Settings
    minimumFloatTopup:               AdminSettingsHelpers.getMinimumFloatTopup(settings),
    maximumFloatTopup:               AdminSettingsHelpers.getMaximumFloatTopup(settings),
    isNegativeFloatAllowed:          AdminSettingsHelpers.isNegativeFloatAllowed(settings),
    negativeFloatLimit:              AdminSettingsHelpers.getNegativeFloatLimit(settings),
    blockCashRidesOnInsufficientFloat: AdminSettingsHelpers.shouldBlockCashRidesOnInsufficientFloat(settings),

    // Commission Settings
    commissionType:              AdminSettingsHelpers.getCommissionType(settings),
    defaultCommissionPercentage: AdminSettingsHelpers.getDefaultCommissionPercentage(settings),
    defaultFlatCommission:       AdminSettingsHelpers.getDefaultFlatCommission(settings),
    isTieredCommissionEnabled:   AdminSettingsHelpers.isTieredCommissionEnabled(settings),
    commissionTiers:             AdminSettingsHelpers.getCommissionTiers(settings),

    // Affiliate System
    isAffiliateSystemEnabled:    AdminSettingsHelpers.isAffiliateSystemEnabled(settings),
    pointsPerRiderReferral:      AdminSettingsHelpers.getPointsPerRiderReferral(settings),
    pointsPerDriverReferral:     AdminSettingsHelpers.getPointsPerDriverReferral(settings),
    pointsPerRiderFirstRide:     AdminSettingsHelpers.getPointsPerRiderFirstRide(settings),
    moneyPerPoint:               AdminSettingsHelpers.getMoneyPerPoint(settings),
    minimumPointsForRedemption:  AdminSettingsHelpers.getMinimumPointsForRedemption(settings),

    // Ride Settings
    maxSimultaneousDriverRequests:    AdminSettingsHelpers.getMaxSimultaneousDriverRequests(settings),
    rideRequestTimeoutSeconds:        AdminSettingsHelpers.getRideRequestTimeoutSeconds(settings),
    driverCancellationCooldownMinutes:AdminSettingsHelpers.getDriverCancellationCooldownMinutes(settings),
    rideCompletionProximity:          AdminSettingsHelpers.getRideCompletionProximity(settings),
    isManualCompletionAllowed:        AdminSettingsHelpers.isManualCompletionAllowed(settings),
    isArrivalConfirmationRequired:    AdminSettingsHelpers.isArrivalConfirmationRequired(settings),

    // Document Requirements
    isDriverLicenseRequired:      AdminSettingsHelpers.isDriverLicenseRequired(settings),
    isNationalIdRequired:         AdminSettingsHelpers.isNationalIdRequired(settings),
    isProofOfAddressRequired:     AdminSettingsHelpers.isProofOfAddressRequired(settings),
    isInsuranceRequired:          AdminSettingsHelpers.isInsuranceRequired(settings),
    isRoadTaxRequired:            AdminSettingsHelpers.isRoadTaxRequired(settings),
    isFitnessDocumentRequired:    AdminSettingsHelpers.isFitnessDocumentRequired(settings),
    isVehicleRegistrationRequired:AdminSettingsHelpers.isVehicleRegistrationRequired(settings),

    // Device Unlock
    targetRidesForUnlock: AdminSettingsHelpers.getTargetRidesForUnlock(settings),

    // Notifications
    isSmsEnabled:              AdminSettingsHelpers.isSmsEnabled(settings),
    isEmailEnabled:            AdminSettingsHelpers.isEmailEnabled(settings),
    isPushNotificationsEnabled:AdminSettingsHelpers.isPushNotificationsEnabled(settings),
    isWhatsappEnabled:         AdminSettingsHelpers.isWhatsappEnabled(settings),

    // Payment Methods
    isCashEnabled:              AdminSettingsHelpers.isCashEnabled(settings),
    isOkrapayEnabled:           AdminSettingsHelpers.isOkrapayEnabled(settings),
    allowFloatTopUpWithOkraPay: AdminSettingsHelpers.isAllowFloatTopUpWithOkraPay(settings),
    allowRidePaymentWithOkraPay:AdminSettingsHelpers.isAllowRidePaymentWithOkraPay(settings),

    // Platform Info
    platformName:    AdminSettingsHelpers.getPlatformName(settings),
    supportEmail:    AdminSettingsHelpers.getSupportEmail(settings),
    supportPhone:    AdminSettingsHelpers.getSupportPhone(settings),
    defaultCurrency: AdminSettingsHelpers.getDefaultCurrency(settings),

    // Utility Functions
    calculateCommission:     (fareAmount) => AdminSettingsHelpers.calculateCommission(settings, fareAmount),
    convertPointsToMoney:    (points)     => AdminSettingsHelpers.convertPointsToMoney(settings, points),
    convertMoneyToPoints:    (money)      => AdminSettingsHelpers.convertMoneyToPoints(settings, money),
    canRedeemPoints:         (userPoints) => AdminSettingsHelpers.canRedeemPoints(settings, userPoints),
    canDriverReceiveCashRide:(balance)    => AdminSettingsHelpers.canDriverReceiveCashRide(settings, balance),
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminSettingsProvider({ children }) {
  const [settings,    setSettings]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  const fetchSettings = useCallback(async (force = false) => {
    if (!force && settings && lastFetched) {
      if (Date.now() - lastFetched < 5 * 60 * 1000) return settings
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getAdminSettings()
      setSettings(data)
      setLastFetched(Date.now())
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSettings', JSON.stringify(data))
        localStorage.setItem('adminSettingsTimestamp', Date.now().toString())
      }
      return data
    } catch (err) {
      console.error('Failed to fetch admin settings:', err)
      setError(err.message)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('adminSettings')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setSettings(parsed)
            return parsed
          } catch {}
        }
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [settings, lastFetched])

  useEffect(() => { fetchSettings() }, []) // eslint-disable-line

  return (
    <AdminSettingsContext.Provider value={{
      settings, loading, error, lastFetched,
      refresh: () => fetchSettings(true),
    }}>
      {children}
    </AdminSettingsContext.Provider>
  )
}

// ─── useAdminSettings (requires Provider) ────────────────────────────────────

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext)

  if (context === undefined) {
    throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  }

  const { settings, loading, error, refresh, lastFetched } = context || {}

  return buildReturnValue({ settings, loading, error, refresh, lastFetched })
}

// ─── useAdminSettingsStandalone (no Provider needed) ─────────────────────────

export function useAdminSettingsStandalone() {
  const [settings,    setSettings]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (typeof window !== 'undefined') {
        const cached    = localStorage.getItem('adminSettings')
        const timestamp = localStorage.getItem('adminSettingsTimestamp')
        if (cached && timestamp && Date.now() - parseInt(timestamp) < 5 * 60 * 1000) {
          setSettings(JSON.parse(cached))
          setLoading(false)
          return
        }
      }

      const data = await getAdminSettings()
      setSettings(data)
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSettings', JSON.stringify(data))
        localStorage.setItem('adminSettingsTimestamp', Date.now().toString())
      }
    } catch (err) {
      console.error('Failed to fetch admin settings:', err)
      setError(err.message)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('adminSettings')
        if (cached) {
          try { setSettings(JSON.parse(cached)) } catch {}
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  return buildReturnValue({
    settings,
    loading,
    error,
    refresh: fetchSettings,
    lastFetched: null,
  })
}

export default useAdminSettings