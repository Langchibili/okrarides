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
  Chip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Person as PersonIcon,
  Tag as TagIcon,
  Public as PublicIcon,
  CardGiftcard as PromoIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { validatePhoneNumber } from '@/Functions';
import { apiClient } from '@/lib/api/client';

const steps = ['Country', 'Phone', 'Details', 'Verify'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

/**
 * Resolve an affiliate code using the priority chain:
 *
 *  1. ?ref= URL param          — user clicked a fresh affiliate link
 *  2. localStorage affiliateRef — user clicked a link in a previous session
 *  3. GET /affiliate/check-impression — server recomputes the IP+UA hash and
 *     returns the code from any matching unconverted AffiliateImpression
 *     (covers users who arrived via a link but whose URL param was lost)
 *
 * Returns the code string, or null if none found.
 * All three steps are silent — they never block or throw to the caller.
 */
async function resolveAffiliateCode() {
  // 1 & 2 — URL param / localStorage (synchronous, instant)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('ref') || params.get('afcode');
    if (fromUrl) {
      localStorage.setItem('affiliateRef', fromUrl)
      return fromUrl;
    }
    const fromStorage = localStorage.getItem('affiliateRef');
    if (fromStorage) return fromStorage;
  }

  // 3 — Server-side impression lookup (IP+UA hash)
  // The browser automatically sends User-Agent; the server reads request.ip.
  // We call the raw fetch rather than apiClient so no auth token is attached.
  try {
    const res = await fetch(`${API_URL}/affiliate/check-impression`, {
      method: 'GET',
      credentials: 'omit', // no cookies, no auth — public endpoint
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.found && data?.affiliateCode) {
      // Persist so subsequent pages in the same session can use it
      if (typeof window !== 'undefined') {
        localStorage.setItem('affiliateRef', data.affiliateCode);
      }
      return data.affiliateCode;
    }
  } catch {
    // Never block registration on a failed impression lookup
  }

  return null;
}

export default function SignupPage() {
  const router = useRouter();
  const { register, sendOTP, isAuthenticated } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [existsSnackbar, setExistsSnackbar] = useState(false);

  // Whether the referral code was auto-filled from an impression / URL param
  // (used to show the "Referred by affiliate" chip on step 2)
  const [codeAutoFilled, setCodeAutoFilled] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    referralCode: '',
  });

  // ── Fetch countries ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCountries();
  }, [])

  // ── Resolve affiliate code (runs once on mount) ────────────────────────────
  // We run this eagerly so the code is ready by the time the user reaches
  // step 2. It runs in the background and never delays rendering.
  useEffect(() => {
    resolveAffiliateCode().then((code) => {
      if (code) {
        console.log('code',code)
        setFormData((prev) => ({ ...prev, referralCode: code }));
        setCodeAutoFilled(true);
      }
    });
  }, []);

  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/countries?filters[isActive][$eq]=true&sort=name:asc`
      );
      if (!response.ok) throw new Error('Failed to fetch countries');
      const data = await response.json();
      setCountries(data.data);

      const zambia = data.data.find(
        (country) => country.code === 'ZM' || country.name === 'Zambia'
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
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // If the user manually edits the referral code, clear the auto-fill indicator
    if (field === 'referralCode') setCodeAutoFilled(false);
    setError('');
  };

  const handleNext = async () => {
    setError('');

    // ── Step 0: Country selection ─────────────────────────────────────────
    if (activeStep === 0) {
      if (!selectedCountry) {
        setError('Please select a country');
        return;
      }
      setActiveStep(1);
    }

    // ── Step 1: Phone number ──────────────────────────────────────────────
    else if (activeStep === 1) {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, '');

      if (!validatePhoneNumber(cleanPhone)) {
        setError('Please enter a valid phone number');
        return;
      }

      const phoneCode    = selectedCountry.phoneCode.replace('+', '');
      const fullUsername = `${phoneCode}${cleanPhone}`;

      try {
        setLoading(true);
        const res = await apiClient.post('/account-exist-check/check-user', {
          username: fullUsername,
        });

        if (res?.userExists) {
          setExistsSnackbar(true);
          try {
            await sendOTP(fullUsername, 'login');
          } catch (err) {
            console.error(err);
          } finally {
            setTimeout(() => {
              router.push(
                `/verify-phone?phone=${encodeURIComponent(fullUsername)}&purpose=login`
              );
            }, 800);
          }
          return;
        }
      } catch (err) {
        console.warn('Account existence check failed:', err);
      } finally {
        setLoading(false);
      }

      setActiveStep(2);
    }

    // ── Step 2: Personal details + register ───────────────────────────────
    else if (activeStep === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Please enter your first and last name');
        return;
      }

      try {
        setLoading(true);

        const fullPhone = `${selectedCountry.phoneCode}${formData.phoneNumber.replace(/\D/g, '')}`;

        await register({
          phoneNumber:  fullPhone,
          firstName:    formData.firstName.trim(),
          lastName:     formData.lastName.trim(),
          referralCode: formData.referralCode.trim() || null,
          country:      selectedCountry,
        });

        // Clean up the stored ref so it isn't re-applied on the next registration
        if (typeof window !== 'undefined') {
          localStorage.removeItem('affiliateRef');
        }

        await sendOTP(fullPhone.replace(/\D/g, ''), 'registration');

        router.push(
          `/verify-phone?phone=${encodeURIComponent(fullPhone.replace(/\D/g, ''))}&purpose=registration`
        );
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

  if(isAuthenticated()){
    router.push('/')
  }
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {activeStep === 0 ? 'Select Country' : 'Create Account'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {activeStep === 0
              ? 'Choose your country to get started'
              : 'Sign up to get started with OkraRides'}
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

      {/* Form steps */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {/* ── Step 0: Country ─────────────────────────────────────────────── */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
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
                    const country = countries.find((c) => c.id === e.target.value);
                    setSelectedCountry(country);
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <PublicIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  }
                  sx={{ height: 56 }}
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

        {/* ── Step 1: Phone number ─────────────────────────────────────────── */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
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
              sx={{ '& .MuiOutlinedInput-root': { height: 56 } }}
            />
          </Box>
        )}

        {/* ── Step 2: Personal details ──────────────────────────────────────── */}
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
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
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
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

            {/* Referral code — auto-filled or manual entry */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Referral Code (Optional)
                </Typography>
                {/* Show a subtle badge when the code was resolved automatically */}
                <AnimatePresence>
                  {codeAutoFilled && formData.referralCode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Chip
                        icon={<PromoIcon sx={{ fontSize: '14px !important' }} />}
                        label="Promotion applied"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 22, fontSize: 10, fontWeight: 700 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>

              <TextField
                fullWidth
                value={formData.referralCode}
                onChange={handleChange('referralCode')}
                placeholder="Enter referral code"
                // Highlight the field when a code was auto-filled
                sx={{
                  '& .MuiOutlinedInput-root': {
                    ...(codeAutoFilled && formData.referralCode
                      ? {
                          '& fieldset': { borderColor: 'success.main', borderWidth: 2 },
                          '&:hover fieldset': { borderColor: 'success.dark' },
                        }
                      : {}),
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagIcon
                        sx={{
                          color: codeAutoFilled && formData.referralCode
                            ? 'success.main'
                            : 'text.secondary',
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                helperText={
                  codeAutoFilled && formData.referralCode
                    ? 'Detected from your affiliate link — you may be eligible for a welcome bonus'
                    : undefined
                }
                FormHelperTextProps={{ sx: { color: 'success.main', fontWeight: 500 } }}
              />
            </Box>
          </Box>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
            {error}
          </Alert>
        </motion.div>
      )}

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
            ) : activeStep === steps.length - 2 ? (
              'Create Account'
            ) : (
              'Continue'
            )}
          </Button>
        </Box>
      )}

      {/* Login link */}
      <Button
        fullWidth
        variant="text"
        onClick={() => router.push('/login')}
        sx={{ height: 48, mt: 2, textTransform: 'none' }}
      >
        <strong>&nbsp;Sign In Instead</strong>
      </Button>

      <Snackbar
        open={existsSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setExistsSnackbar(false)}
        message="Account already exists, redirecting you to the OTP screen"
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