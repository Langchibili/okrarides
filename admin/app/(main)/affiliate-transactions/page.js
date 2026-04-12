// app/(main)/affiliate-transactions/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';

const TX_TYPES = [
  'referral_signup','referral_first_ride_as_rider','referral_first_ride_as_driver',
  'points_redemption','bonus','adjustment',
];

export default function AffiliateTransactionsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = {};
      if (filterType) filters.type = filterType;
      if (filterStatus) filters.affiliate_transaction_status = filterStatus;
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'transactionId', filters, populate: ['affiliate', 'referredUser', 'ride'] });
      const res = await adminClient.get(`/affiliate-transactions${q}&sort=createdAt:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterType, filterStatus]);

  useEffect(() => { load(1); }, [load]);

  const TYPE_COLORS = {
    referral_signup: 'bg-green-100 text-green-700',
    referral_first_ride_as_rider: 'bg-blue-100 text-blue-700',
    referral_first_ride_as_driver: 'bg-blue-100 text-blue-700',
    points_redemption: 'bg-orange-100 text-orange-700',
    bonus: 'bg-purple-100 text-purple-700',
    adjustment: 'bg-gray-100 text-gray-600',
  };

  const columns = [
    {
      key: 'createdAt', label: 'Date', width: 130,
      render: v => v ? <div><div className="text-sm">{new Date(v).toLocaleDateString()}</div><div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div></div> : '—'
    },
    { key: 'transactionId', label: 'TX ID', render: v => <span className="font-mono text-xs text-blue-600">{v}</span> },
    { key: 'affiliate', label: 'Affiliate', render: v => v ? <span className="font-medium text-sm">{v.firstName} {v.lastName}</span> : '—' },
    { key: 'referredUser', label: 'Referred', render: v => v ? <span className="text-sm">{v.firstName} {v.lastName}</span> : '—' },
    { key: 'type', label: 'Type', render: v => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[v] || 'bg-gray-100 text-gray-600'}`}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'points', label: 'Points', render: v => v ? <span className="font-semibold text-purple-600">+{v} pts</span> : '—' },
    { key: 'amount', label: 'Amount', render: v => v ? <span className="font-semibold text-green-600">K{Number(v).toFixed(2)}</span> : '—' },
    { key: 'affiliate_transaction_status', label: 'Status', render: v => <StatusBadge status={v || 'pending'} /> },
    {
      key: 'id', label: '', width: 70,
      render: (_, row) => <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn>
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Affiliate Transactions" description="All affiliate point awards, referral bonuses and redemptions" />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by transaction ID…" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All types</option>
          {TX_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All statuses</option>
          {['pending','completed','failed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}>Clear</Btn>
      </div>

      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No affiliate transactions found" />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Affiliate Transaction Detail" size="md">
        {detail && (
          <div className="space-y-2">
            {[
              ['Transaction ID', detail.transactionId, true],
              ['Affiliate', detail.affiliate ? `${detail.affiliate.firstName} ${detail.affiliate.lastName}` : '—'],
              ['Referred User', detail.referredUser ? `${detail.referredUser.firstName} ${detail.referredUser.lastName}` : '—'],
              ['Type', detail.type?.replace(/_/g, ' ')],
              ['Points', detail.points ? `+${detail.points} pts` : '—'],
              ['Amount', detail.amount ? `K${Number(detail.amount).toFixed(2)}` : '—'],
              ['Status', detail.affiliate_transaction_status],
              ['Ride', detail.ride?.rideCode || '—'],
              ['Description', detail.description],
              ['Processed At', detail.processedAt ? new Date(detail.processedAt).toLocaleString() : '—'],
              ['Created At', detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '—'],
            ].map(([l, v, mono]) => (
              <div key={l} className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-medium text-gray-400 w-32 shrink-0 uppercase tracking-wide pt-0.5">{l}</span>
                <span className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>{v || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}