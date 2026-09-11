// app/(main)/geofence-zones/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea, Toggle } from '@/components/admin/FormField';

const ZONE_TYPES = ['city','airport','suburb','restricted','surge','no_go'];
const EMPTY = { name: '', zoneType: 'city', country: '', description: '', isActive: true, surgePricing: false, surgeMultiplier: 1, coordinates: '' };

export default function GeofenceZonesPage() {
  const [data, setData] = useState([]);
  const [countries, setCountries] = useState([]);
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
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'name', populate: ['country'] });
      const res = await adminClient.get(`/geofence-zones${q}&sort=name:asc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => {
    adminClient.get('/countries?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setCountries(Array.isArray(items) ? items : (items.data || []));
    }).catch(() => {});
  }, []);

  const openEdit = row => {
    setForm({
      name: row.name, zoneType: row.zoneType || 'city', country: row.country?.id || '',
      description: row.description || '', isActive: row.isActive, surgePricing: row.surgePricing || false,
      surgeMultiplier: row.surgeMultiplier || 1,
      coordinates: row.coordinates ? JSON.stringify(row.coordinates, null, 2) : '',
    });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name || !form.zoneType) { setError('Name and zone type are required.'); return; }
    setSaving(true); setError('');
    try {
      let coords = null;
      if (form.coordinates.trim()) {
        try { coords = JSON.parse(form.coordinates); } catch { setError('Invalid JSON coordinates.'); setSaving(false); return; }
      }
      const payload = {
        name: form.name, zoneType: form.zoneType, isActive: form.isActive,
        description: form.description, country: form.country || null,
        surgePricing: form.surgePricing, surgeMultiplier: parseFloat(form.surgeMultiplier) || 1,
        coordinates: coords,
      };
      if (modal.mode === 'create') {
        await adminClient.post('/geofence-zones', { data: payload });
      } else {
        await adminClient.put(`/geofence-zones/${modal.item.id}`, { data: payload });
      }
      setModal(null); load(pagination.page);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const ZONE_COLORS = { city: 'bg-blue-100 text-blue-700', airport: 'bg-purple-100 text-purple-700', suburb: 'bg-green-100 text-green-700', restricted: 'bg-red-100 text-red-700', surge: 'bg-orange-100 text-orange-700', no_go: 'bg-red-200 text-red-800' };

  const columns = [
    { key: 'name', label: 'Zone', render: (v, row) => <div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">{row.country?.name || '—'}</div></div> },
    { key: 'zoneType', label: 'Type', render: v => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ZONE_COLORS[v] || 'bg-gray-100 text-gray-600'}`}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'surgePricing', label: 'Surge', render: (v, row) => v ? <span className="text-orange-600 font-medium">×{row.surgeMultiplier}</span> : '—' },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: 'coordinates', label: 'Has Coordinates', render: v => v ? '✓' : '—' },
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
        title="Geofence Zones"
        description="Define geographic zones for service areas, surge pricing and restrictions"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Zone</Btn>}
      />
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search zones…" /></div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Geofence Zone' : 'Edit Zone'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Zone Name" required><Input value={form.name} onChange={set('name')} placeholder="Lusaka CBD" /></FormField>
          <FormField label="Zone Type" required>
            <Select value={form.zoneType} onChange={set('zoneType')}>
              {ZONE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</option>)}
            </Select>
          </FormField>
          <FormField label="Country">
            <Select value={form.country} onChange={set('country')}>
              <option value="">— None —</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Surge Multiplier (if surge zone)">
            <Input type="number" step="0.1" min="1" value={form.surgeMultiplier} onChange={set('surgeMultiplier')} disabled={!form.surgePricing} />
          </FormField>
          <FormField label="Description" className="col-span-2">
            <Textarea value={form.description} onChange={set('description')} />
          </FormField>
          <FormField label="Coordinates (GeoJSON, optional)" className="col-span-2" hint='Paste a GeoJSON polygon e.g. [[lng, lat], …]'>
            <Textarea value={form.coordinates} onChange={set('coordinates')} rows={4} className="font-mono text-xs" />
          </FormField>
        </div>
        <div className="flex gap-6 mt-3">
          <Toggle checked={form.surgePricing} onChange={v => setForm(f => ({ ...f, surgePricing: v }))} label="Surge Pricing Zone" />
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
          await adminClient.delete(`/geofence-zones/${deleteTarget.id}`);
          setDeleteTarget(null); load(pagination.page);
        }}
        title="Delete Zone" message={`Delete zone "${deleteTarget?.name}"?`}
      />
    </div>
  );
}