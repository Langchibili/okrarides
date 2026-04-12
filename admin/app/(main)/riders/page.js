// PATH: src/app/(dashboard)/riders/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName, debounce } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, Modal, StatusPill, Avatar } from '@/components/UI';

export default function RidersPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterBlocked, setFilterBlocked] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const pageSize = 20;

  const loadRiders = useCallback(async (pg = 1, q = search, bl = filterBlocked) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': pg,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'filters[riderProfile][id][$notNull]': true,
        'populate[riderProfile][fields]': 'completedRides,cancelledRides,totalSpent,averageRating,blocked',
        'populate[country][fields]': 'name,code',
        'fields': 'id,firstName,lastName,phoneNumber,username,createdAt,isOnline',
      };
      if (q) {
        params['filters[$or][0][firstName][$containsi]'] = q;
        params['filters[$or][1][lastName][$containsi]'] = q;
        params['filters[$or][2][phoneNumber][$containsi]'] = q;
      }
      if (bl === 'true') params['filters[riderProfile][blocked][$eq]'] = true;
      if (bl === 'false') params['filters[riderProfile][blocked][$eq]'] = false;
      const res = await adminAPI.get('/users', params);
      const data = Array.isArray(res) ? res : (res?.data || []);
      const meta = res?.meta?.pagination;
      setRiders(data);
      setTotal(meta?.total || data.length);
      setPageCount(meta?.pageCount || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  }, [search, filterBlocked]);

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    loadRiders(1, q, filterBlocked);
  }, 400), [filterBlocked]);

  useEffect(() => { loadRiders(page); }, [page]);

  const handleSearch = (q) => { setSearch(q); debouncedSearch(q); };

  const handleBlockRider = async (rider) => {
    if (!canWrite('riders')) return toast.error('Insufficient permissions');
    try {
      const rp = rider.riderProfile;
      const isBlocked = rp?.blocked;
      await adminAPI.put(`/users/${rider.id}`, { riderProfile: { id: rp?.id, blocked: !isBlocked } });
      toast.success(`Rider ${isBlocked ? 'unblocked' : 'blocked'}`);
      loadRiders(page);
    } catch (err) { toast.error(err.message); }
  };

  const handleViewDetail = async (rider) => {
    setSelectedRider(rider);
    setShowDetail(true);
    try {
      const full = await adminAPI.get(`/users/${rider.id}?populate=riderProfile,country`);
      setSelectedRider(full);
    } catch {}
  };

  const columns = [
    {
      key: 'id', label: 'Rider',
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
    { key: 'country', label: 'Country', render: (v) => v?.name || '—' },
    {
      key: 'riderProfile.completedRides', label: 'Rides',
      render: (_, row) => (
        <span style={{ fontSize: 12 }}>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{row.riderProfile?.completedRides || 0}</span>
          {' '}
          <span style={{ color: 'var(--text-muted)' }}>/ {(row.riderProfile?.completedRides || 0) + (row.riderProfile?.cancelledRides || 0)}</span>
        </span>
      ),
    },
    {
      key: 'riderProfile.totalSpent', label: 'Total Spent',
      render: (_, row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>K{parseFloat(row.riderProfile?.totalSpent || 0).toFixed(2)}</span>,
    },
    {
      key: 'riderProfile.averageRating', label: 'Rating',
      render: (_, row) => {
        const r = parseFloat(row.riderProfile?.averageRating || 0);
        return r > 0 ? <span style={{ fontSize: 12 }}>⭐ {r.toFixed(1)}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
      },
    },
    { key: 'riderProfile.blocked', label: 'Status', render: (_, row) => <StatusPill status={row.riderProfile?.blocked ? 'blocked' : 'active'} /> },
    { key: 'createdAt', label: 'Joined', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(v)}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(row)}>View</button>
          {canWrite('riders') && (
            <button className={`btn btn-sm ${row.riderProfile?.blocked ? 'btn-secondary' : 'btn-danger'}`} onClick={() => handleBlockRider(row)}>
              {row.riderProfile?.blocked ? 'Unblock' : 'Block'}
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!hasPermission('riders')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Riders" subtitle={`${total.toLocaleString()} riders`} />
      <FilterBar>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search riders..." />
        <select className="input select" style={{ width: 140 }} value={filterBlocked}
          onChange={e => { setFilterBlocked(e.target.value); setPage(1); loadRiders(1, search, e.target.value); }}>
          <option value="">All Riders</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </select>
      </FilterBar>
      <DataTable columns={columns} data={riders} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedRider(null); }} title="Rider Details" maxWidth={600}>
        {selectedRider && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <Avatar firstName={selectedRider.firstName} lastName={selectedRider.lastName} username={selectedRider.username} size={52} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{getFullName(selectedRider)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{selectedRider.phoneNumber} · {selectedRider.country?.name}</div>
                <StatusPill status={selectedRider.riderProfile?.blocked ? 'blocked' : 'active'} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                ['Completed Rides', selectedRider.riderProfile?.completedRides || 0],
                ['Cancelled Rides', selectedRider.riderProfile?.cancelledRides || 0],
                ['Total Spent', `K${parseFloat(selectedRider.riderProfile?.totalSpent || 0).toFixed(2)}`],
                ['Avg Rating', `⭐ ${parseFloat(selectedRider.riderProfile?.averageRating || 0).toFixed(1)}`],
                ['Joined', formatDate(selectedRider.createdAt)],
                ['Last Seen', selectedRider.lastSeen ? formatDate(selectedRider.lastSeen) : '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
