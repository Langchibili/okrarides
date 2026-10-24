'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { PageHeader, Btn, StatusBadge } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Toggle } from '@/components/admin/FormField';
import CountryFilter from '@/components/CountryFilter';

const EMPTY = {
  name: '',
  type: 'account-setup',
  appliesTo: 'all',
  actionAmountsPerUser: 1,
  pointsAllocatedFromAction: 1,
  active: true,
  isRuleVolumeType: false,
  volume: 0,
  countries: [],
};
const TYPES = ['account-setup', 'ride-booking', 'ride-completion', 'delivery-booking', 'delivery-completion'];

export default function AffiliatePointsAllocationRulesPage() {
  const [rules, setRules] = useState([]);
  const [countries, setCountries] = useState([]);
  const [countryId, setCountryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filter = countryId ? `&filters[countryId][$eq]=${encodeURIComponent(countryId)}` : '';
      const response = await adminClient.get(`/affiliate-points-allocation-rules?pagination[pageSize]=100&sort=name:asc${filter}`);
      setRules(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.message || 'Could not load referral allocation rules');
    } finally {
      setLoading(false);
    }
  }, [countryId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminClient.get('/country-options')
      .then(response => setCountries(Array.isArray(response) ? response : response?.data || []))
      .catch(requestError => setError(requestError.message || 'Could not load countries'));
  }, []);

  const openEdit = rule => {
    setForm({
      name: rule.name || '',
      type: rule.type || 'account-setup',
      appliesTo: rule.appliesTo || 'all',
      actionAmountsPerUser: rule.actionAmountsPerUser ?? 1,
      pointsAllocatedFromAction: rule.pointsAllocatedFromAction ?? 1,
      active: Boolean(rule.active),
      isRuleVolumeType: Boolean(rule.isRuleVolumeType),
      volume: rule.volume ?? 0,
      countries: (rule.countries || []).map(country => country.id),
    });
    setError('');
    setModal({ mode: 'edit', rule });
  };

  const save = async () => {
    if (!form.name.trim() || !form.countries.length) {
      setError('A rule name and at least one country are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        actionAmountsPerUser: Math.max(1, Number(form.actionAmountsPerUser) || 1),
        pointsAllocatedFromAction: Math.max(1, Number(form.pointsAllocatedFromAction) || 1),
        volume: Math.max(0, Number(form.volume) || 0),
        countries: modal.mode === 'create'
          ? { connect: form.countries.map(Number) }
          : { set: form.countries.map(Number) },
      };
      if (modal.mode === 'create') {
        await adminClient.post('/affiliate-points-allocation-rules', { data: payload });
      } else {
        await adminClient.put(`/affiliate-points-allocation-rules/${modal.rule.id}`, { data: payload });
      }
      setModal(null);
      await load();
    } catch (requestError) {
      setError(requestError.message || 'Could not save referral rule');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Rule', render: value => <span className="font-medium">{value}</span> },
    { key: 'type', label: 'Action', render: value => value?.replace(/-/g, ' ') || '—' },
    { key: 'appliesTo', label: 'Applies to', render: value => value || 'all' },
    { key: 'actionAmountsPerUser', label: 'Actions per user' },
    { key: 'pointsAllocatedFromAction', label: 'Points per action' },
    { key: 'countries', label: 'Countries', render: value => (value || []).map(country => country.name || country.code).join(', ') || '—' },
    { key: 'active', label: 'Status', render: value => <StatusBadge status={value ? 'active' : 'inactive'} /> },
    {
      key: 'id',
      label: '',
      width: 90,
      render: (_, rule) => <Btn size="sm" variant="secondary" onClick={() => openEdit(rule)}>Edit</Btn>,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Referral Points Allocation Rules"
        description="Manage action-based affiliate rewards by country"
        action={<Btn onClick={() => { setForm({ ...EMPTY, countries: countryId ? [Number(countryId)] : [] }); setError(''); setModal({ mode: 'create' }); }}>+ Add Rule</Btn>}
      />
      <div className="mb-4">
        <CountryFilter value={countryId} onChange={setCountryId} />
      </div>
      {error && !modal && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}
      <DataTable columns={columns} data={rules} loading={loading} emptyMessage="No referral allocation rules found" />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'Add Referral Rule' : 'Edit Referral Rule'} size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Rule name" required>
            <Input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
          </FormField>
          <FormField label="Action" required>
            <Select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value }))}>
              {TYPES.map(type => <option key={type} value={type}>{type.replace(/-/g, ' ')}</option>)}
            </Select>
          </FormField>
          <FormField label="Applies to">
            <Select value={form.appliesTo} onChange={event => setForm(current => ({ ...current, appliesTo: event.target.value }))}>
              {['all', 'rider', 'driver'].map(role => <option key={role} value={role}>{role}</option>)}
            </Select>
          </FormField>
          <FormField label="Countries" required>
            <Select
              multiple
              value={form.countries.map(String)}
              onChange={event => setForm(current => ({
                ...current,
                countries: Array.from(event.target.selectedOptions, option => Number(option.value)),
              }))}
              size={Math.min(5, Math.max(2, countries.length))}
            >
              {countries.map(country => <option key={country.id} value={country.id}>{country.name || country.code}</option>)}
            </Select>
          </FormField>
          <FormField label="Actions per user">
            <Input type="number" min="1" value={form.actionAmountsPerUser} onChange={event => setForm(current => ({ ...current, actionAmountsPerUser: event.target.value }))} />
          </FormField>
          <FormField label="Points allocated per action">
            <Input type="number" min="1" value={form.pointsAllocatedFromAction} onChange={event => setForm(current => ({ ...current, pointsAllocatedFromAction: event.target.value }))} />
          </FormField>
          <FormField label="Volume threshold">
            <Input type="number" min="0" value={form.volume} onChange={event => setForm(current => ({ ...current, volume: event.target.value }))} />
          </FormField>
        </div>
        <div className="mt-2 flex flex-wrap gap-6">
          <Toggle checked={form.isRuleVolumeType} onChange={value => setForm(current => ({ ...current, isRuleVolumeType: value }))} label="Use volume rule" />
          <Toggle checked={form.active} onChange={value => setForm(current => ({ ...current, active: value }))} label="Active" />
        </div>
        {error && modal && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save rule'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
