import { returnNineDigitNumber } from '@/Functions';
import { apiClient } from './client';

export const authAPI = {
  // Register new user with phone number
  async register(data) {
    const { phoneNumber, firstName, lastName, referralCode } = data;
    const response = await apiClient.post('/auth/local/register', {
      username: phoneNumber.replace(/\D/g, ''), // Remove non-digits
      email: `unset_${phoneNumber.replace(/\D/g, '')}@email.com`,
      password: phoneNumber.replace(/\D/g, ''), // Remove non-digits
    });

    if (response.hasOwnProperty('user')) {
      await apiClient.put(`/users/${response.user.id}`, {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        firstName,
        lastName,
        referredBy: referralCode || null,
      }, {
        headers: {
          Authorization: `Bearer ${response.jwt}`
        }
      });
    }

    return response;
  },

  // Send OTP for verification
  async sendOTP(phoneNumber, purpose = 'registration') {
    const response = await apiClient.post('/otp-verifications', {
      data: {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        purpose,
        otp: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit OTP
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }
    });
    return response;
  },

  // ReSend OTP for verification
  async reSendOTP(phoneNumber, purpose = 'registration') {
    const response = await apiClient.post('/resendotps', {
      data: {
        identifierType: 'phoneNumber',
        identifier: phoneNumber.replace(/\D/g, ''),
        purpose
      }
    });
    return response;
  },

  // Verify OTP
  async verifyOTP(phoneNumber, otp, purpose = 'registration') {
    const response = await apiClient.post('/verifyotps', {
      data: {
        otp,
        purpose,
        identifier: phoneNumber,
        identifierType: "phoneNumber"
      }
    });
    console.log('otp verification', response);

    if (response.jwt) {
      apiClient.setToken(response.jwt);
    }

    return response;
  },

  // Login with phone and password
  async login(phoneNumber, password) {
    const response = await apiClient.post('/auth/local', {
      identifier: phoneNumber,
      password,
    });

    if (response.jwt) {
      apiClient.setToken(response.jwt);
    }

    return response;
  },

  // Login with OTP
  async loginWithOTP(phoneNumber) {
    // Send OTP first
    await this.sendOTP(phoneNumber, 'login');
    return { success: true, message: 'OTP sent' };
  },

  // Verify login OTP
  async verifyLoginOTP(phoneNumber, otp) {
    return this.verifyOTP(phoneNumber, otp, 'login');
  },

  // Get current user
  async me() {
    const response = await apiClient.get('/users/me?populate=*');
    return response;
  },

  // Logout
  logout() {
    apiClient.clearToken();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/login';
    }
  },

  // Refresh token
  async refreshToken() {
    try {
      const response = await api.refreshToken();
      if (response.jwt) {
        apiClient.setToken(response.jwt);
      }
      return response;
    } catch (error) {
      this.logout();
      throw error;
    }
  },
  
  // Update phone number
  async updatePhone(newPhoneNumber) {
    await this.sendOTP(newPhoneNumber, 'phone_verification');
    return { success: true, message: 'OTP sent to new number' };
  },
  
  // Verify new phone number
  async verifyNewPhone(phoneNumber, otp) {
    const response = await this.verifyOTP(phoneNumber, otp, 'phone_verification');
    
    // Update user phone number
    await apiClient.put('/users/me', {
      phoneNumber,
      phoneVerified: true,
    });
    
    return response;
  },
  
  // Request password reset
  async forgotPassword(phoneNumber) {
    await this.sendOTP(phoneNumber, 'password_reset');
    return { success: true, message: 'OTP sent' };
  },
  
  // Reset password with OTP
  async resetPassword(phoneNumber, otp, newPassword) {
    try {
      const response = await api.resetPassword(phoneNumber, otp, newPassword);
      if (response.jwt) {
        apiClient.setToken(response.jwt);
      }
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check if user exists
  async checkUserExists(phoneNumber) {
    try {
      const response = await api.checkUserExists(phoneNumber);
      return response;
    } catch (error) {
      return false;
    }
  },
};

export default authAPI;
