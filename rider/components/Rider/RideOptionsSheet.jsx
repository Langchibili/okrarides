'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  Chip,
  Divider,
  CircularProgress,
  Radio,
  Paper,
  TextField,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  TwoWheeler as BikeIcon,
  DirectionsBus as BusIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ridesAPI } from '@/lib/api/rides';
import { formatCurrency } from '@/Functions';

const rideTypes = [
  {
    id: 'okra-go',
    name: 'Okra Go',
    icon: <CarIcon />,
    description: 'Affordable rides',
    capacity: 4,
    color: '#FFC107',
  },
  {
    id: 'okra-bike',
    name: 'Okra Bike',
    icon: <BikeIcon />,
    description: 'Quick motorcycle rides',
    capacity: 1,
    color: '#FF9800',
  },
  {
    id: 'okra-bus',
    name: 'Okra Bus',
    icon: <BusIcon />,
    description: 'Shared bus rides',
    capacity: 20,
    color: '#4CAF50',
  },
];

export const RideOptionsSheet = ({
  pickupLocation,
  dropoffLocation,
  onClose,
  onConfirmRide,
}) => {
  const [selectedRide, setSelectedRide] = useState(rideTypes[0]);
  const [loading, setLoading] = useState(true);
  const [estimatedPrices, setEstimatedPrices] = useState({});
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');

  // Fetch price estimates
  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const response = await ridesAPI.getEstimate({
          pickupLocation,
          dropoffLocation,
          rideTypes: rideTypes.map(r => r.id),
        });
        
        // Mock prices for now
        setEstimatedPrices({
          'okra-go': 25.00,
          'okra-bike': 15.00,
          'okra-bus': 10.00,
        });
      } catch (error) {
        console.error('Error fetching prices:', error);
        // Fallback prices
        setEstimatedPrices({
          'okra-go': 25.00,
          'okra-bike': 15.00,
          'okra-bus': 10.00,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [pickupLocation, dropoffLocation]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    try {
      const result = await ridesAPI.validatePromoCode(promoCode);
      if (result.valid) {
        setPromoApplied(true);
        // Apply discount to prices
      }
    } catch (error) {
      console.error('Invalid promo code');
    }
  };

  const handleConfirm = () => {
    onConfirmRide({
      rideType: selectedRide.id,
      pickupLocation,
      dropoffLocation,
      estimatedPrice: estimatedPrices[selectedRide.id] || selectedRide.price,
      paymentMethod: selectedPaymentMethod,
      promoCode: promoApplied ? promoCode : null,
    });
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'background.paper',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        boxShadow: 24,
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 1100,
      }}
    >
      <Box sx={{ p: 3, pb: 12 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Choose a ride
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pickupLocation?.address} → {dropoffLocation?.address}
            </Typography>
          </Box>
          <Button
            variant="text"
            color="inherit"
            onClick={onClose}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <CloseIcon />
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Ride Types List */}
            <List disablePadding sx={{ mb: 3 }}>
              {rideTypes.map((ride, index) => {
                const price = estimatedPrices[ride.id] || 0;
                const isSelected = selectedRide.id === ride.id;

                return (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ListItem
                      button
                      onClick={() => setSelectedRide(ride)}
                      sx={{
                        borderRadius: 3,
                        mb: 1,
                        border: 2,
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        bgcolor: isSelected ? 'action.selected' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      {/* Icon */}
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: `${ride.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          color: ride.color,
                        }}
                      >
                        {ride.icon}
                      </Box>

                      {/* Info */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {ride.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <TimeIcon sx={{ fontSize: 14 }} />
                            3 min
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <PeopleIcon sx={{ fontSize: 14 }} />
                            {ride.capacity}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Price */}
                      <Box sx={{ textAlign: 'right', mr: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: ride.color }}>
                          {formatCurrency(price)}
                        </Typography>
                      </Box>

                      {/* Radio */}
                      <Radio checked={isSelected} />
                    </ListItem>
                  </motion.div>
                );
              })}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Payment Method */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Payment Method
              </Typography>

              <Paper
                onClick={() => setSelectedPaymentMethod('cash')}
                sx={{
                  display: 'flex',
                  gap: 1,
                  p: 2,
                  borderRadius: 2,
                  border: 2,
                  borderColor: selectedPaymentMethod === 'cash' ? 'primary.main' : 'divider',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  💵
                </Box>
                <Typography sx={{ flex: 1, fontWeight: 500 }}>Cash</Typography>
                <Radio checked={selectedPaymentMethod === 'cash'} />
              </Paper>
            </Box>

            {/* Promo Code */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                disabled={promoApplied}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1 }}>🎁</Box>,
                  endAdornment: promoApplied ? (
                    <Chip label="Applied" size="small" color="success" />
                  ) : (
                    <Button
                      size="small"
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim()}
                    >
                      Apply
                    </Button>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  },
                }}
              />
            </Box>

            {/* Confirm Button */}
            <motion.div whileTap={{ scale: 0.98 }}>
              {/* <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleConfirm}
                sx={{
                  height: 56,
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: selectedRide.color,
                  '&:hover': {
                    bgcolor: selectedRide.color,
                    filter: 'brightness(0.9)',
                  },
                }}
              >
                Confirm {selectedRide.name}
              </Button> */}
              <Button
  fullWidth
  variant="contained"
  size="large"
  onClick={handleConfirm}
  disabled={loading}
  sx={{
    height: 56,
    fontWeight: 700,
    fontSize: '1rem',
    borderRadius: 3,
    textTransform: 'none',
    mt: 2,
    boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
    '&:hover': {
      boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  }}
>
  {loading ? <CircularProgress size={24} color="inherit" /> : `Confirm ${selectedRide.name}`}
</Button>
            </motion.div>
          </>
        )}
      </Box>
    </Box>
  );
};

export default RideOptionsSheet;

