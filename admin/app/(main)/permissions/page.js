'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { DataTable } from '@/components/DataTable';
import { PageHeader, SearchBar } from '@/components/UI';

function rolePermissions(role) {
  const permissions = role.permissions?.permissions || role.permissions || role.actions || [];
  return Array.isArray(permissions)
    ? permissions.map(permission => typeof permission === 'string' ? permission : permission.action || permission.name || permission.subject).filter(Boolean)
    : [];
}

export default function RolesPage() {
  const { isSuperAdmin } = useAuth();
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    adminClient.get('/roles')
      .then(result => {
        const items = result?.data?.roles ?? result?.data ?? result?.roles ?? result;
        if (active) setRoles(Array.isArray(items) ? items : []);
      })
      .catch(error => toast.error(error.message || 'Could not load Strapi Admin roles'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [toast]);

  const data = useMemo(() => roles
    .filter(role => `${role.name || ''} ${role.code || ''}`.toLowerCase().includes(search.toLowerCase()))
    .map(role => ({ ...role, permissionList: rolePermissions(role) })), [roles, search]);

  const columns = [
    {
      key: 'name', label: 'Strapi Admin role',
      render: (name, role) => <div className="role-title"><strong>{name || role.code}</strong><small>{role.code || role.type || 'Custom role'}</small></div>,
    },
    { key: 'description', label: 'Description', render: value => value || '—' },
    { key: 'permissionList', label: 'Granted actions', render: permissions => `${permissions.length} permission${permissions.length === 1 ? '' : 's'}` },
    {
      key: 'permissionList', label: 'Permission identifiers',
      render: permissions => (
        <div className="permission-list">
          {permissions.slice(0, 4).map(permission => <code key={permission}>{permission}</code>)}
          {permissions.length > 4 && <span>+{permissions.length - 4} more</span>}
          {!permissions.length && <span>Native Strapi role</span>}
        </div>
      ),
    },
  ];

  if (!isSuperAdmin) {
    return <section className="access-denied"><h1>Roles & permissions</h1><p>Only Strapi Super Admins can inspect administrator roles.</p></section>;
  }

  return (
    <div>
      <PageHeader title="Roles & permissions" subtitle="Native Strapi Admin roles, including custom roles created in the backend." />
      <div className="notice-card">
        <strong>Backend is authoritative</strong>
        <span>Role grants are read directly from Strapi. Create and edit roles in the Strapi Admin role manager; this dashboard does not duplicate or override their permissions.</span>
      </div>
      <div className="filter-bar"><SearchBar value={search} onChange={setSearch} placeholder="Search roles…" /></div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No Strapi Admin roles found." />
    </div>
  );
}
