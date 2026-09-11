// app/(main)/currencies/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, SearchBar, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Toggle } from '@/components/admin/FormField';

const EMPTY = { name: '', code: '', symbol: '', exchangeRate: 1, isActive: true };

export default function CurrenciesPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'name' });
      const res = await adminClient.get(`/currencies${q}`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  const save = async () => {
    if (!form.name || !form.code || !form.symbol) { setError('Name, code and symbol are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, code: form.code.toUpperCase().slice(0, 3), exchangeRate: parseFloat(form.exchangeRate) || 1 };
      if (modal.mode === 'create') {
        await adminClient.post('/currencies', { data: payload });
      } else {
        await adminClient.put(`/currencies/${modal.item.id}`, { data: payload });
      }
      setModal(null);
      load(pagination.page);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'code', label: 'Code', render: v => <span className="font-mono font-bold text-blue-600">{v}</span> },
    { key: 'name', label: 'Name' },
    { key: 'symbol', label: 'Symbol', render: v => <span className="font-semibold">{v}</span> },
    { key: 'exchangeRate', label: 'Exchange Rate', render: v => Number(v).toFixed(4) },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', width: 120,
      render: (_, row) => (
        <div className="flex gap-2">
          <Btn size="sm" variant="secondary" onClick={() => { setForm({ name: row.name, code: row.code, symbol: row.symbol, exchangeRate: row.exchangeRate, isActive: row.isActive }); setError(''); setModal({ mode: 'edit', item: row }); }}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>Del</Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Currencies"
        description="Manage supported currencies and exchange rates"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Currency</Btn>}
      />
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search currencies…" /></div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Currency' : 'Edit Currency'} size="sm">
        <FormField label="Currency Name" required>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Zambian Kwacha" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Code (3 letters)" required>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ZMW" maxLength={3} />
          </FormField>
          <FormField label="Symbol" required>
            <Input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="K" />
          </FormField>
        </div>
        <FormField label="Exchange Rate (vs base)" hint="1 = base currency (e.g. USD)">
          <Input type="number" step="0.0001" value={form.exchangeRate} onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))} />
        </FormField>
        <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="Active" />
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/currencies/${deleteTarget.id}`);
          setDeleteTarget(null); load(pagination.page);
        }}
        title="Delete Currency" message={`Delete "${deleteTarget?.name}" (${deleteTarget?.code})?`}
      />
    </div>
  );
}