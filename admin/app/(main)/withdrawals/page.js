// app/(main)/withdrawals/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal, { ConfirmModal } from '@/components/admin/Modal';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';

export default function WithdrawalsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detail, setDetail] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionNote, setActionNote] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = filterStatus ? { withdrawalStatus: filterStatus } : {};
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'withdrawalId', filters, populate: ['user', 'processedBy', 'currency'] });
      const res = await adminClient.get(`/withdrawals${q}&sort=requestedAt:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { load(1); }, [load]);

  const updateStatus = async (id, status, note = '') => {
    try {
      await adminClient.put(`/withdrawals/${id}`, {
        data: {
          withdrawalStatus: status,
          ...(note && { notes: note }),
          processedAt: new Date().toISOString(),
        }
      });
      setApproveTarget(null); setRejectTarget(null);
      setActionNote('');
      load(pagination.page);
    } catch (e) { alert(e.message); }
  };

  const columns = [
    {
      key: 'requestedAt', label: 'Date', width: 140,
      render: v => v ? <div><div className="text-sm">{new Date(v).toLocaleDateString()}</div><div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div></div> : '—'
    },
    { key: 'withdrawalId', label: 'ID', render: v => <span className="font-mono text-xs text-blue-600">{v}</span> },
    {
      key: 'user', label: 'User',
      render: v => v ? <div><div className="font-medium text-sm">{v.firstName} {v.lastName}</div><div className="text-xs text-gray-400">{v.phoneNumber}</div></div> : '—'
    },
    { key: 'amount', label: 'Amount', render: (v, row) => <span className="font-semibold text-green-600">{row.currency?.symbol || 'K'}{Number(v).toFixed(2)}</span> },
    { key: 'method', label: 'Method', render: v => <span className="capitalize text-sm">{v?.replace(/_/g, ' ') || '—'}</span> },
    { key: 'provider', label: 'Provider', render: v => v || '—' },
    { key: 'accountNumber', label: 'Account', render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'withdrawalStatus', label: 'Status', render: v => <StatusBadge status={v || 'pending'} /> },
    {
      key: 'id', label: 'Actions', width: 160,
      render: (_, row) => (
        <div className="flex gap-1.5">
          <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn>
          {row.withdrawalStatus === 'pending' && (
            <>
              <Btn size="sm" variant="success" onClick={() => setApproveTarget(row)}>✓</Btn>
              <Btn size="sm" variant="danger" onClick={() => setRejectTarget(row)}>✗</Btn>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Withdrawals" description="Driver and affiliate withdrawal requests" />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by withdrawal ID…" />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All statuses</option>
          {['pending','processing','completed','failed','cancelled'].map(s => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterStatus(''); }}>Clear</Btn>
      </div>

      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No withdrawals found" />

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Withdrawal Detail" size="md">
        {detail && (
          <div className="space-y-2">
            {[
              ['Withdrawal ID', detail.withdrawalId, true],
              ['User', detail.user ? `${detail.user.firstName} ${detail.user.lastName} (${detail.user.phoneNumber})` : '—'],
              ['Amount', `K${Number(detail.amount).toFixed(2)}`],
              ['Method', detail.method],
              ['Provider', detail.provider],
              ['Account Number', detail.accountNumber, true],
              ['Account Name', detail.accountName],
              ['Status', detail.withdrawalStatus],
              ['Gateway Reference', detail.gatewayReference, true],
              ['Requested At', detail.requestedAt ? new Date(detail.requestedAt).toLocaleString() : '—'],
              ['Processed At', detail.processedAt ? new Date(detail.processedAt).toLocaleString() : '—'],
              ['Balance Before', detail.balanceBefore != null ? `K${Number(detail.balanceBefore).toFixed(2)}` : '—'],
              ['Balance After', detail.balanceAfter != null ? `K${Number(detail.balanceAfter).toFixed(2)}` : '—'],
              ['Failure Reason', detail.failureReason],
              ['Notes', detail.notes],
            ].map(([l, v, mono]) => (
              <div key={l} className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-medium text-gray-400 w-36 shrink-0 uppercase tracking-wide pt-0.5">{l}</span>
                <span className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>{v || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Approve modal */}
      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Withdrawal" size="sm">
        <p className="text-gray-600 mb-4">Approve withdrawal of <strong>K{Number(approveTarget?.amount || 0).toFixed(2)}</strong> for <strong>{approveTarget?.user?.firstName} {approveTarget?.user?.lastName}</strong>?</p>
        <textarea
          value={actionNote}
          onChange={e => setActionNote(e.target.value)}
          placeholder="Optional note…"
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 resize-none"
        />
        <div className="flex justify-end gap-3">
          <Btn variant="secondary" onClick={() => setApproveTarget(null)}>Cancel</Btn>
          <Btn variant="success" onClick={() => updateStatus(approveTarget.id, 'completed', actionNote)}>Approve</Btn>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Withdrawal" size="sm">
        <p className="text-gray-600 mb-4">Reject withdrawal of <strong>K{Number(rejectTarget?.amount || 0).toFixed(2)}</strong>?</p>
        <textarea
          value={actionNote}
          onChange={e => setActionNote(e.target.value)}
          placeholder="Reason for rejection (required)…"
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 resize-none"
        />
        <div className="flex justify-end gap-3">
          <Btn variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={() => updateStatus(rejectTarget.id, 'failed', actionNote)}>Reject</Btn>
        </div>
      </Modal>
    </div>
  );
}