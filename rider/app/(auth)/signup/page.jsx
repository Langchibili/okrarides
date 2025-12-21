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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Person as PersonIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { validatePhoneNumber } from '@/Functions';

const steps = ['Phone', 'Details', 'Verify'];

export default function SignupPage() {
  const router = useRouter();
  const { register, sendOTP } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    referralCode: '',
  });

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError('');
  };

  const handleNext = async () => {
    setError('');

    // Step 0: Validate phone number
    if (activeStep === 0) {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
      
      if (!validatePhoneNumber(cleanPhone)) {
        setError('Please enter a valid 9-digit phone number');
        return;
      }

      setActiveStep(1);
    }
    // Step 1: Validate name and register
    else if (activeStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Please enter your first and last name');
        return;
      }

      try {
        setLoading(true);
        
        const fullPhone = `+260${formData.phoneNumber.replace(/\D/g, '')}`;
        
        // Register user
        await register({
          phoneNumber: fullPhone,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          referralCode: formData.referralCode.trim() || null,
        });

        // Send OTP
        await sendOTP(fullPhone, 'registration');

        // Navigate to OTP verification
        router.push(`/verify-phone?phone=${encodeURIComponent(fullPhone)}&purpose=registration`);
        
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
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
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 1 }}
          >
            Create Account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign up to get started with OkraRides
          </Typography>
        </motion.div>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Form */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {/* Step 0: Phone Number */}
        {activeStep === 0 && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              Phone Number
            </Typography>
            <TextField
              fullWidth
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange('phoneNumber')}
              placeholder="972612345"
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
        )}

        {/* Step 1: Personal Details */}
        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: 'block' }}
              >
                First Name
              </Typography>
              <TextField
                fullWidth
                value={formData.firstName}
                onChange={handleChange('firstName')}
                placeholder="John"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: 'block' }}
              >
                Last Name
              </Typography>
              <TextField
                fullWidth
                value={formData.lastName}
                onChange={handleChange('lastName')}
                placeholder="Banda"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: 'block' }}
              >
                Referral Code (Optional)
              </Typography>
              <TextField
                fullWidth
                value={formData.referralCode}
                onChange={handleChange('referralCode')}
                placeholder="Enter referral code"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
            {error}
          </Alert>
        </motion.div>
      )}

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        {activeStep > 0 && (
          <Button
            variant="outlined"
            size="large"
            onClick={handleBack}
            sx={{ height: 56, flex: 1 }}
          >
            Back
          </Button>
        )}
        <Button
          fullWidth={activeStep === 0}
          variant="contained"
          size="large"
          onClick={handleNext}
          disabled={loading}
          sx={{ height: 56, flex: activeStep > 0 ? 2 : 1 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            activeStep === steps.length - 2 ? 'Create Account' : 'Continue'
          )}
        </Button>
      </Box>

      {/* Login Link */}
      <Button
        fullWidth
        variant="text"
        onClick={() => router.push('/login')}
        sx={{ height: 48, mt: 2, textTransform: 'none' }}
      >
        Already have an account? <strong>&nbsp;Sign In</strong>
      </Button>
    </Box>
  );
}
