// app/(main)/affiliate-points-types/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea, Toggle } from '@/components/admin/FormField';

const EVENT_TYPES = [
  'onRideCompletion','onRideBooking','onDeliveryCompletion','onDeliveryBooking',
  'onReferralSignup','onFirstRideAsRider','onFirstRideAsDriver','onFirstDelivery',
];
const REWARD_TYPES = ['flat','percentage'];
const EMPTY = { name: '', eventType: 'onRideCompletion', rewardType: 'flat', value: '', isEnabled: true, description: '' };

export default function AffiliatePointsTypesPage() {
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
      const res = await adminClient.get('/affiliate-points-types?pagination[pageSize]=100&sort=eventType:asc');
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = row => {
    setForm({ name: row.name, eventType: row.eventType, rewardType: row.rewardType, value: row.value, isEnabled: row.isEnabled, description: row.description || '' });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name || !form.eventType || !form.rewardType || !form.value) { setError('All fields are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, value: parseFloat(form.value) };
      if (modal.mode === 'create') {
        await adminClient.post('/affiliate-points-types', { data: payload });
      } else {
        await adminClient.put(`/affiliate-points-types/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const EVENT_LABELS = {
    onRideCompletion: '🚗 Ride Completed',
    onRideBooking: '📱 Ride Booked',
    onDeliveryCompletion: '📦 Delivery Completed',
    onDeliveryBooking: '📦 Delivery Booked',
    onReferralSignup: '👤 Referral Signup',
    onFirstRideAsRider: '🎉 First Ride (Rider)',
    onFirstRideAsDriver: '🎉 First Ride (Driver)',
    onFirstDelivery: '🎉 First Delivery',
  };

  const columns = [
    { key: 'name', label: 'Rule Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'eventType', label: 'Event', render: v => <span className="text-sm">{EVENT_LABELS[v] || v}</span> },
    { key: 'rewardType', label: 'Type', render: v => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v === 'flat' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{v}</span> },
    { key: 'value', label: 'Value', render: (v, row) => row.rewardType === 'flat' ? <span className="font-semibold">{v} pts</span> : <span className="font-semibold">{v}% of fare</span> },
    { key: 'isEnabled', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
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
        title="Affiliate Points Rules"
        description="Configure how affiliate points are awarded for different platform events"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Rule</Btn>}
      />
      <DataTable columns={columns} data={data} loading={loading} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Points Rule' : 'Edit Points Rule'} size="md">
        <FormField label="Rule Name" required><Input value={form.name} onChange={set('name')} placeholder="Ride Completion Flat Bonus" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Event Type" required>
            <Select value={form.eventType} onChange={set('eventType')}>
              {EVENT_TYPES.map(e => <option key={e} value={e}>{EVENT_LABELS[e] || e}</option>)}
            </Select>
          </FormField>
          <FormField label="Reward Type" required>
            <Select value={form.rewardType} onChange={set('rewardType')}>
              {REWARD_TYPES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField label={form.rewardType === 'flat' ? 'Points (fixed amount)' : 'Percentage of fare → points'} required>
          <Input type="number" step="0.01" value={form.value} onChange={set('value')} placeholder={form.rewardType === 'flat' ? '10' : '5'} />
        </FormField>
        <FormField label="Description">
          <Textarea value={form.description} onChange={set('description')} placeholder="Admin notes about this rule…" />
        </FormField>
        <Toggle checked={form.isEnabled} onChange={v => setForm(f => ({ ...f, isEnabled: v }))} label="Enabled" />
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/affiliate-points-types/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Rule" message={`Delete rule "${deleteTarget?.name}"?`}
      />
    </div>
  );
}