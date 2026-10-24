'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient } from '@/lib/api/adminClient';
import { useAuth } from '@/lib/auth';
import DataTable from '@/components/admin/DataTable';
import { PageHeader, StatusBadge } from '@/components/admin/PageHeader';

export default function OtpVerificationsPage() {
  const { isSuperAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await adminClient.get(`/otp-verifications?pagination[page]=${page}&pagination[pageSize]=25`);
      setRecords(Array.isArray(response?.data) ? response.data : []);
      if (response?.meta?.pagination) setPagination(response.meta.pagination);
    } catch (requestError) {
      setError(requestError.message || 'Could not load OTP verification records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin, load]);

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-gray-500" role="alert">Only a Strapi Super Admin can view OTP verification records.</div>;
  }

  const columns = [
    {
      key: 'email',
      label: 'Email / phone',
      render: (email, row) => <span className="font-mono text-xs">{email || row.phoneNumber || '—'}</span>,
    },
    { key: 'purpose', label: 'Purpose', render: value => value?.replace(/_/g, ' ') || '—' },
    { key: 'verified', label: 'Verified', render: value => <StatusBadge status={value ? 'verified' : 'pending'} /> },
    { key: 'expiresAt', label: 'Expires', render: value => value ? new Date(value).toLocaleString() : '—' },
    { key: 'attempts', label: 'Attempts', render: (value, row) => `${value ?? 0} / ${row.maxAttempts ?? '—'}` },
    { key: 'verifiedAt', label: 'Verified at', render: value => value ? new Date(value).toLocaleString() : '—' },
    { key: 'createdAt', label: 'Created', render: value => value ? new Date(value).toLocaleString() : '—' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="OTP Verifications"
        description={`${pagination.total.toLocaleString()} verification records`}
      />
      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        One-time verification codes are authentication secrets and are never displayed here. This screen shows record status and delivery identifiers only.
      </p>
      {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        pagination={pagination}
        onPageChange={load}
        emptyMessage="No OTP verification records found"
      />
    </div>
  );
}
