// PATH: src/app/(dashboard)/support/page.js
'use client';
import { useState, useEffect } from 'react';
import adminAPI from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDateTime, getFullName } from '@/lib/utils';
import { DataTable, Pagination } from '@/components/DataTable';
import { PageHeader, FilterBar, Modal, StatusPill, Avatar } from '@/components/UI';

export default function SupportPage() {
  const { hasPermission, canWrite } = useAuth();
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 20;

  useEffect(() => { loadTickets(); }, [page, filterStatus, filterCategory, filterPriority]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {
        'pagination[page]': page, 'pagination[pageSize]': pageSize, 'sort': 'createdAt:desc',
        'populate[user][fields]': 'firstName,lastName,phoneNumber,username',
        'populate[assignedTo][fields]': 'firstName,lastName',
        'populate[ride][fields]': 'rideCode',
      };
      if (filterStatus) params['filters[ticketStatus][$eq]'] = filterStatus;
      if (filterCategory) params['filters[category][$eq]'] = filterCategory;
      if (filterPriority) params['filters[priority][$eq]'] = filterPriority;
      const res = await adminAPI.get('/support-tickets', params);
      const data = res?.data || res || [];
      const meta = res?.meta?.pagination;
      setTickets(Array.isArray(data) ? data : []);
      setTotal(meta?.total || 0); setPageCount(meta?.pageCount || 1);
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const handleViewDetail = async (ticket) => {
    setSelectedTicket(ticket); setShowDetail(true);
    try {
      const full = await adminAPI.get(`/support-tickets/${ticket.id}?populate=user,responses.respondedBy,attachments,ride`);
      const t = full?.data || full;
      setSelectedTicket(t);
    } catch {}
  };

  const handleUpdateStatus = async (ticket, status) => {
    if (!canWrite('support')) return toast.error('Insufficient permissions');
    try {
      await adminAPI.put(`/support-tickets/${ticket.id}`, { data: { ticketStatus: status, ...(status === 'resolved' ? { resolvedAt: new Date() } : {}) } });
      toast.success(`Ticket marked as ${status}`);
      loadTickets();
      if (selectedTicket?.id === ticket.id) setSelectedTicket(prev => ({ ...prev, ticketStatus: status }));
    } catch (err) { toast.error(err.message); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    if (!canWrite('support')) return toast.error('Insufficient permissions');
    setSubmitting(true);
    try {
      const existing = selectedTicket.responses || [];
      await adminAPI.put(`/support-tickets/${selectedTicket.id}`, {
        data: {
          responses: [...existing.map(r => ({ id: r.id })), { message: replyText, isInternal: false, timestamp: new Date().toISOString() }],
          ticketStatus: 'in_progress',
        }
      });
      toast.success('Reply sent');
      setReplyText('');
      handleViewDetail(selectedTicket);
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const priorityColor = (p) => ({ urgent: 'danger', high: 'warning', medium: 'info', low: 'muted' })[p] || 'muted';
  const statusColor = (s) => ({ open: 'warning', in_progress: 'info', waiting_for_user: 'accent', resolved: 'success', closed: 'muted' })[s] || 'muted';

  const columns = [
    { key: 'ticketId', label: 'Ticket ID', render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{v}</span> },
    {
      key: 'user', label: 'User',
      render: (v) => v
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar firstName={v.firstName} lastName={v.lastName} username={v.username} size={26} />
            <div><div style={{ fontSize: 12, fontWeight: 600 }}>{getFullName(v)}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.phoneNumber}</div></div>
          </div>
        : <span style={{ color: 'var(--text-muted)' }}>Guest</span>,
    },
    { key: 'category', label: 'Category', render: (v) => <span style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'subject', label: 'Subject', render: (v) => <span style={{ fontSize: 12, fontWeight: 500, maxWidth: 220, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'priority', label: 'Priority', render: (v) => <span className={`pill pill-${priorityColor(v)}`}>{v}</span> },
    { key: 'ticketStatus', label: 'Status', render: (v) => <span className={`pill pill-${statusColor(v)}`}>{v?.replace(/_/g, ' ')}</span> },
    { key: 'createdAt', label: 'Created', render: (v) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(v)}</span> },
    { key: 'actions', label: '', align: 'right', render: (_, row) => <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(row)}>View</button> },
  ];

  if (!hasPermission('support')) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Access denied.</div>;
  }

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle={`${total.toLocaleString()} tickets`} />
      <FilterBar>
        <select className="input select" style={{ width: 160 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_for_user">Waiting for User</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select className="input select" style={{ width: 170 }} value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {['ride_issue', 'payment_issue', 'subscription_issue', 'account_issue', 'technical_issue', 'feature_request', 'complaint', 'other'].map(c => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select className="input select" style={{ width: 130 }} value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}>
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </FilterBar>
      <DataTable columns={columns} data={tickets} loading={loading} />
      <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} onChange={setPage} />
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedTicket(null); setReplyText(''); }} title="Support Ticket" maxWidth={700}>
        {selectedTicket && (
          <div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{selectedTicket.ticketId}</span>
              <span className={`pill pill-${priorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</span>
              <span className={`pill pill-${statusColor(selectedTicket.ticketStatus)}`}>{selectedTicket.ticketStatus?.replace(/_/g, ' ')}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{selectedTicket.category?.replace(/_/g, ' ')}</span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>{selectedTicket.subject}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>{selectedTicket.description}</p>
            {selectedTicket.user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <Avatar firstName={selectedTicket.user.firstName} lastName={selectedTicket.user.lastName} size={30} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{getFullName(selectedTicket.user)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedTicket.user.phoneNumber}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(selectedTicket.createdAt)}</div>
              </div>
            )}
            {selectedTicket.responses?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Responses ({selectedTicket.responses.length})</div>
                {selectedTicket.responses.map((r, i) => (
                  <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, borderLeft: `3px solid ${r.isInternal ? 'var(--warning)' : 'var(--info)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {r.respondedBy ? getFullName(r.respondedBy) : 'Support'}
                        {r.isInternal && <span style={{ marginLeft: 6, color: 'var(--warning)', fontSize: 10 }}>[Internal]</span>}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(r.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: 13, margin: 0, color: 'var(--text-primary)' }}>{r.message}</p>
                  </div>
                ))}
              </div>
            )}
            {canWrite('support') && !['resolved', 'closed'].includes(selectedTicket.ticketStatus) && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">Reply</label>
                <textarea className="input" rows={3} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your response..." />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleReply} disabled={submitting || !replyText.trim()}>{submitting ? 'Sending...' : 'Send Reply'}</button>
                </div>
              </div>
            )}
            {canWrite('support') && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedTicket.ticketStatus !== 'resolved' && <button className="btn btn-sm" style={{ background: 'var(--success-dim)', color: 'var(--success)' }} onClick={() => handleUpdateStatus(selectedTicket, 'resolved')}>Mark Resolved</button>}
                {selectedTicket.ticketStatus !== 'closed' && <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(selectedTicket, 'closed')}>Close Ticket</button>}
                {selectedTicket.ticketStatus === 'resolved' && <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(selectedTicket, 'open')}>Reopen</button>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
