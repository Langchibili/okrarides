// app/(main)/taxi-types/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Toggle } from '@/components/admin/FormField';

const EMPTY = { name: '', displayOrder: 0, isActive: true };

export default function TaxiTypesPage() {
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
      const res = await adminClient.get('/taxi-types?sort=displayOrder:asc&pagination[pageSize]=100');
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: form.name, displayOrder: +form.displayOrder || 0, isActive: form.isActive };
      if (modal.mode === 'create') {
        await adminClient.post('/taxi-types', { data: payload });
      } else {
        await adminClient.put(`/taxi-types/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'displayOrder', label: '#', width: 50, render: v => <span className="text-gray-400">{v}</span> },
    { key: 'name', label: 'Name', render: v => <span className="font-medium capitalize">{v}</span> },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', width: 120,
      render: (_, row) => (
        <div className="flex gap-2">
          <Btn size="sm" variant="secondary" onClick={() => {
            setForm({ name: row.name, displayOrder: row.displayOrder, isActive: row.isActive });
            setError(''); setModal({ mode: 'edit', item: row });
          }}>Edit</Btn>
          <Btn size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>Del</Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Taxi Types"
        description="Manage vehicle/service types (taxi, bus, motorbike…)"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Type</Btn>}
      />
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No taxi types yet" />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Taxi Type' : 'Edit Taxi Type'} size="sm">
        <FormField label="Name" required>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="taxi" />
        </FormField>
        <FormField label="Display Order">
          <Input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} />
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
          await adminClient.delete(`/taxi-types/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Taxi Type" message={`Delete "${deleteTarget?.name}"? This may affect ride classes linked to it.`}
      />
    </div>
  );
}