'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { Avatar, FormField, Modal, PageHeader, StatusPill } from '@/components/UI';

const PAGE_SIZE = 20;
const emptyForm = { email: '', firstName: '', lastName: '', password: '', confirmPassword: '', roleIds: [], isActive: true };

function records(payload) {
  const data = payload?.data ?? payload;
  return Array.isArray(data) ? data : [];
}

export default function AdminUsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userResult, roleResult] = await Promise.all([
        adminClient.get('/admin-users', {
          'pagination[page]': page,
          'pagination[pageSize]': PAGE_SIZE,
          'sort': 'createdAt:desc',
        }),
        adminClient.get('/roles'),
      ]);
      setUsers(records(userResult));
      if (userResult?.meta?.pagination) setPagination(userResult.meta.pagination);
      setRoles(records(roleResult));
    } catch (requestError) {
      toast.error(requestError.message || 'Could not load admin accounts and roles');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => { load(); }, [load]);

  async function createUser(event) {
    event.preventDefault();
    if (!isSuperAdmin) return toast.error('Only a Super Admin can create admin accounts');
    if (!form.email.trim() || !form.password || form.roleIds.length === 0) {
      setError('Email, password, and at least one Strapi Admin role are required.');
      return;
    }
    if (form.password.length < 12) {
      setError('Use a password with at least 12 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminClient.post('/admin-users', {
        email: form.email.trim().toLowerCase(),
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        password: form.password,
        roles: form.roleIds.map(Number),
        isActive: form.isActive,
      });
      toast.success(form.isActive ? 'Active admin account created' : 'Inactive admin account created');
      setShowCreate(false);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(requestError.message || 'Could not create admin account');
    } finally {
      setSaving(false);
    }
  }

  async function setActive(user, isActive) {
    try {
      await adminClient.put(`/admin-users/${user.id}`, { isActive });
      toast.success(`Admin account ${isActive ? 'activated' : 'deactivated'}`);
      await load();
    } catch (requestError) {
      toast.error(requestError.message || 'Could not update admin account');
    }
  }

  const columns = [
    {
      key: 'email', label: 'Admin user',
      render: (_, row) => (
        <div className="admin-user-cell">
          <Avatar firstName={row.firstname || row.firstName} lastName={row.lastname || row.lastName} username={row.email} />
          <span><strong>{getFullName({ ...row, firstName: row.firstname || row.firstName, lastName: row.lastname || row.lastName })}</strong><small>{row.email}</small></span>
        </div>
      ),
    },
    {
      key: 'roles', label: 'Strapi Admin role',
      render: rolesForUser => (
        <div className="role-chips">
          {(rolesForUser || []).map(role => <span className="role-chip" key={role.id || role.code}>{role.name || role.code}</span>)}
          {!rolesForUser?.length && <span className="text-gray-400">No role</span>}
        </div>
      ),
    },
    { key: 'isActive', label: 'Status', render: isActive => <StatusPill status={isActive ? 'active' : 'inactive'} /> },
    { key: 'createdAt', label: 'Created', render: value => formatDate(value) },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (
        <div className="row-actions">
          <button className={`button ${row.isActive ? 'button-danger' : 'button-primary'}`} type="button"
            disabled={row.id === currentUser?.id && row.isActive}
            onClick={() => setActive(row, !row.isActive)}>
            {row.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  if (!isSuperAdmin) {
    return <section className="access-denied"><h1>Admin users</h1><p>Only Strapi Super Admins can manage administrator accounts and roles.</p></section>;
  }

  return (
    <div>
      <PageHeader title="Admin users" subtitle="Manage native Strapi Admin accounts and assigned backend roles."
        actions={<button className="button button-primary" type="button" onClick={() => { setError(''); setShowCreate(true); }}>+ Add admin</button>} />
      <div className="notice-card">
        <strong>Native Strapi Admin identities</strong>
        <span>Role assignments come from Strapi. Accounts are created without email verification; set the initial password and activate the account as needed. Invitation and verification tokens are never displayed or stored here.</span>
      </div>
      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No administrator accounts found." />
      <Pagination page={page} pageCount={pagination.pageCount} total={pagination.total} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(''); }} title="Create admin account">
        <form onSubmit={createUser}>
          <p className="form-intro">Create an active Strapi Admin account and assign one or more backend roles.</p>
          <div className="form-grid">
            <FormField label="First name"><input value={form.firstName} onChange={event => setForm(current => ({ ...current, firstName: event.target.value }))} autoComplete="given-name" /></FormField>
            <FormField label="Last name"><input value={form.lastName} onChange={event => setForm(current => ({ ...current, lastName: event.target.value }))} autoComplete="family-name" /></FormField>
          </div>
          <FormField label="Email address" required>
            <input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} autoComplete="email" required />
          </FormField>
          <div className="form-grid">
            <FormField label="Initial password" required>
              <input type="password" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} autoComplete="new-password" minLength={12} required />
            </FormField>
            <FormField label="Confirm password" required>
              <input type="password" value={form.confirmPassword} onChange={event => setForm(current => ({ ...current, confirmPassword: event.target.value }))} autoComplete="new-password" minLength={12} required />
            </FormField>
          </div>
          <FormField label="Strapi Admin roles" required>
            <select multiple value={form.roleIds} onChange={event => setForm(current => ({
              ...current,
              roleIds: Array.from(event.target.selectedOptions, option => option.value),
            }))} required size={Math.min(Math.max(roles.length, 2), 6)}>
              {roles.map(role => <option key={role.id} value={role.id}>{role.name}{role.code ? ` — ${role.code}` : ''}</option>)}
            </select>
            {!roles.length && <small>Role list unavailable. Creation is disabled until Strapi roles can be loaded.</small>}
          </FormField>
          <label className="check-row">
            <input type="checkbox" checked={form.isActive}
              onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))} />
            <span>Activate account immediately (no verification email)</span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={saving || roles.length === 0}>{saving ? 'Creating…' : 'Create account'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
