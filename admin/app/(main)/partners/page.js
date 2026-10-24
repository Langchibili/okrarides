'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { Avatar, PageHeader, SearchBar, StatusPill, ConfirmDialog } from '@/components/UI';
import CountryFilter from '@/components/CountryFilter';

const PAGE_SIZE = 20;

function records(payload) {
  const data = payload?.data ?? payload;
  return Array.isArray(data) ? data : [];
}

export default function PartnersPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState('');
  const [countryId, setCountryId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminClient.get('/partners', {
        'pagination[page]': page,
        'pagination[pageSize]': PAGE_SIZE,
        sort: 'createdAt:desc',
        ...(countryId ? { 'filters[countryId][$eq]': countryId } : {}),
        ...(search ? { 'filters[$or][0][username][$containsi]': search, 'filters[$or][1][partnerProfile][businessName][$containsi]': search } : {}),
      });
      setPartners(records(result));
      if (result?.meta?.pagination) setPagination(result.meta.pagination);
    } catch (error) {
      toast.error(error.message || 'Could not load partners');
    } finally {
      setLoading(false);
    }
  }, [countryId, page, search, toast]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus() {
    if (!statusTarget) return;
    const { partner, status } = statusTarget;
    setStatusSaving(true);
    try {
      await adminClient.put(`/partners/${partner.id}/status`, { status });
      toast.success(`Partner ${status}`);
      setStatusTarget(null);
      await load();
    } catch (error) {
      toast.error(error.message || `Could not update partner`);
    } finally { setStatusSaving(false); }
  }

  const columns = [
    {
      key: 'username', label: 'Partner',
      render: (_, row) => (
        <div className="admin-user-cell">
          <Avatar firstName={row.firstName} lastName={row.lastName} username={row.username} />
          <span><strong>{row.partnerProfile?.businessName || getFullName(row)}</strong><small>{row.username}</small></span>
        </div>
      ),
    },
    { key: 'phoneNumber', label: 'Phone', render: value => value || '—' },
    { key: 'country', label: 'Country', render: value => value?.name || '—' },
    { key: 'partnerProfile', label: 'Status', render: value => <StatusPill status={value?.verificationStatus || value?.status || 'pending'} /> },
    { key: 'createdAt', label: 'Joined', render: value => formatDate(value) },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => canWrite('partners') ? (
        <div className="row-actions">
          <button className="button button-primary" type="button" onClick={() => setStatusTarget({ partner: row, status: 'approved' })}>Approve</button>
          <button className="button button-danger" type="button" onClick={() => setStatusTarget({ partner: row, status: 'rejected' })}>Reject</button>
        </div>
      ) : null,
    },
  ];

  if (!hasPermission('partners')) {
    return <section className="access-denied"><h1>Partners</h1><p>You do not have permission to view partner accounts.</p></section>;
  }

  return (
    <div>
      <PageHeader title="Partners" subtitle={`${pagination.total.toLocaleString()} partner accounts`} />
      <div className="filter-bar">
        <SearchBar value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Search business or username…" />
        <CountryFilter value={countryId} onChange={value => { setCountryId(value); setPage(1); }} />
      </div>
      <DataTable columns={columns} data={partners} loading={loading} emptyMessage="No partners found." />
      <Pagination page={page} pageCount={pagination.pageCount} total={pagination.total} pageSize={PAGE_SIZE} onChange={setPage} />
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={updateStatus}
        title={`${statusTarget?.status === 'approved' ? 'Approve' : 'Reject'} partner?`}
        message={`Confirm ${statusTarget?.status} status for ${statusTarget?.partner?.partnerProfile?.businessName || getFullName(statusTarget?.partner || {})}?`}
        confirmLabel={statusTarget?.status === 'approved' ? 'Approve partner' : 'Reject partner'}
        danger={statusTarget?.status === 'rejected'}
        busy={statusSaving}
      />
    </div>
  );
}
