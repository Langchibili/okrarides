// PATH: src/app/(dashboard)/rides/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDateTime, getFullName, debounce } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, Modal, StatusPill, Avatar } from '@/components/UI';

export default function RidesPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const pageSize = 20;

  const loadRides = useCallback(async (pg = 1, q = search, st = filterStatus, pm = filterPayment) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': pg,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'populate[rider][fields]': 'firstName,lastName,phoneNumber',
        'populate[driver][fields]': 'firstName,lastName,phoneNumber',
        'populate[rideClass][fields]': 'name',
        'populate[taxiType][fields]': 'name',
      };
      if (q) params['filters[rideCode][$containsi]'] = q;
      if (st) params['filters[rideStatus][$eq]'] = st;
      if (pm) params['filters[paymentMethod][$eq]'] = pm;
      const res = await adminAPI.get('/rides', params);
      const data = res?.data || res || [];
      const meta = res?.meta?.pagination;
      setRides(Array.isArray(data) ? data : []);
      setTotal(meta?.total || (Array.isArray(data) ? data.length : 0));
      setPageCount(meta?.pageCount || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPayment]);

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    loadRides(1, q, filterStatus, filterPayment);
  }, 400), [filterStatus, filterPayment]);

  useEffect(() => { loadRides(page); }, [page]);

  const handleSearch = (q) => { setSearch(q); debouncedSearch(q); };

  const handleViewDetail = async (ride) => {
    setSelectedRide(ride);
    setShowDetail(true);
    try {
      const full = await adminAPI.get(`/rides/${ride.id}?populate=rider,driver,vehicle,rideClass,taxiType,promoCode`);
      const r = full?.data || full;
      setSelectedRide(r);
    } catch {}
  };

  const columns = [
    { key: 'rideCode', label: 'Ride Code', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{v}</span> },
    {
      key: 'rider', label: 'Rider',
      render: (v) => v
        ? <div style={{ fontSize: 12 }}><div style={{ fontWeight: 600 }}>{getFullName(v)}</div><div style={{ color: 'var(--text-muted)' }}>{v.phoneNumber}</div></div>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    { key: 'driver', label: 'Driver', render: (v) => v ? <span style={{ fontSize: 12 }}>{getFullName(v)}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not assigned</span> },
    { key: 'rideClass', label: 'Class', render: (v) => <span style={{ fontSize: 12 }}>{v?.name || '—'}</span> },
    { key: 'rideStatus', label: 'Status', render: (v) => <StatusPill status={v} /> },
    { key: 'totalFare', label: 'Fare', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>K{parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'paymentMethod', label: 'Payment', render: (v) => <span className={`pill ${v === 'cash' ? 'pill-warning' : 'pill-info'}`}>{v || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(v)}</span> },
    { key: 'actions', label: '', align: 'right', render: (_, row) => <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(row)}>View</button> },
  ];

  if (!hasPermission('rides')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Rides" subtitle={`${total.toLocaleString()} total rides`} />
      <FilterBar>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by ride code..." />
        <select className="input select" style={{ width: 170 }} value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); loadRides(1, search, e.target.value, filterPayment); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="arrived">Arrived</option>
          <option value="passenger_onboard">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_drivers_available">No Drivers</option>
        </select>
        <select className="input select" style={{ width: 140 }} value={filterPayment}
          onChange={e => { setFilterPayment(e.target.value); setPage(1); loadRides(1, search, filterStatus, e.target.value); }}>
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="okrapay">OkraPay</option>
        </select>
      </FilterBar>
      <DataTable columns={columns} data={rides} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedRide(null); }} title="Ride Details" maxWidth={680}>
        {selectedRide && <RideDetail ride={selectedRide} />}
      </Modal>
    </div>
  );
}

function RideDetail({ ride }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>{ride.rideCode}</span>
        <StatusPill status={ride.rideStatus} />
        <span className={`pill ${ride.paymentMethod === 'cash' ? 'pill-warning' : 'pill-info'}`}>{ride.paymentMethod}</span>
        {ride.wasSubscriptionRide && <span className="pill pill-purple">Subscription Ride</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Rider</div>
          {ride.rider
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar firstName={ride.rider.firstName} lastName={ride.rider.lastName} size={28} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{getFullName(ride.rider)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ride.rider.phoneNumber}</div>
                </div>
              </div>
            : <span style={{ color: 'var(--text-muted)' }}>—</span>
          }
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Driver</div>
          {ride.driver
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar firstName={ride.driver.firstName} lastName={ride.driver.lastName} size={28} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{getFullName(ride.driver)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ride.driver.phoneNumber}</div>
                </div>
              </div>
            : <span style={{ color: 'var(--text-muted)' }}>Not assigned</span>
          }
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          ['Total Fare', `K${parseFloat(ride.totalFare || 0).toFixed(2)}`],
          ['Commission', `K${parseFloat(ride.commission || 0).toFixed(2)}`],
          ['Driver Earnings', `K${parseFloat(ride.driverEarnings || 0).toFixed(2)}`],
          ['Distance', ride.actualDistance ? `${parseFloat(ride.actualDistance).toFixed(1)}km` : ride.estimatedDistance ? `~${parseFloat(ride.estimatedDistance).toFixed(1)}km` : '—'],
          ['Duration', ride.actualDuration ? `${ride.actualDuration} min` : ride.estimatedDuration ? `~${ride.estimatedDuration} min` : '—'],
          ['Ride Class', ride.rideClass?.name || '—'],
        ].map(([l, v]) => (
          <div key={l} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>
      {(ride.pickupLocation || ride.dropoffLocation) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ride.pickupLocation && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--success)', marginBottom: 2, fontWeight: 600 }}>📍 PICKUP</div>
              <div style={{ fontSize: 12 }}>{ride.pickupLocation.address || `${ride.pickupLocation.lat?.toFixed(4)}, ${ride.pickupLocation.lng?.toFixed(4)}`}</div>
            </div>
          )}
          {ride.dropoffLocation && (
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--danger)', marginBottom: 2, fontWeight: 600 }}>📍 DROPOFF</div>
              <div style={{ fontSize: 12 }}>{ride.dropoffLocation.address || `${ride.dropoffLocation.lat?.toFixed(4)}, ${ride.dropoffLocation.lng?.toFixed(4)}`}</div>
            </div>
          )}
        </div>
      )}
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Requested: {ride.requestedAt ? formatDateTime(ride.requestedAt) : '—'}</span>
        {ride.acceptedAt && <span>· Accepted: {formatDateTime(ride.acceptedAt)}</span>}
        {ride.tripCompletedAt && <span>· Completed: {formatDateTime(ride.tripCompletedAt)}</span>}
      </div>
    </div>
  );
}
