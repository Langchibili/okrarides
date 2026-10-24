'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { adminClient } from '@/lib/api/adminClient';
import { useAuth } from '@/lib/auth';
import { StatCard } from '@/components/admin/PageHeader';

function fmt(value) {
  return value == null ? '—' : Number(value).toLocaleString();
}

function fmtMoney(value, symbol) {
  return value == null
    ? '—'
    : `${symbol || ''}${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
}

export default function DashboardPage() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countryId, setCountryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState('');
  const [showFloatExplanation, setShowFloatExplanation] = useState(false);
  const [referralRules, setReferralRules] = useState([]);
  const [referralRulesLoading, setReferralRulesLoading] = useState(false);
  const [referralRulesError, setReferralRulesError] = useState('');

  useEffect(() => {
    let active = true;
    adminClient.get('/country-options')
      .then(response => {
        if (!active) return;
        const items = Array.isArray(response) ? response : response?.data || [];
        setCountries(items);
        const zambia = items.find(country => String(country.code || '').toLowerCase() === 'zm');
        setCountryId(current => current ?? String(zambia?.id ?? items[0]?.id ?? ''));
      })
      .catch(requestError => {
        if (!active) return;
        setError(requestError.message || 'Could not load country options');
        setCountryId(current => current ?? '');
      });
    return () => { active = false; };
  }, []);

  const fetchStats = useCallback(async () => {
    if (countryId === null) return;
    setLoading(true);
    setError('');
    try {
      const endpoint = countryId
        ? `/platform-stat?countryId=${encodeURIComponent(countryId)}`
        : '/platform-stat';
      const res = await adminClient.get(endpoint);
      const payload = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
      const records = Array.isArray(payload) ? payload : payload ? [payload] : [];
      setStats(records);
      setLastRefresh(new Date());
      if (!records.length) setError('Dashboard statistics have not been calculated yet.');
    } catch (requestError) {
      setError(requestError.message || 'Could not load platform statistics');
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [countryId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (countryId === null || !hasPermission('affiliates')) return;
    let active = true;
    setReferralRulesLoading(true);
    const countryFilter = countryId ? `&filters[countryId][$eq]=${encodeURIComponent(countryId)}` : '';
    adminClient.get(`/affiliate-points-allocation-rules?pagination[pageSize]=100&sort=name:asc${countryFilter}`)
      .then(response => {
        if (active) {
          setReferralRules(Array.isArray(response?.data) ? response.data : []);
          setReferralRulesError('');
        }
      })
      .catch(requestError => {
        if (active) setReferralRulesError(requestError.message || 'Could not load referral rules');
      })
      .finally(() => {
        if (active) setReferralRulesLoading(false);
      });
    return () => { active = false; };
  }, [countryId, hasPermission]);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          {lastRefresh && (
            <p className="text-sm text-gray-400 mt-0.5">
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⟳ Refreshing…' : '⟳ Refresh'}
          </button>
          <select
            className="input select"
            style={{ minWidth: 180 }}
            value={countryId ?? ''}
            onChange={event => setCountryId(event.target.value)}
            aria-label="Dashboard country"
            disabled={countryId === null}
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>{country.name || country.code}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowFloatExplanation(true)}
            className="text-sm text-blue-700 underline underline-offset-2"
          >
            See how float flows and profit is calculated
          </button>
        </div>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 16 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-7 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : stats.length ? (
        stats.map(record => (
          <CountryStats
            key={record.id || record.country?.id}
            stats={record}
            referralRules={referralRules}
            referralRulesLoading={referralRulesLoading}
            referralRulesError={referralRulesError}
            canViewReferralRules={hasPermission('affiliates')}
          />
        ))
      ) : !error ? (
        <div className="empty-state">
          <strong>Dashboard data is unavailable</strong>
          <span>Statistics could not be loaded. Check your access and try again.</span>
        </div>
      ) : null}
      {showFloatExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setShowFloatExplanation(false);
        }}>
          <section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="float-explanation-title">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id="float-explanation-title" className="text-lg font-bold text-gray-900">How float and estimated profit work</h2>
              <button type="button" onClick={() => setShowFloatExplanation(false)} aria-label="Close" className="text-2xl leading-none text-gray-400">×</button>
            </div>
            <div className="space-y-3 text-sm leading-6 text-gray-700">
              <p><strong>Float flow:</strong> Okra supplies float to partners; partners distribute float to their drivers. Drivers receive the customer’s cash fare, while the driver’s float is charged for the ride fare plus the applicable ride commission. Driver float issued and partner float purchases are tracked separately and are not treated as platform profit.</p>
              <p><strong>Platform estimated profit:</strong> total ride and delivery commissions earned, less the configured partner share of commissions generated by partner-affiliated drivers and deliverers. Commissions from independent drivers remain in the platform share. Subscription revenue is displayed separately and is not included in this commission-based estimate.</p>
              <p><strong>Partner share and amount owed:</strong> a partner’s share is calculated only from completed rides and deliveries by that partner’s own fleet. The remainder of that fleet’s commission is owed to Okra; it is separate from float transfers.</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setShowFloatExplanation(false)} className="button button-primary">Close</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function CountryStats({ stats, referralRules, referralRulesLoading, referralRulesError, canViewReferralRules }) {
  const symbol = stats.country?.currency?.symbol || stats.country?.currency?.code || '';
  const countryName = stats.country?.name || 'Country';
  const money = value => fmtMoney(value, symbol);
  const countryRules = stats.country?.id
    ? referralRules.filter(rule => (rule.countries || []).some(country => String(country.id) === String(stats.country.id)))
    : referralRules;

  return (
    <div className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">{countryName}</h2>
        <p className="text-sm text-gray-500">
          Statistics calculated every {stats.platformStatCalculationCycleInMins || 20} minutes
          {stats.lastCalculatedAt ? ` · Snapshot ${new Date(stats.lastCalculatedAt).toLocaleString()}` : ''}
        </p>
      </div>

      <Section title="📊 Core platform activity">
        <StatCard label="Total Rides" value={fmt(stats.totalRideCount)} icon="🚗" color="blue" />
        <StatCard label="Assigned Drivers" value={fmt(stats.totalDriverCount)} icon="🚕" color="green" />
        <StatCard label="Assigned Deliverers" value={fmt(stats.totalDelivererCount)} icon="🛵" color="orange" />
        <StatCard label="Riders" value={fmt(stats.totalRiderCount)} icon="🧍" color="purple" />
        <StatCard label="Completed Rides" value={fmt(stats.totalRidesCompleted)} icon="✅" color="green" />
        <StatCard label="Total Deliveries" value={fmt(stats.totalDeliveryCount)} icon="📦" color="orange" />
      </Section>

      <Section title="🚗 Ride activity">
        <StatCard label="Cancelled Rides" value={fmt(stats.totalRidesCancelled)} icon="❌" color="red" />
        <StatCard label="Subscription Rides" value={fmt(stats.totalSubscriptionRides)} icon="🔄" color="purple" />
        <StatCard label="Float Rides" value={fmt(stats.totalFloatRides)} icon="💳" color="blue" />
        <StatCard label="Cash Rides" value={fmt(stats.totalCashRides)} icon="💵" color="green" />
        <StatCard label="Digital Rides" value={fmt(stats.totalDigitalRides)} icon="📲" color="blue" />
      </Section>

      <Section title="🚕 Drivers">
        <StatCard label="Active Drivers" value={fmt(stats.activeDriverCount)} icon="🟢" color="green" />
        <StatCard label="Active Subscribers" value={fmt(stats.activeSubscriberCount)} icon="⭐" color="purple" />
        <StatCard label="Trial Subscribers" value={fmt(stats.trialSubscriberCount)} icon="🆕" color="blue" />
      </Section>

      <Section title="📦 Deliveries">
        <StatCard label="Completed Deliveries" value={fmt(stats.totalDeliveriesCompleted)} icon="✅" color="green" />
        <StatCard label="Cancelled Deliveries" value={fmt(stats.totalDeliveriesCancelled)} icon="❌" color="red" />
        <StatCard label="Delivery Earnings" value={money(stats.totalDeliveryDriverEarnings)} icon="💰" color="green" />
        <StatCard label="Delivery Commission" value={money(stats.totalDeliveryPlatformCommission)} icon="🏦" color="purple" />
        <StatCard label="Cash Deliveries" value={fmt(stats.totalCashDeliveries)} icon="💵" color="green" />
        <StatCard label="Digital Deliveries" value={fmt(stats.totalDigitalDeliveries)} icon="📲" color="blue" />
        <StatCard label="Active Delivery Drivers" value={fmt(stats.activeDeliveryDriverCount)} icon="🛵" color="orange" />
      </Section>

      <Section title="🤝 Affiliates">
        <StatCard label="Total Affiliate Points" value={fmt(stats.totalAffiliatePoints)} icon="⭐" color="purple" />
        <StatCard label="Affiliate Payouts" value={money(stats.totalAffiliatePayouts)} icon="💸" color="green" />
        <StatCard label="Pending Balance" value={money(stats.totalPendingAffiliateBalance)} icon="⏳" color="orange" />
        <StatCard label="Active Affiliates" value={fmt(stats.activeAffiliateCount)} icon="👥" color="blue" />
        <StatCard label="Total Referrals" value={fmt(stats.totalAffiliateReferrals)} icon="🔗" color="green" />
        <StatCard label="Affiliate Transactions" value={fmt(stats.totalAffiliateTransactions)} icon="📝" color="blue" />
      </Section>

      <section className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Referral points rules</h2>
            <p className="mt-1 text-xs text-gray-400">Country-specific rewards for rider, driver, and delivery actions.</p>
          </div>
          {canViewReferralRules && <Link className="text-sm font-medium text-blue-700 underline" href="/affiliate-points-allocation-rules">Manage rules</Link>}
        </div>
        {!canViewReferralRules ? (
          <p className="text-sm text-gray-500">Your role needs affiliate view access to see referral rules.</p>
        ) : referralRulesError ? (
          <p className="text-sm text-red-600" role="alert">{referralRulesError}</p>
        ) : referralRulesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(index => <div key={index} className="h-20 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : countryRules.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countryRules.map(rule => (
              <div key={rule.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-sm text-gray-800">{rule.name}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {rule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-xs capitalize text-gray-500">{rule.type?.replace(/-/g, ' ')} · {rule.appliesTo || 'all'}</p>
                <p className="mt-2 text-xs font-medium text-purple-700">
                  {rule.pointsAllocatedFromAction} point{Number(rule.pointsAllocatedFromAction) === 1 ? '' : 's'} per action, up to {rule.actionAmountsPerUser} action{Number(rule.actionAmountsPerUser) === 1 ? '' : 's'} per user
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No referral allocation rules are configured for this country.</p>
        )}
      </section>

      <Section title="💰 Country financials">
        <StatCard label="Estimated Profit" value={money(stats.estimatedProfit)} icon="📈" color="green" />
        <StatCard label="Ride & Delivery Commissions" value={money(stats.totalPlatformCommission)} icon="🏦" color="purple" />
        <StatCard label="Partner Commission Share" value={money(stats.partnerCommissionShare)} icon="🤝" color="blue" sub={`${fmt(stats.partnerCommisionPercentage)}% of partner-fleet commission`} />
        <StatCard label="Driver Earnings" value={money(stats.totalDriverEarnings)} icon="👨‍✈️" color="green" />
        <StatCard label="Subscription Revenue" value={money(stats.totalSubscriptionRevenue)} icon="📋" color="blue" sub="Reported separately" />
        <StatCard label="Float Purchased from Okra" value={money(stats.totalFloatSold)} icon="💰" color="orange" />
        <StatCard label="Float Issued to Drivers" value={money(stats.totalDriverFloatIssued)} icon="↗️" color="orange" />
        <StatCard label="Float Purchased by Partners" value={money(stats.totalPartnerFloatPurchased)} icon="🏢" color="blue" />
        <StatCard label="Active Driver Float" value={money(stats.totalActiveFloat)} icon="📊" color="blue" />
        <StatCard label="Negative Driver Float" value={money(stats.totalNegativeFloat)} icon="⚠️" color="red" sub={`${fmt(stats.driversWithNegativeFloat)} drivers`} />
        <StatCard label="Withdrawals Processed" value={money(stats.totalWithdrawalsProcessed)} icon="🏧" color="green" />
        <StatCard label="Pending Withdrawals" value={money(stats.totalPendingWithdrawals)} icon="⏳" color="orange" />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {children}
      </div>
    </div>
  );
}
