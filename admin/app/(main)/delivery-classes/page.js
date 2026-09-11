// app/(main)/delivery-classes/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Textarea, Toggle } from '@/components/admin/FormField';

const EMPTY = { name: '', description: '', maxWeightKg: '', baseFare: '', perKmRate: '', perMinuteRate: '', minimumFare: '', extraWeightCharge: '', extraChargeForFragileItem: 10, commissionPercentage: '', displayOrder: 0, isActive: true };

export default function DeliveryClassesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminClient.get('/delivery-classes?sort=displayOrder:asc&pagination[pageSize]=100');
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = row => {
    setForm({ name: row.name, description: row.description || '', maxWeightKg: row.maxWeightKg, baseFare: row.baseFare, perKmRate: row.perKmRate, perMinuteRate: row.perMinuteRate || '', minimumFare: row.minimumFare, extraWeightCharge: row.extraWeightCharge || '', extraChargeForFragileItem: row.extraChargeForFragileItem || 10, commissionPercentage: row.commissionPercentage || '', displayOrder: row.displayOrder, isActive: row.isActive });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const f = (k, type = 'text') => e => setForm(prev => ({ ...prev, [k]: type === 'number' ? e.target.value : e.target.value }));

  const save = async () => {
    if (!form.name || !form.baseFare || !form.perKmRate || !form.minimumFare || !form.maxWeightKg) {
      setError('Name, max weight, and all fare fields are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name, description: form.description, isActive: form.isActive,
        displayOrder: +form.displayOrder || 0,
        maxWeightKg: parseFloat(form.maxWeightKg),
        baseFare: parseFloat(form.baseFare),
        perKmRate: parseFloat(form.perKmRate),
        perMinuteRate: form.perMinuteRate ? parseFloat(form.perMinuteRate) : null,
        minimumFare: parseFloat(form.minimumFare),
        extraWeightCharge: form.extraWeightCharge ? parseFloat(form.extraWeightCharge) : null,
        extraChargeForFragileItem: parseFloat(form.extraChargeForFragileItem) || 10,
        commissionPercentage: form.commissionPercentage ? parseFloat(form.commissionPercentage) : null,
      };
      if (modal.mode === 'create') {
        await adminClient.post('/delivery-classes', { data: payload });
      } else {
        await adminClient.put(`/delivery-classes/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'displayOrder', label: '#', width: 40, render: v => <span className="text-gray-400 text-xs">{v}</span> },
    { key: 'name', label: 'Class', render: (v, row) => <div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">Max {row.maxWeightKg}kg</div></div> },
    { key: 'baseFare', label: 'Base', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'perKmRate', label: '/km', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'minimumFare', label: 'Min', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'extraChargeForFragileItem', label: 'Fragile +', render: v => `K${Number(v || 0).toFixed(2)}` },
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
        title="Delivery Classes"
        description="Define delivery tiers — standard, midsize, big, large, etc."
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Class</Btn>}
      />
      <DataTable columns={columns} data={data} loading={loading} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Delivery Class' : 'Edit Delivery Class'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" required><Input value={form.name} onChange={f('name')} placeholder="standard" /></FormField>
          <FormField label="Max Weight (kg)" required><Input type="number" step="0.1" value={form.maxWeightKg} onChange={f('maxWeightKg')} /></FormField>
          <FormField label="Description" className="col-span-2">
            <Textarea value={form.description} onChange={f('description')} />
          </FormField>
          <FormField label="Base Fare (K)" required><Input type="number" step="0.01" value={form.baseFare} onChange={f('baseFare')} /></FormField>
          <FormField label="Per KM Rate (K)" required><Input type="number" step="0.01" value={form.perKmRate} onChange={f('perKmRate')} /></FormField>
          <FormField label="Per Minute Rate (K)"><Input type="number" step="0.01" value={form.perMinuteRate} onChange={f('perMinuteRate')} /></FormField>
          <FormField label="Minimum Fare (K)" required><Input type="number" step="0.01" value={form.minimumFare} onChange={f('minimumFare')} /></FormField>
          <FormField label="Extra Weight Charge (K/kg)"><Input type="number" step="0.01" value={form.extraWeightCharge} onChange={f('extraWeightCharge')} /></FormField>
          <FormField label="Fragile Item Surcharge (K)"><Input type="number" step="0.01" value={form.extraChargeForFragileItem} onChange={f('extraChargeForFragileItem')} /></FormField>
          <FormField label="Commission % (override)"><Input type="number" step="0.1" value={form.commissionPercentage} onChange={f('commissionPercentage')} /></FormField>
          <FormField label="Display Order"><Input type="number" value={form.displayOrder} onChange={f('displayOrder')} /></FormField>
        </div>
        <Toggle checked={form.isActive} onChange={v => setForm(frm => ({ ...frm, isActive: v }))} label="Active" />
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/delivery-classes/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Delivery Class" message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
}