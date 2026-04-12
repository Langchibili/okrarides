// app/(main)/subscription-plans/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea, Toggle } from '@/components/admin/FormField';

const EMPTY = {
  planId: '', name: '', description: '', price: '',
  durationType: 'monthly', durationValue: 1,
  maxRidesPerDay: '', maxRidesPerPeriod: '',
  hasFreeTrial: false, freeTrialDays: 0,
  isActive: true, isPopular: false, displayOrder: 0,
  features: '',
};

export default function SubscriptionPlansPage() {
  const [data, setData] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminClient.get('/subscription-plans?sort=displayOrder:asc&pagination[pageSize]=100&populate=currency');
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminClient.get('/currencies?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setCurrencies(Array.isArray(items) ? items : (items.data || []));
    }).catch(() => {});
  }, []);

  const openEdit = row => {
    setForm({
      planId: row.planId, name: row.name, description: row.description || '',
      price: row.price, durationType: row.durationType, durationValue: row.durationValue,
      maxRidesPerDay: row.maxRidesPerDay || '', maxRidesPerPeriod: row.maxRidesPerPeriod || '',
      hasFreeTrial: row.hasFreeTrial, freeTrialDays: row.freeTrialDays || 0,
      isActive: row.isActive, isPopular: row.isPopular,
      displayOrder: row.displayOrder,
      features: Array.isArray(row.features) ? row.features.join('\n') : '',
      currency: row.currency?.id || '',
    });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name || !form.price || !form.durationType) { setError('Name, price and duration are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        planId: form.planId || `PLAN-${Date.now()}`,
        price: parseFloat(form.price),
        durationValue: +form.durationValue || 1,
        maxRidesPerDay: form.maxRidesPerDay ? +form.maxRidesPerDay : null,
        maxRidesPerPeriod: form.maxRidesPerPeriod ? +form.maxRidesPerPeriod : null,
        freeTrialDays: +form.freeTrialDays || 0,
        displayOrder: +form.displayOrder || 0,
        currency: form.currency || null,
        features: form.features ? form.features.split('\n').map(s => s.trim()).filter(Boolean) : [],
      };
      if (modal.mode === 'create') {
        await adminClient.post('/subscription-plans', { data: payload });
      } else {
        await adminClient.put(`/subscription-plans/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: 'isPopular', label: '', width: 30, render: v => v ? '⭐' : '' },
    { key: 'name', label: 'Plan', render: (v, row) => <div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">{row.planId}</div></div> },
    { key: 'price', label: 'Price', render: (v, row) => `${row.currency?.symbol || 'K'}${Number(v).toFixed(2)}` },
    { key: 'durationType', label: 'Duration', render: (v, row) => `${row.durationValue} ${v}` },
    { key: 'hasFreeTrial', label: 'Trial', render: (v, row) => v ? `${row.freeTrialDays}d` : '—' },
    { key: 'maxRidesPerDay', label: 'Max/Day', render: v => v || '∞' },
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
        title="Subscription Plans"
        description="Configure driver subscription plans and pricing"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ New Plan</Btn>}
      />
      <DataTable columns={columns} data={data} loading={loading} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Create Plan' : 'Edit Plan'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Plan ID (auto-generated if blank)">
            <Input value={form.planId} onChange={set('planId')} placeholder="MONTHLY-BASIC" />
          </FormField>
          <FormField label="Plan Name" required><Input value={form.name} onChange={set('name')} placeholder="Monthly Basic" /></FormField>
          <FormField label="Description" className="col-span-2">
            <Textarea value={form.description} onChange={set('description')} />
          </FormField>
          <FormField label="Price" required><Input type="number" step="0.01" value={form.price} onChange={set('price')} /></FormField>
          <FormField label="Currency">
            <Select value={form.currency || ''} onChange={set('currency')}>
              <option value="">— Default —</option>
              {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Select>
          </FormField>
          <FormField label="Duration Type" required>
            <Select value={form.durationType} onChange={set('durationType')}>
              {['daily','weekly','monthly','yearly'].map(v => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FormField>
          <FormField label="Duration Value"><Input type="number" min="1" value={form.durationValue} onChange={set('durationValue')} /></FormField>
          <FormField label="Max Rides / Day (blank = unlimited)"><Input type="number" value={form.maxRidesPerDay} onChange={set('maxRidesPerDay')} /></FormField>
          <FormField label="Max Rides / Period (blank = unlimited)"><Input type="number" value={form.maxRidesPerPeriod} onChange={set('maxRidesPerPeriod')} /></FormField>
          <FormField label="Features (one per line)" className="col-span-2">
            <Textarea value={form.features} onChange={set('features')} rows={4} placeholder="Unlimited rides&#10;Zero commission&#10;Priority support" />
          </FormField>
          <FormField label="Free Trial Days (0 = no trial)"><Input type="number" min="0" value={form.freeTrialDays} onChange={set('freeTrialDays')} /></FormField>
          <FormField label="Display Order"><Input type="number" value={form.displayOrder} onChange={set('displayOrder')} /></FormField>
        </div>
        <div className="flex gap-6 mt-3">
          <Toggle checked={form.hasFreeTrial} onChange={v => setForm(f => ({ ...f, hasFreeTrial: v }))} label="Has Free Trial" />
          <Toggle checked={form.isPopular} onChange={v => setForm(f => ({ ...f, isPopular: v }))} label="Popular / Featured" />
          <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} label="Active" />
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/subscription-plans/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Plan" message={`Delete plan "${deleteTarget?.name}"? Existing subscriptions will not be affected.`}
      />
    </div>
  );
}