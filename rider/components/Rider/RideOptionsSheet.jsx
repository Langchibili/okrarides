// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   Box,
//   Typography,
//   Button,
//   List,
//   ListItem,
//   Chip,
//   Divider,
//   CircularProgress,
//   Radio,
//   Paper,
//   TextField,
// } from '@mui/material';
// import {
//   DirectionsCar as CarIcon,
//   TwoWheeler as BikeIcon,
//   DirectionsBus as BusIcon,
//   AccessTime as TimeIcon,
//   People as PeopleIcon,
//   Close as CloseIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { ridesAPI } from '@/lib/api/rides';
// import { formatCurrency } from '@/Functions';

// const rideTypes = [
//   {
//     id: 'okra-go',
//     name: 'Okra Go',
//     icon: <CarIcon />,
//     description: 'Affordable rides',
//     capacity: 4,
//     color: '#FFC107',
//   },
//   {
//     id: 'okra-bike',
//     name: 'Okra Bike',
//     icon: <BikeIcon />,
//     description: 'Quick motorcycle rides',
//     capacity: 1,
//     color: '#FF9800',
//   },
//   {
//     id: 'okra-bus',
//     name: 'Okra Bus',
//     icon: <BusIcon />,
//     description: 'Shared bus rides',
//     capacity: 20,
//     color: '#4CAF50',
//   },
// ];

// export const RideOptionsSheet = ({
//   pickupLocation,
//   dropoffLocation,
//   onClose,
//   onConfirmRide,
// }) => {
//   const [selectedRide, setSelectedRide] = useState(rideTypes[0]);
//   const [loading, setLoading] = useState(true);
//   const [estimatedPrices, setEstimatedPrices] = useState({});
//   const [promoCode, setPromoCode] = useState('');
//   const [promoApplied, setPromoApplied] = useState(false);
//   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');

//   // Fetch price estimates
//   useEffect(() => {
//     const fetchPrices = async () => {
//       setLoading(true);
//       try {
//         const response = await ridesAPI.getEstimate({
//           pickupLocation,
//           dropoffLocation,
//           rideTypes: rideTypes.map(r => r.id),
//         });
        
//         // Mock prices for now
//         setEstimatedPrices({
//           'okra-go': 25.00,
//           'okra-bike': 15.00,
//           'okra-bus': 10.00,
//         });
//       } catch (error) {
//         console.error('Error fetching prices:', error);
//         // Fallback prices
//         setEstimatedPrices({
//           'okra-go': 25.00,
//           'okra-bike': 15.00,
//           'okra-bus': 10.00,
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPrices();
//   }, [pickupLocation, dropoffLocation]);

//   const handleApplyPromo = async () => {
//     if (!promoCode.trim()) return;
    
//     try {
//       const result = await ridesAPI.validatePromoCode(promoCode);
//       if (result.valid) {
//         setPromoApplied(true);
//         // Apply discount to prices
//       }
//     } catch (error) {
//       console.error('Invalid promo code');
//     }
//   };

//   const handleConfirm = () => {
//     onConfirmRide({
//       rideType: selectedRide.id,
//       pickupLocation,
//       dropoffLocation,
//       estimatedPrice: estimatedPrices[selectedRide.id] || selectedRide.price,
//       paymentMethod: selectedPaymentMethod,
//       promoCode: promoApplied ? promoCode : null,
//     });
//   };

//   return (
//     <Box
//       sx={{
//         position: 'fixed',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         bgcolor: 'background.paper',
//         borderTopLeftRadius: 32,
//         borderTopRightRadius: 32,
//         boxShadow: 24,
//         maxHeight: '80vh',
//         overflow: 'auto',
//         zIndex: 1100,
//       }}
//     >
//       <Box sx={{ p: 3, pb: 12 }}>
//         {/* Header */}
//         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="h6" sx={{ fontWeight: 600 }}>
//               Choose a ride
//             </Typography>
//             <Typography variant="caption" color="text.secondary">
//               {pickupLocation?.address} → {dropoffLocation?.address}
//             </Typography>
//           </Box>
//           <Button
//             variant="text"
//             color="inherit"
//             onClick={onClose}
//             sx={{ minWidth: 'auto', p: 1 }}
//           >
//             <CloseIcon />
//           </Button>
//         </Box>

//         {loading ? (
//           <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
//             <CircularProgress />
//           </Box>
//         ) : (
//           <>
//             {/* Ride Types List */}
//             <List disablePadding sx={{ mb: 3 }}>
//               {rideTypes.map((ride, index) => {
//                 const price = estimatedPrices[ride.id] || 0;
//                 const isSelected = selectedRide.id === ride.id;

