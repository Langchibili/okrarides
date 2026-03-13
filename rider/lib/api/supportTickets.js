import { apiClient } from './client';

export const supportTicketsAPI = {

  /** Create a draft ticket — returns the new ticket with its id */
  createDraft: async ({ category, subject, description, phoneNumber, guestName }) => {
    return await apiClient.post('/support-tickets/create-draft', {
      category,
      subject,
      description,
      phoneNumber: phoneNumber || undefined,
      guestName:   guestName   || undefined,
    });
  },

  /**
   * Attach a screenshot (File / Blob) to a draft ticket.
   * Uses Strapi's standard upload endpoint with ref params so the file is
   * automatically linked to the ticket's `attachments` field.
   */
  attachScreenshot: async (ticketId, fileOrBlob) => {
    const fd = new FormData();
    const fileName = `screenshot_${Date.now()}.png`;
    fd.append('files', fileOrBlob instanceof Blob
      ? new File([fileOrBlob], fileName, { type: 'image/png' })
      : fileOrBlob,
    );
    fd.append('refId', String(ticketId));
    fd.append('ref',   'api::support-ticket.support-ticket');
    fd.append('field', 'attachments');
    return await apiClient.upload('/upload', fd);
  },

  /** Submit a draft — changes status from open → in_progress */
  submitTicket: async (ticketId, extras = {}) => {
    return await apiClient.put(`/support-tickets/${ticketId}/submit`, extras);
  },

  /** Fetch the current user's tickets */
  getMyTickets: async () => {
    return await apiClient.get('/support-tickets/mine');
  },
};