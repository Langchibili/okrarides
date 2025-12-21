'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

export default function FindingDriverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchStage, setSearchStage] = useState('searching'); // searching, found, timeout
  const [driver, setDriver] = useState(null);
  const [countdown, setCountdown] = useState(30);

  // Simulate driver search
  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSearchStage('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate finding driver after 5 seconds
    const findDriver = setTimeout(() => {
      setDriver({
        id: '123',
        name: 'John Banda',
        rating: 4.8,
        avatar: '/avatars/driver1.jpg',
        vehiclePlate: 'BAZ 1234',
        vehicleModel: 'Toyota Corolla',
        vehicleColor: 'White',
        eta: '3 min',
      });
      setSearchStage('found');
      clearInterval(timer);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(findDriver);
    };
  }, []);

  const handleCancel = () => {
    router.back();
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
      <AnimatePresence mode="wait">
        {searchStage === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Animation */}
            <Box
              sx={{
                width: 280,
                height: 280,
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Box
                  sx={{
                    fontSize: '6rem',
                  }}
                >
                  🚗
                </Box>
              </motion.div>
            </Box>

            {/* Text */}
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}
            >
              Finding you a driver
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 4 }}
            >
              This should only take a moment...
            </Typography>

            {/* Countdown */}
            <Box
              sx={{
                position: 'relative',
                display: 'inline-flex',
                mb: 6,
              }}
            >
              <CircularProgress
                variant="determinate"
                value={(countdown / 30) * 100}
                size={80}
                thickness={4}
                sx={{ color: 'primary.main' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h6"
                  component="div"
                  fontWeight={700}
                >
                  {countdown}s
                </Typography>
              </Box>
            </Box>

            {/* Cancel Button */}
            <Button
              variant="outlined"
              size="large"
              onClick={handleCancel}
              sx={{
                width: '100%',
                height: 56,
                borderRadius: 4,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Cancel Request
            </Button>
          </motion.div>
        )}

        {searchStage === 'found' && driver && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  mb: 3,
                }}
              >
                ✓
              </Box>
            </motion.div>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Driver Found!
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              {driver.name} is coming to pick you up
            </Typography>

            {/* Driver Card */}
            <Box
              sx={{
                width: '100%',
                maxWidth: 400,
                p: 3,
                borderRadius: 4,
                bgcolor: 'background.paper',
                boxShadow: 3,
                mb: 4,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={driver.avatar}
                  sx={{ width: 64, height: 64, mr: 2 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {driver.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ⭐ {driver.rating}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • {driver.vehicleColor} {driver.vehicleModel}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Plate Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {driver.vehiclePlate}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    Arriving in
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 700, color: 'primary.main' }}
                  >
                    {driver.eta}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Continue Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => router.push('/rider/tracking')}
              sx={{ height: 56, fontWeight: 600 }}
            >
              Track Driver
            </Button>
          </motion.div>
        )}

        {searchStage === 'timeout' && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* No Drivers Icon */}
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                mb: 3,
              }}
            >
              😔
            </Box>

            <Typography
              variant="h5"
              sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}
            >
              No Drivers Available
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', mb: 4, maxWidth: 300 }}
            >
              We couldn't find any drivers nearby right now. Please try again in a few minutes.
            </Typography>

            {/* Actions */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => window.location.reload()}
                sx={{ height: 56, fontWeight: 600 }}
              >
                Try Again
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleCancel}
                sx={{ height: 56, fontWeight: 600 }}
              >
                Go Back
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
