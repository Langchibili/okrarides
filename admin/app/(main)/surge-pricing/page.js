// app/(main)/surge-pricing/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Textarea, Toggle } from '@/components/admin/FormField';

const EMPTY = { reason: '', multiplier: 1.5, startTime: '', endTime: '', isActive: false };

export default function SurgePricingPage() {
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
      const res = await adminClient.get('/surge-pricings?sort=startTime:desc&pagination[pageSize]=50');
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = row => {
    setForm({
      reason: row.reason || '',
      multiplier: row.multiplier || 1.5,
      startTime: row.startTime ? row.startTime.slice(0, 16) : '',
      endTime: row.endTime ? row.endTime.slice(0, 16) : '',
      isActive: row.isActive,
    });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.reason || !form.multiplier || !form.startTime || !form.endTime) {
      setError('Reason, multiplier, start and end times are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = { ...form, multiplier: parseFloat(form.multiplier) };
      if (modal.mode === 'create') {
        await adminClient.post('/surge-pricings', { data: payload });
      } else {
        await adminClient.put(`/surge-pricings/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const isActive = row => {
    const now = new Date();
    return row.isActive && new Date(row.startTime) <= now && new Date(row.endTime) >= now;
  };

  const columns = [
    { key: 'reason', label: 'Reason', render: v => <span className="font-medium">{v}</span> },
    {
      key: 'multiplier', label: 'Multiplier',
      render: v => <span className={`font-bold text-lg ${Number(v) > 1.5 ? 'text-red-600' : 'text-orange-500'}`}>×{v}</span>
    },
    { key: 'startTime', label: 'Start', render: v => v ? new Date(v).toLocaleString() : '—' },
    { key: 'endTime', label: 'End', render: v => v ? new Date(v).toLocaleString() : '—' },
    {
      key: 'isActive', label: 'Status',
      render: (v, row) => isActive(row)
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">🔥 Live</span>
        : <StatusBadge status={v ? 'active' : 'inactive'} />
    },
    {
      key: 'id', label: '', width: 120,
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
        title="Surge Pricing"
        description="Configure time-based fare multipliers for peak demand periods"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ New Surge Period</Btn>}
      />
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No surge pricing periods defined" />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'New Surge Period' : 'Edit Surge Period'} size="md">
        <FormField label="Reason / Label" required hint="e.g. Rush Hour, New Year's Eve, Rain Surge">
          <Input value={form.reason} onChange={set('reason')} placeholder="Rush Hour" />
        </FormField>
        <FormField label="Multiplier" required hint="1.5 = 50% more expensive, 2.0 = double">
          <Input type="number" step="0.1" min="1.0" max="5.0" value={form.multiplier} onChange={set('multiplier')} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Time" required><Input type="datetime-local" value={form.startTime} onChange={set('startTime')} /></FormField>
          <FormField label="End Time" required><Input type="datetime-local" value={form.endTime} onChange={set('endTime')} /></FormField>
        </div>
        <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="Enabled" />
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/surge-pricings/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Surge Period" message={`Delete surge period "${deleteTarget?.reason}"?`}
      />
    </div>
  );
}