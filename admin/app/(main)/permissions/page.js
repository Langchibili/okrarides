// app/(main)/permissions/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, SearchBar, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea } from '@/components/admin/FormField';

const CATEGORIES = ['users','drivers','riders','rides','vehicles','subscriptions','finance','settings','reports','support','affiliates','deliveries','notifications','audit'];
const EMPTY = { name: '', code: '', category: 'users', description: '' };

export default function PermissionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admn-user-permissions?pagination[pageSize]=200&sort=category:asc,code:asc';
      if (filterCat) url += `&filters[category][$eq]=${filterCat}`;
      if (search) url += `&filters[name][$containsi]=${encodeURIComponent(search)}`;
      const res = await adminClient.get(url);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterCat]);

  useEffect(() => { load(); }, [load]);

  const openEdit = row => {
    setForm({ name: row.name, code: row.code, category: row.category, description: row.description || '' });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name || !form.code || !form.category) { setError('Name, code and category are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, code: form.code.replace(/\s/g, '_').toLowerCase() };
      if (modal.mode === 'create') {
        await adminClient.post('/admn-user-permissions', { data: payload });
      } else {
        await adminClient.put(`/admn-user-permissions/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const CAT_COLORS = {
    users: 'bg-blue-100 text-blue-700', drivers: 'bg-orange-100 text-orange-700',
    riders: 'bg-green-100 text-green-700', rides: 'bg-purple-100 text-purple-700',
    vehicles: 'bg-gray-100 text-gray-700', subscriptions: 'bg-indigo-100 text-indigo-700',
    finance: 'bg-yellow-100 text-yellow-700', settings: 'bg-red-100 text-red-700',
    reports: 'bg-cyan-100 text-cyan-700', support: 'bg-pink-100 text-pink-700',
    affiliates: 'bg-teal-100 text-teal-700', deliveries: 'bg-amber-100 text-amber-700',
    notifications: 'bg-violet-100 text-violet-700', audit: 'bg-slate-100 text-slate-700',
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = data.filter(d => d.category === cat);
    if (items.length || cat === filterCat) acc[cat] = items;
    return acc;
  }, {});

  const columns = [
    { key: 'name', label: 'Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'code', label: 'Code', render: v => <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{v}</span> },
    { key: 'category', label: 'Category', render: v => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CAT_COLORS[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span> },
    { key: 'description', label: 'Description', render: v => <span className="text-sm text-gray-500">{v || '—'}</span> },
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
        title="Admin User Permissions"
        description="Manage permission codes used to control admin panel access"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Permission</Btn>}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search permissions…" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Category-grouped view */}
      {!search && !filterCat ? (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const items = data.filter(d => d.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${CAT_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}>{cat}</span>
                  <span className="text-xs text-gray-400">{items.length} permission{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 w-52 shrink-0">{item.code}</span>
                      <span className="font-medium text-sm text-gray-800 flex-1">{item.name}</span>
                      <span className="text-sm text-gray-400 flex-1">{item.description}</span>
                      <div className="flex gap-2">
                        <Btn size="sm" variant="secondary" onClick={() => openEdit(item)}>Edit</Btn>
                        <Btn size="sm" variant="danger" onClick={() => setDeleteTarget(item)}>Del</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="No permissions found" />
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Permission' : 'Edit Permission'} size="sm">
        <FormField label="Permission Name" required><Input value={form.name} onChange={set('name')} placeholder="View Drivers" /></FormField>
        <FormField label="Code" required hint="Unique identifier, lowercase with underscores">
          <Input value={form.code} onChange={set('code')} placeholder="drivers_view" />
        </FormField>
        <FormField label="Category" required>
          <Select value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </Select>
        </FormField>
        <FormField label="Description"><Textarea value={form.description} onChange={set('description')} rows={2} /></FormField>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/admn-user-permissions/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Permission" message={`Delete permission "${deleteTarget?.name}" (${deleteTarget?.code})?`}
      />
    </div>
  );
}