//                 return (
//                   <motion.div
//                     key={ride.id}
//                     initial={{ opacity: 0, x: -20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: index * 0.05 }}
//                   >
//                     <ListItem
//                       button
//                       onClick={() => setSelectedRide(ride)}
//                       sx={{
//                         borderRadius: 3,
//                         mb: 1,
//                         border: 2,
//                         borderColor: isSelected ? 'primary.main' : 'transparent',
//                         bgcolor: isSelected ? 'action.selected' : 'background.paper',
//                         transition: 'all 0.2s',
//                         '&:hover': {
//                           bgcolor: 'action.hover',
//                         },
//                       }}
//                     >
//                       {/* Icon */}
//                       <Box
//                         sx={{
//                           width: 48,
//                           height: 48,
//                           borderRadius: 2,
//                           bgcolor: `${ride.color}20`,
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center',
//                           mr: 2,
//                           color: ride.color,
//                         }}
//                       >
//                         {ride.icon}
//                       </Box>

//                       {/* Info */}
//                       <Box sx={{ flex: 1 }}>
//                         <Typography variant="body1" sx={{ fontWeight: 600 }}>
//                           {ride.name}
//                         </Typography>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
//                           <Typography
//                             variant="caption"
//                             color="text.secondary"
//                             sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
//                           >
//                             <TimeIcon sx={{ fontSize: 14 }} />
//                             3 min
//                           </Typography>
//                           <Typography variant="caption" color="text.secondary">
//                             •
//                           </Typography>
//                           <Typography
//                             variant="caption"
//                             color="text.secondary"
//                             sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
//                           >
//                             <PeopleIcon sx={{ fontSize: 14 }} />
//                             {ride.capacity}
//                           </Typography>
//                         </Box>
//                       </Box>

//                       {/* Price */}
//                       <Box sx={{ textAlign: 'right', mr: 1 }}>
//                         <Typography variant="h6" sx={{ fontWeight: 700, color: ride.color }}>
//                           {formatCurrency(price)}
//                         </Typography>
//                       </Box>

//                       {/* Radio */}
//                       <Radio checked={isSelected} />
//                     </ListItem>
//                   </motion.div>
//                 );
//               })}
//             </List>

//             <Divider sx={{ my: 2 }} />

//             {/* Payment Method */}
//             <Box sx={{ mb: 3 }}>
//               <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
//                 Payment Method
//               </Typography>

//               <Paper
//                 onClick={() => setSelectedPaymentMethod('cash')}
//                 sx={{
//                   display: 'flex',
//                   gap: 1,
//                   p: 2,
//                   borderRadius: 2,
//                   border: 2,
//                   borderColor: selectedPaymentMethod === 'cash' ? 'primary.main' : 'divider',
//                   alignItems: 'center',
//                   cursor: 'pointer',
//                   '&:hover': {
//                     bgcolor: 'action.hover',
//                   },
//                 }}
//               >
//                 <Box
//                   sx={{
//                     width: 40,
//                     height: 40,
//                     borderRadius: 2,
//                     bgcolor: 'success.light',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     fontSize: '1.5rem',
//                   }}
//                 >
//                   💵
//                 </Box>
//                 <Typography sx={{ flex: 1, fontWeight: 500 }}>Cash</Typography>
//                 <Radio checked={selectedPaymentMethod === 'cash'} />
//               </Paper>
//             </Box>

//             {/* Promo Code */}
//             <Box sx={{ mb: 3 }}>
//               <TextField
//                 fullWidth
//                 placeholder="Enter promo code"
//                 value={promoCode}
//                 onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
//                 disabled={promoApplied}
//                 InputProps={{
//                   startAdornment: <Box sx={{ mr: 1 }}>🎁</Box>,
//                   endAdornment: promoApplied ? (
//                     <Chip label="Applied" size="small" color="success" />
//                   ) : (
//                     <Button
//                       size="small"
//                       onClick={handleApplyPromo}
//                       disabled={!promoCode.trim()}
//                     >
//                       Apply
//                     </Button>
//                   ),
//                 }}
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                   },
//                 }}
//               />
//             </Box>

