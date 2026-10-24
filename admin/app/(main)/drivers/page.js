// PATH: src/app/(dashboard)/drivers/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import adminAPI from '@/lib/api';
import { adminClient } from '@/lib/api/adminClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName, debounce } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, Modal, StatusPill, Avatar, ConfirmDialog, ActionIcon } from '@/components/UI';
import CountryFilter from '@/components/CountryFilter';

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
  const [filterCountry, setFilterCountry] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [floatTarget, setFloatTarget] = useState(null);
  const [floatAmount, setFloatAmount] = useState('');
  const [debitPartner, setDebitPartner] = useState(false);
  const [floatSaving, setFloatSaving] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [partnerOptions, setPartnerOptions] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const pageSize = 20;

  const loadDrivers = useCallback(async (pg = 1, q = search, vs = filterStatus, ss = filterSubStatus, countryId = filterCountry) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': pg,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'filters[driverProfile][id][$notNull]': true,
        'filters[driverProfile][assignedVehicle][id][$notNull]': true,
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
      if (countryId) params['filters[country][id][$eq]'] = countryId;
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
  }, [search, filterStatus, filterSubStatus, filterCountry]);

  const debouncedSearch = useCallback(debounce((q) => {
    setPage(1);
    loadDrivers(1, q, filterStatus, filterSubStatus, filterCountry);
  }, 400), [filterStatus, filterSubStatus, filterCountry]);

  useEffect(() => { loadDrivers(page); }, [page]);

  const handleSearch = (q) => { setSearch(q); debouncedSearch(q); };

  const handleApprove = async (driver) => {
    if (!canWrite('drivers')) { toast.error('Insufficient permissions'); return false; }
    try {
      const dp = driver.driverProfile;
      if (!dp) { toast.error('No driver profile found'); return false; }
      await adminAPI.put(`/users/${driver.id}`, { driverProfile: { id: dp.id, verificationStatus: 'approved' } });
      toast.success('Driver approved');
      loadDrivers(page);
      return true;
    } catch (err) { toast.error(err.message); return false; }
  };

  const handleReject = async (driver) => {
    if (!canWrite('drivers')) { toast.error('Insufficient permissions'); return false; }
    try {
      const dp = driver.driverProfile;
      if (!dp) { toast.error('No driver profile found'); return false; }
      await adminAPI.put(`/users/${driver.id}`, { driverProfile: { id: dp.id, verificationStatus: 'rejected' } });
      toast.success('Driver rejected');
      loadDrivers(page);
      return true;
    } catch (err) { toast.error(err.message); return false; }
  };

  const handleBlockDriver = async (driver) => {
    if (!canWrite('drivers')) { toast.error('Insufficient permissions'); return false; }
    try {
      const dp = driver.driverProfile;
      const isBlocked = dp?.blocked;
      await adminAPI.put(`/users/${driver.id}`, { driverProfile: { id: dp.id, blocked: !isBlocked, isOnline: false, isAvailable: false } });
      toast.success(`Driver ${isBlocked ? 'unblocked' : 'blocked'}`);
      loadDrivers(page);
      return true;
    } catch (err) { toast.error(err.message); return false; }
  };

  const handleViewDetail = async (driver) => {
    setSelectedDriver(driver);
    setShowDetail(true);
    try {
      const full = await adminAPI.get(`/users/${driver.id}?populate[driverProfile][populate]=assignedVehicle,currentSubscription.subscriptionPlan,subscriptionHistory&populate[country]=*`);
      setSelectedDriver(full);
    } catch (error) {
      toast.error(error.message || 'Could not load driver details');
    }
  };

  const askForConfirmation = (action, driver) => setConfirmation({ action, driver });

  const confirmDriverAction = async () => {
    if (!confirmation) return;
    setConfirmSaving(true);
    try {
      const succeeded = confirmation.action === 'approve'
        ? await handleApprove(confirmation.driver)
        : confirmation.action === 'reject'
          ? await handleReject(confirmation.driver)
          : await handleBlockDriver(confirmation.driver);
      if (succeeded) setConfirmation(null);
    } finally {
      setConfirmSaving(false);
    }
  };

  const handleAddFloat = async () => {
    const amount = Number(floatAmount);
    if (!floatTarget || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid positive float amount');
      return;
    }
    setFloatSaving(true);
    try {
      await adminAPI.post(`/drivers/${floatTarget.id}/float`, {
        amount,
        debitPartner: Boolean(floatTarget.partner && debitPartner),
      });
      toast.success(`K${amount.toFixed(2)} added to ${getFullName(floatTarget)}'s float`);
      setFloatTarget(null);
      setFloatAmount('');
      setDebitPartner(false);
      loadDrivers(page);
    } catch (err) { toast.error(err.message || 'Could not add driver float'); }
    finally { setFloatSaving(false); }
  };

  const openEdit = async driver => {
    const vehicle = driver.driverProfile?.assignedVehicle || {};
    setEditTarget(driver);
    setEditForm({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      address: driver.address || '',
      partnerId: driver.partner?.id ? String(driver.partner.id) : '',
      vehicle: {
        numberPlate: vehicle.numberPlate || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        color: vehicle.color || '',
        insuranceExpiryDate: vehicle.insuranceExpiryDate || '',
      },
    });
    try {
      const response = await adminClient.get('/drivers/partners');
      const list = response?.data ?? response;
      setPartnerOptions(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(error.message || 'Could not load partner accounts');
    }
  };

  const saveDriver = async () => {
    if (!editTarget || !canWrite('drivers')) return;
    setEditSaving(true);
    try {
      await adminAPI.put(`/drivers/${editTarget.id}`, {
        ...editForm,
        partnerId: editForm.partnerId ? Number(editForm.partnerId) : null,
        vehicle: { ...editForm.vehicle, year: Number(editForm.vehicle.year) },
      });
      toast.success('Driver details updated');
      setEditTarget(null);
      loadDrivers(page);
    } catch (error) { toast.error(error.message || 'Could not update driver'); }
    finally { setEditSaving(false); }
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
      key: 'partner', label: 'Partner',
      render: (partner) => partner
        ? <span style={{ fontSize: 12 }}>{partner.partnerProfile?.businessName || getFullName(partner)}</span>
        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No partner</span>,
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
            <button className="btn btn-secondary btn-sm" title="View driver" aria-label="View driver" onClick={() => handleViewDetail(row)}>View</button>
            {canWrite('drivers') && <>
              <button className="btn btn-secondary btn-sm" title="Edit driver" aria-label="Edit driver" onClick={() => openEdit(row)}><ActionIcon name="edit" /></button>
              <button className="btn btn-secondary btn-sm" title="Add float" aria-label="Add float" onClick={() => { setFloatTarget(row); setFloatAmount(''); setDebitPartner(Boolean(row.partner)); }}>
                <ActionIcon name="cash" />
              </button>
            </>}
            {canWrite('drivers') && vs === 'pending' && (
              <>
                <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }} onClick={() => askForConfirmation('approve', row)}>Approve</button>
                <button className="btn btn-danger btn-sm" onClick={() => askForConfirmation('reject', row)}>Reject</button>
              </>
            )}
            {canWrite('drivers') && vs === 'approved' && (
              <button className={`btn btn-sm ${isBlocked ? 'btn-secondary' : 'btn-danger'}`} onClick={() => askForConfirmation('block', row)}>{isBlocked ? 'Unblock' : 'Block'}</button>
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
      <PageHeader title="Drivers" subtitle={`${total.toLocaleString()} drivers`}
        actions={canWrite('drivers') ? <Link className="btn btn-primary btn-sm" href="/drivers/register">+ Add driver</Link> : undefined} />
      <FilterBar>
        <SearchBar value={search} onChange={handleSearch} placeholder="Search drivers..." />
        <select className="input select" style={{ width: 170 }} value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); loadDrivers(1, search, e.target.value, filterSubStatus, filterCountry); }}>
          <option value="">All Verification</option>
          <option value="not_started">Not Started</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <select className="input select" style={{ width: 160 }} value={filterSubStatus}
          onChange={e => { setFilterSubStatus(e.target.value); setPage(1); loadDrivers(1, search, filterStatus, e.target.value, filterCountry); }}>
          <option value="">All Subscriptions</option>
          <option value="inactive">Inactive</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <CountryFilter value={filterCountry} onChange={value => { setFilterCountry(value); setPage(1); loadDrivers(1, search, filterStatus, filterSubStatus, value); }} />
      </FilterBar>
      <DataTable columns={columns} data={drivers} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedDriver(null); }} title="Driver Details" maxWidth={680}>
        {selectedDriver && <DriverDetail driver={selectedDriver} onApprove={() => askForConfirmation('approve', selectedDriver)} onReject={() => askForConfirmation('reject', selectedDriver)} onBlock={() => askForConfirmation('block', selectedDriver)} canWrite={canWrite('drivers')} />}
      </Modal>
      <ConfirmDialog
        open={Boolean(confirmation)}
        onClose={() => setConfirmation(null)}
        onConfirm={confirmDriverAction}
        title={`${confirmation?.action === 'approve' ? 'Approve' : confirmation?.action === 'reject' ? 'Reject' : confirmation?.driver?.driverProfile?.blocked ? 'Unblock' : 'Block'} driver`}
        message={`Confirm this action for ${getFullName(confirmation?.driver || {})}?`}
        confirmLabel={confirmation?.action === 'approve' ? 'Approve driver' : confirmation?.action === 'reject' ? 'Reject driver' : confirmation?.driver?.driverProfile?.blocked ? 'Unblock driver' : 'Block driver'}
        danger={confirmation?.action !== 'approve' && !confirmation?.driver?.driverProfile?.blocked}
        busy={confirmSaving}
      />
      <Modal open={Boolean(floatTarget)} onClose={() => { if (!floatSaving) setFloatTarget(null); }} title="Add driver float" size="sm">
        {floatTarget && (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>{getFullName(floatTarget)} · Current balance K{Number(floatTarget.driverProfile?.floatBalance || 0).toFixed(2)}</p>
            <label className="form-field">
              <span>Amount</span>
              <input className="input" type="number" min="0.01" step="0.01" value={floatAmount} onChange={event => setFloatAmount(event.target.value)} />
            </label>
            {floatTarget.partner && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={debitPartner} onChange={event => setDebitPartner(event.target.checked)} />
                Debit {floatTarget.partner.partnerProfile?.businessName || getFullName(floatTarget.partner)} (default)
              </label>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>This will add float to the driver and record the balance change.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setFloatTarget(null)} disabled={floatSaving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddFloat} disabled={floatSaving}>{floatSaving ? 'Adding…' : 'Confirm add float'}</button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={Boolean(editTarget)} onClose={() => { if (!editSaving) setEditTarget(null); }} title="Edit driver" maxWidth={640}>
        {editTarget && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[
                ['firstName', 'First name'], ['lastName', 'Last name'], ['address', 'Address'],
              ].map(([key, label]) => (
                <label className="form-field" key={key}>
                  <span>{label}</span>
                  <input className="input" value={editForm[key] || ''} onChange={event => setEditForm(current => ({ ...current, [key]: event.target.value }))} />
                </label>
              ))}
              <label className="form-field">
                <span>Partner</span>
                <select className="input select" value={editForm.partnerId} onChange={event => setEditForm(current => ({ ...current, partnerId: event.target.value }))}>
                  <option value="">No partner (independent)</option>
                  {partnerOptions.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
                </select>
              </label>
              {[
                ['numberPlate', 'Number plate'], ['make', 'Make'], ['model', 'Model'], ['year', 'Year'], ['color', 'Color'], ['insuranceExpiryDate', 'Insurance expiry'],
              ].map(([key, label]) => (
                <label className="form-field" key={key}>
                  <span>{label}</span>
                  <input className="input" type={key === 'year' ? 'number' : key === 'insuranceExpiryDate' ? 'date' : 'text'}
                    value={editForm.vehicle?.[key] || ''}
                    onChange={event => setEditForm(current => ({ ...current, vehicle: { ...current.vehicle, [key]: event.target.value } }))} />
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button className="btn btn-secondary" onClick={() => setEditTarget(null)} disabled={editSaving}>Cancel</button>
              <button className="btn btn-primary" onClick={saveDriver} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        )}
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
