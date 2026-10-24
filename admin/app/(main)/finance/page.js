// PATH: src/app/(dashboard)/finance/page.js
'use client';
import { useState, useEffect } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDateTime, getFullName } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, FilterBar, StatusPill, Avatar, StatCard } from '@/components/UI';
import CountryFilter from '@/components/CountryFilter';
import { adminClient } from '@/lib/api/adminClient';

export default function FinancePage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [topups, setTopups] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [stats, setStats] = useState(null);
  const [countryId, setCountryId] = useState('');
  const pageSize = 20;

  useEffect(() => { loadData(); }, [page, activeTab, filterStatus, filterType, countryId]);
  useEffect(() => { loadStats(); }, [countryId]);

  const loadStats = async () => {
    setStats(null);
    try {
      const endpoint = countryId
        ? `/platform-stat?countryId=${encodeURIComponent(countryId)}`
        : '/platform-stat';
      const res = await adminClient.get(endpoint);
      const payload = res?.data ?? res;
      setStats(Array.isArray(payload) ? payload : payload ? [payload] : []);
    } catch (err) {
      setStats([]);
      toast.error(err.message || 'Could not load finance statistics');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { 'pagination[page]': page, 'pagination[pageSize]': pageSize, 'sort': 'createdAt:desc' };
      if (activeTab === 'transactions') {
        params['populate[user][fields]'] = 'firstName,lastName,phoneNumber';
        params['populate[user][populate][country][populate][currency]'] = '*';
        if (countryId) params['filters[user][country][id][$eq]'] = countryId;
        if (filterType) params['filters[type][$eq]'] = filterType;
        if (filterStatus) params['filters[transactionStatus][$eq]'] = filterStatus;
        const res = await adminAPI.get('/transactions', params);
        const data = res?.data || res || [];
        setTransactions(Array.isArray(data) ? data : []);
        const meta = res?.meta?.pagination;
        setTotal(meta?.total || 0); setPageCount(meta?.pageCount || 1);
      } else if (activeTab === 'topups') {
        params['populate[driver][fields]'] = 'firstName,lastName,phoneNumber';
        params['populate[driver][populate][country][populate][currency]'] = '*';
        params['populate[currency]'] = '*';
        if (countryId) params['filters[driver][country][id][$eq]'] = countryId;
        if (filterStatus) params['filters[floatStatus][$eq]'] = filterStatus;
        const res = await adminAPI.get('/float-topups', params);
        const data = res?.data || res || [];
        setTopups(Array.isArray(data) ? data : []);
        const meta = res?.meta?.pagination;
        setTotal(meta?.total || 0); setPageCount(meta?.pageCount || 1);
      } else {
        params['populate[user][fields]'] = 'firstName,lastName,phoneNumber';
        params['populate[user][populate][country][populate][currency]'] = '*';
        if (countryId) params['filters[user][country][id][$eq]'] = countryId;
        if (filterStatus) params['filters[withdrawalStatus][$eq]'] = filterStatus;
        const res = await adminAPI.get('/withdrawals', params);
        const data = res?.data || res || [];
        setWithdrawals(Array.isArray(data) ? data : []);
        const meta = res?.meta?.pagination;
        setTotal(meta?.total || 0); setPageCount(meta?.pageCount || 1);
      }
    } catch (err) { toast.error(err.message || 'Failed to load data'); } finally { setLoading(false); }
  };

  const handleProcessWithdrawal = async (withdrawal, status) => {
    if (!canWrite('finance')) return toast.error('Insufficient permissions');
    try {
      await adminAPI.put(`/withdrawals/${withdrawal.id}`, { data: { withdrawalStatus: status, processedAt: new Date() } });
      toast.success(`Withdrawal ${status}`);
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const txColumns = [
    { key: 'transactionId', label: 'Transaction ID', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{v}</span> },
    { key: 'user', label: 'User', render: (v) => v ? <div style={{ fontSize: 12 }}><div style={{ fontWeight: 600 }}>{getFullName(v)}</div><div style={{ color: 'var(--text-muted)' }}>{v.phoneNumber}</div></div> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'type', label: 'Type', render: (v) => <span style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'amount', label: 'Amount', render: (v, row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{formatMoney(v, row.currency?.symbol || row.user?.country?.currency?.symbol || row.user?.country?.currency?.code)}</span> },
    { key: 'transactionStatus', label: 'Status', render: (v) => <StatusPill status={v} /> },
    { key: 'paymentMethod', label: 'Method', render: (v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'processedAt', label: 'Processed', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v ? formatDateTime(v) : '—'}</span> },
  ];

  const topupColumns = [
    { key: 'topupId', label: 'Top-up ID', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{v}</span> },
    { key: 'driver', label: 'Driver', render: (v) => v ? <div style={{ fontSize: 12 }}><div style={{ fontWeight: 600 }}>{getFullName(v)}</div><div style={{ color: 'var(--text-muted)' }}>{v.phoneNumber}</div></div> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'amount', label: 'Amount', render: (v, row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{formatMoney(v, row.currency?.symbol || row.driver?.country?.currency?.symbol || row.driver?.country?.currency?.code)}</span> },
    { key: 'floatStatus', label: 'Status', render: (v) => <StatusPill status={v || 'pending'} /> },
    { key: 'paymentMethod', label: 'Method', render: (v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v || '—'}</span> },
    { key: 'completedAt', label: 'Date', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v ? formatDateTime(v) : '—'}</span> },
  ];

  const withdrawalColumns = [
    { key: 'withdrawalId', label: 'Withdrawal ID', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{v}</span> },
    { key: 'user', label: 'User', render: (v) => v ? <div style={{ fontSize: 12 }}><div style={{ fontWeight: 600 }}>{getFullName(v)}</div><div style={{ color: 'var(--text-muted)' }}>{v.phoneNumber}</div></div> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'amount', label: 'Amount', render: (v, row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{formatMoney(v, row.user?.country?.currency?.symbol || row.user?.country?.currency?.code)}</span> },
    { key: 'withdrawalStatus', label: 'Status', render: (v) => <StatusPill status={v || 'pending'} /> },
    { key: 'method', label: 'Method', render: (v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'accountNumber', label: 'Account', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v || '—'}</span> },
    { key: 'requestedAt', label: 'Requested', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v ? formatDateTime(v) : '—'}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (row.withdrawalStatus === 'pending' || row.withdrawalStatus === 'processing') ? (
        <div style={{ display: 'flex', gap: 6 }}>
          {canWrite('finance') && (
            <>
              <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)' }} onClick={() => handleProcessWithdrawal(row, 'completed')}>Complete</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleProcessWithdrawal(row, 'failed')}>Fail</button>
            </>
          )}
        </div>
      ) : null,
    },
  ];

  if (!hasPermission('finance')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  const s = stats;
  return (
    <div>
      <PageHeader title="Finance" actions={<CountryFilter value={countryId} onChange={value => { setCountryId(value); setPage(1); }} />} />
      {s === null ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="stat-card animate-pulse">
              <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 24, width: '70%' }} />
            </div>
          ))}
        </div>
      ) : s.length ? s.map(record => (
        <CountryFinanceStats key={record.id || record.country?.id} stats={record} />
      )) : (
        <div className="empty-state">No country finance snapshots are available yet.</div>
      )}

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[['transactions', 'Transactions'], ['topups', 'Float Top-ups'], ['withdrawals', 'Withdrawals']].map(([key, label]) => (
          <button key={key} onClick={() => { setActiveTab(key); setPage(1); setFilterStatus(''); setFilterType(''); }}
            style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      <FilterBar>
        {activeTab === 'transactions' && (
          <select className="input select" style={{ width: 170 }} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="ride_payment">Ride Payment</option>
            <option value="float_topup">Float Top-up</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="subscription_payment">Subscription</option>
            <option value="affiliate_payout">Affiliate Payout</option>
            <option value="partner_commission_payment">Partner Commission Payment</option>
          </select>
        )}
        <select className="input select" style={{ width: 150 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="processing">Processing</option>
        </select>
      </FilterBar>

      {activeTab === 'transactions' && <><DataTable columns={txColumns} data={transactions} loading={loading} /><Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} /></>}
      {activeTab === 'topups' && <><DataTable columns={topupColumns} data={topups} loading={loading} /><Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} /></>}
      {activeTab === 'withdrawals' && <><DataTable columns={withdrawalColumns} data={withdrawals} loading={loading} /><Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} /></>}
    </div>
  );
}

