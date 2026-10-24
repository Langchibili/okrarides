'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, SearchBar, FilterBar, StatusPill, Avatar } from '@/components/UI';
import CountryFilter from '@/components/CountryFilter';

export default function DeliverersPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [deliverers, setDeliverers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryId, setCountryId] = useState('');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const loadDeliverers = useCallback(async (currentPage = page, currentSearch = search, selectedCountry = countryId) => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': currentPage,
        'pagination[pageSize]': pageSize,
        'sort': 'createdAt:desc',
        'filters[deliveryProfile][id][$notNull]': true,
        'filters[deliveryProfile][activeVehicleType][$ne]': 'none',
        'populate[deliveryProfile]': '*',
        'populate[partner]': '*',
        'populate[country][fields]': 'name,code',
        'fields': 'id,firstName,lastName,phoneNumber,username,createdAt',
      };
      if (currentSearch) {
        params['filters[$or][0][firstName][$containsi]'] = currentSearch;
        params['filters[$or][1][lastName][$containsi]'] = currentSearch;
        params['filters[$or][2][phoneNumber][$containsi]'] = currentSearch;
      }
      if (selectedCountry) params['filters[country][id][$eq]'] = selectedCountry;
      const result = await adminAPI.get('/users', params);
      const rows = result?.data || result || [];
      setDeliverers(Array.isArray(rows) ? rows : []);
      setTotal(result?.meta?.pagination?.total || rows.length || 0);
      setPageCount(result?.meta?.pagination?.pageCount || 1);
    } catch (error) {
      toast.error(error.message || 'Could not load deliverers');
    } finally {
      setLoading(false);
    }
  }, [countryId, page, search, toast]);

  useEffect(() => { loadDeliverers(page); }, [loadDeliverers, page]);

  const columns = [
    {
      key: 'id', label: 'Deliverer',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar firstName={row.firstName} lastName={row.lastName} username={row.username} size={30} />
          <div><div style={{ fontWeight: 600 }}>{getFullName(row)}</div><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{row.phoneNumber}</div></div>
        </div>
      ),
    },
    { key: 'country', label: 'Country', render: country => country?.name || '—' },
    {
      key: 'partner', label: 'Partner',
      render: partner => partner
        ? partner.partnerProfile?.businessName || getFullName(partner)
        : <span style={{ color: 'var(--text-muted)' }}>No partner</span>,
    },
    {
      key: 'deliveryProfile', label: 'Vehicle',
      render: profile => {
        const type = profile?.activeVehicleType;
        const vehicle = profile?.[type]?.vehicle;
        return vehicle
          ? `${vehicle.make || ''} ${vehicle.model || ''} · ${vehicle.numberPlate || ''}`
          : type || '—';
      },
    },
    { key: 'deliveryProfile.verificationStatus', label: 'Verification', render: (_, row) => <StatusPill status={row.deliveryProfile?.verificationStatus || 'not_started'} /> },
    { key: 'createdAt', label: 'Joined', render: value => formatDate(value) },
  ];

  if (!hasPermission('drivers')) return <div className="access-denied" role="alert">Access denied.</div>;

  return (
    <div>
      <PageHeader title="Deliverers" subtitle={`${total.toLocaleString()} delivery drivers`}
        actions={canWrite('drivers') ? <Link className="btn btn-primary btn-sm" href="/drivers/register">+ Add deliverer</Link> : undefined} />
      <FilterBar>
        <SearchBar value={search} onChange={value => { setSearch(value); setPage(1); loadDeliverers(1, value, countryId); }} placeholder="Search deliverers..." />
        <CountryFilter value={countryId} onChange={value => { setCountryId(value); setPage(1); loadDeliverers(1, search, value); }} />
      </FilterBar>
      <DataTable columns={columns} data={deliverers} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
    </div>
  );
}