//             {/* Confirm Button */}
//             <motion.div whileTap={{ scale: 0.98 }}>
//               {/* <Button
//                 fullWidth
//                 variant="contained"
//                 size="large"
//                 onClick={handleConfirm}
//                 sx={{
//                   height: 56,
//                   fontSize: '1rem',
//                   fontWeight: 600,
//                   bgcolor: selectedRide.color,
//                   '&:hover': {
//                     bgcolor: selectedRide.color,
//                     filter: 'brightness(0.9)',
//                   },
//                 }}
//               >
//                 Confirm {selectedRide.name}
//               </Button> */}
//               <Button
//   fullWidth
//   variant="contained"
//   size="large"
//   onClick={handleConfirm}
//   disabled={loading}
//   sx={{
//     height: 56,
//     fontWeight: 700,
//     fontSize: '1rem',
//     borderRadius: 3,
//     textTransform: 'none',
//     mt: 2,
//     boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
//     '&:hover': {
//       boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
//       transform: 'translateY(-1px)',
//     },
//     '&:active': {
//       transform: 'translateY(0)',
//     },
//   }}
// >
//   {loading ? <CircularProgress size={24} color="inherit" /> : `Confirm ${selectedRide.name}`}
// </Button>
//             </motion.div>
//           </>
//         )}
//       </Box>
//     </Box>
//   );
// };

// export default RideOptionsSheet;

// ============================================
// components/Rider/RideOptionsSheet.tsx
// ============================================
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalOffer as PromoIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  TrendingUp as SurgeIcon,
  Person as PersonIcon,
  CreditCard as CardIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';

// Ride class icons mapping
const RIDE_CLASS_ICONS = {
  'okra-go': '🚗',
  'okra-bike': '🏍️',
  'okra-xl': '🚙',
  'okra-bus': '🚌',
  'okra-premium': '✨',
};

