// PATH: src/app/(dashboard)/affiliates/page.js
'use client';
import { useState, useEffect } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, getFullName } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, Modal, StatusPill, Avatar, StatCard } from '@/components/UI';

export default function AffiliatesPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('affiliates');
  const [affiliates, setAffiliates] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [platformStats, setPlatformStats] = useState(null);
  const pageSize = 20;

  useEffect(() => { loadData(); loadPlatformStats(); }, [page, activeTab]);

  const loadPlatformStats = async () => {
    try {
      const res = await adminAPI.get('/platform-stats');
      setPlatformStats(res?.data || res);
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { 'pagination[page]': page, 'pagination[pageSize]': pageSize, 'sort': 'createdAt:desc' };
      if (activeTab === 'affiliates') {
        params['filters[affiliateProfile][affiliateCode][$notNull]'] = true;
        params['populate[affiliateProfile][fields]'] = 'affiliateCode,totalReferrals,totalPoints,pointsBalance,totalEarnings,pendingEarnings,withdrawableBalance,blocked';
        params['fields'] = 'id,firstName,lastName,phoneNumber,username,createdAt';
        const res = await adminAPI.get('/users', params);
        const data = Array.isArray(res) ? res : (res?.data || []);
        setAffiliates(data.filter(u => u.affiliateProfile?.affiliateCode));
        const meta = res?.meta?.pagination;
        setTotal(meta?.total || data.length); setPageCount(meta?.pageCount || 1);
      } else if (activeTab === 'transactions') {
        params['populate[affiliate][fields]'] = 'firstName,lastName,phoneNumber';
        params['populate[referredUser][fields]'] = 'firstName,lastName,phoneNumber';
        const res = await adminAPI.get('/affiliate-transactions', params);
        const data = res?.data || res || [];
        setTransactions(Array.isArray(data) ? data : []);
        const meta = res?.meta?.pagination;
        setTotal(meta?.total || 0); setPageCount(meta?.pageCount || 1);
      } else {
        const res = await adminAPI.get('/affiliate-promotions', { ...params, 'populate[affiliateOwner][fields]': 'firstName,lastName' });
        const data = res?.data || res || [];
        setPromotions(Array.isArray(data) ? data : []);
        const meta = res?.meta?.pagination;
        setTotal(meta?.total || 0); setPageCount(meta?.pageCount || 1);
      }
    } catch (err) { toast.error(err.message || 'Failed to load data'); } finally { setLoading(false); }
  };

  const handleBlockAffiliate = async (user) => {
    if (!canWrite('finance')) return toast.error('Insufficient permissions');
    try {
      const ap = user.affiliateProfile;
      const isBlocked = ap?.blocked;
      await adminAPI.put(`/users/${user.id}`, { affiliateProfile: { id: ap?.id, blocked: !isBlocked } });
      toast.success(`Affiliate ${isBlocked ? 'unblocked' : 'blocked'}`);
      loadData();
    } catch (err) { toast.error(err.message); }
  };

  const s = platformStats;

  const affiliateColumns = [
    {
      key: 'id', label: 'Affiliate',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar firstName={row.firstName} lastName={row.lastName} username={row.username} size={30} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{getFullName(row)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.phoneNumber}</div>
          </div>
        </div>
      ),
    },
    { key: 'affiliateProfile.affiliateCode', label: 'Affiliate Code', render: (_, row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{row.affiliateProfile?.affiliateCode}</span> },
    { key: 'affiliateProfile.totalReferrals', label: 'Referrals', render: (_, row) => <span style={{ fontSize: 12, fontWeight: 600 }}>{row.affiliateProfile?.totalReferrals || 0}</span> },
    { key: 'affiliateProfile.totalPoints', label: 'Total Points', render: (_, row) => <span style={{ fontSize: 12 }}>⭐ {row.affiliateProfile?.totalPoints || 0}</span> },
    { key: 'affiliateProfile.withdrawableBalance', label: 'Withdrawable', render: (_, row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>K{parseFloat(row.affiliateProfile?.withdrawableBalance || 0).toFixed(2)}</span> },
    { key: 'affiliateProfile.blocked', label: 'Status', render: (_, row) => <StatusPill status={row.affiliateProfile?.blocked ? 'blocked' : 'active'} /> },
    {
      key: 'actions', label: '', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedAffiliate(row); setShowDetail(true); }}>View</button>
          {canWrite('finance') && (
            <button className={`btn btn-sm ${row.affiliateProfile?.blocked ? 'btn-secondary' : 'btn-danger'}`} onClick={() => handleBlockAffiliate(row)}>
              {row.affiliateProfile?.blocked ? 'Unblock' : 'Block'}
            </button>
          )}
        </div>
      ),
    },
  ];

  const txColumns = [
    { key: 'transactionId', label: 'ID', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{v}</span> },
    { key: 'affiliate', label: 'Affiliate', render: (v) => v ? <span style={{ fontSize: 12, fontWeight: 600 }}>{getFullName(v)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'referredUser', label: 'Referred User', render: (v) => v ? <span style={{ fontSize: 12 }}>{getFullName(v)}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span> },
    { key: 'type', label: 'Type', render: (v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'points', label: 'Points', render: (v) => v ? <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>⭐ {v}</span> : null },
    { key: 'amount', label: 'Amount', render: (v) => v && parseFloat(v) > 0 ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>K{parseFloat(v).toFixed(2)}</span> : null },
    { key: 'affiliate_transaction_status', label: 'Status', render: (v) => <StatusPill status={v || 'pending'} /> },
    { key: 'createdAt', label: 'Date', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(v)}</span> },
  ];

  const promoColumns = [
    { key: 'name', label: 'Name', render: (v) => <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span> },
    { key: 'action', label: 'Action', render: (v) => <span style={{ fontSize: 12, color: 'var(--info)', textTransform: 'capitalize' }}>{v?.replace(/-/g, ' ')}</span> },
    { key: 'for', label: 'For', render: (v) => <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{v}</span> },
    { key: 'amount', label: 'Value', render: (v, row) => <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>{row.action?.includes('discount') ? `${row.percentageAmount}%` : `K${parseFloat(v || 0).toFixed(2)}`}</span> },
    { key: 'usageLimit', label: 'Usage Limit', render: (v) => <span style={{ fontSize: 12 }}>{v}</span> },
    { key: 'isActive', label: 'Status', render: (v) => <StatusPill status={v ? 'active' : 'inactive'} /> },
    { key: 'isDefault', label: 'Default', render: (v) => v ? <span className="pill pill-accent">Default</span> : null },
    { key: 'affiliateOwner', label: 'Owner', render: (v) => v ? <span style={{ fontSize: 12 }}>{getFullName(v)}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span> },
  ];

  if (!hasPermission('finance')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Affiliates" />
      {s && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard title="Active Affiliates" value={s.activeAffiliateCount || 0} icon="🔗" color="var(--purple)" />
          <StatCard title="Total Referrals" value={s.totalAffiliateReferrals || 0} icon="👥" color="var(--info)" />
          <StatCard title="Points Awarded" value={s.totalAffiliatePoints || 0} icon="⭐" color="var(--accent)" />
          <StatCard title="Payouts" value={parseFloat(s.totalAffiliatePayouts || 0)} currency icon="💸" color="var(--success)" />
          <StatCard title="Pending Balance" value={parseFloat(s.totalPendingAffiliateBalance || 0)} currency icon="⏳" color="var(--warning)" />
          <StatCard title="Transactions" value={s.totalAffiliateTransactions || 0} icon="📊" color="var(--purple)" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[['affiliates', 'Affiliates'], ['transactions', 'Transactions'], ['promotions', 'Promotions']].map(([key, label]) => (
          <button key={key} onClick={() => { setActiveTab(key); setPage(1); }}
            style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {activeTab === 'affiliates' && <><DataTable columns={affiliateColumns} data={affiliates} loading={loading} /><Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} /></>}
      {activeTab === 'transactions' && <><DataTable columns={txColumns} data={transactions} loading={loading} /><Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} /></>}
      {activeTab === 'promotions' && <><DataTable columns={promoColumns} data={promotions} loading={loading} /><Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} /></>}

      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedAffiliate(null); }} title="Affiliate Details" maxWidth={580}>
        {selectedAffiliate && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <Avatar firstName={selectedAffiliate.firstName} lastName={selectedAffiliate.lastName} size={48} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{getFullName(selectedAffiliate)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedAffiliate.phoneNumber}</div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>{selectedAffiliate.affiliateProfile?.affiliateCode}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                ['Total Referrals', selectedAffiliate.affiliateProfile?.totalReferrals || 0],
                ['Active Referrals', selectedAffiliate.affiliateProfile?.activeReferrals || 0],
                ['Total Points', selectedAffiliate.affiliateProfile?.totalPoints || 0],
                ['Points Balance', selectedAffiliate.affiliateProfile?.pointsBalance || 0],
                ['Total Earnings', `K${parseFloat(selectedAffiliate.affiliateProfile?.totalEarnings || 0).toFixed(2)}`],
                ['Withdrawable', `K${parseFloat(selectedAffiliate.affiliateProfile?.withdrawableBalance || 0).toFixed(2)}`],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
