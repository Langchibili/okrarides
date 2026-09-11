// app/(main)/okrapay/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, StatCard, Btn } from '@/components/admin/PageHeader';

export default function OkraPayPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = {};
      if (filterStatus) filters.paymentStatus = filterStatus;
      if (filterPurpose) filters.purpose = filterPurpose;
      if (filterDirection) filters.direction = filterDirection;
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'paymentId', filters, populate: ['user', 'currency'] });
      const res = await adminClient.get(`/okrapays${q}&sort=initiatedAt:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterStatus, filterPurpose, filterDirection]);

  useEffect(() => { load(1); }, [load]);

  const DIRECTION_COLORS = { collection: 'bg-green-100 text-green-700', payout: 'bg-orange-100 text-orange-700' };
  const PURPOSE_ICONS = { floatadd: '💳', subpay: '📋', ridepay: '🚗', withdraw: '🏧', walletTopup: '💰', affiliatePayout: '🤝' };

  const columns = [
    {
      key: 'initiatedAt', label: 'Date', width: 140,
      render: v => v ? <div><div className="text-sm">{new Date(v).toLocaleDateString()}</div><div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div></div> : '—'
    },
    { key: 'paymentId', label: 'Payment ID', render: v => <span className="font-mono text-xs text-blue-600">{v}</span> },
    {
      key: 'user', label: 'User',
      render: v => v ? <div><div className="font-medium text-sm">{v.firstName} {v.lastName}</div><div className="text-xs text-gray-400">{v.phoneNumber}</div></div> : '—'
    },
    { key: 'direction', label: 'Direction', render: v => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DIRECTION_COLORS[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span> },
    { key: 'purpose', label: 'Purpose', render: v => <span className="text-sm">{PURPOSE_ICONS[v] || ''} {v}</span> },
    { key: 'amount', label: 'Amount', render: (v, row) => <span className="font-semibold">{row.currency?.symbol || 'K'}{Number(v).toFixed(2)}</span> },
    { key: 'paymentStatus', label: 'Status', render: v => <StatusBadge status={v || 'pending'} /> },
    { key: 'gatewayName', label: 'Gateway', render: v => <span className="text-xs text-gray-500 capitalize">{v || '—'}</span> },
    {
      key: 'id', label: '', width: 70,
      render: (_, row) => <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn>
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="OkraPay Transactions" description="All payment gateway transactions — collections and payouts" />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by payment ID…" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All statuses</option>
          {['pending','processing','completed','failed','cancelled','refunded'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPurpose} onChange={e => setFilterPurpose(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All purposes</option>
          {['floatadd','subpay','ridepay','withdraw','walletTopup','affiliatePayout'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">Both directions</option>
          <option value="collection">Collection (in)</option>
          <option value="payout">Payout (out)</option>
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterStatus(''); setFilterPurpose(''); setFilterDirection(''); }}>Clear</Btn>
      </div>

      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No payment records found" />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Transaction Detail" size="lg">
        {detail && (
          <div className="space-y-2">
            {[
              ['Payment ID', detail.paymentId, true],
              ['Reference', detail.reference, true],
              ['Direction', detail.direction],
              ['Purpose', detail.purpose],
              ['Amount', `${detail.currency?.symbol || 'K'}${Number(detail.amount).toFixed(2)}`],
              ['Status', detail.paymentStatus],
              ['Payment Method', detail.paymentMethod],
              ['Gateway', detail.gatewayName],
              ['Gateway Reference', detail.gatewayReference, true],
              ['Related Entity Type', detail.relatedEntityType],
              ['Related Entity ID', detail.relatedEntityId],
              ['Initiated At', detail.initiatedAt ? new Date(detail.initiatedAt).toLocaleString() : '—'],
              ['Completed At', detail.completedAt ? new Date(detail.completedAt).toLocaleString() : '—'],
              ['Failed At', detail.failedAt ? new Date(detail.failedAt).toLocaleString() : '—'],
              ['Failure Reason', detail.failureReason],
              ['IP Address', detail.ipAddress],
            ].map(([l, v, mono]) => (
              <div key={l} className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-medium text-gray-400 w-40 shrink-0 uppercase tracking-wide pt-0.5">{l}</span>
                <span className={`text-sm text-gray-800 break-all ${mono ? 'font-mono' : ''}`}>{v || '—'}</span>
              </div>
            ))}
            {detail.gatewayResponse && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">GATEWAY RESPONSE</p>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">{JSON.stringify(detail.gatewayResponse, null, 2)}</pre>
              </div>
            )}
            {detail.metadata && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">METADATA</p>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">{JSON.stringify(detail.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}