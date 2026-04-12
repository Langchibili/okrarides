// app/(main)/affiliate-points-conversions/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select } from '@/components/admin/FormField';

const EMPTY = { affiliatePoints: '', currencyAmount: '', currency: '' };

export default function AffiliatePointsConversionsPage() {
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
      const res = await adminClient.get('/affiliate-points-conversions?pagination[pageSize]=100&populate=currency&sort=affiliatePoints:asc');
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

  const save = async () => {
    if (!form.affiliatePoints || !form.currencyAmount) { setError('Points and currency amount are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { affiliatePoints: parseInt(form.affiliatePoints), currencyAmount: parseFloat(form.currencyAmount), currency: form.currency || null };
      if (modal.mode === 'create') {
        await adminClient.post('/affiliate-points-conversions', { data: payload });
      } else {
        await adminClient.put(`/affiliate-points-conversions/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'affiliatePoints', label: 'Points', render: v => <span className="font-bold text-purple-600">{v} pts</span> },
    { key: 'currencyAmount', label: 'Currency Value', render: (v, row) => <span className="font-bold text-green-600">{row.currency?.symbol || 'K'}{Number(v).toFixed(2)}</span> },
    { key: 'currency', label: 'Currency', render: v => v ? `${v.name} (${v.code})` : <span className="text-gray-400">Default</span> },
    {
      key: 'id', label: 'Rate', width: 120,
      render: (_, row) => {
        const rate = row.currencyAmount / row.affiliatePoints;
        return <span className="text-sm text-gray-500">{row.currency?.symbol || 'K'}{rate.toFixed(4)}/pt</span>;
      }
    },
    {
      key: 'actions', label: '', width: 120,
      render: (_, row) => (
        <div className="flex gap-2">
          <Btn size="sm" variant="secondary" onClick={() => {
            setForm({ affiliatePoints: row.affiliatePoints, currencyAmount: row.currencyAmount, currency: row.currency?.id || '' });
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
        title="Points Conversion Rates"
        description="Define how many affiliate points equal how much currency"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Rate</Btn>}
      />

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
        ℹ️ These conversion rates determine how affiliate points translate into monetary value when drivers/riders redeem them. The global default rate is also set in Admin Settings.
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No conversion rates defined — using global default from Admin Settings" />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Conversion Rate' : 'Edit Conversion Rate'} size="sm">
        <FormField label="Affiliate Points" required hint="Number of points">
          <Input type="number" min="1" value={form.affiliatePoints} onChange={e => setForm(f => ({ ...f, affiliatePoints: e.target.value }))} placeholder="100" />
        </FormField>
        <FormField label="Currency Amount" required hint="Value in the selected currency">
          <Input type="number" step="0.01" value={form.currencyAmount} onChange={e => setForm(f => ({ ...f, currencyAmount: e.target.value }))} placeholder="10.00" />
        </FormField>
        <FormField label="Currency (leave blank for default)">
          <Select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
            <option value="">— Default currency —</option>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </Select>
        </FormField>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/affiliate-points-conversions/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Rate" message={`Delete this conversion rate (${deleteTarget?.affiliatePoints} pts = ${deleteTarget?.currency?.symbol || 'K'}${deleteTarget?.currencyAmount})?`}
      />
    </div>
  );
}