// PATH: src/app/(dashboard)/admin-users/page.js
'use client';
import { useState, useEffect } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, Modal, StatusPill, Avatar, FormField } from '@/components/UI';

export default function AdminUsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const toast = useToast();
  const [adminUsers, setAdminUsers] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const pageSize = 20;

  useEffect(() => { loadAdminUsers(); loadPermissions(); }, [page]);

  const loadAdminUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/users', {
        'pagination[page]': page, 'pagination[pageSize]': pageSize, 'sort': 'createdAt:desc',
        'filters[adminType][$ne]': 'noRole',
        'populate[adminPermissions][fields]': 'name,code,category',
        'fields': 'id,firstName,lastName,username,phoneNumber,adminType,blocked,createdAt',
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      const meta = res?.meta?.pagination;
      setAdminUsers(data);
      setTotal(meta?.total || data.length);
      setPageCount(meta?.pageCount || 1);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const loadPermissions = async () => {
    try {
      const res = await adminAPI.get('/admn-user-permissions?pagination[limit]=100');
      const data = res?.data || res || [];
      setAllPermissions(Array.isArray(data) ? data : []);
    } catch {}
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ adminType: 'support', selectedPermissions: [], blocked: false });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ adminType: u.adminType, selectedPermissions: u.adminPermissions?.map(p => p.id) || [], blocked: u.blocked });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (currentUser?.adminType !== 'super_admin') return toast.error('Only super admins can manage admin users');
    setSaving(true);
    try {
      const updateData = { adminType: form.adminType, blocked: form.blocked };
      if (form.selectedPermissions?.length > 0) {
        updateData.adminPermissions = { connect: form.selectedPermissions };
      } else {
        updateData.adminPermissions = { set: [] };
      }
      if (!editingUser) {
        if (!form.username || !form.password || !form.phoneNumber) {
          toast.error('Username, phone, and password are required');
          setSaving(false);
          return;
        }
        await adminAPI.post('/users', {
          ...updateData,
          username: form.username, phoneNumber: form.phoneNumber,
          email: `admin_${form.username}@okrarides.com`, password: form.password,
          firstName: form.firstName, lastName: form.lastName,
        });
        toast.success('Admin user created');
      } else {
        await adminAPI.put(`/users/${editingUser.id}`, updateData);
        toast.success('Admin user updated');
      }
      setShowModal(false); setEditingUser(null); setForm({});
      loadAdminUsers();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const togglePermission = (permId) => {
    setForm(prev => {
      const current = prev.selectedPermissions || [];
      const has = current.includes(permId);
      return { ...prev, selectedPermissions: has ? current.filter(id => id !== permId) : [...current, permId] };
    });
  };

  const adminTypeColors = { super_admin: 'danger', manager: 'warning', fleet_owner: 'info', support: 'muted', finance: 'purple' };

  const columns = [
    {
      key: 'id', label: 'Admin',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar firstName={row.firstName} lastName={row.lastName} username={row.username} size={30} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{getFullName(row)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.phoneNumber}</div>
          </div>
        </div>
      ),
    },
    { key: 'username', label: 'Username', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span> },
    { key: 'adminType', label: 'Role', render: (v) => <span className={`pill pill-${adminTypeColors[v] || 'muted'}`}>{v?.replace(/_/g, ' ')}</span> },
    {
      key: 'adminPermissions', label: 'Permissions',
      render: (v) => {
        if (!v?.length) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>None</span>;
        const cats = [...new Set(v.map(p => p.category).filter(Boolean))];
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {cats.slice(0, 4).map(c => <span key={c} className="pill pill-muted" style={{ fontSize: 10 }}>{c}</span>)}
            {cats.length > 4 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{cats.length - 4} more</span>}
          </div>
        );
      },
    },
    { key: 'blocked', label: 'Status', render: (v) => <StatusPill status={v ? 'blocked' : 'active'} /> },
    { key: 'createdAt', label: 'Added', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(v)}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => currentUser?.adminType === 'super_admin'
        ? <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>Edit</button>
        : null,
    },
  ];

  if (!hasPermission('settings')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Admin Users" subtitle="Manage admin access and permissions"
        actions={currentUser?.adminType === 'super_admin' ? <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Admin</button> : undefined} />
      <DataTable columns={columns} data={adminUsers} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingUser(null); setForm({}); }}
        title={editingUser ? `Edit ${getFullName(editingUser)}` : 'Add Admin User'} maxWidth={600}
        footer={<>
          <button className="btn btn-secondary" onClick={() => { setShowModal(false); setForm({}); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </>}>
        <div>
          {!editingUser && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <FormField label="First Name"><input className="input" value={form.firstName || ''} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} /></FormField>
                <FormField label="Last Name"><input className="input" value={form.lastName || ''} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></FormField>
                <FormField label="Username" required><input className="input" value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} /></FormField>
                <FormField label="Phone Number" required><input className="input" value={form.phoneNumber || ''} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="+260..." /></FormField>
                <FormField label="Password" required><input className="input" type="password" value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></FormField>
              </div>
              <hr className="divider" />
            </>
          )}
          <FormField label="Admin Role">
            <select className="input select" value={form.adminType || 'support'} onChange={e => setForm(p => ({ ...p, adminType: e.target.value }))}>
              <option value="super_admin">Super Admin</option>
              <option value="manager">Manager</option>
              <option value="fleet_owner">Fleet Owner</option>
              <option value="support">Support</option>
              <option value="finance">Finance</option>
            </select>
          </FormField>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Permissions</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allPermissions.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 6, background: form.selectedPermissions?.includes(p.id) ? 'var(--accent-dim)' : 'transparent', transition: 'background 0.1s' }}>
                  <input type="checkbox" checked={form.selectedPermissions?.includes(p.id) || false} onChange={() => togglePermission(p.id)} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: form.selectedPermissions?.includes(p.id) ? 'var(--accent)' : 'var(--text-primary)' }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</div>}
                  </div>
                  <span className="pill pill-muted" style={{ marginLeft: 'auto', fontSize: 10 }}>{p.category}</span>
                </label>
              ))}
              {allPermissions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>No permissions found. Create them in the Admin User Permission collection first.</p>}
            </div>
          </div>
          {editingUser && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={!!form.blocked} onChange={e => setForm(p => ({ ...p, blocked: e.target.checked }))} />
              Block this admin user
            </label>
          )}
        </div>
      </Modal>
    </div>
  );
}
