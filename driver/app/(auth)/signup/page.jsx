'use client';

import { useState, useEffect } from 'react';
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
  MenuItem,
  Select,
  FormControl,
  Snackbar,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Person as PersonIcon,
  Tag as TagIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { validatePhoneNumber } from '@/Functions';
import { apiClient } from '@/lib/api/client';

const steps = ['Country', 'Phone', 'Details', 'Verify'];

export default function SignupPage() {
  const router = useRouter();
  const { register, sendOTP } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [existsSnackbar, setExistsSnackbar] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    referralCode: '',
  });

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if(typeof window !== "undefined"){
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || localStorage.getItem('affiliateRef');
      if (ref) {
        localStorage.setItem('affiliateRef', ref);
        setReferralCode(ref);  // set into registration form state
      }
    }
  }, []);

  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/countries?filters[isActive][$eq]=true&sort=name:asc`);
      
      if (!response.ok) throw new Error('Failed to fetch countries');
      
      const data = await response.json();
      console.log('countries',data)
      setCountries(data.data);
      
      // Set Zambia as default
      const zambia = data.data.find(country => 
        country.code === 'ZM' || country.name === 'Zambia'
      );
      if (zambia) {
        setSelectedCountry(zambia);
      } else if (data.data.length > 0) {
        setSelectedCountry(data.data[0]);
      }
    } catch (err) {
      setError('Failed to load countries. Please refresh the page.');
      console.error('Error fetching countries:', err);
    } finally {
      setCountriesLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError('');
  };

  const handleNext = async () => {
    setError('');

    // Step 0: Country selection
    if (activeStep === 0) {
      if (!selectedCountry) {
        setError('Please select a country');
        return;
      }
      setActiveStep(1);
    }
    else if (activeStep === 1) {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, '');

      if (!validatePhoneNumber(cleanPhone)) {
        setError('Please enter a valid phone number');
        return;
      }

      // Build the username exactly as the backend stores it — no leading +
      const phoneCode    = selectedCountry.phoneCode.replace('+', '');
      const fullUsername = `${phoneCode}${cleanPhone}`;

      try {
        setLoading(true);
        const res = await apiClient.post('/account-exist-check/check-user', {
          username: fullUsername,
        })

       if (res?.userExists) {
          setExistsSnackbar(true);
          try{
            await sendOTP(fullUsername, 'login');
          }
          catch(err){
             console.error(err)
          }
          finally{
            setTimeout(() => {
              router.push(
                `/verify-phone?phone=${encodeURIComponent(fullUsername)}&purpose=login`
              );
            }, 800);
          }
          return;
        }
      } catch (err) {
        // Non-blocking — if the check fails, just continue to registration
        console.warn('Account existence check failed:', err);
      } finally {
        setLoading(false);
      }

      setActiveStep(2);
    }
    // Step 2: Validate name and register
    else if (activeStep === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Please enter your first and last name');
        return;
      }

      try {
        setLoading(true);
        
        const fullPhone = `${selectedCountry.phoneCode}${formData.phoneNumber.replace(/\D/g, '')}`;
        
        // Register user with country ID
        await register({
          phoneNumber: fullPhone,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          referralCode: formData.referralCode.trim() || null,
          country: selectedCountry, // Add country ID
        });

        // Send OTP
        await sendOTP(fullPhone.replace(/\D/g, ''), 'registration');
        
        // Navigate to OTP verification
        router.push(`/verify-phone?phone=${encodeURIComponent(fullPhone.replace(/\D/g, ''))}&purpose=registration`);
        
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
      setError('');
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
            {activeStep === 0 ? 'Select Country' : 'Create Account'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {activeStep === 0 
              ? 'Choose your country to get started' 
              : 'Sign up to get started with OkraRides'
            }
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
        {/* Step 0: Country Selection */}
        {activeStep === 0 && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: 'block' }}
            >
              Country
            </Typography>
            
            {countriesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <FormControl fullWidth>
                <Select
                  value={selectedCountry?.id || ''}
                  onChange={(e) => {
                    const country = countries.find(c => c.id === e.target.value);
                    setSelectedCountry(country);
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <PublicIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  }
                  sx={{
                    height: 56,
                  }}
                >
                  {countries.map((country) => (
                    <MenuItem key={country.id} value={country.id}>
                      {country.name} ({country.phoneCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {/* Step 1: Phone Number */}
        {activeStep === 1 && (
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
                        {selectedCountry?.phoneCode}
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

        {/* Step 2: Personal Details */}
        {activeStep === 2 && (
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
      <Box sx={{ flex: 0.5 }} />

      {/* Actions */}
      {!countriesLoading && (
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
            disabled={loading || (activeStep === 0 && !selectedCountry)}
            sx={{ height: 56, flex: activeStep > 0 ? 2 : 1 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              activeStep === steps.length - 2 ? 'Create Account' : 'Continue'
            )}
          </Button>
        </Box>
      )}

      {/* Login Link */}
      <Button
        fullWidth
        variant="text"
        onClick={() => router.push('/login')}
        sx={{ height: 48, mt: 2, textTransform: 'none' }}
      >
        Already have an account? <strong>&nbsp;Sign In</strong>
      </Button>
      <Snackbar
        open={existsSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setExistsSnackbar(false)}
        message="Account already exists, redirecting you to the login screen"
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: 'primary.main',
            fontWeight: 600,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
}