// app/(main)/ledger/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';

const ENTRY_TYPES = ['fare','fare_cash','fare_digital','fare_subscription','float_topup','float_deduction','commission','withdrawal','bonus','adjustment'];

export default function LedgerPage() {
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
      if (filterStatus) filters.ledgerStatus = filterStatus;
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'entryId', filters, populate: ['driver', 'ride'] });
      const res = await adminClient.get(`/ledger-entries${q}&sort=createdAt:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterType, filterStatus]);

  useEffect(() => { load(1); }, [load]);

  const TYPE_COLORS = {
    fare: 'bg-green-100 text-green-700',
    fare_cash: 'bg-green-100 text-green-700',
    fare_digital: 'bg-emerald-100 text-emerald-700',
    fare_subscription: 'bg-blue-100 text-blue-700',
    float_topup: 'bg-blue-100 text-blue-700',
    float_deduction: 'bg-orange-100 text-orange-700',
    commission: 'bg-purple-100 text-purple-700',
    withdrawal: 'bg-red-100 text-red-700',
    bonus: 'bg-yellow-100 text-yellow-700',
    adjustment: 'bg-gray-100 text-gray-600',
  };

  const columns = [
    {
      key: 'createdAt', label: 'Date', width: 130,
      render: v => v ? <div><div className="text-sm">{new Date(v).toLocaleDateString()}</div><div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div></div> : '—'
    },
    { key: 'entryId', label: 'Entry ID', render: v => <span className="font-mono text-xs text-blue-600">{v}</span> },
    {
      key: 'driver', label: 'Driver',
      render: v => v ? <div><div className="font-medium text-sm">{v.firstName} {v.lastName}</div><div className="text-xs text-gray-400">{v.phoneNumber}</div></div> : '—'
    },
    { key: 'type', label: 'Type', render: v => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[v] || 'bg-gray-100 text-gray-600'}`}>{v?.replace(/_/g, ' ')}</span> },
    {
      key: 'amount', label: 'Amount',
      render: v => {
        const n = Number(v);
        return <span className={`font-semibold tabular-nums ${n < 0 ? 'text-red-600' : 'text-green-600'}`}>{n < 0 ? '' : '+'}K{Math.abs(n).toFixed(2)}</span>;
      }
    },
    { key: 'source', label: 'Source', render: v => <span className="capitalize text-xs">{v}</span> },
    { key: 'ledgerStatus', label: 'Status', render: v => <StatusBadge status={v || 'pending'} /> },
    { key: 'ride', label: 'Ride', render: v => v?.rideCode ? <span className="font-mono text-xs">{v.rideCode}</span> : '—' },
    {
      key: 'id', label: '', width: 70,
      render: (_, row) => <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn>
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Ledger Entries" description="Complete financial ledger — all driver earnings, commissions and deductions" />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by entry ID…" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All types</option>
          {ENTRY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All statuses</option>
          {['pending','settled','failed','reversed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}>Clear</Btn>
      </div>

      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No ledger entries found" />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Ledger Entry Detail" size="md">
        {detail && (
          <div className="space-y-2">
            {[
              ['Entry ID', detail.entryId, true],
              ['Type', detail.type?.replace(/_/g, ' ')],
              ['Amount', `${Number(detail.amount) >= 0 ? '+' : ''}K${Number(detail.amount).toFixed(2)}`],
              ['Source', detail.source],
              ['Status', detail.ledgerStatus],
              ['Driver', detail.driver ? `${detail.driver.firstName} ${detail.driver.lastName} (${detail.driver.phoneNumber})` : '—'],
              ['Ride', detail.ride?.rideCode || '—'],
              ['Balance Before', detail.balanceBefore != null ? `K${Number(detail.balanceBefore).toFixed(2)}` : '—'],
              ['Balance After', detail.balanceAfter != null ? `K${Number(detail.balanceAfter).toFixed(2)}` : '—'],
              ['Description', detail.description],
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