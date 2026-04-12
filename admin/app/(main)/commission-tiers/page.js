// app/(main)/commission-tiers/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Toggle } from '@/components/admin/FormField';

const EMPTY = { name: '', minFare: '', maxFare: '', commissionPercentage: '', commissionFlat: '', taxiType: '', rideClass: '', isActive: true, displayOrder: 0 };

export default function CommissionTiersPage() {
  const [data, setData] = useState([]);
  const [taxiTypes, setTaxiTypes] = useState([]);
  const [rideClasses, setRideClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminClient.get('/commission-tiers?sort=displayOrder:asc&pagination[pageSize]=100&populate=taxiType,rideClass');
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminClient.get('/taxi-types?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setTaxiTypes(Array.isArray(items) ? items : (items.data || []));
    }).catch(() => {});
    adminClient.get('/ride-classes?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setRideClasses(Array.isArray(items) ? items : (items.data || []));
    }).catch(() => {});
  }, []);

  const openEdit = row => {
    setForm({ name: row.name, minFare: row.minFare, maxFare: row.maxFare || '', commissionPercentage: row.commissionPercentage || '', commissionFlat: row.commissionFlat || '', taxiType: row.taxiType?.id || '', rideClass: row.rideClass?.id || '', isActive: row.isActive, displayOrder: row.displayOrder });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name || !form.minFare) { setError('Name and minimum fare are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name, isActive: form.isActive, displayOrder: +form.displayOrder || 0,
        minFare: parseFloat(form.minFare),
        maxFare: form.maxFare ? parseFloat(form.maxFare) : null,
        commissionPercentage: form.commissionPercentage ? parseFloat(form.commissionPercentage) : null,
        commissionFlat: form.commissionFlat ? parseFloat(form.commissionFlat) : null,
        taxiType: form.taxiType || null,
        rideClass: form.rideClass || null,
      };
      if (modal.mode === 'create') {
        await adminClient.post('/commission-tiers', { data: payload });
      } else {
        await adminClient.put(`/commission-tiers/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: 'name', label: 'Tier Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'minFare', label: 'Min Fare', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'maxFare', label: 'Max Fare', render: v => v ? `K${Number(v).toFixed(2)}` : '∞' },
    { key: 'commissionPercentage', label: 'Commission %', render: v => v ? `${v}%` : '—' },
    { key: 'commissionFlat', label: 'Flat Fee', render: v => v ? `K${v}` : '—' },
    { key: 'taxiType', label: 'Type', render: v => v?.name || <span className="text-gray-400">Any</span> },
    { key: 'rideClass', label: 'Class', render: v => v?.name || <span className="text-gray-400">Any</span> },
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
        title="Commission Tiers"
        description="Tiered commission rates based on fare ranges, vehicle types and ride classes"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Tier</Btn>}
      />
      <DataTable columns={columns} data={data} loading={loading} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Commission Tier' : 'Edit Commission Tier'} size="md">
        <FormField label="Tier Name" required><Input value={form.name} onChange={set('name')} placeholder="Standard Low Fare" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Min Fare (K)" required><Input type="number" step="0.01" value={form.minFare} onChange={set('minFare')} /></FormField>
          <FormField label="Max Fare (K, blank = unlimited)"><Input type="number" step="0.01" value={form.maxFare} onChange={set('maxFare')} /></FormField>
          <FormField label="Commission %"><Input type="number" step="0.1" value={form.commissionPercentage} onChange={set('commissionPercentage')} /></FormField>
          <FormField label="Flat Commission (K)"><Input type="number" step="0.01" value={form.commissionFlat} onChange={set('commissionFlat')} /></FormField>
          <FormField label="Taxi Type (optional)">
            <Select value={form.taxiType} onChange={set('taxiType')}>
              <option value="">— Any —</option>
              {taxiTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Ride Class (optional)">
            <Select value={form.rideClass} onChange={set('rideClass')}>
              <option value="">— Any —</option>
              {rideClasses.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
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
          await adminClient.delete(`/commission-tiers/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Tier" message={`Delete tier "${deleteTarget?.name}"?`}
      />
    </div>
  );
}