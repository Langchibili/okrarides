// app/(main)/ride-classes/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, StatusBadge, SearchBar, Btn } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea, Toggle } from '@/components/admin/FormField';
import CountryFilter from '@/components/CountryFilter';

const EMPTY = { name: '', description: '', taxiType: '', baseFare: '', perKmRate: '', perMinuteRate: '', minimumFare: '', commissionPercentage: '', displayOrder: 0, isActive: true, countries: [] };

export default function RideClassesPage() {
  const [data, setData] = useState([]);
  const [taxiTypes, setTaxiTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countryId, setCountryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery({ populate: ['taxiType'], search, searchField: 'name', pageSize: 100 });
      const countryFilter = countryId ? `&filters[countryId][$eq]=${encodeURIComponent(countryId)}` : '';
      const res = await adminClient.get(`/ride-classes?${q}${countryFilter}&sort=displayOrder:asc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, countryId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminClient.get('/taxi-types?pagination[pageSize]=100').then(res => {
      const items = res?.data || res || [];
      setTaxiTypes(Array.isArray(items) ? items : (items.data || []));
    }).catch(() => {});
    adminClient.get('/country-options').then(res => {
      setCountries(Array.isArray(res) ? res : res?.data || []);
    }).catch(() => {});
  }, []);

  const openEdit = row => {
    setForm({
      name: row.name, description: row.description || '',
      taxiType: row.taxiType?.id || '', baseFare: row.baseFare,
      perKmRate: row.perKmRate, perMinuteRate: row.perMinuteRate,
      minimumFare: row.minimumFare, commissionPercentage: row.commissionPercentage || '',
      displayOrder: row.displayOrder, isActive: row.isActive,
      countries: (row.countries || []).map(item => ({
        country: item.country?.id || item.country || '',
        baseFare: item.baseFare ?? '',
        perKmRate: item.perKmRate ?? '',
        perMinuteRate: item.perMinuteRate ?? '',
        minimumFare: item.minimumFare ?? '',
        commissionPercentage: item.commissionPercentage ?? '',
        isActive: item.isActive ?? true,
      })),
    });
    setError(''); setModal({ mode: 'edit', item: row });
  };

  const save = async () => {
    if (!form.name.trim() || !form.baseFare || !form.perKmRate || !form.perMinuteRate || !form.minimumFare) {
      setError('Name and all fare fields are required.'); return;
    }
    const selectedCountries = form.countries.map(rule => String(rule.country));
    if (form.countries.some(rule => (
      !rule.country ||
      ['baseFare', 'perKmRate', 'perMinuteRate', 'minimumFare'].some(field => (
        rule[field] === '' || !Number.isFinite(Number(rule[field])) || Number(rule[field]) < 0
      ))
    ))) {
      setError('Each country override needs a country and valid non-negative fare values.');
      return;
    }
    if (new Set(selectedCountries).size !== selectedCountries.length) {
      setError('A country can only have one pricing override per ride class.');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        taxiType: form.taxiType || null,
        baseFare: parseFloat(form.baseFare),
        perKmRate: parseFloat(form.perKmRate),
        perMinuteRate: parseFloat(form.perMinuteRate),
        minimumFare: parseFloat(form.minimumFare),
        commissionPercentage: form.commissionPercentage ? parseFloat(form.commissionPercentage) : null,
        displayOrder: +form.displayOrder || 0,
        countries: form.countries.map(rule => ({
          country: Number(rule.country),
          baseFare: Number(rule.baseFare),
          perKmRate: Number(rule.perKmRate),
          perMinuteRate: Number(rule.perMinuteRate),
          minimumFare: Number(rule.minimumFare),
          commissionPercentage: rule.commissionPercentage === '' ? null : Number(rule.commissionPercentage),
          isActive: Boolean(rule.isActive),
        })),
      };
      if (modal.mode === 'create') {
        await adminClient.post('/ride-classes', { data: payload });
      } else {
        await adminClient.put(`/ride-classes/${modal.item.id}`, { data: payload });
      }
      setModal(null); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'displayOrder', label: '#', width: 40, render: v => <span className="text-gray-400 text-xs">{v}</span> },
    { key: 'name', label: 'Name', render: (v, row) => <div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">{row.taxiType?.name || '—'}</div></div> },
    { key: 'baseFare', label: 'Base Fare', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'perKmRate', label: 'Per Km', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'perMinuteRate', label: 'Per Min', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'minimumFare', label: 'Min Fare', render: v => `K${Number(v).toFixed(2)}` },
    { key: 'commissionPercentage', label: 'Comm %', render: v => v ? `${v}%` : '—' },
    { key: 'countries', label: 'Country pricing', render: v => (v || []).map(item => item.country?.name || item.country?.code).filter(Boolean).join(', ') || 'Default only' },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', width: 120,
      render: (_, row) => (
        <div className="flex gap-2">
          <Btn size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Ride Classes"
        description="Define pricing tiers for rides (OkraGo, OkraXL, etc.)"
        action={<Btn onClick={() => { setForm(EMPTY); setError(''); setModal({ mode: 'create' }); }}>+ Add Class</Btn>}
      />
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search classes…" /></div>
      <div className="mb-4"><CountryFilter value={countryId} onChange={setCountryId} /></div>
      <DataTable columns={columns} data={data} loading={loading} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Ride Class' : 'Edit Ride Class'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="OkraGo" />
          </FormField>
          <FormField label="Taxi Type">
            <Select value={form.taxiType} onChange={e => setForm(f => ({ ...f, taxiType: e.target.value }))}>
              <option value="">— All types —</option>
              {taxiTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Description" className="col-span-2">
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Base Fare (K)" required>
            <Input type="number" step="0.01" value={form.baseFare} onChange={e => setForm(f => ({ ...f, baseFare: e.target.value }))} />
          </FormField>
          <FormField label="Per KM Rate (K)" required>
            <Input type="number" step="0.01" value={form.perKmRate} onChange={e => setForm(f => ({ ...f, perKmRate: e.target.value }))} />
          </FormField>
          <FormField label="Per Minute Rate (K)" required>
            <Input type="number" step="0.01" value={form.perMinuteRate} onChange={e => setForm(f => ({ ...f, perMinuteRate: e.target.value }))} />
          </FormField>
          <FormField label="Minimum Fare (K)" required>
            <Input type="number" step="0.01" value={form.minimumFare} onChange={e => setForm(f => ({ ...f, minimumFare: e.target.value }))} />
          </FormField>
          <FormField label="Commission % (override)">
            <Input type="number" step="0.1" value={form.commissionPercentage} onChange={e => setForm(f => ({ ...f, commissionPercentage: e.target.value }))} placeholder="Leave blank for global default" />
          </FormField>
          <FormField label="Display Order">
            <Input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} />
          </FormField>
          <div className="col-span-2 rounded-xl border border-gray-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-800">Country-specific pricing</h3>
                <p className="text-xs text-gray-500">Leave countries without an override on the default fare values above.</p>
              </div>
              <Btn
                type="button"
                variant="secondary"
                onClick={() => setForm(current => ({
                  ...current,
                  countries: [...current.countries, { country: '', baseFare: '', perKmRate: '', perMinuteRate: '', minimumFare: '', commissionPercentage: '', isActive: true }],
                }))}
              >
                + Add country pricing
              </Btn>
            </div>
            <div className="space-y-4">
              {form.countries.map((rule, index) => (
                <div key={`${rule.country || 'new'}-${index}`} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Country" required>
                    <Select value={rule.country} onChange={event => setForm(current => ({
                      ...current,
                      countries: current.countries.map((item, itemIndex) => itemIndex === index ? { ...item, country: event.target.value } : item),
                    }))}>
                      <option value="">Select country</option>
                      {countries.map(country => <option key={country.id} value={country.id}>{country.name || country.code}</option>)}
                    </Select>
                  </FormField>
                  {[
                    ['baseFare', 'Base fare'],
                    ['perKmRate', 'Per km rate'],
                    ['perMinuteRate', 'Per minute rate'],
                    ['minimumFare', 'Minimum fare'],
                    ['commissionPercentage', 'Commission % (optional)'],
                  ].map(([key, label]) => (
                    <FormField
                      key={key}
                      label={`${label}${key === 'commissionPercentage' ? '' : ` (${countries.find(country => String(country.id) === String(rule.country))?.currency?.symbol || countries.find(country => String(country.id) === String(rule.country))?.currency?.code || 'country currency'})`}`}
                      required={key !== 'commissionPercentage'}
                    >
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rule[key]}
                        onChange={event => setForm(current => ({
                          ...current,
                          countries: current.countries.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: event.target.value } : item),
                        }))}
                      />
                    </FormField>
                  ))}
                  <div className="flex items-center justify-between gap-3">
                    <Toggle
                      checked={rule.isActive}
                      onChange={value => setForm(current => ({
                        ...current,
                        countries: current.countries.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: value } : item),
                      }))}
                      label="Active in country"
                    />
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600"
                      onClick={() => setForm(current => ({ ...current, countries: current.countries.filter((_, itemIndex) => itemIndex !== index) }))}
                    >
                      Remove override
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          await adminClient.delete(`/ride-classes/${deleteTarget.id}`);
          setDeleteTarget(null); load();
        }}
        title="Delete Ride Class" message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
}