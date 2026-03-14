'use client';
// PATH: rider/app/(main)/trips/[id]/page.jsx
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Chip,
  Divider,
  Button,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Report as ReportIcon,
  Share as ShareIcon,
  Receipt as ReceiptIcon,
  Speed as SpeedIcon,
  AccessTime as TimeIcon,
  Straighten as DistanceIcon,
  Payment as PaymentIcon,
  LocalTaxi as TaxiIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ShimmerDiv, ShimmerText, ShimmerTitle } from 'shimmer-effects-react';
import { ridesAPI } from '@/lib/api/rides';
import { formatCurrency, formatDate, formatDistance, formatDuration, getImageUrl } from '@/Functions';
import { RIDE_STATUS_LABELS, RIDE_STATUS_COLORS } from '@/Constants';
import useRide from '@/lib/hooks/useRide';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const TripDetailSkeleton = ({ mode }) => (
  <Box sx={{ px: 2, pt: 2 }}>
    {/* Status card */}
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <ShimmerDiv mode={mode} height={28} width={110} rounded={1} />
        <ShimmerDiv mode={mode} height={36} width={90} rounded={1} />
      </Box>
      <ShimmerDiv mode={mode} height={14} width={180} rounded={1} />
    </Box>
    {/* Route card */}
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', mb: 2 }}>
      <ShimmerDiv mode={mode} height={18} width={100} rounded={1} />
      <Box sx={{ mt: 2 }}>
        {[1, 2].map((i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: i === 1 ? 2 : 0 }}>
            <ShimmerDiv mode={mode} height={12} width={12} rounded={1} />
            <Box sx={{ flex: 1 }}>
              <ShimmerDiv mode={mode} height={12} width={40} rounded={1} />
              <Box sx={{ mt: 0.5 }}>
                <ShimmerDiv mode={mode} height={14} width="80%" rounded={1} />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
    {/* Driver card */}
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <ShimmerDiv mode={mode} height={56} width={56} rounded={1} />
        <Box sx={{ flex: 1 }}>
          <ShimmerDiv mode={mode} height={18} width={140} rounded={1} />
          <Box sx={{ mt: 1 }}>
            <ShimmerDiv mode={mode} height={14} width={80} rounded={1} />
          </Box>
        </Box>
      </Box>
    </Box>
    {/* Stats grid */}
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', mb: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i}>
            <ShimmerDiv mode={mode} height={12} width={60} rounded={1} />
            <Box sx={{ mt: 1 }}>
              <ShimmerDiv mode={mode} height={18} width={80} rounded={1} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);

// ─── Stat tile ────────────────────────────────────────────────────────────────
const StatTile = ({ icon, label, value, accentColor, isDark }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 2.5,
      background: isDark
        ? `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`
        : `linear-gradient(135deg, ${accentColor}12 0%, ${accentColor}06 100%)`,
      border: '1px solid',
      borderColor: `${accentColor}20`,
      transition: 'transform 0.18s ease',
    }}
  >
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1.5,
        background: `linear-gradient(135deg, ${accentColor}30 0%, ${accentColor}15 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1,
        color: accentColor,
      }}
    >
      {icon}
    </Box>
    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block' }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.3, fontSize: '0.95rem' }}>
      {value}
    </Typography>
  </Box>
);

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const shimmerMode = theme.palette.mode;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverProfilePic, setDriverProfilePic ] = useState(null)
  const { loadRideDriverProfilePicUrl } = useRide()

  useEffect(() => {
    loadRide();
  }, [params.id]);

  const loadRide = async () => {
    try {
      setLoading(true);
      const response = await ridesAPI.getRide(params.id);
      const rideData = response.success ? response.data : response;
      setRide(rideData)
      setDriverProfilePic(await loadRideDriverProfilePicUrl(rideData?.driver?.id))
    } catch (error) {
      console.error('Error loading ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetReceipt = () => router.push(`/trips/${params.id}/receipt`);
  const handleReportIssue = () => router.push(`/trips/${params.id}/report`);

  const handleShareTrip = () => {
    if (navigator.share && ride) {
      navigator.share({
        title: 'OkraRides Trip',
        text: `Trip from ${ride.pickupLocation.address} to ${ride.dropoffLocation.address}`,
        url: window.location.href,
      });
    }
  };

  const statusColor = ride ? (RIDE_STATUS_COLORS[ride.rideStatus] || '#9E9E9E') : '#9E9E9E';

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* ── Fixed Header ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          flexShrink: 0,
          background: isDark
            ? 'linear-gradient(160deg, #1C1C1C 0%, #141414 100%)'
            : 'linear-gradient(160deg, #FFFFFF 0%, #F8F8F8 100%)',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
        }}
      >
        {/* Color accent bar that echoes the ride status */}
        {ride && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}60 100%)`,
            }}
          />
        )}
        <IconButton
          onClick={() => router.back()}
          edge="start"
          sx={{
            bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)' },
            width: 38,
            height: 38,
          }}
        >
          <BackIcon sx={{ fontSize: 20 }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1, letterSpacing: -0.3 }}>
            Trip Details
          </Typography>
          {ride && (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
              {ride.rideCode}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={handleShareTrip}
          sx={{
            bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            width: 38,
            height: 38,
          }}
        >
          <ShareIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ── Scrollable Content ──────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          pb: 3,
        }}
      >
        {loading ? (
          <TripDetailSkeleton mode={shimmerMode} />
        ) : !ride ? (
          <Box sx={{ p: 3 }}>
            <Typography>Trip not found</Typography>
          </Box>
        ) : (
          <Box sx={{ px: 2, pt: 2 }}>

            {/* Status + Fare hero card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  borderRadius: 3,
                  background: isDark
                    ? `linear-gradient(135deg, ${statusColor}22 0%, ${statusColor}08 100%)`
                    : `linear-gradient(135deg, ${statusColor}15 0%, ${statusColor}05 100%)`,
                  border: '1px solid',
                  borderColor: `${statusColor}30`,
                  boxShadow: `0 8px 32px ${statusColor}20`,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Decorative circle */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: -30,
                    top: -30,
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${statusColor}18 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Chip
                    label={RIDE_STATUS_LABELS[ride.rideStatus]}
                    sx={{
                      background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}CC 100%)`,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      boxShadow: `0 4px 12px ${statusColor}40`,
                    }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: -1,
                      background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {formatCurrency(ride.totalFare)}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                  {formatDate(ride.createdAt, 'long')} · {formatDate(ride.createdAt, 'time')}
                </Typography>
              </Paper>
            </motion.div>

            {/* Trip Route */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, fontSize: '0.8rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.disabled' }}>
                  Route
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Timeline track */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        boxShadow: '0 0 0 4px rgba(76,175,80,0.2)',
                        flexShrink: 0,
                      }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        width: 2,
                        minHeight: 32,
                        my: 0.5,
                        background: 'repeating-linear-gradient(180deg, #4CAF50 0px, #4CAF50 4px, transparent 4px, transparent 8px)',
                      }}
                    />
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: 1,
                        bgcolor: 'error.main',
                        flexShrink: 0,
                        boxShadow: '0 0 0 4px rgba(244,67,54,0.2)',
                      }}
                    />
                  </Box>

                  {/* Addresses */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Pickup
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3, lineHeight: 1.4 }}>
                        {ride.pickupLocation?.address || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Dropoff
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3, lineHeight: 1.4 }}>
                        {ride.dropoffLocation?.address || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </motion.div>

            {/* Driver Info */}
            {ride.driver && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontSize: '0.8rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.disabled' }}>
                    Driver
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(driverProfilePic, 'thumbnail')}
                        sx={{
                          width: 56,
                          height: 56,
                          border: '3px solid',
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(255,193,7,0.3)',
                        }}
                      >
                        {ride.driver.firstName?.[0]}
                      </Avatar>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
                        {ride.driver.firstName} {ride.driver.lastName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Typography sx={{ fontSize: '0.9rem' }}>⭐</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#FF8C00' }}>
                          {ride.driver.driverProfile?.averageRating?.toFixed(1) || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          · {ride.driver.driverProfile?.completedRides || 0} trips
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride.driver.username)
                            ? ride.driver.username
                            : ride.driver.phoneNumber;
                          const digits = raw.replace(/\D/g, '');
                          const phone = digits.length > 10 ? digits.slice(-10) : digits;
                          window.location.href = `tel:${phone}`;
                        }}
                        sx={{
                          bgcolor: 'success.main', color: '#fff', width: 36, height: 36,
                          '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.08)' },
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <PhoneIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const raw = /^\+?\d[\d\s\-]{6,}$/.test(ride.driver.username)
                            ? ride.driver.username
                            : ride.driver.phoneNumber;
                          const phone = raw.replace(/\D/g, '');
                          window.open(`https://wa.me/${phone}`, '_blank');
                        }}
                        sx={{
                          bgcolor: 'primary.main', color: '#fff', width: 36, height: 36,
                          '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.08)' },
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <MessageIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {ride.vehicle && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: 2,
                        background: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.03)',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          Vehicle
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          Plate
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: 1,
                            fontFamily: 'monospace',
                            background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {ride.vehicle.numberPlate}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </motion.div>
            )}

            {/* Trip Stats Grid */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontSize: '0.8rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.disabled' }}>
                  Trip Summary
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <StatTile icon={<DistanceIcon sx={{ fontSize: 16 }} />} label="Distance" value={formatDistance(ride.actualDistance || ride.estimatedDistance || 0)} accentColor="#2196F3" isDark={isDark} />
                  <StatTile icon={<TimeIcon sx={{ fontSize: 16 }} />} label="Duration" value={formatDuration(ride.actualDuration || ride.estimatedDuration || 0)} accentColor="#9C27B0" isDark={isDark} />
                  <StatTile icon={<PaymentIcon sx={{ fontSize: 16 }} />} label="Payment" value={ride.paymentMethod === 'cash' ? 'Cash' : 'OkraPay'} accentColor="#4CAF50" isDark={isDark} />
                  <StatTile icon={<TaxiIcon sx={{ fontSize: 16 }} />} label="Ride Type" value={ride.taxiType?.name || 'N/A'} accentColor="#FF8C00" isDark={isDark} />
                </Box>
              </Paper>
            </motion.div>

            {/* Fare Breakdown */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, fontSize: '0.8rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'text.disabled' }}>
                  Fare Breakdown
                </Typography>

                {[
                  { label: 'Base Fare', value: ride.baseFare || 0 },
                  { label: 'Distance Fare', value: ride.distanceFare || 0 },
                  ...(ride.surgeFare > 0 ? [{ label: 'Surge', value: ride.surgeFare }] : []),
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(item.value)}</Typography>
                  </Box>
                ))}

                {ride.promoDiscount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'success.main' }}>Promo Discount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      -{formatCurrency(ride.promoDiscount)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Total</Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #FFC107 0%, #FF8C00 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: -0.5,
                    }}
                  >
                    {formatCurrency(ride.totalFare)}
                  </Typography>
                </Box>
              </Paper>
            </motion.div>

            {/* Action Buttons */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ReceiptIcon />}
                  onClick={handleGetReceipt}
                  sx={{
                    height: 50,
                    borderRadius: 2.5,
                    fontWeight: 600,
                    borderWidth: 1.5,
                    '&:hover': { borderWidth: 1.5, transform: 'translateY(-1px)' },
                    transition: 'all 0.18s ease',
                  }}
                >
                  Receipt
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<ReportIcon />}
                  onClick={handleReportIssue}
                  sx={{
                    height: 50,
                    borderRadius: 2.5,
                    fontWeight: 600,
                    borderWidth: 1.5,
                    '&:hover': { borderWidth: 1.5, transform: 'translateY(-1px)' },
                    transition: 'all 0.18s ease',
                  }}
                >
                  Report
                </Button>
              </Box>
            </motion.div>
          </Box>
        )}
      </Box>
    </Box>
  );
}