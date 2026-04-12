// app/(main)/notifications/page.js
'use client';
import { useState, useEffect } from 'react';
import { adminClient, buildQuery } from '@/lib/api/adminClient';
import { PageHeader, Btn, SearchBar } from '@/components/admin/PageHeader';
import { FormField, Input, Select, Textarea, Toggle } from '@/components/admin/FormField';
import DataTable from '@/components/admin/DataTable';

const TARGET_OPTIONS = [
  { value: 'all_users', label: 'All Users' },
  { value: 'all_drivers', label: 'All Drivers (approved)' },
  { value: 'all_riders', label: 'All Riders' },
  { value: 'all_delivery_drivers', label: 'All Delivery Drivers' },
  { value: 'specific_user', label: 'Specific User (by ID or phone)' },
  { value: 'online_drivers', label: 'Currently Online Drivers' },
];

const TYPE_OPTIONS = [
  { value: 'general', label: 'General Announcement' },
  { value: 'promo', label: 'Promotion' },
  { value: 'account_update', label: 'Account Update' },
  { value: 'system', label: 'System Notice' },
];

const EMPTY = { title: '', body: '', target: 'all_users', specificId: '', type: 'general', data: '', urgent: false };

export default function NotificationsPage() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Load notification history from support tickets or a custom endpoint
  useEffect(() => {
    // Try to fetch recent admin notifications if endpoint exists
    adminClient.get('/admin-notifications?sort=createdAt:desc&pagination[pageSize]=30')
      .then(res => {
        const items = res?.data || res || [];
        setLogs(Array.isArray(items) ? items : (items.data || []));
      })
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const send = async () => {
    if (!form.title || !form.body) { setError('Title and body are required.'); return; }
    if (form.target === 'specific_user' && !form.specificId) { setError('Please provide a user ID or phone number.'); return; }
    setSending(true); setError(''); setResult(null);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        target: form.target,
        type: form.type,
        urgent: form.urgent,
        ...(form.target === 'specific_user' && { specificId: form.specificId }),
        ...(form.data && { data: JSON.parse(form.data || '{}') }),
      };
      const res = await adminClient.post('/admin-notifications/broadcast', payload);
      setResult({ success: true, sent: res?.sent || res?.count || '?', message: res?.message || 'Notification sent successfully!' });
      setForm(EMPTY);
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  };

  const logColumns = [
    { key: 'createdAt', label: 'Sent At', render: v => v ? new Date(v).toLocaleString() : '—' },
    { key: 'title', label: 'Title', render: v => <span className="font-medium">{v}</span> },
    { key: 'target', label: 'Target', render: v => <span className="capitalize text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{v?.replace(/_/g,' ')}</span> },
    { key: 'type', label: 'Type', render: v => <span className="capitalize text-gray-600 text-sm">{v}</span> },
    { key: 'sentCount', label: 'Sent', render: v => v ?? '—' },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Notifications" description="Broadcast push notifications to users, drivers, and riders" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Compose Notification</h2>

          <FormField label="Title" required>
            <Input value={form.title} onChange={set('title')} placeholder="Important Update" />
          </FormField>
          <FormField label="Message Body" required>
            <Textarea value={form.body} onChange={set('body')} rows={4} placeholder="Your message…" />
          </FormField>
          <FormField label="Notification Type">
            <Select value={form.type} onChange={set('type')}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Target Audience">
            <Select value={form.target} onChange={set('target')}>
              {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </FormField>
          {form.target === 'specific_user' && (
            <FormField label="User ID or Phone Number" required>
              <Input value={form.specificId} onChange={set('specificId')} placeholder="260971234567 or user ID" />
            </FormField>
          )}
          <FormField label="Extra Data (JSON, optional)" hint='e.g. {"screen":"subscription"}'>
            <Input value={form.data} onChange={set('data')} placeholder='{"key":"value"}' />
          </FormField>
          <div className="mb-4">
            <Toggle checked={form.urgent} onChange={v => setForm(f => ({ ...f, urgent: v }))} label="Mark as urgent (high priority)" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
          {result?.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              ✓ {result.message} {result.sent !== '?' && `(${result.sent} sent)`}
            </div>
          )}

          <Btn onClick={send} disabled={sending} className="w-full justify-center">
            {sending ? '⟳ Sending…' : '📣 Send Notification'}
          </Btn>
        </div>

        {/* Quick Stats Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-5">Quick Broadcast Templates</h2>
          <div className="space-y-3">
            {[
              { title: 'System Maintenance', body: 'OkraRides will be briefly unavailable tonight from 2–4 AM for scheduled maintenance.', target: 'all_users', type: 'system' },
              { title: 'New Feature Available!', body: 'We\'ve just launched a new feature. Update your app to enjoy the latest improvements.', target: 'all_users', type: 'general' },
              { title: 'Promo: Double Points Weekend!', body: 'Earn double affiliate points this weekend only. Share your code and start earning now!', target: 'all_users', type: 'promo' },
              { title: 'Driver Reminder: Float Top-Up', body: 'Ensure your float balance is topped up before going online to avoid ride rejections.', target: 'all_drivers', type: 'general' },
              { title: 'Subscription Renewal', body: 'Your subscription is expiring soon. Renew now to continue enjoying zero-commission rides.', target: 'all_drivers', type: 'account_update' },
            ].map((tpl, i) => (
              <button
                key={i}
                onClick={() => setForm(f => ({ ...f, title: tpl.title, body: tpl.body, target: tpl.target, type: tpl.type }))}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
              >
                <div className="font-medium text-sm group-hover:text-blue-700">{tpl.title}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{tpl.body}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-6">
        <h2 className="font-semibold text-gray-700 mb-3">Recent Broadcasts</h2>
        <DataTable
          columns={logColumns}
          data={logs}
          loading={logsLoading}
          emptyMessage="No notifications sent yet — history will appear here"
        />
      </div>
    </div>
  );
}