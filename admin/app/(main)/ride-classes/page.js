// app/(main)/ride-classes/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, SearchBar, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea, Toggle } from '@/components/admin/FormField';

const EMPTY = { name: '', description: '', taxiType: '', baseFare: '', perKmRate: '', perMinuteRate: '', minimumFare: '', commissionPercentage: '', displayOrder: 0, isActive: true };

export default function RideClassesPage() {
  const [data, setData] = useState([]);
  const [taxiTypes, setTaxiTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery({ populate: ['taxiType'], search, searchField: 'name', pageSize: 100 });
      const res = await adminClient.get(`/ride-classes${q}&sort=displayOrder:asc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminClient.get('/taxi-types?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setTaxiTypes(Array.isArray(items) ? items : (items.data || []));
    }).catch(() => {});
  }, []);

  const openEdit = row => {
    setForm({
      name: row.name, description: row.description || '',
      taxiType: row.taxiType?.id || '', baseFare: row.baseFare,
      perKmRate: row.perKmRate, perMinuteRate: row.perMinuteRate,
      minimumFare: row.minimumFare, commissionPercentage: row.commissionPercentage || '',
      displayOrder: row.displayOrder, isActive: row.isActive,
    });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name || !form.baseFare || !form.perKmRate || !form.perMinuteRate || !form.minimumFare) {
      setError('Name and all fare fields are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        taxiType: form.taxiType || null,
        baseFare: parseFloat(form.baseFare),
        perKmRate: parseFloat(form.perKmRate),
        perMinuteRate: parseFloat(form.perMinuteRate),
        minimumFare: parseFloat(form.minimumFare),
        commissionPercentage: form.commissionPercentage ? parseFloat(form.commissionPercentage) : null,
        displayOrder: +form.displayOrder || 0,
      };
      if (modal.mode === 'create') {
        await adminClient.post('/ride-classes', { data: payload });
      } else {
        await adminClient.put(`/ride-classes/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'displayOrder', label: '#', width: 40, render: v => <span className="text-gray-400 text-xs">{v}</span> },
    { key: 'name', label: 'Name', render: (v, row) => <div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">{row.taxiType?.name || '—'}</div></div> },
    { key: 'baseFare', label: 'Base Fare', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'perKmRate', label: 'Per Km', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'perMinuteRate', label: 'Per Min', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'minimumFare', label: 'Min Fare', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'commissionPercentage', label: 'Comm %', render: v => v ? `${v}%` : '—' },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', width: 120,
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
        title="Ride Classes"
        description="Define pricing tiers for rides (OkraGo, OkraXL, etc.)"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Class</Btn>}
      />
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search classes…" /></div>
      <DataTable columns={columns} data={data} loading={loading} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Ride Class' : 'Edit Ride Class'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="OkraGo" />
          </FormField>
          <FormField label="Taxi Type">
            <Select value={form.taxiType} onChange={e => setForm(f => ({ ...f, taxiType: e.target.value }))}>
              <option value="">— All types —</option>
              {taxiTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Description" className="col-span-2">
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Base Fare (K)" required>
            <Input type="number" step="0.01" value={form.baseFare} onChange={e => setForm(f => ({ ...f, baseFare: e.target.value }))} />
          </FormField>
          <FormField label="Per KM Rate (K)" required>
            <Input type="number" step="0.01" value={form.perKmRate} onChange={e => setForm(f => ({ ...f, perKmRate: e.target.value }))} />
          </FormField>
          <FormField label="Per Minute Rate (K)" required>
            <Input type="number" step="0.01" value={form.perMinuteRate} onChange={e => setForm(f => ({ ...f, perMinuteRate: e.target.value }))} />
          </FormField>
          <FormField label="Minimum Fare (K)" required>
            <Input type="number" step="0.01" value={form.minimumFare} onChange={e => setForm(f => ({ ...f, minimumFare: e.target.value }))} />
          </FormField>
          <FormField label="Commission % (override)">
            <Input type="number" step="0.1" value={form.commissionPercentage} onChange={e => setForm(f => ({ ...f, commissionPercentage: e.target.value }))} placeholder="Leave blank for global default" />
          </FormField>
          <FormField label="Display Order">
            <Input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} />
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
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/ride-classes/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Ride Class" message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
}