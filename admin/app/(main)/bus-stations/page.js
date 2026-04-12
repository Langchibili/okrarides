// app/(main)/bus-stations/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Textarea, Toggle } from '@/components/admin/FormField';

const EMPTY = { name: '', code: '', address: '', city: '', lat: '', lng: '', isActive: true, description: '' };

export default function BusStationsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'name' });
      const res = await adminClient.get(`/bus-stations${q}&sort=name:asc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  const openEdit = row => {
    setForm({
      name: row.name, code: row.code || '', address: row.address || '', city: row.city || '',
      lat: row.location?.lat || row.lat || '', lng: row.location?.lng || row.lng || '',
      isActive: row.isActive, description: row.description || '',
    });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name) { setError('Station name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name, code: form.code, address: form.address, city: form.city,
        isActive: form.isActive, description: form.description,
        ...(form.lat && form.lng ? { location: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) } } : {}),
      };
      if (modal.mode === 'create') {
        await adminClient.post('/bus-stations', { data: payload });
      } else {
        await adminClient.put(`/bus-stations/${modal.item.id}`, { data: payload });
      }
      setModal(null); load(pagination.page);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: 'code', label: 'Code', render: v => v ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded font-bold">{v}</span> : '—' },
    { key: 'name', label: 'Station Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'city', label: 'City', render: v => v || '—' },
    { key: 'address', label: 'Address', render: v => <span className="text-sm text-gray-500 line-clamp-1">{v || '—'}</span> },
    {
      key: 'location', label: 'Coordinates',
      render: (v, row) => {
        const lat = v?.lat || row.lat;
        const lng = v?.lng || row.lng;
        return lat && lng ? <span className="font-mono text-xs text-gray-500">{Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}</span> : '—';
      }
    },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
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
        title="Bus Stations"
        description="Manage bus pickup and dropoff stations"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Station</Btn>}
      />
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search stations…" /></div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No bus stations defined" />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Station' : 'Edit Station'} size="md">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Station Name" required><Input value={form.name} onChange={set('name')} placeholder="Lusaka City Bus Terminal" /></FormField>
          <FormField label="Code"><Input value={form.code} onChange={set('code')} placeholder="LCT" /></FormField>
          <FormField label="City"><Input value={form.city} onChange={set('city')} placeholder="Lusaka" /></FormField>
          <FormField label="Address"><Input value={form.address} onChange={set('address')} placeholder="Cairo Road, Lusaka" /></FormField>
          <FormField label="Latitude"><Input type="number" step="any" value={form.lat} onChange={set('lat')} placeholder="-15.4167" /></FormField>
          <FormField label="Longitude"><Input type="number" step="any" value={form.lng} onChange={set('lng')} placeholder="28.2833" /></FormField>
          <FormField label="Description" className="col-span-2"><Textarea value={form.description} onChange={set('description')} /></FormField>
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
          await adminClient.delete(`/bus-stations/${deleteTarget.id}`);
          setDeleteTarget(null); load(pagination.page);
        }}
        title="Delete Station" message={`Delete station "${deleteTarget?.name}"?`}
      />
    </div>
  );
}