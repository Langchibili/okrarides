// app/(main)/audit-logs/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import { PageHeader, SearchBar, StatusBadge, Btn } from '@/components/admin/PageHeader';
import Modal from '@/components/admin/Modal';

const ACTION_COLORS = {
  user_registration: 'bg-green-100 text-green-700',
  driver_approved: 'bg-blue-100 text-blue-700',
  ride_completed: 'bg-purple-100 text-purple-700',
  withdrawal_processed: 'bg-orange-100 text-orange-700',
  suspension: 'bg-red-100 text-red-700',
  settings_updated: 'bg-yellow-100 text-yellow-700',
};

export default function AuditLogsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterActorType, setFilterActorType] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = {};
      if (filterAction) filters.action = filterAction;
      if (filterActorType) filters.actorType = filterActorType;
      const q = buildQuery({ page, pageSize: 20, search, searchField: 'action', filters, populate: ['actor'] });
      const res = await adminClient.get(`/audit-logs${q}&sort=timestamp:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterAction, filterActorType]);

  useEffect(() => { load(1); }, [load]);

  const columns = [
    {
      key: 'timestamp', label: 'Time', width: 160,
      render: v => v ? (
        <div>
          <div className="text-sm">{new Date(v).toLocaleDateString()}</div>
          <div className="text-xs text-gray-400">{new Date(v).toLocaleTimeString()}</div>
        </div>
      ) : '—'
    },
    {
      key: 'action', label: 'Action',
      render: v => {
        const cls = ACTION_COLORS[v] || 'bg-gray-100 text-gray-600';
        return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{v?.replace(/_/g, ' ')}</span>;
      }
    },
    {
      key: 'actor', label: 'Actor',
      render: (v, row) => (
        <div>
          <div className="text-sm">{v?.firstName || v?.username || `#${v?.id || '?'}`}</div>
          <div className="text-xs text-gray-400 capitalize">{row.actorType}</div>
        </div>
      )
    },
    {
      key: 'metadata', label: 'Summary',
      render: v => {
        if (!v) return <span className="text-gray-400">—</span>;
        const entries = Object.entries(v).slice(0, 2);
        return (
          <div className="text-xs text-gray-500">
            {entries.map(([k, val]) => <span key={k} className="mr-2"><span className="text-gray-400">{k}:</span> {String(val).slice(0, 30)}</span>)}
          </div>
        );
      }
    },
    {
      key: 'id', label: '', width: 70,
      render: (_, row) => <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn>
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Audit Logs"
        description="Full trail of system events, user actions and admin changes"
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search action…" />
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All actions</option>
          {['user_registration','driver_approved','ride_completed','withdrawal_processed','settings_updated','suspension','login','logout'].map(a => (
            <option key={a} value={a} className="capitalize">{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={filterActorType}
          onChange={e => setFilterActorType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All actor types</option>
          {['user','driver','admin','system'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <Btn variant="secondary" onClick={() => { setSearch(''); setFilterAction(''); setFilterActorType(''); }}>Clear</Btn>
      </div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} emptyMessage="No audit log entries found" />

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Audit Log Detail" size="md">
        {detail && (
          <div className="space-y-4">
            <Row label="ID" value={detail.id} />
            <Row label="Action" value={detail.action?.replace(/_/g, ' ')} />
            <Row label="Actor Type" value={detail.actorType} />
            <Row label="Actor" value={detail.actor ? `${detail.actor.firstName || ''} ${detail.actor.lastName || ''} (#${detail.actor.id})`.trim() : '—'} />
            <Row label="Timestamp" value={detail.timestamp ? new Date(detail.timestamp).toLocaleString() : '—'} />
            {detail.metadata && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">METADATA</p>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto text-gray-700">
                  {JSON.stringify(detail.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs font-medium text-gray-400 w-32 shrink-0 uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 capitalize">{value || '—'}</span>
    </div>
  );
}