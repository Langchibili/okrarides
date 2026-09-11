// PATH: src/app/(dashboard)/drivers/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName, debounce } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, Modal, StatusPill, Avatar } from '@/components/UI';

export default function DriversPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSubStatus, setFilterSubStatus] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const pageSize = 20;

  const loadDrivers = useCallback(async (pg = 1, q = search, vs = filterStatus, ss = filterSubStatus) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': pg,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'filters[driverProfile][id][$notNull]': true,
        'populate[driverProfile][fields]': 'verificationStatus,floatBalance,withdrawableFloatBalance,completedRides,totalRides,averageRating,isOnline,isAvailable,subscriptionStatus,blocked,totalEarnings',
        'populate[driverProfile][populate][assignedVehicle][fields]': 'numberPlate,make,model,color',
        'populate[country][fields]': 'name,code',
        'fields': 'id,firstName,lastName,phoneNumber,username,createdAt,isOnline',
      };
      if (q) {
        params['filters[$or][0][firstName][$containsi]'] = q;
        params['filters[$or][1][lastName][$containsi]'] = q;
        params['filters[$or][2][phoneNumber][$containsi]'] = q;
      }
      if (vs) params['filters[driverProfile][verificationStatus][$eq]'] = vs;
      if (ss) params['filters[driverProfile][subscriptionStatus][$eq]'] = ss;
      const res = await adminAPI.get('/users', params);
      const data = Array.isArray(res) ? res : (res?.data || []);
      const meta = res?.meta?.pagination;
      setDrivers(data);
      setTotal(meta?.total || data.length);
      setPageCount(meta?.pageCount || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterSubStatus]);

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    loadDrivers(1, q, filterStatus, filterSubStatus);
  }, 400), [filterStatus, filterSubStatus]);

  useEffect(() => { loadDrivers(page); }, [page]);

  const handleSearch = (q) => { setSearch(q); debouncedSearch(q); };

  const handleApprove = async (driver) => {
    if (!canWrite('drivers')) return toast.error('Insufficient permissions');
    try {
      const dp = driver.driverProfile;
      if (!dp) return toast.error('No driver profile found');
      await adminAPI.put(`/users/${driver.id}`, { driverProfile: { id: dp.id, verificationStatus: 'approved' } });
      toast.success('Driver approved');
      loadDrivers(page);
    } catch (err) { toast.error(err.message); }
  };

  const handleReject = async (driver) => {
    if (!canWrite('drivers')) return toast.error('Insufficient permissions');
    try {
      const dp = driver.driverProfile;
      await adminAPI.put(`/users/${driver.id}`, { driverProfile: { id: dp.id, verificationStatus: 'rejected' } });
      toast.success('Driver rejected');
      loadDrivers(page);
    } catch (err) { toast.error(err.message); }
  };

  const handleBlockDriver = async (driver) => {
    if (!canWrite('drivers')) return toast.error('Insufficient permissions');
    try {
      const dp = driver.driverProfile;
      const isBlocked = dp?.blocked;
      await adminAPI.put(`/users/${driver.id}`, { driverProfile: { id: dp.id, blocked: !isBlocked, isOnline: false, isAvailable: false } });
      toast.success(`Driver ${isBlocked ? 'unblocked' : 'blocked'}`);
      loadDrivers(page);
    } catch (err) { toast.error(err.message); }
  };

  const handleViewDetail = async (driver) => {
    setSelectedDriver(driver);
    setShowDetail(true);
    try {
      const full = await adminAPI.get(`/users/${driver.id}?populate[driverProfile][populate]=assignedVehicle,currentSubscription.subscriptionPlan,subscriptionHistory&populate[country]=*`);
      setSelectedDriver(full);
    } catch {}
  };

  const columns = [
    {
      key: 'id', label: 'Driver',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Avatar firstName={row.firstName} lastName={row.lastName} username={row.username} size={32} />
            {row.isOnline && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-surface)' }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{getFullName(row)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.phoneNumber}</div>
          </div>
        </div>
      ),
    },
    { key: 'driverProfile.verificationStatus', label: 'Verification', render: (_, row) => <StatusPill status={row.driverProfile?.verificationStatus || 'not_started'} /> },
    {
      key: 'driverProfile.floatBalance', label: 'Float Balance',
      render: (_, row) => {
        const bal = parseFloat(row.driverProfile?.floatBalance || 0);
        return <span style={{ fontWeight: 600, color: bal < 0 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>K{bal.toFixed(2)}</span>;
      },
    },
    { key: 'driverProfile.subscriptionStatus', label: 'Subscription', render: (_, row) => <StatusPill status={row.driverProfile?.subscriptionStatus || 'inactive'} /> },
    { key: 'driverProfile.completedRides', label: 'Rides', render: (_, row) => <span style={{ fontSize: 12 }}>{row.driverProfile?.completedRides || 0}</span> },
    {
      key: 'driverProfile.averageRating', label: 'Rating',
      render: (_, row) => {
        const r = parseFloat(row.driverProfile?.averageRating || 0);
        return r > 0 ? <span style={{ fontSize: 12 }}>⭐ {r.toFixed(1)}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
      },
    },
    {
      key: 'driverProfile.assignedVehicle', label: 'Vehicle',
      render: (_, row) => {
        const v = row.driverProfile?.assignedVehicle;
        return v
          ? <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.make} {v.model} · <span style={{ fontFamily: 'var(--font-mono)' }}>{v.numberPlate}</span></span>
          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No vehicle</span>;
      },
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => {
        const vs = row.driverProfile?.verificationStatus;
        const isBlocked = row.driverProfile?.blocked;
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(row)}>View</button>
            {canWrite('drivers') && vs === 'pending' && (
              <>
                <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }} onClick={() => handleApprove(row)}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleReject(row)}>Reject</button>
              </>
            )}
            {canWrite('drivers') && vs === 'approved' && (
              <button className={`btn btn-sm ${isBlocked ? 'btn-secondary' : 'btn-danger'}`} onClick={() => handleBlockDriver(row)}>{isBlocked ? 'Unblock' : 'Block'}</button>
            )}
          </div>
        );
      },
    },
  ];

  if (!hasPermission('drivers')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Drivers" subtitle={`${total.toLocaleString()} drivers`} />
      <FilterBar>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search drivers..." />
        <select className="input select" style={{ width: 170 }} value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); loadDrivers(1, search, e.target.value, filterSubStatus); }}>
          <option value="">All Verification</option>
          <option value="not_started">Not Started</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <select className="input select" style={{ width: 160 }} value={filterSubStatus}
          onChange={e => { setFilterSubStatus(e.target.value); setPage(1); loadDrivers(1, search, filterStatus, e.target.value); }}>
          <option value="">All Subscriptions</option>
          <option value="inactive">Inactive</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </FilterBar>
      <DataTable columns={columns} data={drivers} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedDriver(null); }} title="Driver Details" maxWidth={680}>
        {selectedDriver && <DriverDetail driver={selectedDriver} onApprove={handleApprove} onReject={handleReject} onBlock={handleBlockDriver} canWrite={canWrite('drivers')} />}
      </Modal>
    </div>
  );
}

