// src/api/support-ticket/content-types/support-ticket/lifecycles.js
'use strict';

const { SendEmailNotification, SendSmsNotification } = require('../../../../services/messages');

module.exports = {
  async afterUpdate(event) {
    const { result, params } = event;

    const newStatus  = result?.ticketStatus;
    const prevStatus = params?.data?.ticketStatus;

    // Only fire on the open → in_progress transition
    if (prevStatus === 'in_progress' && newStatus === 'in_progress') {
      try {
        await notifyAdmins(result);
      } catch (err) {
        strapi.log.error('Support ticket notification failed:', err);
      }
    }
  },
};

async function notifyAdmins(ticket) {
  // ── Load admin settings ─────────────────────────────────────────────────
  let adminSettings = null;
  try {
    const results = await strapi.entityService.findMany(
      'api::admn-setting.admn-setting',
      { pagination: { pageSize: 1 } }
    );
    adminSettings = Array.isArray(results) ? results[0] : results;
  } catch {
    strapi.log.warn('Could not load admin settings for support notification.');
    return;
  }

  const supportEmails  = adminSettings?.adminSupportEmails  || [];
  const supportNumbers = adminSettings?.adminSupportNumbers || [];

  // ── Fetch full ticket ───────────────────────────────────────────────────
  const full = await strapi.entityService.findOne(
    'api::support-ticket.support-ticket',
    ticket.id,
    { populate: ['user', 'attachments'] }
  );

  // ── Resolve submitter identity ──────────────────────────────────────────
  const isGuest   = full.user?.id === 1;
  const guestName = full.tags?.guestName || 'Unknown';

  const submitterName  = isGuest ? guestName                   : (full.user?.username    || 'Unknown');
  const submitterPhone = isGuest ? (full.phoneNumber || 'N/A') : (full.user?.phoneNumber || full.phoneNumber || 'N/A');
  const submitterId    = isGuest ? `Guest — Phone: ${submitterPhone}` : `User ID: ${full.user?.id} — Phone: ${submitterPhone}`;

  const attachmentCount = full.attachments?.length ?? 0;

  // ── Build message bodies ────────────────────────────────────────────────
  const smsBody = [
    `[OkraRides Support] New Ticket: #${full.ticketId}`,
    `From: ${submitterName} (${submitterPhone})`,
    `Category: ${full.category}`,
    `Subject: ${full.subject}`,
    `Screenshots: ${attachmentCount}`,
    `Description: ${full.description.slice(0, 120)}${full.description.length > 120 ? '…' : ''}`,
  ].join('\n');

  const emailBody = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#10B981;border-bottom:2px solid #10B981;pb:8px">
        New Support Ticket Submitted
      </h2>

      <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
        <tr style="background:#f8fafc">
          <td style="padding:10px 12px;font-weight:700;width:160px;border:1px solid #e2e8f0">Ticket ID</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0;font-family:monospace">${full.ticketId}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0">Submitted By</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0">${submitterName}</td>
        </tr>
        <tr style="background:#f8fafc">
          <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0">Identifier</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0">${submitterId}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0">Category</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0">${full.category}</td>
        </tr>
        <tr style="background:#f8fafc">
          <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0">Subject</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0">${full.subject}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0">Priority</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0">${full.priority}</td>
        </tr>
        <tr style="background:#f8fafc">
          <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0">Screenshots</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0">${attachmentCount} attached</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:700;border:1px solid #e2e8f0">Submitted At</td>
          <td style="padding:10px 12px;border:1px solid #e2e8f0">${new Date(full.updatedAt).toUTCString()}</td>
        </tr>
      </table>

      <h3 style="color:#374151">Description</h3>
      <div style="background:#f4f4f4;padding:16px;border-radius:8px;border-left:4px solid #10B981;line-height:1.7">
        ${full.description}
      </div>

      <p style="color:#9ca3af;font-size:12px;margin-top:24px">
        This is an automated notification from OkraRides Support System.
      </p>
    </div>
  `;

  // ── Flatten contact arrays ──────────────────────────────────────────────
  const emailList = supportEmails
    .map(e => (typeof e === 'object' ? (e.email ?? e.value ?? '') : e))
    .filter(Boolean);

  const phoneList = supportNumbers
    .map(n => (typeof n === 'object' ? (n.number ?? n.value ?? '') : n))
    .filter(Boolean);

  // ── Send emails ─────────────────────────────────────────────────────────
  for (const email of emailList) {
    try {
      SendEmailNotification(email, emailBody);
      strapi.log.info(`Support notification email sent to ${email}`);
    } catch (err) {
      strapi.log.error(`Failed to send support email to ${email}:`, err);
    }
  }

  // ── Send SMS ────────────────────────────────────────────────────────────
  for (const phone of phoneList) {
    try {
      SendSmsNotification(phone, smsBody);
      strapi.log.info(`Support notification SMS sent to ${phone}`);
    } catch (err) {
      strapi.log.error(`Failed to send support SMS to ${phone}:`, err);
    }
  }

  strapi.log.info(
    `Ticket ${full.ticketId} — notified ${emailList.length} email(s) and ${phoneList.length} SMS(s).`
  );
}