// app/(main)/countries/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, SearchBar, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Toggle } from '@/components/admin/FormField';

const EMPTY = { name: '', code: '', phoneCode: '', currency: '', isActive: true, phoneNumberDigitLenth: 9, phoneNumberRegex: '' };

export default function CountriesPage() {
  const [data, setData] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', item }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const q = buildQuery({ page, pageSize: 20, populate: ['currency'], search, searchField: 'name' });
      const res = await adminClient.get(`/countries${q}`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    adminClient.get('/currencies?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setCurrencies(Array.isArray(items) ? items : (items.data || []));
    }).catch(() => {});
  }, []);

  const openCreate = () => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); };
  const openEdit = item => {
    setForm({
      name: item.name || '', code: item.code || '', phoneCode: item.phoneCode || '',
      currency: item.currency?.id || item.currency || '',
      isActive: item.isActive ?? true,
      phoneNumberDigitLenth: item.phoneNumberDigitLenth || 9,
      phoneNumberRegex: item.phoneNumberRegex || '',
      acceptedMobileMoneyPayments: (item.acceptedMobileMoneyPayments || []).join(', '),
    });
    setError('');
    setModal({ mode: 'edit', item });
  };

  const save = async () => {
    if (!form.name || !form.code || !form.phoneCode) { setError('Name, code and phone code are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        code: form.code.toLowerCase().slice(0, 2),
        acceptedMobileMoneyPayments: form.acceptedMobileMoneyPayments
          ? form.acceptedMobileMoneyPayments.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        currency: form.currency || null,
      };
      if (modal.mode === 'create') {
        await adminClient.post('/countries', { data: payload });
      } else {
        await adminClient.put(`/countries/${modal.item.id}`, { data: payload });
      }
      setModal(null);
      load(pagination.page);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    try {
      await adminClient.delete(`/countries/${deleteTarget.id}`);
      setDeleteTarget(null);
      load(pagination.page);
    } catch (e) { alert(e.message); }
  };

  const columns = [
    { key: 'flag', label: '', width: 40, render: (_, row) => <span className="text-xl">{getFlagEmoji(row.code)}</span> },
    { key: 'name', label: 'Name', render: (v, row) => <div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">{row.code?.toUpperCase()}</div></div> },
    { key: 'phoneCode', label: 'Phone Code', render: v => `+${v}` },
    { key: 'currency', label: 'Currency', render: (v) => v?.code || v || '—' },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', width: 100,
      render: (_, row) => (
        <div className="flex gap-2">
          <Btn size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>Del</Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Countries"
        description="Manage supported countries and their settings"
        action={<Btn onClick={openCreate}>+ Add Country</Btn>}
      />
      <div className="flex gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search countries…" />
      </div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} />

      {/* Create / Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Country' : 'Edit Country'} size="md">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Country Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Zambia" />
          </FormField>
          <FormField label="Code (2 letters)" required>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ZM" maxLength={2} />
          </FormField>
          <FormField label="Phone Code" required>
            <Input value={form.phoneCode} onChange={e => setForm(f => ({ ...f, phoneCode: e.target.value }))} placeholder="260" />
          </FormField>
          <FormField label="Phone Digit Length">
            <Input type="number" value={form.phoneNumberDigitLenth} onChange={e => setForm(f => ({ ...f, phoneNumberDigitLenth: +e.target.value }))} />
          </FormField>
          <FormField label="Currency" className="col-span-2">
            <Select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              <option value="">— Select currency —</option>
              {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Select>
          </FormField>
          <FormField label="Accepted Mobile Money (comma-separated)" className="col-span-2">
            <Input value={form.acceptedMobileMoneyPayments || ''} onChange={e => setForm(f => ({ ...f, acceptedMobileMoneyPayments: e.target.value }))} placeholder="mtn, airtel" />
          </FormField>
          <FormField label="Phone Regex (optional)" className="col-span-2">
            <Input value={form.phoneNumberRegex} onChange={e => setForm(f => ({ ...f, phoneNumberRegex: e.target.value }))} placeholder="^\d{9}$" />
          </FormField>
        </div>
        <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="Active" />
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Delete Country"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect existing users.`}
      />
    </div>
  );
}

function getFlagEmoji(code) {
  if (!code) return '🌍';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}