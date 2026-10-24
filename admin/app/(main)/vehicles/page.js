// PATH: src/app/(dashboard)/vehicles/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, debounce } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, Modal, StatusPill, ConfirmDialog } from '@/components/UI';
import CountryFilter from '@/components/CountryFilter';

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
  const [filterCountry, setFilterCountry] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const pageSize = 20;

  const loadVehicles = useCallback(async (pg = 1, q = search, st = filterStatus, tp = filterType, countryId = filterCountry) => {
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
      if (countryId) params['filters[countryId][$eq]'] = countryId;
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
  }, [search, filterStatus, filterType, filterCountry]);

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    loadVehicles(1, q, filterStatus, filterType, filterCountry);
  }, 400), [filterStatus, filterType, filterCountry]);

  useEffect(() => { loadVehicles(page); }, [page]);

  const handleApproveVehicle = async (vehicle) => {
    if (!canWrite('vehicles')) { toast.error('Insufficient permissions'); return false; }
    try {
      await adminAPI.put(`/vehicles/${vehicle.id}`, { data: { verificationStatus: 'approved', isActive: true } });
      toast.success('Vehicle approved');
      loadVehicles(page);
      return true;
    } catch (err) { toast.error(err.message); return false; }
  };

  const handleRejectVehicle = async (vehicle) => {
    if (!canWrite('vehicles')) { toast.error('Insufficient permissions'); return false; }
    try {
      await adminAPI.put(`/vehicles/${vehicle.id}`, { data: { verificationStatus: 'rejected', isActive: false } });
      toast.success('Vehicle rejected');
      loadVehicles(page);
      return true;
    } catch (err) { toast.error(err.message); return false; }
  };

  const confirmVehicleStatus = async () => {
    if (!confirmation) return;
    setConfirmSaving(true);
    try {
      const succeeded = confirmation.status === 'approved'
        ? await handleApproveVehicle(confirmation.vehicle)
        : await handleRejectVehicle(confirmation.vehicle);
      if (succeeded) setConfirmation(null);
    } finally { setConfirmSaving(false); }
  };

  const openEdit = vehicle => {
    setEditTarget(vehicle);
    setEditForm({
      numberPlate: vehicle.numberPlate || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      verificationStatus: vehicle.verificationStatus || 'pending',
      isActive: Boolean(vehicle.isActive),
    });
  };

  const saveVehicle = async () => {
    if (!editTarget || !canWrite('vehicles')) return;
    setEditSaving(true);
    try {
      await adminAPI.put(`/vehicles/${editTarget.id}`, { data: { ...editForm, year: Number(editForm.year) || null } });
      toast.success('Vehicle updated');
      setEditTarget(null);
      loadVehicles(page);
    } catch (error) { toast.error(error.message || 'Could not update vehicle'); }
    finally { setEditSaving(false); }
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
          {canWrite('vehicles') && <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)} aria-label="Edit vehicle" title="Edit vehicle">✏</button>}
          {canWrite('vehicles') && row.verificationStatus === 'pending' && <>
            <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)' }} onClick={() => setConfirmation({ vehicle: row, status: 'approved' })}>Approve</button>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmation({ vehicle: row, status: 'rejected' })}>Reject</button>
          </>}
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
          onChange={e => { setFilterStatus(e.target.value); setPage(1); loadVehicles(1, search, e.target.value, filterType, filterCountry); }}>
          <option value="">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="input select" style={{ width: 140 }} value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); loadVehicles(1, search, filterStatus, e.target.value, filterCountry); }}>
          <option value="">All Types</option>
          <option value="taxi">Taxi</option>
          <option value="bus">Bus</option>
          <option value="motorcycle">Motorcycle</option>
          <option value="truck">Truck</option>
        </select>
        <CountryFilter value={filterCountry} onChange={value => { setFilterCountry(value); setPage(1); loadVehicles(1, search, filterStatus, filterType, value); }} />
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
      <Modal open={Boolean(editTarget)} onClose={() => { if (!editSaving) setEditTarget(null); }} title="Edit vehicle" size="md">
        {editTarget && <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['numberPlate', 'Number plate'], ['make', 'Make'], ['model', 'Model'],
              ['year', 'Year'], ['color', 'Color'],
            ].map(([key, label]) => <label className="form-field" key={key}><span>{label}</span>
              <input className="input" type={key === 'year' ? 'number' : 'text'} value={editForm[key] || ''} onChange={event => setEditForm(current => ({ ...current, [key]: event.target.value }))} />
            </label>)}
            <label className="form-field"><span>Verification</span>
              <select className="input select" value={editForm.verificationStatus} onChange={event => setEditForm(current => ({ ...current, verificationStatus: event.target.value }))}>
                {['not_started', 'pending', 'approved', 'rejected'].map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={editForm.isActive} onChange={event => setEditForm(current => ({ ...current, isActive: event.target.checked }))} /> Active</label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setEditTarget(null)} disabled={editSaving}>Cancel</button>
            <button className="btn btn-primary" onClick={saveVehicle} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>}
      </Modal>
      <ConfirmDialog
        open={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        onConfirm={confirmVehicleStatus}
        title={`${confirmation?.status === 'approved' ? 'Approve' : 'Reject'} vehicle?`}
        message={`Confirm ${confirmation?.status} for vehicle ${confirmation?.vehicle?.numberPlate || ''}?`}
        confirmLabel={confirmation?.status === 'approved' ? 'Approve vehicle' : 'Reject vehicle'}
        danger={confirmation?.status === 'rejected'}
        busy={confirmSaving}
      />
    </div>
  );
}
