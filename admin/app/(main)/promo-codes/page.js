// PATH: src/app/(dashboard)/promo-codes/page.js
'use client';
import { useState, useEffect } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, Modal, StatusPill, FormField } from '@/components/UI';

export default function PromoCodesPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const pageSize = 20;

  useEffect(() => { loadPromos(); }, [page]);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/promo-codes', { 'pagination[page]': page, 'pagination[pageSize]': pageSize, 'sort': 'createdAt:desc' });
      const data = res?.data || res || [];
      const meta = res?.meta?.pagination;
      setPromos(Array.isArray(data) ? data : []);
      setTotal(meta?.total || 0);
      setPageCount(meta?.pageCount || 1);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingPromo(null);
    setForm({
      discountType: 'percentage', discountValue: 10, maxUsagePerUser: 1, currentUsageCount: 0,
      applicableFor: 'all_users', applicableRideTypes: ['taxi', 'bus', 'delivery'], isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const openEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code, name: promo.name, description: promo.description,
      discountType: promo.discountType, discountValue: promo.discountValue,
      maxDiscountAmount: promo.maxDiscountAmount, minimumOrderValue: promo.minimumOrderValue,
      validFrom: promo.validFrom?.split('T')[0], validUntil: promo.validUntil?.split('T')[0],
      maxUsageCount: promo.maxUsageCount, maxUsagePerUser: promo.maxUsagePerUser,
      applicableFor: promo.applicableFor, isActive: promo.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!canWrite('finance')) return toast.error('Insufficient permissions');
    setSaving(true);
    try {
      const payload = {
        data: {
          ...form,
          validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
          validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        }
      };
      if (editingPromo?.id) {
        await adminAPI.put(`/promo-codes/${editingPromo.id}`, payload);
        toast.success('Promo code updated');
      } else {
        await adminAPI.post('/promo-codes', payload);
        toast.success('Promo code created');
      }
      setShowModal(false);
      loadPromos();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleToggle = async (promo) => {
    if (!canWrite('finance')) return toast.error('Insufficient permissions');
    try {
      await adminAPI.put(`/promo-codes/${promo.id}`, { data: { isActive: !promo.isActive } });
      toast.success(`Promo code ${promo.isActive ? 'deactivated' : 'activated'}`);
      loadPromos();
    } catch (err) { toast.error(err.message); }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>{v}</span> },
    { key: 'name', label: 'Name', render: (v) => <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span> },
    {
      key: 'discountValue', label: 'Discount',
      render: (v, row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>{row.discountType === 'percentage' ? `${v}%` : `K${parseFloat(v || 0).toFixed(2)}`}</span>,
    },
    { key: 'currentUsageCount', label: 'Usage', render: (v, row) => <span style={{ fontSize: 12 }}>{v || 0}{row.maxUsageCount ? `/${row.maxUsageCount}` : ''}</span> },
    {
      key: 'validUntil', label: 'Expires',
      render: (v) => {
        if (!v) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
        const expired = new Date(v) < new Date();
        return <span style={{ fontSize: 12, color: expired ? 'var(--danger)' : 'var(--text-secondary)' }}>{expired && '⚠ '}{formatDate(v)}</span>;
      },
    },
    { key: 'applicableFor', label: 'For', render: (v) => <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'isActive', label: 'Status', render: (v) => <StatusPill status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {canWrite('finance') && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>Edit</button>
              <button className={`btn btn-sm ${row.isActive ? 'btn-danger' : 'btn-secondary'}`} onClick={() => handleToggle(row)}>{row.isActive ? 'Disable' : 'Enable'}</button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!hasPermission('finance')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Promo Codes" subtitle={`${total} codes`} actions={canWrite('finance') ? <button className="btn btn-primary btn-sm" onClick={openCreate}>+ New Promo Code</button> : undefined} />
      <DataTable columns={columns} data={promos} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingPromo ? 'Edit Promo Code' : 'New Promo Code'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </>}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Code" required>
              <input className="input" value={form.code || ''} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="WELCOME20" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }} />
            </FormField>
            <FormField label="Name" required>
              <input className="input" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Welcome 20% Off" />
            </FormField>
            <FormField label="Discount Type" required>
              <select className="input select" value={form.discountType || 'percentage'} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </FormField>
            <FormField label={form.discountType === 'percentage' ? 'Discount %' : 'Discount Amount (K)'} required>
              <input className="input" type="number" step="0.01" value={form.discountValue || ''} onChange={e => setForm(p => ({ ...p, discountValue: parseFloat(e.target.value) }))} />
            </FormField>
            <FormField label="Max Discount (K)" hint="Cap for % discounts">
              <input className="input" type="number" step="0.01" value={form.maxDiscountAmount || ''} onChange={e => setForm(p => ({ ...p, maxDiscountAmount: parseFloat(e.target.value) || null }))} />
            </FormField>
            <FormField label="Min Order Value (K)">
              <input className="input" type="number" step="0.01" value={form.minimumOrderValue || ''} onChange={e => setForm(p => ({ ...p, minimumOrderValue: parseFloat(e.target.value) || null }))} />
            </FormField>
            <FormField label="Valid From" required>
              <input className="input" type="date" value={form.validFrom || ''} onChange={e => setForm(p => ({ ...p, validFrom: e.target.value }))} />
            </FormField>
            <FormField label="Valid Until" required>
              <input className="input" type="date" value={form.validUntil || ''} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} />
            </FormField>
            <FormField label="Max Total Usage">
              <input className="input" type="number" value={form.maxUsageCount || ''} onChange={e => setForm(p => ({ ...p, maxUsageCount: parseInt(e.target.value) || null }))} placeholder="Unlimited" />
            </FormField>
            <FormField label="Max Usage Per User">
              <input className="input" type="number" value={form.maxUsagePerUser || 1} onChange={e => setForm(p => ({ ...p, maxUsagePerUser: parseInt(e.target.value) }))} />
            </FormField>
          </div>
          <FormField label="Applicable For">
            <select className="input select" value={form.applicableFor || 'all_users'} onChange={e => setForm(p => ({ ...p, applicableFor: e.target.value }))}>
              <option value="all_users">All Users</option>
              <option value="new_users">New Users Only</option>
              <option value="specific_users">Specific Users</option>
            </select>
          </FormField>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginTop: 8 }}>
            <input type="checkbox" checked={!!form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
