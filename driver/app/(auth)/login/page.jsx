// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   InputAdornment,
//   CircularProgress,
//   Alert,
// } from '@mui/material';
// import { Phone as PhoneIcon } from '@mui/icons-material';
// import { motion } from 'framer-motion';
// import { useAuth } from '@/lib/hooks/useAuth';

// export default function LoginPage() {
//   const router = useRouter();
//   const { loginWithOTP } = useAuth();
  
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
    
//     // Validate phone number
//     const cleanPhone = phoneNumber.replace(/\D/g, '');
//     if (cleanPhone.length !== 9) {
//       setError('Please enter a valid 9-digit phone number');
//       return;
//     }
    
//     const fullPhone = `260${cleanPhone}`;
    
//     try {
//       setLoading(true);
//       await loginWithOTP(fullPhone);
      
//       // Navigate to OTP verification
//       router.push(`/verify-phone?phone=${encodeURIComponent(fullPhone)}&purpose=login`);
//     } catch (err) {
//       if(err.message && err.message === "This attribute must be unique"){
//          router.push(`/verify-phone?phone=${encodeURIComponent(fullPhone)}&purpose=login`);
//          setError('otp already sent');
//          return
//       }
//       setError(err.message || 'Failed to send OTP. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   return (
//     <Box
//       sx={{
//         minHeight: '100vh',
//         display: 'flex',
//         flexDirection: 'column',
//         bgcolor: 'background.default',
//         p: 3,
//       }}
//     >
//       {/* Header */}
//       <Box sx={{ pt: 4, pb: 6 }}>
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//         >
//           <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
//             Welcome Back
//           </Typography>
//           <Typography variant="body1" color="text.secondary">
//             Enter your phone number to continue
//           </Typography>
//         </motion.div>
//       </Box>
      
//       {/* Form */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.1 }}
//       >
//         <form onSubmit={handleSubmit}>
//           <Box sx={{ mb: 3 }}>
//             <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
//               Phone Number
//             </Typography>
            
//             <TextField
//               fullWidth
//               type="tel"
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               placeholder="97x xxx xxx"
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                       <PhoneIcon sx={{ color: 'text.secondary' }} />
//                       <Typography variant="body1" sx={{ fontWeight: 500 }}>
//                         +260
//                       </Typography>
//                       <Box sx={{ width: 1, height: 24, bgcolor: 'divider' }} />
//                     </Box>
//                   </InputAdornment>
//                 ),
//               }}
//               sx={{
//                 '& .MuiOutlinedInput-root': {
//                   height: 56,
//                 },
//               }}
//             />
//           </Box>
          
//           {error && (
//             <motion.div
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//             >
//               <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
//                 {error}
//               </Alert>
//             </motion.div>
//           )}
          
//           <Button
//             fullWidth
//             type="submit"
//             variant="contained"
//             size="large"
//             disabled={loading || phoneNumber.replace(/\D/g, '').length !== 9}
//             sx={{
//               height: 56,
//               fontSize: '1rem',
//               fontWeight: 600,
//               mb: 2,
//             }}
//           >
//             {loading ? (
//               <CircularProgress size={24} color="inherit" />
//             ) : (
//               'Continue'
//             )}
//           </Button>
          
//           <Button
//             fullWidth
//             variant="text"
//             onClick={() => router.push('/signup')}
//             sx={{
//               height: 48,
//               textTransform: 'none',
//             }}
//           >
//             Don't have an account? <strong>&nbsp;Sign Up</strong>
//           </Button>
//         </form>
//       </motion.div>
      
//       {/* Spacer */}
//       <Box sx={{ flex: 1 }} />
      
//       {/* Footer */}
//       <Typography
//         variant="caption"
//         color="text.secondary"
//         sx={{ textAlign: 'center', mt: 4 }}
//       >
//         By continuing, you agree to our Terms & Conditions
//       </Typography>
//     </Box>
//   );
// }

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
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import { Phone as PhoneIcon, Public as PublicIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithOTP } = useAuth();
  
  const [step, setStep] = useState(0); // 0: country selection, 1: phone input
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/countries?filters[isActive][$eq]=true&sort=name:asc`);
      
      if (!response.ok) throw new Error('Failed to fetch countries');
      
      const data = await response.json();
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

  const handleCountrySelect = () => {
    if (!selectedCountry) {
      setError('Please select a country');
      return;
    }
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }
    
    const fullPhone = `${selectedCountry.phoneCode}${cleanPhone}`;
    
    try {
      setLoading(true);
      await loginWithOTP(fullPhone.replace(/\D/g, ''));
      
      // Navigate to OTP verification
      router.push(`/verify-phone?phone=${encodeURIComponent(fullPhone.replace(/\D/g, ''))}&purpose=login`);
    } catch (err) {
      if(err.message && err.message === "This attribute must be unique"){
         router.push(`/verify-phone?phone=${encodeURIComponent(fullPhone)}&purpose=login`);
         setError('OTP already sent');
         return;
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
            {step === 0 ? 'Select Country' : 'Welcome Back'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {step === 0 ? 'Choose your country to continue' : 'Enter your phone number to continue'}
          </Typography>
        </motion.div>
      </Box>
      
      {/* Form */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        {/* Step 0: Country Selection */}
        {step === 0 && (
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
        {step === 1 && (
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
              disabled={loading || phoneNumber.replace(/\D/g, '').length < 9}
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
        )}
      </motion.div>
      
      {/* Error for country selection */}
      {step === 0 && error && (
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
      
      {/* Actions for country selection */}
      {step === 0 && !countriesLoading && (
        <>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleCountrySelect}
            disabled={!selectedCountry}
            sx={{
              height: 56,
              fontSize: '1rem',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Continue
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
        </>
      )}

      {/* Back button for phone step */}
      {step === 1 && (
        <Button
          fullWidth
          variant="text"
          onClick={() => {
            setStep(0);
            setError('');
          }}
          sx={{
            height: 48,
            mt: 2,
            textTransform: 'none',
          }}
        >
          ← Change Country
        </Button>
      )}
      
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