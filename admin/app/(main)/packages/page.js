// app/(main)/packages/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  picked_up: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PackagesPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = filterStatus ? { packageStatus: filterStatus } : {};
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'trackingCode', filters, populate: ['delivery', 'sender'] });
      const res = await adminClient.get(`/packages${q}&sort=createdAt:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(1); }, [load]);

  const columns = [
    {
      key: 'createdAt', label: 'Date', width: 130,
      render: v => v ? <div><div className="text-sm">{new Date(v).toLocaleDateString()}</div><div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div></div> : '—'
    },
    { key: 'trackingCode', label: 'Tracking', render: v => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-blue-700">{v || '—'}</span> },
    { key: 'packageType', label: 'Type', render: v => <span className="capitalize">{v || '—'}</span> },
    {
      key: 'description', label: 'Description',
      render: v => <span className="text-sm text-gray-600 line-clamp-1">{v || '—'}</span>
    },
    { key: 'weight', label: 'Weight', render: v => v ? `${v} kg` : '—' },
    { key: 'fragile', label: 'Fragile', render: v => v ? <span className="text-orange-500 font-medium">⚠ Yes</span> : '—' },
    {
      key: 'packageStatus', label: 'Status',
      render: v => <StatusBadge status={v || 'pending'} />
    },
    {
      key: 'recipient', label: 'Recipient',
      render: v => v ? <div><div className="text-sm font-medium">{v.name}</div><div className="text-xs text-gray-400">{v.phone}</div></div> : '—'
    },
    {
      key: 'id', label: '', width: 70,
      render: (_, row) => <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn>
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Packages" description="All delivery packages and their status" />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by tracking code…" />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All statuses</option>
          {['pending','picked_up','delivered','cancelled'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterStatus(''); }}>Clear</Btn>
      </div>

      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No packages found" />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Package Detail" size="md">
        {detail && (
          <div className="space-y-2">
            {[
              ['Tracking Code', detail.trackingCode, true],
              ['Type', detail.packageType],
              ['Description', detail.description],
              ['Weight', detail.weight ? `${detail.weight} kg` : '—'],
              ['Dimensions', detail.dimensions],
              ['Fragile', detail.fragile ? 'Yes ⚠' : 'No'],
              ['Status', detail.packageStatus],
              ['Picked Up At', detail.pickedUpAt ? new Date(detail.pickedUpAt).toLocaleString() : '—'],
              ['Delivered At', detail.deliveredAt ? new Date(detail.deliveredAt).toLocaleString() : '—'],
            ].filter(([, v]) => v != null).map(([l, v, mono]) => (
              <div key={l} className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-medium text-gray-400 w-32 shrink-0 uppercase tracking-wide pt-0.5">{l}</span>
                <span className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>{v || '—'}</span>
              </div>
            ))}
            {detail.recipient && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase">Recipient</p>
                <p className="text-sm font-medium">{detail.recipient.name}</p>
                <p className="text-sm text-gray-500">{detail.recipient.phone}</p>
                {detail.recipient.address && <p className="text-xs text-gray-400 mt-1">{detail.recipient.address}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}