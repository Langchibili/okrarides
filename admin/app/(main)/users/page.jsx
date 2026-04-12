// PATH: src/app/(dashboard)/users/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDateTime, formatDate, getFullName, debounce } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, Modal, StatusPill, Avatar, FormField } from '@/components/UI';

export default function UsersPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filterBlocked, setFilterBlocked] = useState('');
  const pageSize = 20;

  const loadUsers = useCallback(async (pg = 1, q = search, blocked = filterBlocked) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': pg,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'populate[riderProfile][fields]': 'completedRides,totalSpent,averageRating,blocked',
        'populate[driverProfile][fields]': 'verificationStatus,floatBalance,completedRides,averageRating,blocked',
        'populate[country][fields]': 'name,code',
      };
      if (q) {
        params['filters[$or][0][firstName][$containsi]'] = q;
        params['filters[$or][1][lastName][$containsi]'] = q;
        params['filters[$or][2][phoneNumber][$containsi]'] = q;
        params['filters[$or][3][username][$containsi]'] = q;
      }
      if (blocked === 'true') params['filters[blocked][$eq]'] = true;
      if (blocked === 'false') params['filters[blocked][$eq]'] = false;
      const res = await adminAPI.get('/users', params);
      const data = Array.isArray(res) ? res : (res?.data || []);
      const meta = res?.meta?.pagination;
      setUsers(data);
      setTotal(meta?.total || data.length);
      setPageCount(meta?.pageCount || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, filterBlocked]);

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    loadUsers(1, q, filterBlocked);
  }, 400), [filterBlocked]);

  useEffect(() => { loadUsers(page); }, [page]);

  const handleSearch = (q) => { setSearch(q); debouncedSearch(q); };

  const handleBlock = async (user) => {
    if (!canWrite('users')) return toast.error('Insufficient permissions');
    try {
      await adminAPI.put(`/users/${user.id}`, { blocked: !user.blocked });
      toast.success(`User ${user.blocked ? 'unblocked' : 'blocked'} successfully`);
      loadUsers(page);
    } catch (err) { toast.error(err.message); }
  };

  const handleViewDetail = async (user) => {
    setSelectedUser(user);
    setShowDetail(true);
    try {
      const full = await adminAPI.get(`/users/${user.id}?populate=*`);
      setSelectedUser(full);
    } catch {}
  };

  const columns = [
    {
      key: 'id', label: 'User',
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
    {
      key: 'username', label: 'Username',
      render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>,
    },
    { key: 'country', label: 'Country', render: (v) => v?.name || '—' },
    {
      key: 'riderProfile', label: 'Rider',
      render: (v) => v
        ? <span style={{ fontSize: 12 }}><span style={{ color: 'var(--success)' }}>✓</span> {v.completedRides || 0} rides</span>
        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>,
    },
    {
      key: 'driverProfile', label: 'Driver',
      render: (v) => v ? <StatusPill status={v.verificationStatus || 'not_started'} /> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>,
    },
    { key: 'blocked', label: 'Status', render: (v) => <StatusPill status={v ? 'blocked' : 'active'} /> },
    {
      key: 'createdAt', label: 'Joined',
      render: (v) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(v)}</span>,
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(row)}>View</button>
          {canWrite('users') && (
            <button className={`btn btn-sm ${row.blocked ? 'btn-secondary' : 'btn-danger'}`} onClick={() => handleBlock(row)}>
              {row.blocked ? 'Unblock' : 'Block'}
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!hasPermission('users')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>You don't have permission to view users.</div>;
  }

  return (
    <div>
      <PageHeader title="Users" subtitle={`${total.toLocaleString()} total users`} />
      <FilterBar>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by name, phone, username..." />
        <select className="input select" style={{ width: 160 }} value={filterBlocked}
          onChange={e => { setFilterBlocked(e.target.value); setPage(1); loadUsers(1, search, e.target.value); }}>
          <option value="">All Users</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </select>
      </FilterBar>
      <DataTable columns={columns} data={users} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedUser(null); }} title="User Details" maxWidth={640}>
        {selectedUser && <UserDetail user={selectedUser} onBlock={handleBlock} canWrite={canWrite('users')} />}
      </Modal>
    </div>
  );
}

function UserDetail({ user, onBlock, canWrite }) {
  const dp = user.driverProfile;
  const rp = user.riderProfile;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '0 0 20px', borderBottom: '1px solid var(--border)' }}>
        <Avatar firstName={user.firstName} lastName={user.lastName} username={user.username} size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{getFullName(user)}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{user.phoneNumber} · {user.username}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatusPill status={user.blocked ? 'blocked' : 'active'} />
            {user.adminType && user.adminType !== 'noRole' && <StatusPill status={user.adminType} label={user.adminType.replace('_', ' ')} />}
          </div>
        </div>
        {canWrite && (
          <button className={`btn btn-sm ${user.blocked ? 'btn-secondary' : 'btn-danger'}`} onClick={() => onBlock(user)}>
            {user.blocked ? 'Unblock' : 'Block'}
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          ['ID', user.id], ['Email', user.email || '—'],
          ['Phone Verified', user.phoneVerified ? '✅ Yes' : '❌ No'], ['Country', user.country?.name || '—'],
          ['Joined', formatDateTime(user.createdAt)], ['Last Seen', user.lastSeen ? formatDateTime(user.lastSeen) : '—'],
          ['Active Profile', user.activeProfile || 'none'], ['Admin Type', user.adminType || 'none'],
        ].map(([label, value]) => (
          <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>
      {dp && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>Driver Profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              ['Verification', dp.verificationStatus],
              ['Float Balance', `K${parseFloat(dp.floatBalance || 0).toFixed(2)}`],
              ['Completed Rides', dp.completedRides || 0],
              ['Avg Rating', (dp.averageRating || 0).toFixed(1) + '⭐'],
              ['Subscription', dp.subscriptionStatus || 'inactive'],
              ['Blocked', dp.blocked ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {rp && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>Rider Profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              ['Completed Rides', rp.completedRides || 0],
              ['Total Spent', `K${parseFloat(rp.totalSpent || 0).toFixed(2)}`],
              ['Avg Rating', (rp.averageRating || 0).toFixed(1) + '⭐'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-ZM', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
