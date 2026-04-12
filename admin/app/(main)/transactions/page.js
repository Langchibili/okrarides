// app/(main)/transactions/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';

const TX_TYPES = ['ride_payment','float_topup','withdrawal','subscription_payment','commission','refund','affiliate_payout'];

export default function TransactionsPage() {
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
      if (filterStatus) filters.transactionStatus = filterStatus;
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'transactionId', filters, populate: ['user', 'ride', 'subscription'] });
      const res = await adminClient.get(`/transactions${q}&sort=createdAt:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterType, filterStatus]);

  useEffect(() => { load(1); }, [load]);

  const TYPE_COLORS = {
    ride_payment: 'bg-blue-100 text-blue-700',
    float_topup: 'bg-green-100 text-green-700',
    withdrawal: 'bg-orange-100 text-orange-700',
    subscription_payment: 'bg-purple-100 text-purple-700',
    commission: 'bg-gray-100 text-gray-700',
    refund: 'bg-red-100 text-red-700',
    affiliate_payout: 'bg-teal-100 text-teal-700',
  };

  const columns = [
    { key: 'createdAt', label: 'Date', width: 130, render: v => v ? <div><div className="text-sm">{new Date(v).toLocaleDateString()}</div><div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div></div> : '—' },
    { key: 'transactionId', label: 'TX ID', render: v => <span className="font-mono text-xs text-blue-600">{v}</span> },
    { key: 'user', label: 'User', render: v => v ? <div><div className="font-medium text-sm">{v.firstName} {v.lastName}</div><div className="text-xs text-gray-400">{v.phoneNumber}</div></div> : '—' },
    { key: 'type', label: 'Type', render: v => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[v] || 'bg-gray-100 text-gray-600'}`}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'amount', label: 'Amount', render: v => <span className="font-semibold">K{Number(v).toFixed(2)}</span> },
    { key: 'paymentMethod', label: 'Method', render: v => <span className="capitalize text-sm">{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'transactionStatus', label: 'Status', render: v => <StatusBadge status={v || 'pending'} /> },
    { key: 'id', label: '', width: 70, render: (_, row) => <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn> },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Transactions" description="All platform financial transactions" />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by transaction ID…" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All types</option>
          {TX_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All statuses</option>
          {['pending','completed','failed','cancelled','refunded'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}>Clear</Btn>
      </div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No transactions found" />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Transaction Detail" size="md">
        {detail && (
          <div className="space-y-2">
            {[
              ['Transaction ID', detail.transactionId, true],
              ['Type', detail.type?.replace(/_/g, ' ')],
              ['Amount', `K${Number(detail.amount).toFixed(2)}`],
              ['Status', detail.transactionStatus],
              ['Payment Method', detail.paymentMethod],
              ['Gateway Reference', detail.gatewayReference, true],
              ['User', detail.user ? `${detail.user.firstName} ${detail.user.lastName} (${detail.user.phoneNumber})` : '—'],
              ['Ride', detail.ride?.rideCode || detail.ride?.id || '—'],
              ['Subscription', detail.subscription?.subscriptionId || '—'],
              ['Notes', detail.notes],
              ['Processed At', detail.processedAt ? new Date(detail.processedAt).toLocaleString() : '—'],
            ].map(([l, v, mono]) => (
              <div key={l} className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-medium text-gray-400 w-36 shrink-0 uppercase tracking-wide pt-0.5">{l}</span>
                <span className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>{v || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}