// app/(main)/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import { StatCard } from '@/components/admin/PageHeader';

function fmt(n) { return n == null ? '—' : Number(n).toLocaleString(); }
function fmtMoney(n, sym = 'K') { return n == null ? '—' : `${sym}${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminClient.get('/platform-stat');
      setStats(res?.data || res);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const s = stats || {};

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          {lastRefresh && (
            <p className="text-sm text-gray-400 mt-0.5">
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '⟳ Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
              <div className="h-7 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Rides */}
          <Section title="🚗 Rides">
            <StatCard label="Completed Rides" value={fmt(s.totalRidesCompleted)} icon="✅" color="green" />
            <StatCard label="Cancelled Rides" value={fmt(s.totalRidesCancelled)} icon="❌" color="red" />
            <StatCard label="Subscription Rides" value={fmt(s.totalSubscriptionRides)} icon="🔄" color="purple" />
            <StatCard label="Float Rides" value={fmt(s.totalFloatRides)} icon="💳" color="blue" />
            <StatCard label="Cash Rides" value={fmt(s.totalCashRides)} icon="💵" color="green" />
            <StatCard label="Digital Rides" value={fmt(s.totalDigitalRides)} icon="📲" color="blue" />
          </Section>

          {/* Financials */}
          <Section title="💰 Financials">
            <StatCard label="Driver Earnings" value={fmtMoney(s.totalDriverEarnings)} icon="👨‍✈️" color="green" />
            <StatCard label="Platform Commission" value={fmtMoney(s.totalPlatformCommission)} icon="🏦" color="purple" />
            <StatCard label="Subscription Revenue" value={fmtMoney(s.totalSubscriptionRevenue)} icon="📋" color="blue" />
            <StatCard label="Float Sold" value={fmtMoney(s.totalFloatSold)} icon="💰" color="orange" />
            <StatCard label="Active Float" value={fmtMoney(s.totalActiveFloat)} icon="📊" color="blue" />
            <StatCard label="Negative Float" value={fmtMoney(s.totalNegativeFloat)} icon="⚠️" color="red" sub={`${fmt(s.driversWithNegativeFloat)} drivers`} />
            <StatCard label="Withdrawals Processed" value={fmtMoney(s.totalWithdrawalsProcessed)} icon="🏧" color="green" />
            <StatCard label="Pending Withdrawals" value={fmtMoney(s.totalPendingWithdrawals)} icon="⏳" color="orange" />
          </Section>

          {/* Drivers */}
          <Section title="🚕 Drivers">
            <StatCard label="Active Drivers" value={fmt(s.activeDriverCount)} icon="🟢" color="green" />
            <StatCard label="Active Subscribers" value={fmt(s.activeSubscriberCount)} icon="⭐" color="purple" />
            <StatCard label="Trial Subscribers" value={fmt(s.trialSubscriberCount)} icon="🆕" color="blue" />
          </Section>

          {/* Deliveries */}
          <Section title="📦 Deliveries">
            <StatCard label="Completed Deliveries" value={fmt(s.totalDeliveriesCompleted)} icon="✅" color="green" />
            <StatCard label="Cancelled Deliveries" value={fmt(s.totalDeliveriesCancelled)} icon="❌" color="red" />
            <StatCard label="Delivery Earnings" value={fmtMoney(s.totalDeliveryDriverEarnings)} icon="💰" color="green" />
            <StatCard label="Delivery Commission" value={fmtMoney(s.totalDeliveryPlatformCommission)} icon="🏦" color="purple" />
            <StatCard label="Cash Deliveries" value={fmt(s.totalCashDeliveries)} icon="💵" color="green" />
            <StatCard label="Digital Deliveries" value={fmt(s.totalDigitalDeliveries)} icon="📲" color="blue" />
            <StatCard label="Active Delivery Drivers" value={fmt(s.activeDeliveryDriverCount)} icon="🛵" color="orange" />
          </Section>

          {/* Affiliates */}
          <Section title="🤝 Affiliates">
            <StatCard label="Total Affiliate Points" value={fmt(s.totalAffiliatePoints)} icon="⭐" color="purple" />
            <StatCard label="Affiliate Payouts" value={fmtMoney(s.totalAffiliatePayouts)} icon="💸" color="green" />
            <StatCard label="Pending Balance" value={fmtMoney(s.totalPendingAffiliateBalance)} icon="⏳" color="orange" />
            <StatCard label="Active Affiliates" value={fmt(s.activeAffiliateCount)} icon="👥" color="blue" />
            <StatCard label="Total Referrals" value={fmt(s.totalAffiliateReferrals)} icon="🔗" color="green" />
            <StatCard label="Affiliate Transactions" value={fmt(s.totalAffiliateTransactions)} icon="📝" color="blue" />
          </Section>
        </>
      )}
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