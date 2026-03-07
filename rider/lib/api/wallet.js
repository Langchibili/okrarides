// PATH: rider/lib/api/wallet.js

import { apiClient } from './client';

export const walletAPI = {
  // ── Balance ────────────────────────────────────────────────────────────────
  async getBalance() {
    const response = await apiClient.get('/users/me?populate=riderProfile');
    return {
      balance: response.riderProfile?.walletBalance || 0,
      currency: 'ZMW',
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

  // ── Wallet Top-up ──────────────────────────────────────────────────────────
  //
  // Creates a float-topup record then initiates an OkraPay payment.
  // The `purpose` is 'walletTopup' and the relatedEntityId is the topup record id.
  //
  async topUp(amount, paymentMethod = 'okrapay') {
    // 1. Create a pending topup record
    const topupResponse = await apiClient.post('/float-topups', {
      data: {
        amount,
        paymentMethod,
        floatStatus: 'pending',
        purpose: 'wallet_topup',
      },
    });

    const topupId = topupResponse.data?.id;
    if (!topupId) throw new Error('Failed to create topup record');

    // 2. Initiate OkraPay payment
    const paymentResponse = await apiClient.post('/okrapay/initiate', {
      purpose:         'walletTopup',
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

  // ── Pay for a Ride ─────────────────────────────────────────────────────────
  //
  // Attempts to pay for a ride:
  //   1. Backend first checks rider's wallet balance.
  //   2. If sufficient → deducts wallet, marks ride paid, returns paidFromWallet: true.
  //   3. If insufficient → opens OkraPay gateway for the full ride amount.
  //
  // The reference for ridepay uses the RIDE ID (not the user id).
  //
  async payForRide(rideId, fareAmount) {
    const response = await apiClient.post('/okrapay/initiate', {
      purpose:         'ridepay',
      amount:          fareAmount,
      currency:        'ZMW',
      relatedEntityId: rideId,   // ride id — backend derives rider from ride record
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to initiate ride payment');
    }

    return response;
    // Response shape:
    //   { success: true, paidFromWallet: true, message: '...', data: { rideId, amount, walletBalance } }
    //   OR
    //   { success: true, paidFromWallet: false, data: { paymentId, reference, paymentUrl, gatewayName, gatewayConfig, amount } }
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
    const { amount, method, accountDetails, provider, accountName } = data;

    const response = await apiClient.post('/okrapay/request-withdrawal', {
      amount,
      method:        method        || 'mobile_money',
      provider:      provider      || accountDetails?.provider,
      accountNumber: data.accountNumber || accountDetails?.accountNumber,
      accountName:   accountName   || accountDetails?.accountName,
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

  // ── Transactions ───────────────────────────────────────────────────────────
  async getTransaction(id) {
    const response = await apiClient.get(`/transactions/${id}?populate=*`);
    return response.data;
  },
};

export default walletAPI;