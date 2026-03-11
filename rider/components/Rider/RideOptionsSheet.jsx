// components/Rider/RideOptionsSheet.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, CircularProgress, TextField,
  InputAdornment, IconButton, Divider, Chip, Radio,
  RadioGroup, FormControlLabel, Alert, Paper,
} from '@mui/material';
import {
  Close as CloseIcon, LocalOffer as PromoIcon,
  CheckCircle as CheckIcon, AccessTime as TimeIcon,
  TrendingUp as SurgeIcon, Person as PersonIcon,
  CreditCard as CardIcon, AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheetDragPill } from '@/components/ui/SwipeableBottomSheet';

const HEADER_GRADIENT_SX = {
  background: 'linear-gradient(-60deg, #FFB300 0%, #FF8A00 25%, #FFC107 50%, #FF6D00 75%, #FFD54F 100%)',
  backgroundSize: '300% 300%',
  animation: 'okraHeaderWave 6s ease infinite',
  '@keyframes okraHeaderWave': {
    '0%':   { backgroundPosition: '0% 50%' },
    '50%':  { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
};

const RIDE_CLASS_ICONS = {
  'okra-go': '🚗', 'okra-bike': '🏍️', 'okra-xl': '🚙',
  'okra-bus': '🚌', 'okra-premium': '✨',
};

export function RideOptionsSheet({
  pickupLocation, dropoffLocation, routeInfo,
  fareEstimates, loadingEstimates, selectedRideClass,
  onSelectRideClass, promoCode, onPromoCodeChange,
  promoDiscount, onValidatePromo, validatingPromo,
  onClose, onConfirmRide, loading,
  bottomPadding = 80,
}) {
  const [paymentMethod,   setPaymentMethod]   = useState('cash');
  const [passengerCount,  setPassengerCount]  = useState(1);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [notes,           setNotes]           = useState('');
  const [promoInput,      setPromoInput]      = useState(promoCode || '');
  const [promoApplied,    setPromoApplied]    = useState(false);

  const hasLocations = !!(pickupLocation && dropoffLocation);

  useEffect(() => { if (promoCode) setPromoInput(promoCode); }, [promoCode]);
  useEffect(() => { setPromoApplied(!!(promoDiscount?.valid)); }, [promoDiscount]);

  const handleApplyPromo = () => {
    if (promoInput?.trim()) {
      onPromoCodeChange(promoInput.trim());
      onValidatePromo(promoInput.trim());
    }
  };
  const handleRemovePromo = () => {
    setPromoInput(''); onPromoCodeChange(''); setPromoApplied(false);
  };
  const calculateTotalFare = () => {
    if (!selectedRideClass) return 0;
    const sub = selectedRideClass.subtotal || selectedRideClass.estimatedFare || 0;
    return promoApplied && promoDiscount ? Math.max(0, sub - (promoDiscount.discount || 0)) : sub;
  };
  const toggleSpecialRequest = (req) =>
    setSpecialRequests((p) => p.includes(req) ? p.filter((r) => r !== req) : [...p, req]);
  const handleConfirm = () => {
    if (!hasLocations || !selectedRideClass) return;
    onConfirmRide({ paymentMethod, passengerCount, specialRequests, notes, totalFare: calculateTotalFare() });
  };

  return (
    /*
      CRITICAL LAYOUT PATTERN
      ───────────────────────
      This Box fills the height given by SwipeableBottomSheet (via flex).
      It is a flex column with three zones:
        1. Header     — flex-shrink: 0, never scrolls
        2. ScrollArea — flex: 1, min-height: 0, overflowY: auto (hidden scrollbar)
        3. Footer     — flex-shrink: 0, ALWAYS visible at bottom, above bottom nav

      SwipeableBottomSheet's inner container is overflow:hidden so the footer
      can never be clipped by a parent scroll context.
    */
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        bgcolor: 'background.paper',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ① HEADER — gradient, pill inside, never scrolls */}
      <Box
        sx={{
          ...HEADER_GRADIENT_SX,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute',
            top: -30, right: -30, width: 120, height: 120,
            borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          },
        }}
      >
        <BottomSheetDragPill colored />
        <Box sx={{ px: 3, pb: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'white', fontSize: '1.15rem', letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.15)', mb: routeInfo ? 0.5 : 0 }}>
              Choose your ride
            </Typography>
            {routeInfo && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.78rem' }}>
                📍 {routeInfo.distance}&nbsp;&nbsp;·&nbsp;&nbsp;⏱ {routeInfo.duration}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', flexShrink: 0, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' }, '&:focus': { outline: 'none', bgcolor: 'rgba(255,255,255,0.35)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* ② SCROLL AREA — fills remaining space, hidden scrollbar */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          p: 2,
          pb: 1,
          boxSizing: 'border-box',
        }}
      >
        {!hasLocations && <Alert severity="warning" sx={{ mb: 2 }}>Please select both pickup and dropoff locations.</Alert>}

        {loadingEstimates && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading ride options…</Typography>
          </Box>
        )}

        {/* Ride option cards */}
        {!loadingEstimates && fareEstimates?.estimates?.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {fareEstimates.estimates.map((estimate, index) => {
              const isSelected = selectedRideClass?.rideClassId === estimate.rideClassId || selectedRideClass?.id === estimate.rideClassId;
              const icon = RIDE_CLASS_ICONS[estimate.rideClassName?.toLowerCase().replace(/ /g, '-')] || '🚗';
              return (
                <motion.div key={estimate.rideClassId || index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
                  <Paper
                    onClick={() => onSelectRideClass(estimate)}
                    elevation={0}
                    sx={{
                      p: 2, mb: 1.5, cursor: 'pointer', border: '2px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'rgba(255,193,7,0.07)' : 'background.paper',
                      borderRadius: 2.5, transition: 'all 0.15s ease',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(255,193,7,0.18)' },
                      '&:active': { transform: 'none' },
                      // Prevent focus outlines from breaking layout
                      outline: 'none',
                      '&:focus': { outline: 'none' },
                      width: '100%', maxWidth: '100%', boxSizing: 'border-box',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', minWidth: 0 }}>
                      <Box sx={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{icon}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>{estimate.rideClassName}</Typography>
                          {estimate.surgeFare > 0 && <Chip label={`${((estimate.surgeFare / estimate.baseFare) * 100).toFixed(0)}x`} size="small" color="error" icon={<SurgeIcon />} />}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimeIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{estimate.estimatedDuration} min</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">{estimate.availableDrivers || 0} nearby</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ fontSize: '1rem' }}>
                          K{(estimate.subtotal || 0).toFixed(2)}
                        </Typography>
                        {estimate.surgeFare > 0 && <Typography variant="caption" color="text.secondary">Surge</Typography>}
                      </Box>
                      {isSelected && <CheckIcon color="primary" sx={{ fontSize: 22, flexShrink: 0 }} />}
                    </Box>
                  </Paper>
                </motion.div>
              );
            })}
          </Box>
        )}

        {!loadingEstimates && !fareEstimates?.estimates?.length && hasLocations && (
          <Alert severity="info" sx={{ mb: 2 }}>No ride options available for this route.</Alert>
        )}

        {/* Promo Code */}
        {selectedRideClass && (
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Promo Code</Typography>
            {!promoApplied ? (
              <Box sx={{ display: 'flex', gap: 1, width: '100%', minWidth: 0 }}>
                <TextField
                  fullWidth size="small" placeholder="Enter promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PromoIcon color="action" fontSize="small" /></InputAdornment> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& .MuiInputBase-root:focus': { outline: 'none' }, flexShrink: 1, minWidth: 0 }}
                />
                <Button
                  variant="contained" onClick={handleApplyPromo}
                  disabled={!promoInput || validatingPromo}
                  sx={{ minWidth: 80, flexShrink: 0, borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:focus': { outline: 'none' } }}
                >
                  {validatingPromo ? <CircularProgress size={18} color="inherit" /> : 'Apply'}
                </Button>
              </Box>
            ) : (
              <Paper elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'success.main', borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{promoInput}</Typography>
                      <Typography variant="caption" color="text.secondary">{promoDiscount?.message || `Save K${promoDiscount?.discount?.toFixed(2)}`}</Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={handleRemovePromo} sx={{ flexShrink: 0, '&:focus': { outline: 'none' } }}><CloseIcon fontSize="small" /></IconButton>
                </Box>
              </Paper>
            )}
          </Box>
        )}

        {/* Payment Method */}
        {selectedRideClass && (
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Payment Method</Typography>
            <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {[{ value: 'cash', label: 'Cash', Icon: WalletIcon }, { value: 'okrapay', label: 'OkraPay', Icon: CardIcon }].map(({ value, label, Icon }) => (
                <Paper
                  key={value} elevation={0} onClick={() => setPaymentMethod(value)}
                  sx={{
                    p: 1.5, mb: 1, border: '1.5px solid',
                    borderColor: paymentMethod === value ? 'primary.main' : 'divider',
                    bgcolor: paymentMethod === value ? 'rgba(255,193,7,0.06)' : 'background.paper',
                    borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s ease',
                    width: '100%', boxSizing: 'border-box',
                    '&:focus': { outline: 'none' },
                  }}
                >
                  <FormControlLabel
                    value={value} control={<Radio size="small" sx={{ '&:focus': { outline: 'none' } }} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon sx={{ fontSize: 19, color: paymentMethod === value ? 'primary.main' : 'text.secondary' }} />
                        <Typography fontWeight={600} fontSize="0.88rem">{label}</Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </Box>
        )}

        {/* Special Requests */}
        {selectedRideClass && (
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Special Requests <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Wheelchair Accessible', 'Pet Friendly', 'Child Seat', 'Extra Luggage'].map((req) => {
                const key = req.toLowerCase().replace(/ /g, '_');
                const active = specialRequests.includes(key);
                return (
                  <Chip
                    key={req} label={req} size="small"
                    onClick={() => toggleSpecialRequest(key)}
                    color={active ? 'primary' : 'default'}
                    variant={active ? 'filled' : 'outlined'}
                    sx={{ fontWeight: active ? 700 : 500, '&:focus': { outline: 'none' } }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {/* bottom padding inside scroll so last item isn't flush against footer */}
        <Box sx={{ height: 8 }} />
      </Box>

      {/* ③ FOOTER — flex-shrink:0, OUTSIDE scroll area, always visible above nav bar */}
      <AnimatePresence>
        {selectedRideClass && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            style={{ flexShrink: 0, width: '100%' }}
          >
            <Box
              sx={{
                px: 2.5,
                pt: 1.5,
                // bottomPadding ensures content clears the bottom navigation bar.
                // We do NOT use env(safe-area-inset-bottom) here because the
                // bottom nav is a sibling element with its own height — we just
                // need a fixed px clearance equal to nav bar height.
                pb: `${bottomPadding}px`,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2" fontWeight={600}>K{(selectedRideClass.subtotal || 0).toFixed(2)}</Typography>
                </Box>
                {promoApplied && promoDiscount && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography variant="body2" color="success.main">Promo Discount</Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">-K{(promoDiscount.discount || 0).toFixed(2)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.75 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={800}>Total</Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">K{calculateTotalFare().toFixed(2)}</Typography>
                </Box>
              </Box>

              <Button
                fullWidth variant="contained" size="large"
                onClick={handleConfirm}
                disabled={!hasLocations || !selectedRideClass || loading}
                sx={{
                  height: 52,
                  fontWeight: 800, fontSize: '0.95rem', borderRadius: 3,
                  textTransform: 'none',
                  boxShadow: '0 4px 18px rgba(255,193,7,0.4)',
                  transition: 'all 0.18s ease',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 28px rgba(255,193,7,0.5)' },
                  '&:active': { transform: 'none' },
                  '&:focus': { outline: 'none' },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : `Confirm Ride · K${calculateTotalFare().toFixed(2)}`}
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default RideOptionsSheet;