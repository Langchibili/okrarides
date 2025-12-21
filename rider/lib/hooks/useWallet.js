'use client';

import { useState, useEffect, useCallback } from 'react';
import { walletAPI } from '@/lib/api/wallet';

export const useWallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load wallet balance
  const loadBalance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await walletAPI.getBalance();
      setBalance(data.balance);
      return data.balance;
    } catch (err) {
      setError(err.message);
      console.error('Error loading balance:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletAPI.getTransactions(params);
      setTransactions(response.data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load payment methods
  const loadPaymentMethods = useCallback(async () => {
    try {
      const methods = await walletAPI.getPaymentMethods();
      setPaymentMethods(methods);
      return methods;
    } catch (err) {
      console.error('Error loading payment methods:', err);
      return [];
    }
  }, []);

  // Top up wallet
  const topUp = useCallback(async (amount, paymentMethod) => {
    try {
      setLoading(true);
      setError(null);
      const result = await walletAPI.topUp(amount, paymentMethod);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Request withdrawal
  const withdraw = useCallback(async (amount, method, accountDetails) => {
    try {
      setLoading(true);
      setError(null);
      const result = await walletAPI.requestWithdrawal({
        amount,
        method,
        accountDetails,
      });
      
      // Refresh balance after withdrawal
      await loadBalance();
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBalance]);

  // Add payment method
  const addPaymentMethod = useCallback(async (methodData) => {
    try {
      setLoading(true);
      setError(null);
      const method = await walletAPI.addPaymentMethod(methodData);
      
      // Refresh payment methods
      await loadPaymentMethods();
      
      return method;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPaymentMethods]);

  // Remove payment method
  const removePaymentMethod = useCallback(async (methodId) => {
    try {
      setLoading(true);
      setError(null);
      await walletAPI.removePaymentMethod(methodId);
      
      // Refresh payment methods
      await loadPaymentMethods();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPaymentMethods]);

  // Set default payment method
  const setDefaultPaymentMethod = useCallback(async (methodId) => {
    try {
      await walletAPI.setDefaultPaymentMethod(methodId);
      await loadPaymentMethods();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadPaymentMethods]);

  // Load initial data on mount
  useEffect(() => {
    loadBalance();
    loadPaymentMethods();
  }, [loadBalance, loadPaymentMethods]);

  return {
    balance,
    transactions,
    paymentMethods,
    loading,
    error,
    loadBalance,
    loadTransactions,
    topUp,
    withdraw,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
  };
};

export default useWallet;

