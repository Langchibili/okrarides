'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithOTP } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 9) {
      setError('Please enter a valid 9-digit phone number');
      return;
    }
    
    const fullPhone = `+260${cleanPhone}`;
    
    try {
      setLoading(true);
      await loginWithOTP(fullPhone);
      
      // Navigate to OTP verification
      router.push(`/verify-phone?phone=${encodeURIComponent(fullPhone)}&purpose=login`);
    } catch (err) {
      if(err.message && err.message === "This attribute must be unique"){
         router.push(`/verify-phone?phone=${encodeURIComponent(fullPhone)}&purpose=login`);
         setError('otp already sent');
         return
      }
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ pt: 4, pb: 6 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your phone number to continue
          </Typography>
        </motion.div>
      </Box>
      
      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Phone Number
            </Typography>
            
            <TextField
              fullWidth
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="972 612 345"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ color: 'text.secondary' }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        +260
                      </Typography>
                      <Box sx={{ width: 1, height: 24, bgcolor: 'divider' }} />
                    </Box>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 56,
                },
              }}
            />
          </Box>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                {error}
              </Alert>
            </motion.div>
          )}
          
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || phoneNumber.replace(/\D/g, '').length !== 9}
            sx={{
              height: 56,
              fontSize: '1rem',
              fontWeight: 600,
              mb: 2,
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Continue'
            )}
          </Button>
          
          <Button
            fullWidth
            variant="text"
            onClick={() => router.push('/signup')}
            sx={{
              height: 48,
              textTransform: 'none',
            }}
          >
            Don't have an account? <strong>&nbsp;Sign Up</strong>
          </Button>
        </form>
      </motion.div>
      
      {/* Spacer */}
      <Box sx={{ flex: 1 }} />
      
      {/* Footer */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: 'center', mt: 4 }}
      >
        By continuing, you agree to our Terms & Conditions
      </Typography>
    </Box>
  );
}