function DriverDetail({ driver, onApprove, onReject, onBlock, canWrite }) {
  const dp = driver.driverProfile;
  if (!dp) return <p style={{ color: 'var(--text-muted)' }}>No driver profile found.</p>;
  const sub = dp.currentSubscription;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <Avatar firstName={driver.firstName} lastName={driver.lastName} username={driver.username} size={52} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{getFullName(driver)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{driver.phoneNumber} · {driver.country?.name}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <StatusPill status={dp.verificationStatus || 'not_started'} />
            <StatusPill status={dp.subscriptionStatus || 'inactive'} />
            {dp.blocked && <StatusPill status="blocked" />}
            {driver.isOnline && <span className="pill pill-success">🟢 Online</span>}
          </div>
        </div>
        {canWrite && (
          <div style={{ display: 'flex', gap: 6 }}>
            {dp.verificationStatus === 'pending' && (
              <>
                <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)' }} onClick={() => onApprove(driver)}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => onReject(driver)}>Reject</button>
              </>
            )}
            {dp.verificationStatus === 'approved' && (
              <button className={`btn btn-sm ${dp.blocked ? 'btn-secondary' : 'btn-danger'}`} onClick={() => onBlock(driver)}>{dp.blocked ? 'Unblock' : 'Block'}</button>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          ['Float Balance', `K${parseFloat(dp.floatBalance || 0).toFixed(2)}`, dp.floatBalance < 0 ? 'var(--danger)' : 'var(--text-primary)'],
          ['Withdrawable Float', `K${parseFloat(dp.withdrawableFloatBalance || 0).toFixed(2)}`],
          ['Total Earnings', `K${parseFloat(dp.totalEarnings || 0).toFixed(2)}`],
          ['Completed Rides', dp.completedRides || 0],
          ['Avg Rating', dp.averageRating ? `⭐ ${parseFloat(dp.averageRating).toFixed(1)}` : '—'],
          ['Acceptance Rate', dp.acceptanceRate ? `${dp.acceptanceRate}%` : '—'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>
      {dp.assignedVehicle && (
        <div style={{ marginBottom: 16, background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Assigned Vehicle</div>
          <div style={{ fontSize: 13 }}>{dp.assignedVehicle.color} {dp.assignedVehicle.make} {dp.assignedVehicle.model} · <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{dp.assignedVehicle.numberPlate}</span></div>
        </div>
      )}
      {sub && (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Current Subscription</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{sub.subscriptionPlan?.name || 'Unknown Plan'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expires: {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : '—'}</div>
            </div>
            <StatusPill status={sub.subscriptionStatus} />
          </div>
        </div>
      )}
    </div>
  );
}
