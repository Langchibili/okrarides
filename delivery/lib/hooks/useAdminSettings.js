'use client'
// lib/hooks/useAdminSettings.js

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { getAdminSettings, getAdminSettingsCacheKey } from '@/lib/api/adminSettings'
import * as AdminSettingsHelpers from '@/lib/api/adminSettings'
import { useAuth } from '@/lib/hooks/useAuth'

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
    allowOrdersWithoutPartner: settings?.allowOrdersWithoutPartner ?? false,
    allowPartnerSwitching: settings?.allowPartnerSwitching ?? false,
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
  const { user, loading: authLoading } = useAuth()
  const countryId = Number(user?.country?.id ?? user?.country) || null
  const [settings,    setSettings]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  const fetchSettings = useCallback(async (force = false) => {
    const cacheKey = getAdminSettingsCacheKey(countryId, user?.id)
    const timestampKey = `${cacheKey}:timestamp`
    if (!force && typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey)
      const timestamp = Number(localStorage.getItem(timestampKey))
      if (cached && timestamp && Date.now() - timestamp < 5 * 60 * 1000) {
        try {
          const parsed = JSON.parse(cached)
          setSettings(parsed)
          window.__adminSettings = parsed
          setLastFetched(timestamp)
          setLoading(false)
          return parsed
        } catch (cacheError) {
          console.error('Failed to parse cached settings:', cacheError)
        }
      }
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getAdminSettings({ countryId })
      setSettings(data)
      if (typeof window !== 'undefined') window.__adminSettings = data
      const fetchedAt = Date.now()
      setLastFetched(fetchedAt)
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(data))
        localStorage.setItem(timestampKey, fetchedAt.toString())
      }
      return data
    } catch (err) {
      console.error('Failed to fetch admin settings:', err)
      setError(err.message)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setSettings(parsed)
            window.__adminSettings = parsed
            return parsed
          } catch (cacheError) {
            console.error('Failed to parse cached settings:', cacheError)
          }
        }
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [countryId, user?.id])

  useEffect(() => { if (!authLoading) fetchSettings() }, [authLoading, fetchSettings])

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

export function useAdminSettingsStandalone({ countryId = null } = {}) {
  const [settings,    setSettings]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    const cacheKey = getAdminSettingsCacheKey(countryId)

    try {
      if (typeof window !== 'undefined') {
        const cached    = localStorage.getItem(cacheKey)
        const timestamp = localStorage.getItem(`${cacheKey}:timestamp`)
        if (cached && timestamp && Date.now() - parseInt(timestamp) < 5 * 60 * 1000) {
          try {
            const parsed = JSON.parse(cached)
            setSettings(parsed)
            window.__adminSettings = parsed
            setLoading(false)
            return
          } catch (cacheError) {
            console.error('Failed to parse cached settings:', cacheError)
          }
        }
      }

      const data = await getAdminSettings({ countryId })
      setSettings(data)
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(data))
        localStorage.setItem(`${cacheKey}:timestamp`, Date.now().toString())
      }
    } catch (err) {
      console.error('Failed to fetch admin settings:', err)
      setError(err.message)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            setSettings(parsed)
            window.__adminSettings = parsed
          } catch (cacheError) {
            console.error('Failed to parse cached settings:', cacheError)
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }, [countryId])

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