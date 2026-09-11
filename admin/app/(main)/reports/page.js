// PATH: src/app/(dashboard)/reports/page.js
'use client';
import { useState, useEffect } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { PageHeader, StatCard } from '@/components/UI';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      {label && <p style={{ color: 'var(--text-muted)', margin: '0 0 4px' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? (p.value > 1000 ? `K${(p.value / 1000).toFixed(1)}k` : p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/platform-stats');
      setStats(res?.data || res);
    } catch (err) { toast.error(err.message || 'Failed to load stats'); } finally { setLoading(false); }
  };

  if (!hasPermission('reports')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Reports" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 24, width: '70%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = stats;
  if (!s) return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>No statistics available.</div>;

  const rideStatusData = [
    { name: 'Completed', value: s.totalRidesCompleted || 0, color: '#22c55e' },
    { name: 'Cancelled', value: s.totalRidesCancelled || 0, color: '#ef4444' },
  ];
  const deliveryStatusData = [
    { name: 'Completed', value: s.totalDeliveriesCompleted || 0, color: '#3b82f6' },
    { name: 'Cancelled', value: s.totalDeliveriesCancelled || 0, color: '#ef4444' },
  ];
  const paymentBreakdownData = [
    { name: 'Cash Rides', value: s.totalCashRides || 0, color: '#ffc107' },
    { name: 'Digital Rides', value: s.totalDigitalRides || 0, color: '#22c55e' },
    { name: 'Cash Deliveries', value: s.totalCashDeliveries || 0, color: '#f59e0b' },
    { name: 'Digital Deliveries', value: s.totalDigitalDeliveries || 0, color: '#3b82f6' },
  ];
  const subscriptionData = [
    { name: 'Active', value: s.activeSubscriberCount || 0, color: '#22c55e' },
    { name: 'Trial', value: s.trialSubscriberCount || 0, color: '#ffc107' },
  ];
  const rideTypeData = [{ name: 'Subscription', value: s.totalSubscriptionRides || 0 }, { name: 'Float', value: s.totalFloatRides || 0 }];
  const revenueData = [
    { name: 'Driver Earnings', value: parseFloat(s.totalDriverEarnings || 0), fill: '#ffc107' },
    { name: 'Commission', value: parseFloat(s.totalPlatformCommission || 0), fill: '#22c55e' },
    { name: 'Subscriptions', value: parseFloat(s.totalSubscriptionRevenue || 0), fill: '#a855f7' },
    { name: 'Float Sold', value: parseFloat(s.totalFloatSold || 0), fill: '#3b82f6' },
    { name: 'Withdrawals', value: parseFloat(s.totalWithdrawalsProcessed || 0), fill: '#ef4444' },
  ];

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle={s.lastCalculatedAt ? `Last updated: ${new Date(s.lastCalculatedAt).toLocaleString()}` : 'Platform-wide statistics'} />

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {[['overview', 'Overview'], ['rides', 'Rides & Deliveries'], ['finance', 'Finance'], ['affiliates', 'Affiliates']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard title="Total Rides" value={(s.totalRidesCompleted || 0) + (s.totalRidesCancelled || 0)} icon="🚗" color="var(--info)" />
            <StatCard title="Total Deliveries" value={(s.totalDeliveriesCompleted || 0) + (s.totalDeliveriesCancelled || 0)} icon="📦" color="var(--purple)" />
            <StatCard title="Active Drivers" value={s.activeDriverCount || 0} icon="👨‍💼" color="var(--success)" />
            <StatCard title="Active Subscribers" value={s.activeSubscriberCount || 0} icon="⭐" color="var(--accent)" />
            <StatCard title="Active Affiliates" value={s.activeAffiliateCount || 0} icon="🔗" color="var(--info)" />
            <StatCard title="Trial Subscribers" value={s.trialSubscriberCount || 0} icon="🔄" color="var(--warning)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[['Rides Outcome', rideStatusData], ['Deliveries Outcome', deliveryStatusData], ['Subscriptions', subscriptionData]].map(([title, data]) => (
              <div key={title} className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>{title}</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {data.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rides' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard title="Completed Rides" value={s.totalRidesCompleted || 0} icon="✅" color="var(--success)" />
            <StatCard title="Cancelled Rides" value={s.totalRidesCancelled || 0} icon="❌" color="var(--danger)" />
            <StatCard title="Subscription Rides" value={s.totalSubscriptionRides || 0} icon="⭐" color="var(--accent)" />
            <StatCard title="Float Rides" value={s.totalFloatRides || 0} icon="🔋" color="var(--info)" />
            <StatCard title="Cash Rides" value={s.totalCashRides || 0} icon="💵" color="var(--warning)" />
            <StatCard title="Digital Rides" value={s.totalDigitalRides || 0} icon="📱" color="var(--purple)" />
            <StatCard title="Completed Deliveries" value={s.totalDeliveriesCompleted || 0} icon="📦" color="var(--success)" />
            <StatCard title="Cancelled Deliveries" value={s.totalDeliveriesCancelled || 0} icon="❌" color="var(--danger)" />
            <StatCard title="Active Drivers" value={s.activeDriverCount || 0} icon="🚗" color="var(--success)" />
            <StatCard title="Delivery Drivers" value={s.activeDeliveryDriverCount || 0} icon="🛵" color="var(--info)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: '0 0 16px' }}>Payment Methods</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paymentBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>{paymentBreakdownData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: '0 0 16px' }}>Ride Types</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rideTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard title="Driver Earnings" value={parseFloat(s.totalDriverEarnings || 0)} currency icon="💵" color="var(--success)" />
            <StatCard title="Platform Commission" value={parseFloat(s.totalPlatformCommission || 0)} currency icon="💰" color="var(--accent)" />
            <StatCard title="Subscription Revenue" value={parseFloat(s.totalSubscriptionRevenue || 0)} currency icon="📋" color="var(--purple)" />
            <StatCard title="Float Sold" value={parseFloat(s.totalFloatSold || 0)} currency icon="🔋" color="var(--info)" />
            <StatCard title="Active Float" value={parseFloat(s.totalActiveFloat || 0)} currency icon="💳" color="var(--success)" />
            <StatCard title="Negative Float" value={parseFloat(s.totalNegativeFloat || 0)} currency icon="⚠️" color="var(--danger)" />
            <StatCard title="Withdrawals Processed" value={parseFloat(s.totalWithdrawalsProcessed || 0)} currency icon="📤" color="var(--success)" />
            <StatCard title="Pending Withdrawals" value={parseFloat(s.totalPendingWithdrawals || 0)} currency icon="⏳" color="var(--warning)" />
            <StatCard title="Delivery Earnings" value={parseFloat(s.totalDeliveryDriverEarnings || 0)} currency icon="📦" color="var(--purple)" />
            <StatCard title="Delivery Commission" value={parseFloat(s.totalDeliveryPlatformCommission || 0)} currency icon="💰" color="var(--accent)" />
          </div>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: '0 0 16px' }}>Revenue Breakdown (ZMW)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Amount (K)" radius={[0, 4, 4, 0]}>{revenueData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'affiliates' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard title="Active Affiliates" value={s.activeAffiliateCount || 0} icon="🔗" color="var(--purple)" />
            <StatCard title="Total Referrals" value={s.totalAffiliateReferrals || 0} icon="👥" color="var(--info)" />
            <StatCard title="Total Points" value={s.totalAffiliatePoints || 0} icon="⭐" color="var(--accent)" />
            <StatCard title="Affiliate Payouts" value={parseFloat(s.totalAffiliatePayouts || 0)} currency icon="💸" color="var(--success)" />
            <StatCard title="Pending Balance" value={parseFloat(s.totalPendingAffiliateBalance || 0)} currency icon="⏳" color="var(--warning)" />
            <StatCard title="Transactions" value={s.totalAffiliateTransactions || 0} icon="📊" color="var(--purple)" />
          </div>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: '0 0 16px' }}>Affiliate Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Active Affiliates', value: s.activeAffiliateCount || 0 },
                { name: 'Total Referrals', value: s.totalAffiliateReferrals || 0 },
                { name: 'Transactions', value: s.totalAffiliateTransactions || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Count" fill="var(--purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
