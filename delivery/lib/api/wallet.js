import { apiClient } from './client';

export const walletAPI = {
  // ── Balance ────────────────────────────────────────────────────────────────
  async getBalance() {
    const response = await apiClient.get('/users/me?populate=driverProfile');
    return {
      balance:   response.driverProfile?.floatBalance    || 0,
      withdrawable: response.driverProfile?.currentBalance || 0,
      currency:  'ZMW',
    };
  },

  // ── Transactions ───────────────────────────────────────────────────────────
  async getTransactions(params = {}) {
    const { page = 1, limit = 20, type, transactionStatus } = params;

    const filterParts = [];
    if (type)              filterParts.push(`filters[type][$eq]=${encodeURIComponent(type)}`);
    if (transactionStatus) filterParts.push(`filters[transactionStatus][$eq]=${encodeURIComponent(transactionStatus)}`);

    const query = [
      `populate=*`,
      `pagination[page]=${page}`,
      `pagination[pageSize]=${limit}`,
      `sort=createdAt:desc`,
      `filters[user][id][$eq]=me`,
      ...filterParts,
    ].join('&');

    return apiClient.get(`/transactions?${query}`);
  },

  // ── Float Top-up ───────────────────────────────────────────────────────────
  //
  // Creates a pending float-topup record, then initiates OkraPay for payment.
  // The `purpose` sent to the backend is 'floatadd'.
  //
  async topUp(amount, paymentMethod = 'okrapay') {
    // 1. Create pending topup record
    const topupResponse = await apiClient.post('/float-topups', {
      data: {
        amount,
        paymentMethod,
        floatStatus: 'pending',
        purpose:     'float_topup',
      },
    });

    const topupId = topupResponse.data?.id;
    if (!topupId) throw new Error('Failed to create float topup record');

    // 2. Initiate OkraPay gateway payment
    const paymentResponse = await apiClient.post('/okrapay/initiate', {
      purpose:         'floatadd',
      amount,
      currency:        'ZMW',
      relatedEntityId: topupId,
    });

    if (!paymentResponse.success) {
      throw new Error(paymentResponse.error || 'Failed to initiate payment');
    }

    return {
      ...topupResponse.data,
      paymentId:     paymentResponse.data?.paymentId,
      reference:     paymentResponse.data?.reference,
      paymentUrl:    paymentResponse.data?.paymentUrl,
      gatewayConfig: paymentResponse.data?.gatewayConfig,
    };
  },

  // ── Payment Methods ────────────────────────────────────────────────────────
  async getPaymentMethods() {
    const response = await apiClient.get('/payment-methods?filters[user][id][$eq]=me&populate=*');
    return response.data;
  },

  async addPaymentMethod(data) {
    const response = await apiClient.post('/payment-methods', {
      data: { ...data, user: 'me' },
    });
    return response.data;
  },

  async removePaymentMethod(id) {
    return apiClient.delete(`/payment-methods/${id}`);
  },

  async setDefaultPaymentMethod(id) {
    const response = await apiClient.put(`/payment-methods/${id}`, {
      data: { isDefault: true },
    });
    return response.data;
  },

  // ── Withdrawals ────────────────────────────────────────────────────────────
  async requestWithdrawal(data) {
    const { amount, method, provider, accountNumber, accountName, accountDetails } = data;

    const response = await apiClient.post('/okrapay/request-withdrawal', {
      amount,
      method:        method         || 'mobile_money',
      provider:      provider       || accountDetails?.provider,
      accountNumber: accountNumber  || accountDetails?.accountNumber,
      accountName:   accountName    || accountDetails?.accountName,
    });

    return response.data || response;
  },

  async getWithdrawals(params = {}) {
    const { page = 1, limit = 20 } = params;
    const query = [
      `populate=*`,
      `pagination[page]=${page}`,
      `pagination[pageSize]=${limit}`,
      `sort=createdAt:desc`,
      `filters[user][id][$eq]=me`,
    ].join('&');
    return apiClient.get(`/withdrawals?${query}`);
  },

  // ── Transaction detail ─────────────────────────────────────────────────────
  async getTransaction(id) {
    const response = await apiClient.get(`/transactions/${id}?populate=*`);
    return response.data;
  },
};

export default walletAPI;