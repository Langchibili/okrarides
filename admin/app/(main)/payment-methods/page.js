// app/(main)/payment-methods/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { ConfirmModal } from '@/components/admin/Modal';

export default function PaymentMethodsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = filterType ? { type: filterType } : {};
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'accountNumber', filters, populate: ['user'] });
      const res = await adminClient.get(`/payment-methods${q}&sort=createdAt:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterType]);

  useEffect(() => { load(1); }, [load]);

  const TYPE_ICONS = { okrapay: '📲', mobile_money: '📱', bank_card: '💳' };

  const columns = [
    { key: 'createdAt', label: 'Added', width: 110, render: v => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'user', label: 'User',
      render: v => v ? <div><div className="font-medium text-sm">{v.firstName} {v.lastName}</div><div className="text-xs text-gray-400">{v.phoneNumber}</div></div> : '—'
    },
    { key: 'type', label: 'Type', render: v => <span>{TYPE_ICONS[v] || ''} <span className="capitalize text-sm">{v?.replace(/_/g, ' ')}</span></span> },
    { key: 'provider', label: 'Provider', render: v => <span className="capitalize text-sm">{v || '—'}</span> },
    { key: 'accountNumber', label: 'Account #', render: v => <span className="font-mono text-sm">{v || '—'}</span> },
    { key: 'accountName', label: 'Account Name', render: v => v || '—' },
    { key: 'isDefault', label: 'Default', render: v => v ? <span className="text-blue-600 font-medium text-xs">★ Default</span> : '—' },
    { key: 'isVerified', label: 'Verified', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'id', label: '', width: 70,
      render: (_, row) => <Btn size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>Del</Btn>
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Payment Methods" description="All registered payment methods across user accounts" />
      <div className="flex gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by account number…" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All types</option>
          {['okrapay','mobile_money','bank_card'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterType(''); }}>Clear</Btn>
      </div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No payment methods found" />

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/payment-methods/${deleteTarget.id}`);
          setDeleteTarget(null); load(pagination.page);
        }}
        title="Delete Payment Method"
        message={`Delete ${deleteTarget?.type} account "${deleteTarget?.accountNumber}" for this user?`}
      />
    </div>
  );
}