export function RideOptionsSheet({
  pickupLocation,
  dropoffLocation,
  routeInfo,
  fareEstimates,
  loadingEstimates,
  selectedRideClass,
  onSelectRideClass,
  promoCode,
  onPromoCodeChange,
  promoDiscount,
  onValidatePromo,
  validatingPromo,
  onClose,
  onConfirmRide,
  loading,
}) {
  // Local state
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [passengerCount, setPassengerCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState([]);
  const [notes, setNotes] = useState('');
  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoApplied, setPromoApplied] = useState(false);

  // Validate locations
  const hasLocations = pickupLocation && dropoffLocation;

  // Effect to sync promo code
  useEffect(() => {
    if (promoCode) {
      setPromoInput(promoCode);
    }
  }, [promoCode]);

  // Effect to check if promo is applied
  useEffect(() => {
    if (promoDiscount && promoDiscount.valid) {
      setPromoApplied(true);
    } else {
      setPromoApplied(false);
    }
  }, [promoDiscount]);

  // Handle promo code validation
  const handleApplyPromo = () => {
    if (promoInput && promoInput.trim() !== '') {
      onPromoCodeChange(promoInput.trim());
      onValidatePromo(promoInput.trim());
    }
  };

  // Handle promo code removal
  const handleRemovePromo = () => {
    setPromoInput('');
    onPromoCodeChange('');
    setPromoApplied(false);
  };

  // Calculate total fare
  const calculateTotalFare = () => {
    if (!selectedRideClass) return 0;
    
    const subtotal = selectedRideClass.subtotal || selectedRideClass.estimatedFare || 0;
    
    if (promoApplied && promoDiscount) {
      const discount = promoDiscount.discount || 0;
      return Math.max(0, subtotal - discount);
    }
    
    return subtotal;
  };

  // Handle special request toggle
  const toggleSpecialRequest = (request) => {
    setSpecialRequests(prev => 
      prev.includes(request) 
        ? prev.filter(r => r !== request)
        : [...prev, request]
    );
  };

  // Handle confirm booking
  const handleConfirm = () => {
    if (!hasLocations) {
      alert('Please select pickup and dropoff locations');
      return;
    }

    if (!selectedRideClass) {
      alert('Please select a ride class');
      return;
    }

    const rideDetails = {
      paymentMethod,
      passengerCount,
      specialRequests,
      notes,
      totalFare: calculateTotalFare(),
    };

    onConfirmRide(rideDetails);
  };

  // Handle ride class selection
  const handleSelectRideClass = (rideClass) => {
    // Don't validate locations here - just select the ride class
    onSelectRideClass(rideClass);
  };

  return (
    <SwipeableBottomSheet
      open={true}
      initialHeight={600}
      maxHeight={700}
      minHeight={400}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Choose your ride
            </Typography>
            {routeInfo && (
              <Typography variant="caption" color="text.secondary">
                {routeInfo.distance} • {routeInfo.duration}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content - Scrollable */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {/* Location Warning */}
          {!hasLocations && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please select both pickup and dropoff locations to see ride options.
            </Alert>
          )}

          {/* Loading State */}
          {loadingEstimates && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading ride options...
              </Typography>
            </Box>
          )}

          {/* Ride Options */}
          {!loadingEstimates && fareEstimates?.estimates && fareEstimates.estimates.length > 0 && (
            <Box sx={{ mb: 3 }}>
              {fareEstimates.estimates.map((estimate, index) => {
                const isSelected = selectedRideClass?.rideClassId === estimate.rideClassId || 
                                 selectedRideClass?.id === estimate.rideClassId;
                const icon = RIDE_CLASS_ICONS[estimate.rideClassName?.toLowerCase().replace(' ', '-')] || '🚗';

                return (
                  <motion.div
                    key={estimate.rideClassId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Paper
                      onClick={() => handleSelectRideClass(estimate)}
                      sx={{
                        p: 2,
                        mb: 2,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'primary.light' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Icon */}
                        <Box
                          sx={{
                            fontSize: '2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {icon}
                        </Box>

                        {/* Info */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {estimate.rideClassName}
                            </Typography>
                            {estimate.surgeFare > 0 && (
                              <Chip
                                label={`${((estimate.surgeFare / estimate.baseFare) * 100).toFixed(0)}x`}
                                size="small"
                                color="error"
                                icon={<SurgeIcon />}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {estimate.estimatedDuration} min
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {estimate.availableDrivers || 0} nearby
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Price */}
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" fontWeight={700} color="primary">
                            K{estimate.subtotal?.toFixed(2) || '0.00'}
                          </Typography>
                          {estimate.surgeFare > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Surge pricing
                            </Typography>
                          )}
                        </Box>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <CheckIcon color="primary" sx={{ fontSize: 28 }} />
                        )}
                      </Box>
                    </Paper>
                  </motion.div>
                );
              })}
            </Box>
          )}

          {/* No Estimates Available */}
          {!loadingEstimates && (!fareEstimates?.estimates || fareEstimates.estimates.length === 0) && hasLocations && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No ride options available for this route. Please try different locations.
            </Alert>
          )}

          {/* Promo Code Section */}
          {selectedRideClass && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Promo Code
              </Typography>
              
              {!promoApplied ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PromoIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleApplyPromo}
                    disabled={!promoInput || validatingPromo}
                    sx={{ minWidth: 100, borderRadius: 2 }}
                  >
                    {validatingPromo ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </Box>
              ) : (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'success.light',
                    border: '1px solid',
                    borderColor: 'success.main',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon color="success" />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {promoInput}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {promoDiscount?.message || `Save K${promoDiscount?.discount?.toFixed(2)}`}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={handleRemovePromo}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              )}
            </Box>
          )}

          {/* Payment Method */}
          {selectedRideClass && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Payment Method
              </Typography>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <Paper
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: paymentMethod === 'cash' ? 'primary.main' : 'divider',
                    bgcolor: paymentMethod === 'cash' ? 'primary.light' : 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  <FormControlLabel
                    value="cash"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WalletIcon />
                        <Typography fontWeight={600}>Cash</Typography>
                      </Box>
                    }
                  />
                </Paper>
                <Paper
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: paymentMethod === 'okrapay' ? 'primary.main' : 'divider',
                    bgcolor: paymentMethod === 'okrapay' ? 'primary.light' : 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  <FormControlLabel
                    value="okrapay"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CardIcon />
                        <Typography fontWeight={600}>OkraPay</Typography>
                      </Box>
                    }
                  />
                </Paper>
              </RadioGroup>
            </Box>
          )}

          {/* Special Requests */}
          {selectedRideClass && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Special Requests (Optional)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['Wheelchair Accessible', 'Pet Friendly', 'Child Seat', 'Extra Luggage'].map((request) => (
                  <Chip
                    key={request}
                    label={request}
                    onClick={() => toggleSpecialRequest(request.toLowerCase().replace(' ', '_'))}
                    color={specialRequests.includes(request.toLowerCase().replace(' ', '_')) ? 'primary' : 'default'}
                    variant={specialRequests.includes(request.toLowerCase().replace(' ', '_')) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer - Fixed at bottom */}
        {selectedRideClass && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              flexShrink: 0,
            }}
          >
            {/* Price Summary */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  K{(selectedRideClass.subtotal || 0).toFixed(2)}
                </Typography>
              </Box>
              {promoApplied && promoDiscount && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="success.main">
                    Promo Discount
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    -K{(promoDiscount.discount || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  K{calculateTotalFare().toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Confirm Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleConfirm}
              disabled={!hasLocations || !selectedRideClass || loading}
              sx={{
                height: 56,
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Confirm Ride - K${calculateTotalFare().toFixed(2)}`
              )}
            </Button>
          </Box>
        )}
      </Box>
    </SwipeableBottomSheet>
  );
}

export default RideOptionsSheet;