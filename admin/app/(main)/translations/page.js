// app/(main)/translations/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, SearchBar, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select } from '@/components/admin/FormField';

const CATEGORIES = ['general','rides','payments','notifications','errors','subscriptions'];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'sw', label: 'Swahili' },
  { code: 'ny', label: 'Chichewa' },
  { code: 'bem', label: 'Bemba' },
];

const EMPTY = { key: '', category: 'general', translations: [] };

export default function TranslationsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [transMap, setTransMap] = useState({});
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = filterCat ? { category: filterCat } : {};
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'key', filters, populate: ['translations'] });
      const res = await adminClient.get(`/translations${q}`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterCat]);

  useEffect(() => { load(1); }, [load]);

  const openCreate = () => {
    setForm(EMPTY);
    setTransMap(Object.fromEntries(LANGUAGES.map(l => [l.code, ''])));
    setError(''); setModal({ mode: 'create' });
  };

  const openEdit = row => {
    setForm({ key: row.key, category: row.category });
    const m = {};
    LANGUAGES.forEach(l => { m[l.code] = ''; });
    (row.translations || []).forEach(t => { if (t.locale) m[t.locale] = t.value || ''; });
    setTransMap(m);
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.key || !form.category) { setError('Key and category are required.'); return; }
    setSaving(true); setError('');
    try {
      const translations = LANGUAGES.map(l => ({ locale: l.code, value: transMap[l.code] || '' })).filter(t => t.value);
      const payload = { key: form.key, category: form.category, translations };
      if (modal.mode === 'create') {
        await adminClient.post('/translations', { data: payload });
      } else {
        await adminClient.put(`/translations/${modal.item.id}`, { data: payload });
      }
      setModal(null); load(pagination.page);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'key', label: 'Key', render: v => <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-blue-700">{v}</span> },
    { key: 'category', label: 'Category', render: v => <span className="capitalize text-sm">{v}</span> },
    {
      key: 'translations', label: 'Languages', render: (v) => {
        const langs = (v || []).map(t => t.locale?.toUpperCase()).filter(Boolean);
        return langs.length ? <div className="flex flex-wrap gap-1">{langs.map(l => <span key={l} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{l}</span>)}</div> : <span className="text-gray-400 text-xs">None</span>;
      }
    },
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
        title="Translations"
        description="Manage app string translations for all supported languages"
        action={<Btn onClick={openCreate}>+ Add Key</Btn>}
      />
      <div className="flex gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by key…" />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Translation Key' : 'Edit Translation Key'} size="lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormField label="Key (dot notation)" required>
            <Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="ride.status.pending" />
          </FormField>
          <FormField label="Category" required>
            <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </Select>
          </FormField>
        </div>
        <p className="text-sm font-medium text-gray-600 mb-3">Translations</p>
        <div className="space-y-3">
          {LANGUAGES.map(lang => (
            <FormField key={lang.code} label={`${lang.label} (${lang.code})`}>
              <Input
                value={transMap[lang.code] || ''}
                onChange={e => setTransMap(m => ({ ...m, [lang.code]: e.target.value }))}
                placeholder={`Translation in ${lang.label}…`}
              />
            </FormField>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <div className="flex justify-end gap-3 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          await adminClient.delete(`/translations/${deleteTarget.id}`);
          setDeleteTarget(null); load(pagination.page);
        }}
        title="Delete Translation" message={`Delete key "${deleteTarget?.key}"?`}
      />
    </div>
  );
}