// app/(main)/cancellation-reasons/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Toggle } from '@/components/admin/FormField';

const EMPTY = { reason: '', code: '', applicableFor: 'both', requiresExplanation: false, hasFee: false, feeAmount: '', feePercentage: '', isActive: true, displayOrder: 0 };

export default function CancellationReasonsPage() {
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
      const res = await adminClient.get('/cancellation-reasons?sort=displayOrder:asc&pagination[pageSize]=100');
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = row => {
    setForm({ reason: row.reason, code: row.code, applicableFor: row.applicableFor, requiresExplanation: row.requiresExplanation, hasFee: row.hasFee, feeAmount: row.feeAmount || '', feePercentage: row.feePercentage || '', isActive: row.isActive, displayOrder: row.displayOrder });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.reason || !form.code || !form.applicableFor) { setError('Reason, code and applicable-for are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        code: form.code.replace(/\s/g, '_').toUpperCase(),
        feeAmount: form.feeAmount ? parseFloat(form.feeAmount) : null,
        feePercentage: form.feePercentage ? parseFloat(form.feePercentage) : null,
        displayOrder: +form.displayOrder || 0,
      };
      if (modal.mode === 'create') {
        await adminClient.post('/cancellation-reasons', { data: payload });
      } else {
        await adminClient.put(`/cancellation-reasons/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: 'displayOrder', label: '#', width: 40, render: v => <span className="text-gray-400 text-xs">{v}</span> },
    { key: 'reason', label: 'Reason', render: (v, row) => <div><div className="font-medium">{v}</div><div className="font-mono text-xs text-gray-400">{row.code}</div></div> },
    { key: 'applicableFor', label: 'For', render: v => <StatusBadge status={v} customColors={{ rider: 'bg-blue-100 text-blue-700', driver: 'bg-orange-100 text-orange-700', both: 'bg-purple-100 text-purple-700' }} /> },
    { key: 'hasFee', label: 'Has Fee', render: (v, row) => v ? <span className="text-sm text-orange-600">{row.feeAmount ? `K${row.feeAmount}` : `${row.feePercentage}%`}</span> : <span className="text-gray-400">—</span> },
    { key: 'requiresExplanation', label: 'Needs Explanation', render: v => v ? '✓' : '—' },
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
        title="Cancellation Reasons"
        description="Define reasons riders and drivers can give when cancelling"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Reason</Btn>}
      />
      <DataTable columns={columns} data={data} loading={loading} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Reason' : 'Edit Reason'} size="md">
        <FormField label="Reason Text" required><Input value={form.reason} onChange={set('reason')} placeholder="Driver too far away" /></FormField>
        <FormField label="Code (unique)" required hint="e.g. DRIVER_TOO_FAR — spaces become underscores">
          <Input value={form.code} onChange={set('code')} placeholder="DRIVER_TOO_FAR" />
        </FormField>
        <FormField label="Applicable For" required>
          <Select value={form.applicableFor} onChange={set('applicableFor')}>
            <option value="rider">Rider only</option>
            <option value="driver">Driver only</option>
            <option value="both">Both</option>
          </Select>
        </FormField>
        <div className="flex gap-6 mb-4">
          <Toggle checked={form.requiresExplanation} onChange={v => setForm(f => ({ ...f, requiresExplanation: v }))} label="Requires Explanation" />
          <Toggle checked={form.hasFee} onChange={v => setForm(f => ({ ...f, hasFee: v }))} label="Has Cancellation Fee" />
          <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="Active" />
        </div>
        {form.hasFee && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fee Amount (K)"><Input type="number" step="0.01" value={form.feeAmount} onChange={set('feeAmount')} /></FormField>
            <FormField label="Fee Percentage (%)"><Input type="number" step="0.1" value={form.feePercentage} onChange={set('feePercentage')} /></FormField>
          </div>
        )}
        <FormField label="Display Order"><Input type="number" value={form.displayOrder} onChange={set('displayOrder')} /></FormField>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/cancellation-reasons/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Reason" message={`Delete "${deleteTarget?.reason}"?`}
      />
    </div>
  );
}