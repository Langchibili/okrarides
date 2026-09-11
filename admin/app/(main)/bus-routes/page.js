// app/(main)/bus-routes/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea, Toggle } from '@/components/admin/FormField';

const EMPTY = { name: '', routeCode: '', startStation: '', endStation: '', distance: '', estimatedDuration: '', baseFare: '', isActive: true, description: '' };

export default function BusRoutesPage() {
  const [data, setData] = useState([]);
  const [stations, setStations] = useState([]);
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
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'name', populate: ['startStation', 'endStation'] });
      const res = await adminClient.get(`/bus-routes${q}&sort=routeCode:asc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => {
    adminClient.get('/bus-stations?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setStations(Array.isArray(items) ? items : (items.data || []));
    }).catch(() => {});
  }, []);

  const openEdit = row => {
    setForm({
      name: row.name, routeCode: row.routeCode || '', description: row.description || '',
      startStation: row.startStation?.id || '', endStation: row.endStation?.id || '',
      distance: row.distance || '', estimatedDuration: row.estimatedDuration || '',
      baseFare: row.baseFare || '', isActive: row.isActive,
    });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name) { setError('Route name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name, routeCode: form.routeCode, description: form.description, isActive: form.isActive,
        startStation: form.startStation || null, endStation: form.endStation || null,
        distance: form.distance ? parseFloat(form.distance) : null,
        estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration) : null,
        baseFare: form.baseFare ? parseFloat(form.baseFare) : null,
      };
      if (modal.mode === 'create') {
        await adminClient.post('/bus-routes', { data: payload });
      } else {
        await adminClient.put(`/bus-routes/${modal.item.id}`, { data: payload });
      }
      setModal(null); load(pagination.page);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const columns = [
    { key: 'routeCode', label: 'Code', render: v => <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded font-bold">{v || '—'}</span> },
    { key: 'name', label: 'Route Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'startStation', label: 'From', render: v => v?.name || '—' },
    { key: 'endStation', label: 'To', render: v => v?.name || '—' },
    { key: 'distance', label: 'Distance', render: v => v ? `${v} km` : '—' },
    { key: 'estimatedDuration', label: 'Duration', render: v => v ? `${v} min` : '—' },
    { key: 'baseFare', label: 'Base Fare', render: v => v ? `K${Number(v).toFixed(2)}` : '—' },
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
        title="Bus Routes"
        description="Configure bus routes with start/end stations and fares"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Route</Btn>}
      />
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search routes…" /></div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No bus routes defined" />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Bus Route' : 'Edit Route'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Route Name" required><Input value={form.name} onChange={set('name')} placeholder="Lusaka – Ndola Express" /></FormField>
          <FormField label="Route Code"><Input value={form.routeCode} onChange={set('routeCode')} placeholder="LUS-NDO-01" /></FormField>
          <FormField label="Start Station">
            <Select value={form.startStation} onChange={set('startStation')}>
              <option value="">— Select station —</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
          <FormField label="End Station">
            <Select value={form.endStation} onChange={set('endStation')}>
              <option value="">— Select station —</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Distance (km)"><Input type="number" step="0.1" value={form.distance} onChange={set('distance')} /></FormField>
          <FormField label="Est. Duration (minutes)"><Input type="number" value={form.estimatedDuration} onChange={set('estimatedDuration')} /></FormField>
          <FormField label="Base Fare (K)"><Input type="number" step="0.01" value={form.baseFare} onChange={set('baseFare')} /></FormField>
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
          await adminClient.delete(`/bus-routes/${deleteTarget.id}`);
          setDeleteTarget(null); load(pagination.page);
        }}
        title="Delete Bus Route" message={`Delete route "${deleteTarget?.name}"?`}
      />
    </div>
  );
}