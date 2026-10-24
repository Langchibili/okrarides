// app/(main)/countries/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, SearchBar, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea, Toggle } from '@/components/admin/FormField';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

const EMPTY = { name: '', code: '', phoneCode: '', currency: '', isActive: true, phoneNumberDigitLenth: 9, phoneNumberRegex: '' };

export default function CountriesPage() {
  const { canWrite } = useAuth();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', item }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [settingsCountry, setSettingsCountry] = useState(null);
  const [settingsFields, setSettingsFields] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const q = buildQuery({ page, pageSize: 20, populate: ['currency'], search, searchField: 'name' });
      const res = await adminClient.get(`/countries?${q}`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { toast.error(e.message || 'Could not load countries'); }
    finally { setLoading(false); }
  }, [search, toast]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    adminClient.get('/currencies?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setCurrencies(Array.isArray(items) ? items : (items.data || []));
    }).catch(error => toast.error(error.message || 'Could not load currencies'));
  }, [toast]);

  const openCreate = () => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); };
  const openEdit = item => {
    setForm({
      name: item.name || '', code: item.code || '', phoneCode: item.phoneCode || '',
      currency: item.currency?.id || item.currency || '',
      isActive: item.isActive ?? true,
      phoneNumberDigitLenth: item.phoneNumberDigitLenth || 9,
      phoneNumberRegex: item.phoneNumberRegex || '',
      acceptedMobileMoneyPayments: (item.acceptedMobileMoneyPayments || []).join(', '),
    });
    setError('');
    setModal({ mode: 'edit', item });
  };

  const openCountrySettings = async item => {
    setSettingsCountry(item);
    setSettingsFields([]);
    setSettingsError('');
    setSettingsLoading(true);
    try {
      const response = await adminClient.get(`/countries/${item.id}/settings`);
      const countrySettings = response?.data ?? response;
      setSettingsFields(Array.isArray(countrySettings?.fields) ? countrySettings.fields : []);
    } catch (requestError) {
      setSettingsError(requestError.message || 'Could not load country settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateCountrySetting = (key, value) => {
    setSettingsFields(fields => fields.map(field => field.key === key ? { ...field, value } : field));
  };

  const saveCountrySettings = async () => {
    if (!settingsCountry || !canWrite('countries')) {
      toast.error('Insufficient permissions to update country settings');
      return;
    }
    setSettingsSaving(true);
    setSettingsError('');
    try {
      const values = Object.fromEntries(settingsFields.map(field => {
        if (field.type === 'json' && typeof field.value === 'string') {
          try {
            return [field.key, JSON.parse(field.value)];
          } catch {
            throw new Error(`${field.label || field.key} must contain valid JSON`);
          }
        }
        return [field.key, field.value];
      }));
      await adminClient.put(`/countries/${settingsCountry.id}/settings`, { data: values });
      toast.success(`${settingsCountry.name} settings saved`);
      setSettingsCountry(null);
    } catch (requestError) {
      setSettingsError(requestError.message || 'Could not save country settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.code || !form.phoneCode) { setError('Name, code and phone code are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        code: form.code.toLowerCase().slice(0, 2),
        acceptedMobileMoneyPayments: form.acceptedMobileMoneyPayments
          ? form.acceptedMobileMoneyPayments.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        currency: form.currency || null,
      };
      if (modal.mode === 'create') {
        await adminClient.post('/countries', { data: payload });
      } else {
        await adminClient.put(`/countries/${modal.item.id}`, { data: payload });
      }
      setModal(null);
      load(pagination.page);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    try {
      await adminClient.delete(`/countries/${deleteTarget.id}`);
      setDeleteTarget(null);
      load(pagination.page);
    } catch (e) { toast.error(e.message || 'Could not delete country'); }
  };

  const columns = [
    { key: 'flag', label: '', width: 40, render: (_, row) => <span className="text-xl">{getFlagEmoji(row.code)}</span> },
    { key: 'name', label: 'Name', render: (v, row) => <div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">{row.code?.toUpperCase()}</div></div> },
    { key: 'phoneCode', label: 'Phone Code', render: v => `+${v}` },
    { key: 'currency', label: 'Currency', render: (v) => v?.code || v || '—' },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', width: 100,
      render: (_, row) => (
        <div className="flex gap-2">
          {canWrite('countries') && <>
            <Btn size="sm" variant="secondary" onClick={() => openCountrySettings(row)}>Settings</Btn>
            <Btn size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Btn>
          </>}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Countries"
        description="Manage supported countries and their settings"
        action={canWrite('countries') ? <Btn onClick={openCreate}>+ Add Country</Btn> : undefined}
      />
      <div className="flex gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search countries…" />
      </div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} />

      {/* Create / Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Country' : 'Edit Country'} size="md">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Country Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Zambia" />
          </FormField>
          <FormField label="Code (2 letters)" required>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ZM" maxLength={2} />
          </FormField>
          <FormField label="Phone Code" required>
            <Input value={form.phoneCode} onChange={e => setForm(f => ({ ...f, phoneCode: e.target.value }))} placeholder="260" />
          </FormField>
          <FormField label="Phone Digit Length">
            <Input type="number" value={form.phoneNumberDigitLenth} onChange={e => setForm(f => ({ ...f, phoneNumberDigitLenth: +e.target.value }))} />
          </FormField>
          <FormField label="Currency" className="col-span-2">
            <Select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              <option value="">— Select currency —</option>
              {currencies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Select>
          </FormField>
          <FormField label="Accepted Mobile Money (comma-separated)" className="col-span-2">
            <Input value={form.acceptedMobileMoneyPayments || ''} onChange={e => setForm(f => ({ ...f, acceptedMobileMoneyPayments: e.target.value }))} placeholder="mtn, airtel" />
          </FormField>
          <FormField label="Phone Regex (optional)" className="col-span-2">
            <Input value={form.phoneNumberRegex} onChange={e => setForm(f => ({ ...f, phoneNumberRegex: e.target.value }))} placeholder="^\d{9}$" />
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
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Delete Country"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect existing users.`}
      />

      <Modal open={!!settingsCountry} onClose={() => setSettingsCountry(null)} title={`${settingsCountry?.name || 'Country'} settings`} size="xl">
        <p className="form-intro">These values apply only to this country and are separate from global Admin Settings.</p>
        {settingsLoading ? <p className="text-gray-400">Loading country configuration…</p> : (
          <>
            {settingsFields.map(field => (
              <FormField key={field.key} label={field.label || field.key} hint={field.description}>
                {field.type === 'boolean' ? (
                  <Toggle checked={Boolean(field.value)} onChange={value => updateCountrySetting(field.key, value)} label={field.value ? 'Enabled' : 'Disabled'} />
                ) : field.type === 'enumeration' || field.type === 'enum' ? (
                  <Select value={field.value ?? ''} onChange={event => updateCountrySetting(field.key, event.target.value)}>
                    {(field.options || []).map(option => <option key={option} value={option}>{String(option).replace(/_/g, ' ')}</option>)}
                  </Select>
                ) : field.type === 'json' ? (
                  <Textarea rows={4} value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value ?? null, null, 2)}
                    onChange={event => updateCountrySetting(field.key, event.target.value)} />
                ) : (
                  <Input
                    type={field.type === 'integer' || field.type === 'decimal' || field.type === 'number' ? 'number' : 'text'}
                    step={field.type === 'decimal' ? 'any' : undefined}
                    value={field.value ?? ''}
                    onChange={event => updateCountrySetting(field.key,
                      field.type === 'integer' ? (event.target.value === '' ? '' : Number.parseInt(event.target.value, 10))
                        : field.type === 'decimal' || field.type === 'number' ? (event.target.value === '' ? '' : Number(event.target.value))
                          : event.target.value)}
                  />
                )}
              </FormField>
            ))}
            {!settingsFields.length && <p className="text-gray-400">No country-specific settings are available.</p>}
          </>
        )}
        {settingsError && <p className="form-error" role="alert">{settingsError}</p>}
        <div className="modal-actions">
          <Btn variant="secondary" onClick={() => setSettingsCountry(null)}>Close</Btn>
          <Btn onClick={saveCountrySettings} disabled={settingsLoading || settingsSaving || settingsFields.length === 0}>
            {settingsSaving ? 'Saving…' : 'Save country settings'}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

function getFlagEmoji(code) {
  if (!code) return '🌍';
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}