'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import { useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

   // Add initialization state
  const [initialized, setInitialized] = useState(false);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);
  
  const loadUser = async () => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        setUser(null);
        setInitialized(true);
        setLoading(false);
        return;
      }
      
      const userData = await authAPI.me();
      setUser(userData);
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err.message);
      apiClient.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Simple check for token
  const isAuthenticated = useCallback(() => {
    if (!initialized) return false;
    return !!apiClient.getToken();
  }, [initialized]);
  
  // Register
  const register = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(data);
      return response;
    } catch (err) {
      if(err.message === "Error: Email or Username are already taken" || err.message === "Email or Username are already taken"){
         setError("Oops! Account Already Exists, Log In Instead.");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Send OTP
  const sendOTP = async (phoneNumber, purpose) => {
    try {
      setError(null);
      return await authAPI.sendOTP(phoneNumber, purpose);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
   // reSend  OTP
  const reSendOTP = async (phoneNumber, purpose) => {
    try {
      setError(null);
      return await authAPI.reSendOTP(phoneNumber, purpose);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  
  
  // Verify OTP
  const verifyOTP = async (phoneNumber, otp, purpose) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.verifyOTP(phoneNumber, otp, purpose);
      
      if (response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Login
  const login = async (phoneNumber, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(phoneNumber, password);
      setUser(response.user);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Login with OTP
  const loginWithOTP = async (phoneNumber) => {
    try {
      setError(null);
      return await authAPI.loginWithOTP(phoneNumber);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Logout
  const logout = () => {
    authAPI.logout();
    setUser(null);
    router.push('/login');
  };
  
  // Update user
  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };
  
  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Error refreshing user:', err);
      throw err;
    }
  };
  
  // Check auth status
  // const isAuthenticated = () => {
  //   return !!user && !!apiClient.getToken();
  // };
  
  // Forgot password
  const forgotPassword = async (phoneNumber) => {
    try {
      setError(null);
      return await authAPI.forgotPassword(phoneNumber);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Reset password
  const resetPassword = async (phoneNumber, otp, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.resetPassword(phoneNumber, otp, newPassword);
      setUser(response.user);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    user,
    loading,
    error,
    register,
    sendOTP,
    reSendOTP,
    verifyOTP,
    login,
    loginWithOTP,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated,
    forgotPassword,
    resetPassword,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default useAuth;

