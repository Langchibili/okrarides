/**
 * Mock Authentication API for Development
 * This simulates OTP functionality while the real backend is being configured
 */

// Store for mock OTP codes (in-memory, cleared on page reload)
const otpStore = {};

// Store for mock users
const userStore = {
  'user1': {
    id: 'user1',
    username: '260972612345',
    phoneNumber: '260972612345',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  }
};

export const mockAuthAPI = {
  // Generate a mock OTP
  generateMockOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Send OTP for verification
  async sendOTP(phoneNumber, purpose = 'registration') {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const otp = this.generateMockOTP();
    
    // Store OTP with 10-minute expiry
    otpStore[cleanPhone] = {
      otp,
      purpose,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };
    
    console.log(`[MOCK API] OTP sent to ${phoneNumber}: ${otp}`);
    
    return {
      success: true,
      message: 'OTP sent successfully',
      // In development, we return the OTP so you can see it
      _debug_otp: otp,
    };
  },

  // Resend OTP
  async reSendOTP(phoneNumber, purpose = 'registration') {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (!otpStore[cleanPhone]) {
      throw new Error('No OTP request found for this phone number');
    }
    
    const otp = this.generateMockOTP();
    otpStore[cleanPhone] = {
      otp,
      purpose,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    };
    
    console.log(`[MOCK API] OTP resent to ${phoneNumber}: ${otp}`);
    
    return {
      success: true,
      message: 'OTP resent successfully',
      _debug_otp: otp,
    };
  },

  // Verify OTP
  async verifyOTP(phoneNumber, otp, purpose = 'registration') {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const storedOTP = otpStore[cleanPhone];
    
    if (!storedOTP) {
      throw new Error('No OTP request found. Please request an OTP first.');
    }
    
    if (storedOTP.expiresAt < Date.now()) {
      delete otpStore[cleanPhone];
      throw new Error('OTP has expired. Please request a new one.');
    }
    
    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      if (storedOTP.attempts >= 3) {
        delete otpStore[cleanPhone];
        throw new Error('Too many failed attempts. Please request a new OTP.');
      }
      throw new Error('Invalid OTP. Please try again.');
    }
    
    // OTP verified successfully
    delete otpStore[cleanPhone];
    
    // Create or get user
    const userId = `user_${cleanPhone}`;
    let user = userStore[userId];
    
    if (!user) {
      user = {
        id: userId,
        username: cleanPhone,
        phoneNumber: cleanPhone,
        firstName: 'User',
        lastName: cleanPhone,
        email: `user_${cleanPhone}@okrarides.test`,
        createdAt: new Date().toISOString(),
      };
      userStore[userId] = user;
    }
    
    // Generate mock JWT token
    const mockJWT = Buffer.from(
      JSON.stringify({
        id: user.id,
        username: user.username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      })
    ).toString('base64');
    
    console.log(`[MOCK API] OTP verified for ${phoneNumber}`);
    
    return {
      status: true,
      message: 'OTP verified successfully',
      jwt: mockJWT,
      user,
    };
  },

  // Login with OTP
  async loginWithOTP(phoneNumber) {
    // Send OTP first
    return this.sendOTP(phoneNumber, 'login');
  },

  // Register user
  async register(data) {
    const { phoneNumber, firstName, lastName } = data;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const userId = `user_${cleanPhone}`;
    
    const user = {
      id: userId,
      username: cleanPhone,
      phoneNumber: cleanPhone,
      firstName: firstName || 'User',
      lastName: lastName || cleanPhone,
      email: `user_${cleanPhone}@okrarides.test`,
      createdAt: new Date().toISOString(),
    };
    
    userStore[userId] = user;
    console.log(`[MOCK API] User registered: ${phoneNumber}`);
    
    return { user };
  },

  // Get current user (requires JWT)
  async me() {
    // In a real scenario, this would validate the JWT
    // For mock, we return a default user
    const userId = 'user1';
    return userStore[userId] || {
      id: userId,
      username: '260972612345',
      phoneNumber: '260972612345',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };
  },

  // Check if user exists
  async checkUserExists(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const userId = `user_${cleanPhone}`;
    return !!userStore[userId];
  },

  // Forgot password
  async forgotPassword(phoneNumber) {
    return this.sendOTP(phoneNumber, 'password_reset');
  },

  // Reset password with OTP
  async resetPassword(phoneNumber, otp, newPassword) {
    const verification = await this.verifyOTP(phoneNumber, otp, 'password_reset');
    
    // In a real scenario, we would update the password
    console.log(`[MOCK API] Password reset for ${phoneNumber}`);
    
    return verification;
  },

  // Update phone number
  async updatePhone(newPhoneNumber) {
    return this.sendOTP(newPhoneNumber, 'phone_verification');
  },

  // Verify new phone number
  async verifyNewPhone(phoneNumber, otp) {
    return this.verifyOTP(phoneNumber, otp, 'phone_verification');
  },

  // Logout
  logout() {
    console.log('[MOCK API] User logged out');
  },

  // Refresh token
  async refreshToken() {
    const mockJWT = Buffer.from(
      JSON.stringify({
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      })
    ).toString('base64');
    
    return { jwt: mockJWT };
  },
};

export default mockAuthAPI;
