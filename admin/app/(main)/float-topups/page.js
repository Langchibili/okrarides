// app/(main)/float-topups/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, StatCard, Btn } from '@/components/admin/PageHeader';

export default function FloatTopupsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detail, setDetail] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, totalAmount: 0 });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = filterStatus ? { floatStatus: filterStatus } : {};
      const q = buildQuery({ page, pageSize: 20, populate: ['driver'], search, searchField: 'topupId', filters });
      const res = await adminClient.get(`/float-topups${q}&sort=createdAt:desc`);
      const items = res?.data || res || [];
      const arr = Array.isArray(items) ? items : (items.data || []);
      setData(arr);
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
      // quick stats from current page
      const allRes = await adminClient.get('/float-topups?pagination[pageSize]=1&filters[floatStatus][$eq]=completed&populate=amount');
      setStats(s => ({ ...s, total: res?.meta?.pagination?.total || arr.length }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(1); }, [load]);

  const columns = [
    {
      key: 'createdAt', label: 'Date', width: 140,
      render: v => v ? <div><div className="text-sm">{new Date(v).toLocaleDateString()}</div><div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div></div> : '—'
    },
    { key: 'topupId', label: 'Topup ID', render: v => <span className="font-mono text-xs text-blue-600">{v}</span> },
    {
      key: 'driver', label: 'Driver',
      render: v => v ? <div><div className="font-medium text-sm">{v.firstName} {v.lastName}</div><div className="text-xs text-gray-400">{v.phoneNumber}</div></div> : '—'
    },
    { key: 'amount', label: 'Amount', render: v => <span className="font-semibold text-green-600">K{Number(v).toFixed(2)}</span> },
    { key: 'paymentMethod', label: 'Method', render: v => <span className="capitalize text-sm">{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'floatStatus', label: 'Status', render: v => <StatusBadge status={v || 'pending'} /> },
    { key: 'floatBalanceBefore', label: 'Before', render: v => v != null ? `K${Number(v).toFixed(2)}` : '—' },
    { key: 'floatBalanceAfter', label: 'After', render: v => v != null ? `K${Number(v).toFixed(2)}` : '—' },
    {
      key: 'id', label: '', width: 70,
      render: (_, row) => <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn>
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Float Top-ups" description="All driver float top-up transactions" />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by topup ID…" />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All statuses</option>
          {['pending','completed','failed','cancelled'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterStatus(''); }}>Clear</Btn>
      </div>

      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No float top-ups found" />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Float Top-up Detail" size="md">
        {detail && (
          <div className="space-y-3">
            <DetailRow label="Topup ID" value={detail.topupId} mono />
            <DetailRow label="Driver" value={detail.driver ? `${detail.driver.firstName} ${detail.driver.lastName} (${detail.driver.phoneNumber})` : '—'} />
            <DetailRow label="Amount" value={`K${Number(detail.amount).toFixed(2)}`} />
            <DetailRow label="Payment Method" value={detail.paymentMethod} />
            <DetailRow label="Status" value={detail.floatStatus} />
            <DetailRow label="Gateway Reference" value={detail.gatewayReference} mono />
            <DetailRow label="Balance Before" value={detail.floatBalanceBefore != null ? `K${Number(detail.floatBalanceBefore).toFixed(2)}` : '—'} />
            <DetailRow label="Balance After" value={detail.floatBalanceAfter != null ? `K${Number(detail.floatBalanceAfter).toFixed(2)}` : '—'} />
            <DetailRow label="Requested At" value={detail.requestedAt ? new Date(detail.requestedAt).toLocaleString() : '—'} />
            <DetailRow label="Completed At" value={detail.completedAt ? new Date(detail.completedAt).toLocaleString() : '—'} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 w-36 shrink-0 uppercase tracking-wide pt-0.5">{label}</span>
      <span className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}