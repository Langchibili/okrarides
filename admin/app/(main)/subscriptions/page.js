// PATH: src/app/(dashboard)/subscriptions/page.js
'use client';
import { useState, useEffect } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, FilterBar, Modal, StatusPill, Avatar, FormField } from '@/components/UI';

export default function SubscriptionsPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('subscriptions');
  const pageSize = 20;

  useEffect(() => { loadSubscriptions(page); loadPlans(); }, [page]);

  const loadSubscriptions = async (pg = 1, st = filterStatus) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': pg,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'populate[driver][fields]': 'firstName,lastName,phoneNumber',
        'populate[subscriptionPlan][fields]': 'name,price,durationType',
      };
      if (st) params['filters[subscriptionStatus][$eq]'] = st;
      const res = await adminAPI.get('/driver-subscriptions', params);
      const data = res?.data || res || [];
      const meta = res?.meta?.pagination;
      setSubs(Array.isArray(data) ? data : []);
      setTotal(meta?.total || 0);
      setPageCount(meta?.pageCount || 1);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const loadPlans = async () => {
    try {
      const res = await adminAPI.get('/subscription-plans?sort=displayOrder:asc');
      const data = res?.data || res || [];
      setPlans(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleSavePlan = async () => {
    if (!canWrite('subscriptions')) return toast.error('Insufficient permissions');
    setSaving(true);
    try {
      if (editingPlan?.id) {
        await adminAPI.put(`/subscription-plans/${editingPlan.id}`, { data: planForm });
        toast.success('Plan updated');
      } else {
        await adminAPI.post('/subscription-plans', { data: { ...planForm, planId: `PLAN-${Date.now()}` } });
        toast.success('Plan created');
      }
      setShowPlanModal(false); setEditingPlan(null); setPlanForm({}); loadPlans();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleTogglePlan = async (plan) => {
    if (!canWrite('subscriptions')) return toast.error('Insufficient permissions');
    try {
      await adminAPI.put(`/subscription-plans/${plan.id}`, { data: { isActive: !plan.isActive } });
      toast.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`);
      loadPlans();
    } catch (err) { toast.error(err.message); }
  };

  const subsColumns = [
    { key: 'subscriptionId', label: 'Subscription ID', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{v}</span> },
    {
      key: 'driver', label: 'Driver',
      render: (v) => v
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar firstName={v.firstName} lastName={v.lastName} size={26} />
            <div><div style={{ fontSize: 12, fontWeight: 600 }}>{getFullName(v)}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.phoneNumber}</div></div>
          </div>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    {
      key: 'subscriptionPlan', label: 'Plan',
      render: (v) => v
        ? <div style={{ fontSize: 12 }}><div style={{ fontWeight: 600 }}>{v.name}</div><div style={{ color: 'var(--text-muted)' }}>K{parseFloat(v.price || 0).toFixed(2)}/{v.durationType}</div></div>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    { key: 'subscriptionStatus', label: 'Status', render: (v) => <StatusPill status={v} /> },
    { key: 'isFreeTrial', label: 'Trial', render: (v) => v ? <span className="pill pill-accent">Free Trial</span> : null },
    { key: 'startedAt', label: 'Started', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v ? formatDate(v) : '—'}</span> },
    {
      key: 'expiresAt', label: 'Expires',
      render: (v) => {
        if (!v) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
        const expired = new Date(v) < new Date();
        return <span style={{ fontSize: 11, color: expired ? 'var(--danger)' : 'var(--text-secondary)' }}>{formatDate(v)}</span>;
      },
    },
    { key: 'renewalCount', label: 'Renewals', render: (v) => <span style={{ fontSize: 12 }}>{v || 0}</span> },
  ];

  if (!hasPermission('subscriptions')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Subscriptions" actions={canWrite('subscriptions') ? (
        <button className="btn btn-primary btn-sm" onClick={() => {
          setEditingPlan(null);
          setPlanForm({ isActive: true, hasFreeTrial: false, durationType: 'monthly', durationValue: 1, displayOrder: 0 });
          setShowPlanModal(true);
        }}>+ New Plan</button>
      ) : undefined} />

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[['subscriptions', 'Subscriptions'], ['plans', 'Plans']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {activeTab === 'subscriptions' && (
        <>
          <FilterBar>
            <select className="input select" style={{ width: 160 }} value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); loadSubscriptions(1, e.target.value); }}>
              <option value="">All Statuses</option>
              <option value="trial">Trial</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="suspended">Suspended</option>
            </select>
          </FilterBar>
          <DataTable columns={subsColumns} data={subs} loading={loading} />
          <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
        </>
      )}

      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {plans.map(plan => (
            <div key={plan.id} className="card" style={{ opacity: plan.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{plan.name}</div>
                  {plan.isPopular && <span className="pill pill-accent" style={{ fontSize: 10 }}>Popular</span>}
                </div>
                <StatusPill status={plan.isActive ? 'active' : 'inactive'} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>
                K{parseFloat(plan.price || 0).toFixed(2)}<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/{plan.durationType}</span>
              </div>
              {plan.hasFreeTrial && <div style={{ fontSize: 12, color: 'var(--success)', marginBottom: 8 }}>✓ {plan.freeTrialDays} days free trial</div>}
              {plan.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{plan.description}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                {canWrite('subscriptions') && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      setEditingPlan(plan);
                      setPlanForm({ name: plan.name, price: plan.price, durationType: plan.durationType, durationValue: plan.durationValue, hasFreeTrial: plan.hasFreeTrial, freeTrialDays: plan.freeTrialDays, isActive: plan.isActive, isPopular: plan.isPopular, description: plan.description, displayOrder: plan.displayOrder });
                      setShowPlanModal(true);
                    }}>Edit</button>
                    <button className={`btn btn-sm ${plan.isActive ? 'btn-danger' : 'btn-secondary'}`} onClick={() => handleTogglePlan(plan)}>{plan.isActive ? 'Deactivate' : 'Activate'}</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showPlanModal} onClose={() => { setShowPlanModal(false); setEditingPlan(null); setPlanForm({}); }}
        title={editingPlan ? 'Edit Subscription Plan' : 'New Subscription Plan'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => { setShowPlanModal(false); setEditingPlan(null); setPlanForm({}); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSavePlan} disabled={saving}>{saving ? 'Saving...' : 'Save Plan'}</button>
        </>}>
        <div>
          <FormField label="Plan Name" required>
            <input className="input" value={planForm.name || ''} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Okra Pro Monthly" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Price (ZMW)" required>
              <input className="input" type="number" step="0.01" value={planForm.price || ''} onChange={e => setPlanForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
            </FormField>
            <FormField label="Duration Type" required>
              <select className="input select" value={planForm.durationType || 'monthly'} onChange={e => setPlanForm(p => ({ ...p, durationType: e.target.value }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </FormField>
            <FormField label="Duration Value" hint="e.g. 1 for 1 month">
              <input className="input" type="number" value={planForm.durationValue || 1} onChange={e => setPlanForm(p => ({ ...p, durationValue: parseInt(e.target.value) }))} />
            </FormField>
            <FormField label="Display Order">
              <input className="input" type="number" value={planForm.displayOrder || 0} onChange={e => setPlanForm(p => ({ ...p, displayOrder: parseInt(e.target.value) }))} />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea className="input" rows={2} value={planForm.description || ''} onChange={e => setPlanForm(p => ({ ...p, description: e.target.value }))} placeholder="Plan description..." />
          </FormField>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['isActive', 'Active'], ['isPopular', 'Mark as Popular'], ['hasFreeTrial', 'Has Free Trial']].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={!!planForm[key]} onChange={e => setPlanForm(p => ({ ...p, [key]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
          {planForm.hasFreeTrial && (
            <FormField label="Free Trial Days" hint="Number of trial days">
              <input className="input" type="number" value={planForm.freeTrialDays || 7} onChange={e => setPlanForm(p => ({ ...p, freeTrialDays: parseInt(e.target.value) }))} />
            </FormField>
          )}
        </div>
      </Modal>
    </div>
  );
}
