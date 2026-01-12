import { apiClient } from './client';

export const walletAPI = {
  // Get wallet balance
  async getBalance() {
    const response = await apiClient.get('/users/me?populate=riderProfile');
    return {
      balance: response.riderProfile?.walletBalance || 0,
      currency: 'ZMW',
    };
  },

  // Get transactions history
  async getTransactions(params = {}) {
    const { page = 1, limit = 20, type, transactionStatus } = params;
    
    const filters = {};
    if (type) filters.type = { $eq: type };
    if (transactionStatus) filters.transactionStatus = { $eq: transactionStatus };

    const query = new URLSearchParams({
      'populate': '*',
      'pagination[page]': page,
      'pagination[pageSize]': limit,
      'sort': 'createdAt:desc',
      'filters[user][id][$eq]': 'me',
      'filters': JSON.stringify(filters),
    });

    const response = await apiClient.get(`/transactions?${query}`);
    return response;
  },

  // Initiate wallet top-up
  async topUp(amount, paymentMethod = 'okrapay') {
    const response = await apiClient.post('/float-topups', {
      data: {
        amount,
        paymentMethod,
        floatStatus: 'pending',
      },
    });

    // Initiate payment with OkraPay
    const paymentResponse = await apiClient.post('/okrapay/initiate', {
      amount,
      currency: 'ZMW',
      reference: response.data.topupId,
      type: 'wallet_topup',
      callbackUrl: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/wallet/topup/callback`,
    });

    return {
      ...response.data,
      paymentUrl: paymentResponse.paymentUrl,
      transactionId: paymentResponse.transactionId,
    };
  },

  // Get payment methods
  async getPaymentMethods() {
    const response = await apiClient.get('/payment-methods?filters[user][id][$eq]=me&populate=*');
    return response.data;
  },

  // Add payment method
  async addPaymentMethod(data) {
    const response = await apiClient.post('/payment-methods', {
      data: {
        ...data,
        user: 'me',
      },
    });
    return response.data;
  },

  // Remove payment method
  async removePaymentMethod(id) {
    const response = await apiClient.delete(`/payment-methods/${id}`);
    return response;
  },

  // Set default payment method
  async setDefaultPaymentMethod(id) {
    const response = await apiClient.put(`/payment-methods/${id}`, {
      data: {
        isDefault: true,
      },
    });
    return response.data;
  },

  // Request withdrawal
  async requestWithdrawal(data) {
    const { amount, method, accountDetails } = data;
    
    const response = await apiClient.post('/withdrawals', {
      data: {
        amount,
        method,
        accountDetails,
        withdrawalStatus: 'pending',
      },
    });
    
    return response.data;
  },

  // Get withdrawal history
  async getWithdrawals(params = {}) {
    const { page = 1, limit = 20 } = params;
    
    const query = new URLSearchParams({
      'populate': '*',
      'pagination[page]': page,
      'pagination[pageSize]': limit,
      'sort': 'createdAt:desc',
      'filters[user][id][$eq]': 'me',
    });

    const response = await apiClient.get(`/withdrawals?${query}`);
    return response;
  },

  // Get transaction details
  async getTransaction(id) {
    const response = await apiClient.get(`/transactions/${id}?populate=*`);
    return response.data;
  },
};

export default walletAPI;

