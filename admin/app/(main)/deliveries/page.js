// PATH: src/app/(dashboard)/deliveries/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDateTime, getFullName, debounce } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, Modal, StatusPill } from '@/components/UI';

export default function DeliveriesPage() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const pageSize = 20;

  const loadDeliveries = useCallback(async (pg = 1, q = search, st = filterStatus) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': pg,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'populate[sender][fields]': 'firstName,lastName,phoneNumber',
        'populate[deliverer][fields]': 'firstName,lastName,phoneNumber',
        'populate[package][fields]': 'packageType,weight,fragile',
      };
      if (q) params['filters[rideCode][$containsi]'] = q;
      if (st) params['filters[rideStatus][$eq]'] = st;
      const res = await adminAPI.get('/deliveries', params);
      const data = res?.data || res || [];
      const meta = res?.meta?.pagination;
      setDeliveries(Array.isArray(data) ? data : []);
      setTotal(meta?.total || (Array.isArray(data) ? data.length : 0));
      setPageCount(meta?.pageCount || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    loadDeliveries(1, q, filterStatus);
  }, 400), [filterStatus]);

  useEffect(() => { loadDeliveries(page); }, [page]);

  function handleSearch(q) { setSearch(q); debouncedSearch(q); }

  const columns = [
    { key: 'rideCode', label: 'Delivery Code', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{v}</span> },
    {
      key: 'sender', label: 'Sender',
      render: (v) => v
        ? <div style={{ fontSize: 12 }}><div style={{ fontWeight: 600 }}>{getFullName(v)}</div><div style={{ color: 'var(--text-muted)' }}>{v.phoneNumber}</div></div>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    { key: 'deliverer', label: 'Deliverer', render: (v) => v ? <span style={{ fontSize: 12 }}>{getFullName(v)}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Not assigned</span> },
    {
      key: 'package', label: 'Package',
      render: (v) => v
        ? <div style={{ fontSize: 12 }}>
            <span style={{ textTransform: 'capitalize' }}>{v.packageType || 'parcel'}</span>
            {v.weight && <span style={{ color: 'var(--text-muted)' }}> · {v.weight}kg</span>}
            {v.fragile && <span style={{ color: 'var(--warning)' }}> ⚠</span>}
          </div>
        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>,
    },
    { key: 'rideStatus', label: 'Status', render: (v) => <StatusPill status={v} /> },
    { key: 'totalFare', label: 'Fare', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>K{parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'paymentMethod', label: 'Payment', render: (v) => <span className={`pill ${v === 'cash' ? 'pill-warning' : 'pill-info'}`}>{v || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(v)}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedDelivery(row); setShowDetail(true); }}>View</button>,
    },
  ];

  if (!hasPermission('rides')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Deliveries" subtitle={`${total.toLocaleString()} total deliveries`} />
      <FilterBar>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by delivery code..." />
        <select className="input select" style={{ width: 170 }} value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); loadDeliveries(1, search, e.target.value); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="arrived">Arrived</option>
          <option value="passenger_onboard">In Transit</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </FilterBar>
      <DataTable columns={columns} data={deliveries} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedDelivery(null); }} title="Delivery Details" maxWidth={600}>
        {selectedDelivery && (
          <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>{selectedDelivery.rideCode}</span>
              <StatusPill status={selectedDelivery.rideStatus} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                ['Total Fare', `K${parseFloat(selectedDelivery.totalFare || 0).toFixed(2)}`],
                ['Commission', `K${parseFloat(selectedDelivery.commission || 0).toFixed(2)}`],
                ['Driver Earnings', `K${parseFloat(selectedDelivery.driverEarnings || 0).toFixed(2)}`],
                ['Est. Distance', selectedDelivery.estimatedDistance ? `${parseFloat(selectedDelivery.estimatedDistance).toFixed(1)}km` : '—'],
                ['Payment Method', selectedDelivery.paymentMethod || '—'],
                ['Payment Status', selectedDelivery.paymentStatus || '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