function formatMoney(value, symbol) {
  return `${symbol || ''}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function CountryFinanceStats({ stats }) {
  const symbol = stats.country?.currency?.symbol || stats.country?.currency?.code || '';
  const money = value => `${symbol}${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const metrics = [
    ['Estimated profits', stats.estimatedProfit, '📈', 'var(--success)'],
    ['Ride commissions', stats.totalPlatformCommission, '💰', 'var(--accent)'],
    ['Partner commission share', stats.partnerCommissionShare, '🤝', 'var(--purple)'],
    ['Subscription revenue', stats.totalSubscriptionRevenue, '📋', 'var(--info)'],
    ['Float purchased from Okra', stats.totalFloatSold, '🔋', 'var(--info)'],
    ['Float issued to drivers', stats.totalDriverFloatIssued, '↗️', 'var(--warning)'],
    ['Float purchased by partners', stats.totalPartnerFloatPurchased, '🏢', 'var(--accent)'],
    ['Withdrawals processed', stats.totalWithdrawalsProcessed, '📤', 'var(--success)'],
    ['Pending withdrawals', stats.totalPendingWithdrawals, '⏳', 'var(--warning)'],
    ['Active float', stats.totalActiveFloat, '📊', 'var(--info)'],
    ['Negative float', stats.totalNegativeFloat, '⚠️', 'var(--danger)'],
  ];
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          {stats.country?.name || 'Country'} financial summary
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {stats.country?.currency?.code || 'Local currency'} · Partner share {Number(stats.partnerCommisionPercentage || 0)}%
          {' · '}Statistics calculated every {stats.platformStatCalculationCycleInMins || 20} minutes
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {metrics.map(([title, value, icon, color]) => (
          <StatCard key={title} title={title} value={money(value)} icon={icon} color={color} />
        ))}
      </div>
    </section>
  );
}
