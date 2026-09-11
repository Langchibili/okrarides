// app/(main)/ratings/page.js - Full ratings viewer
'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import DataTable from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import { PageHeader, Btn } from '@/components/admin/PageHeader';

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-sm ${i <= rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-600">{rating}</span>
    </span>
  );
}

export default function RatingsPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, pageCount: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const filters = filterRating ? { rating: filterRating } : {};
      const q = buildQuery({ page, pageSize: 20, filters, populate: ['ratedBy', 'ratedUser', 'ride'] });
      const res = await adminClient.get(`/ratings${q}&sort=createdAt:desc`);
      const items = res?.data || res || [];
      setData(Array.isArray(items) ? items : (items.data || []));
      if (res?.meta?.pagination) setPagination(res.meta.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterRating]);

  useEffect(() => { load(1); }, [load]);

  const dist = [5,4,3,2,1].reduce((a, n) => ({ ...a, [n]: data.filter(r => r.rating === n).length }), {});

  const columns = [
    { key: 'createdAt', label: 'Date', width: 130, render: v => v ? new Date(v).toLocaleString() : '—' },
    { key: 'rating', label: 'Rating', render: v => <Stars rating={v} /> },
    { key: 'ratedBy', label: 'From', render: v => v ? `${v.firstName} ${v.lastName}` : '—' },
    { key: 'ratedUser', label: 'To', render: v => v ? `${v.firstName} ${v.lastName}` : '—' },
    { key: 'ride', label: 'Ride', render: v => v?.rideCode ? <span className="font-mono text-xs">{v.rideCode}</span> : '—' },
    { key: 'review', label: 'Review', render: v => v ? <span className="text-sm italic text-gray-600 line-clamp-1">"{v}"</span> : '—' },
    { key: 'id', label: '', width: 70, render: (_, row) => <Btn size="sm" variant="ghost" onClick={() => setDetail(row)}>View</Btn> },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Ratings & Reviews" description="All ratings submitted after completed rides and deliveries" />
      {data.length > 0 && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[5,4,3,2,1].map(n => (
            <div key={n} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-2xl font-bold">{dist[n]||0}</div>
              <Stars rating={n} />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3 mb-4">
        <select value={filterRating} onChange={e => setFilterRating(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="">All ratings</option>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
        </select>
        <Btn variant="secondary" onClick={() => setFilterRating('')}>Clear</Btn>
      </div>
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination} onPageChange={load} />
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Rating Detail" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="text-center py-3"><Stars rating={detail.rating} /></div>
            {detail.review && <div className="bg-gray-50 rounded-lg p-4 text-sm italic text-gray-700">"{detail.review}"</div>}
            {detail.tags?.length > 0 && <div className="flex flex-wrap gap-2">{detail.tags.map((t,i) => <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{t}</span>)}</div>}
            <div className="space-y-2">
              {[['From',detail.ratedBy?`${detail.ratedBy.firstName} ${detail.ratedBy.lastName}`:'—'],['To',detail.ratedUser?`${detail.ratedUser.firstName} ${detail.ratedUser.lastName}`:'—'],['Ride',detail.ride?.rideCode||'—'],['Date',detail.createdAt?new Date(detail.createdAt).toLocaleString():'—']].map(([l,v]) => (
                <div key={l} className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-medium text-gray-400 w-20 uppercase">{l}</span>
                  <span className="text-sm text-gray-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}