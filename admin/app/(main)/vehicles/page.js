// PATH: src/app/(dashboard)/vehicles/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, debounce } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, Modal, StatusPill } from '@/components/UI';

export default function VehiclesPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const pageSize = 20;

  const loadVehicles = useCallback(async (pg = 1, q = search, st = filterStatus, tp = filterType) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': pg,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'populate[owner][fields]': 'firstName,lastName,phoneNumber',
        'populate[taxiType][fields]': 'name',
      };
      if (q) {
        params['filters[$or][0][numberPlate][$containsi]'] = q;
        params['filters[$or][1][make][$containsi]'] = q;
        params['filters[$or][2][model][$containsi]'] = q;
      }
      if (st) params['filters[verificationStatus][$eq]'] = st;
      if (tp) params['filters[vehicleType][$eq]'] = tp;
      const res = await adminAPI.get('/vehicles', params);
      const data = res?.data || res || [];
      const meta = res?.meta?.pagination;
      setVehicles(Array.isArray(data) ? data : []);
      setTotal(meta?.total || (Array.isArray(data) ? data.length : 0));
      setPageCount(meta?.pageCount || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterType]);

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    loadVehicles(1, q, filterStatus, filterType);
  }, 400), [filterStatus, filterType]);

  useEffect(() => { loadVehicles(page); }, [page]);

  const handleApproveVehicle = async (vehicle) => {
    if (!canWrite('vehicles')) return toast.error('Insufficient permissions');
    try {
      await adminAPI.put(`/vehicles/${vehicle.id}`, { data: { verificationStatus: 'approved', isActive: true } });
      toast.success('Vehicle approved');
      loadVehicles(page);
    } catch (err) { toast.error(err.message); }
  };

  const handleRejectVehicle = async (vehicle) => {
    if (!canWrite('vehicles')) return toast.error('Insufficient permissions');
    try {
      await adminAPI.put(`/vehicles/${vehicle.id}`, { data: { verificationStatus: 'rejected', isActive: false } });
      toast.success('Vehicle rejected');
      loadVehicles(page);
    } catch (err) { toast.error(err.message); }
  };

  const columns = [
    {
      key: 'numberPlate', label: 'Plate / Vehicle',
      render: (v, row) => (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{v}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.year} {row.make} {row.model}</div>
        </div>
      ),
    },
    {
      key: 'color', label: 'Color / Type',
      render: (v, row) => (
        <div style={{ fontSize: 12 }}>
          <div>{v || '—'}</div>
          <div style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{row.vehicleType}</div>
        </div>
      ),
    },
    {
      key: 'owner', label: 'Owner',
      render: (v) => v
        ? <div style={{ fontSize: 12 }}><div style={{ fontWeight: 600 }}>{v.firstName} {v.lastName}</div><div style={{ color: 'var(--text-muted)' }}>{v.phoneNumber}</div></div>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>,
    },
    { key: 'verificationStatus', label: 'Verification', render: (v) => <StatusPill status={v || 'not_started'} /> },
    { key: 'isActive', label: 'Active', render: (v) => <StatusPill status={v ? 'active' : 'inactive'} /> },
    {
      key: 'insuranceExpiryDate', label: 'Insurance Expiry',
      render: (v) => {
        if (!v) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
        const expired = new Date(v) < new Date();
        return <span style={{ fontSize: 12, color: expired ? 'var(--danger)' : 'var(--text-secondary)' }}>{expired && '⚠ '}{formatDate(v)}</span>;
      },
    },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedVehicle(row); setShowDetail(true); }}>View</button>
          {canWrite('vehicles') && row.verificationStatus === 'pending' && (
            <>
              <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)' }} onClick={() => handleApproveVehicle(row)}>Approve</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleRejectVehicle(row)}>Reject</button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!hasPermission('vehicles')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Vehicles" subtitle={`${total.toLocaleString()} registered vehicles`} />
      <FilterBar>
        <SearchBar value={search} onChange={q => { setSearch(q); debouncedSearch(q); }} placeholder="Search by plate, make, model..." />
        <select className="input select" style={{ width: 160 }} value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); loadVehicles(1, search, e.target.value, filterType); }}>
          <option value="">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="input select" style={{ width: 140 }} value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); loadVehicles(1, search, filterStatus, e.target.value); }}>
          <option value="">All Types</option>
          <option value="taxi">Taxi</option>
          <option value="bus">Bus</option>
          <option value="motorcycle">Motorcycle</option>
          <option value="truck">Truck</option>
        </select>
      </FilterBar>
      <DataTable columns={columns} data={vehicles} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedVehicle(null); }} title="Vehicle Details" maxWidth={600}>
        {selectedVehicle && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>{selectedVehicle.numberPlate}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selectedVehicle.color} · {selectedVehicle.vehicleType}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <StatusPill status={selectedVehicle.verificationStatus || 'not_started'} />
              <StatusPill status={selectedVehicle.isActive ? 'active' : 'inactive'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Seating Capacity', selectedVehicle.seatingCapacity || '—'],
                ['Vehicle Type', selectedVehicle.vehicleType],
                ['Insurance Expiry', selectedVehicle.insuranceExpiryDate ? formatDate(selectedVehicle.insuranceExpiryDate) : '—'],
                ['Road Tax Expiry', selectedVehicle.roadTaxExpiryDate ? formatDate(selectedVehicle.roadTaxExpiryDate) : '—'],
                ['Fitness Expiry', selectedVehicle.fitnessExpiryDate ? formatDate(selectedVehicle.fitnessExpiryDate) : '—'],
                ['Owner', selectedVehicle.owner ? `${selectedVehicle.owner.firstName} ${selectedVehicle.owner.lastName}` : '—'],
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
