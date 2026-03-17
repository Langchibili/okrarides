'use client';
// PATH: app/(main)/home/page.jsx — UI POLISH ONLY

import { useState, useEffect, useRef } from 'react';
import { useRouter }                   from 'next/navigation';
import { Box, AppBar, Toolbar, Typography, Button, Alert, Paper, Chip } from '@mui/material';
import { alpha, useTheme }             from '@mui/material/styles';
import {
  LocalAtm as EarningsIcon, DirectionsCar as RidesIcon, Star as StarIcon,
  Speed as SpeedIcon, History as HistoryIcon, AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon, TrendingDown as FloatLowIcon, Schedule as ExpiryIcon,
  Savings as SavingsIcon, LightMode as LightIcon, DarkMode as DarkIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { OnlineToggle }     from '@/components/Driver/OnlineToggle';
import { EarningsCard }     from '@/components/Driver/EarningsCard';
import { StatCard }         from '@/components/Driver/StatCard';
import { RideRequestModal } from '@/components/Driver/RideRequestModal';
import { HomePageSkeleton } from '@/components/Skeletons/HomePageSkeleton';
import { useDriver }        from '@/lib/hooks/useDriver';
import { useRide }          from '@/lib/hooks/useRide';
import { useReactNative }   from '@/lib/contexts/ReactNativeWrapper';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { useDriverStats }   from '@/lib/hooks/useDriverStats';
import { useThemeMode }     from '@/components/ThemeProvider';
import { formatCurrency }   from '@/Functions';
import { VERIFICATION_STATUS } from '@/Constants';
import useAuthGuard         from '@/lib/hooks/useAuthGuard';
import ClientOnly           from '@/components/ClientOnly';
import { apiClient }        from '@/lib/api/client';

const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };
const GREEN = '#10B981';
const GREEN_DIM = '#059669';

function AppsIcon({ size = 20, color = GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3"  y="3"  width="7" height="7" rx="2" fill={color} />
      <rect x="14" y="3"  width="7" height="7" rx="2" fill={color} opacity="0.7" />
      <rect x="3"  y="14" width="7" height="7" rx="2" fill={color} opacity="0.7" />
      <rect x="14" y="14" width="7" height="7" rx="2" fill={color} opacity="0.5" />
    </svg>
  );
}

function HelpCircleIcon({ size = 20, color = GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M9.5 9.5C9.5 8.12 10.62 7 12 7C13.38 7 14.5 8.12 14.5 9.5C14.5 10.88 12 12 12 13.5"
            stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.9" fill={color} />
    </svg>
  );
}

function AnimatedHeaderButton({ label, icon, direction, onClick }) {
  const [phase, setPhase] = useState(0);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const t = setTimeout(() => { if (mounted.current) setPhase(1); }, 1800);
    return () => { mounted.current = false; clearTimeout(t); };
  }, []);
  const textV = {
    enter:  { x: direction === 'left' ? 18 : -18, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 28 } },
    exit:   { x: direction === 'left' ? -22 : 22, opacity: 0, transition: { duration: 0.22 } },
  };
  const iconV = {
    enter:  { x: direction === 'left' ? 18 : -18, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 26 } },
    exit:   { x: 0, opacity: 0, transition: { duration: 0.15 } },
  };
  return (
    <Box onClick={onClick} sx={{
      cursor: 'pointer', minWidth: 48, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', borderRadius: 2, px: 0.5,
      '&:hover': { '& .btn-glow': { opacity: 1 } },
    }}>
      <Box className="btn-glow" sx={{
        position: 'absolute', inset: 0, borderRadius: 2,
        background: `radial-gradient(circle, ${alpha(GREEN, 0.18)} 0%, transparent 70%)`,
        opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none',
      }} />
      <AnimatePresence mode="wait" initial>
        {phase === 0 ? (
          <motion.div key="label" variants={textV} initial="enter" animate="center" exit="exit"
            style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            {direction === 'left' && <Typography sx={{ fontSize: 14, fontWeight: 900, color: GREEN, mr: 0.25, letterSpacing: -1, fontFamily: 'monospace' }}>«</Typography>}
            <Typography sx={{
              fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
              background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DIM} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{label}</Typography>
            {direction === 'right' && <Typography sx={{ fontSize: 14, fontWeight: 900, color: GREEN, ml: 0.25, letterSpacing: -1, fontFamily: 'monospace' }}>»</Typography>}
          </motion.div>
        ) : (
          <motion.div key="icon" variants={iconV} initial="enter" animate="center" exit="exit"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 6px ${alpha(GREEN, 0.55)})` }}>
            {icon}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

const PILL_W  = 74;
const PILL_H  = 30;
const THUMB_D = 22;
const THUMB_PAD = 3;
const THUMB_TRAVEL = PILL_W - THUMB_D - THUMB_PAD * 3; // how far thumb moves

function ThemeToggle({ isDark, onToggle }) {
  return (
    <Box onClick={onToggle} sx={{
      position: 'relative', width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2,
      cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
      border: `1.5px solid ${isDark ? alpha(GREEN, 0.35) : alpha('#CBD5E1', 0.9)}`,
      background: isDark
        ? `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)`
        : `linear-gradient(135deg, #ffffff 0%, #F1F5F9 100%)`,
      boxShadow: isDark
        ? `0 0 12px ${alpha(GREEN, 0.22)}, inset 0 1px 0 ${alpha('#fff', 0.04)}`
        : `0 1px 6px ${alpha('#94A3B8', 0.3)}, inset 0 1px 0 rgba(255,255,255,0.9)`,
      transition: 'background 0.35s, border-color 0.35s, box-shadow 0.35s',
      '&:hover': {
        boxShadow: isDark ? `0 0 20px ${alpha(GREEN, 0.38)}` : `0 2px 10px ${alpha('#94A3B8', 0.45)}`,
        border: isDark ? `1.5px solid ${alpha(GREEN, 0.6)}` : `1.5px solid ${alpha('#94A3B8', 0.7)}`,
      },
    }}>
      <Box sx={{
        position: 'absolute', top: 0, bottom: 0,
        ...(isDark ? { left: THUMB_PAD + 3, right: THUMB_D + THUMB_PAD * 2 } : { left: THUMB_D + THUMB_PAD * 2, right: THUMB_PAD + 3 }),
        display: 'flex', alignItems: 'center',
        justifyContent: isDark ? 'flex-start' : 'flex-end',
        pointerEvents: 'none', overflow: 'hidden',
      }}>
        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: 0.9, textTransform: 'uppercase', lineHeight: 1,
          color: isDark ? alpha(GREEN, 0.85) : alpha('#64748B', 0.9), transition: 'color 0.3s',
        }}>{isDark ? 'DARK' : 'LIGHT'}</Typography>
      </Box>
      <motion.div
        animate={{ x: isDark ? THUMB_TRAVEL : 0 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34 }}
        style={{
          position: 'absolute', top: THUMB_PAD, left: THUMB_PAD,
          width: THUMB_D, height: THUMB_D, borderRadius: '50%',
          background: isDark
            ? `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DIM} 100%)`
            : `linear-gradient(135deg, #F59E0B 0%, #D97706 100%)`,
          boxShadow: isDark ? `0 2px 8px ${alpha(GREEN, 0.55)}` : `0 2px 8px ${alpha('#F59E0B', 0.55)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
        }}
      >
        <motion.div animate={{ rotate: isDark ? 0 : 20 }} transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isDark ? <DarkIcon sx={{ fontSize: 13, color: '#fff' }} /> : <LightIcon sx={{ fontSize: 13, color: '#fff' }} />}
        </motion.div>
      </motion.div>
    </Box>
  );
}

export default function DriverHomePage() {
  const router  = useRouter();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const { toggleTheme: toggleColorMode } = useThemeMode();

  const { driverProfile, isOnline, toggleOnline, needsVerification, needsVehicle, needsSubscription, paymentSystemType, loadingDriverProfile } = useDriver();
  const { isNegativeFloatAllowed, negativeFloatLimit, minimumFloatTopup, defaultCommissionPercentage, isFloatSystemEnabled, isSubscriptionSystemEnabled } = useAdminSettings();
  const { user } = useAuthGuard({ requireAuth: true, requireVerification: true, redirectTo: '/home' });
  const { incomingRide, acceptRide, declineRide } = useRide();
  const { isNative, getCurrentLocation } = useReactNative();
  const { summary, lifetime, loading: statsLoading, fetchStats } = useDriverStats();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [landingPageUrl,  setLandingPageUrl]  = useState(null);

  useEffect(() => {
    fetchStats('today');
    requestLocationOnMount();
  }, []);

  useEffect(() => {
    const getFrontendUrl = async () => {
      const res = await apiClient.get('/frontend-url').catch(() => null);
      const url = res?.data?.paths?.['okra-frontend-app'];
      if (url) setLandingPageUrl(url);
    };
    getFrontendUrl();
  }, []);

  const requestLocationOnMount = async () => {
    try {
      if (isNative) {
        const loc = await getCurrentLocation().catch(() => null);
        if (loc) { setCurrentLocation({ lat: loc.lat, lng: loc.lng }); return; }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => setCurrentLocation({ lat: coords.latitude, lng: coords.longitude }),
          (e) => console.error('Location error:', e),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
    } catch (e) { console.error('Error requesting location:', e); }
  };

  const handleToggleOnline = async () => {
    try {
      const result = await toggleOnline(!isOnline);
      if (!result.allowed) {
        if (result.action === 'subscribe')   { if (window.confirm(result.message + '\n\nView plans?')) router.push('/subscription/plans'); }
        if (result.action === 'topup_float') { if (window.confirm(result.message + '\n\nTop up now?')) router.push('/float/topup'); }
      }
    } catch (e) { console.error('Error toggling online:', e); }
  };

  const handleAcceptRide  = async (id) => { try { await acceptRide(id);  router.push(`/active-ride/${id}`); } catch (e) { console.error(e); } };
  const handleDeclineRide = async (id) => { try { await declineRide(id, 'Driver declined'); } catch (e) { console.error(e); } };

  const subscriptionStatus    = driverProfile?.subscriptionStatus;
  const subscriptionExpiresAt = driverProfile?.currentSubscription?.expiresAt;
  const isOnSubscriptionSystem = paymentSystemType === 'subscription_based' || (paymentSystemType === 'hybrid' && ['active', 'trial'].includes(subscriptionStatus));
  const isOnFloatSystem = paymentSystemType === 'float_based' || (paymentSystemType === 'hybrid' && !['active', 'trial'].includes(subscriptionStatus));
  const daysUntilExpiry = subscriptionExpiresAt ? Math.floor((new Date(subscriptionExpiresAt).getTime() - Date.now()) / 86400000) : null;
  const isSubscriptionExpired      = ['expired', 'cancelled'].includes(subscriptionStatus);
  const isSubscriptionExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  const isOnTrial = subscriptionStatus === 'trial';
  const floatBalance    = driverProfile?.floatBalance || 0;
  const isFloatNegative = floatBalance <= 0;
  const isFloatAtLimit  = isFloatNegative && negativeFloatLimit > 0 && Math.abs(floatBalance) >= negativeFloatLimit;
  const isFloatLow      = !isFloatNegative && floatBalance < minimumFloatTopup * 2 && floatBalance > 0;
  const showVerificationAlert         = needsVerification || needsVehicle;
  const showSubscriptionRequiredAlert = !showVerificationAlert && paymentSystemType === 'subscription_based' && needsSubscription;
  const showSubscriptionExpiryAlert   = !showVerificationAlert && isOnSubscriptionSystem && (isSubscriptionExpired || isSubscriptionExpiringSoon);
  const showFloatBlockedAlert         = !showVerificationAlert && isOnFloatSystem && (isFloatAtLimit || (isFloatNegative && !isNegativeFloatAllowed));
  const showFloatLowAlert             = !showVerificationAlert && isOnFloatSystem && isFloatLow;
  const showFloatNegativeWarning      = !showVerificationAlert && isOnFloatSystem && isFloatNegative && !isFloatAtLimit && isNegativeFloatAllowed;
  const showFloatWithdrawableNotice   = !showVerificationAlert && isOnSubscriptionSystem && floatBalance > 0;

  const alertVariants = {
    hidden: { opacity: 0, y: -12, height: 0 },
    show:   { opacity: 1, y: 0,   height: 'auto', transition: { type: 'spring', stiffness: 300, damping: 28 } },
    exit:   { opacity: 0, y: -8,  height: 0 },
  };

  // ── Light-mode surface colors ──
  const surfaceBg = isDark
    ? 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)'
    : 'linear-gradient(160deg, #F0FDF4 0%, #ECFDF5 100%)';
  const appBarBg = isDark
    ? `linear-gradient(135deg, #1E293B 0%, #0F172A 100%)`
    : `linear-gradient(135deg, #065F46 0%, #059669 100%)`;

  return (
    <ClientOnly>
      <Box sx={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        background: surfaceBg,
        position: 'relative',
      }}>
        {/* Ambient bg blob */}
        <Box sx={{
          position: 'absolute', top: -60, right: -60, width: 240, height: 240,
          borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(circle, ${alpha(GREEN, isDark ? 0.07 : 0.1)} 0%, transparent 70%)`,
        }} />

        {/* ── AppBar ─────────────────────────────────────────────────── */}
        <AppBar position="static" elevation={0} sx={{
          background: appBarBg,
          backdropFilter: 'blur(12px)',
          borderBottom: isDark
            ? `1px solid ${alpha(GREEN, 0.12)}`
            : `1px solid ${alpha('#047857', 0.2)}`,
          boxShadow: isDark
            ? `0 2px 16px ${alpha('#000', 0.4)}`
            : `0 4px 20px ${alpha('#059669', 0.25)}`,
          zIndex: 10,
        }}>
          <Toolbar sx={{ justifyContent: 'space-between', gap: 1 }}>
            <AnimatedHeaderButton label="APPS" direction="left"
              icon={<AppsIcon size={22} color={isDark ? GREEN : '#A7F3D0'} />}
              onClick={() => { if (landingPageUrl) router.push(landingPageUrl); }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThemeToggle isDark={isDark} onToggle={toggleColorMode} />
            </Box>
            <AnimatedHeaderButton label="HELP" direction="right"
              icon={<HelpCircleIcon size={22} color={isDark ? GREEN : '#A7F3D0'} />}
              onClick={() => router.push('/help')} />
          </Toolbar>
        </AppBar>

        {/* ── Scrollable body ─────────────────────────────────────── */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 10, ...hideScrollbar, position: 'relative', zIndex: 1 }}>
          {loadingDriverProfile ? (
            <HomePageSkeleton />
          ) : (
            <>
              {/* Alerts */}
              <AnimatePresence initial={false}>
                {showVerificationAlert && (
                  <motion.div key="verify" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 1.5, borderRadius: 2.5, boxShadow: `0 4px 16px ${alpha('#F59E0B', 0.2)}` }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/verification')}>Complete</Button>}>
                      <Typography variant="subtitle2" fontWeight={600}>Verification Required</Typography>
                      <Typography variant="body2">
                        {needsVerification && 'Complete your verification before accepting rides. '}
                        {needsVehicle && 'Add your vehicle information to continue.'}
                      </Typography>
                    </Alert>
                  </motion.div>
                )}
                {showSubscriptionRequiredAlert && (
                  <motion.div key="sub-req" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2.5 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/subscription/plans')}>Subscribe</Button>}>
                      <Typography variant="subtitle2" fontWeight={600}>Subscription Required</Typography>
                      <Typography variant="body2">Subscribe to start accepting rides and keep 100% of your earnings.</Typography>
                    </Alert>
                  </motion.div>
                )}
                {showSubscriptionExpiryAlert && (
                  <motion.div key="sub-exp" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity={isSubscriptionExpired ? 'error' : 'warning'} icon={<ExpiryIcon />} sx={{ mb: 1.5, borderRadius: 2.5 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/subscription/plans')}>{isSubscriptionExpired ? 'Renew Now' : 'View Plan'}</Button>}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {isSubscriptionExpired ? 'Subscription Expired' : isOnTrial ? `Trial Ends in ${daysUntilExpiry}d` : `Expiring in ${daysUntilExpiry}d`}
                      </Typography>
                      <Typography variant="body2">
                        {isSubscriptionExpired ? 'Renew to keep accepting rides at zero commission.' : isOnTrial ? 'Subscribe to continue enjoying 0% commission.' : 'Renew before it expires to avoid interruption.'}
                      </Typography>
                    </Alert>
                  </motion.div>
                )}
                {showFloatBlockedAlert && (
                  <motion.div key="float-blocked" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="error" icon={<FloatLowIcon />} sx={{ mb: 1.5, borderRadius: 2.5 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}>
                      <Typography variant="subtitle2" fontWeight={600}>Float Balance Blocked</Typography>
                      <Typography variant="body2">Float: {formatCurrency(floatBalance)}.{' '}{isFloatAtLimit && `Exceeded limit of ${formatCurrency(-negativeFloatLimit)}.`}</Typography>
                    </Alert>
                  </motion.div>
                )}
                {showFloatNegativeWarning && (
                  <motion.div key="float-neg" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="warning" icon={<FloatLowIcon />} sx={{ mb: 1.5, borderRadius: 2.5 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}>
                      <Typography variant="subtitle2" fontWeight={600}>Negative Float Balance</Typography>
                      <Typography variant="body2">Float: {formatCurrency(floatBalance)}.{' '}{negativeFloatLimit > 0 ? `Limit: ${formatCurrency(-negativeFloatLimit)}.` : 'Top up to maintain balance.'}</Typography>
                    </Alert>
                  </motion.div>
                )}
                {showFloatLowAlert && (
                  <motion.div key="float-low" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2.5 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/float/topup')}>Top Up</Button>}>
                      <Typography variant="subtitle2" fontWeight={600}>Float Balance Low</Typography>
                      <Typography variant="body2">Balance: {formatCurrency(floatBalance)}. Top up soon.</Typography>
                    </Alert>
                  </motion.div>
                )}
                {showFloatWithdrawableNotice && (
                  <motion.div key="float-withdraw" variants={alertVariants} initial="hidden" animate="show" exit="exit">
                    <Alert severity="success" icon={<SavingsIcon />} sx={{ mb: 1.5, borderRadius: 2.5 }}
                      action={<Button color="inherit" size="small" onClick={() => router.push('/float')}>Withdraw</Button>}>
                      <Typography variant="subtitle2" fontWeight={600}>Float Available to Withdraw</Typography>
                      <Typography variant="body2">{formatCurrency(floatBalance)} available — subscription plan.</Typography>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Payment banner ──────────────────────────────────── */}
              {driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Paper elevation={0} sx={{
                    p: 1.5, mb: 1.5, borderRadius: 2.5,
                    background: isOnSubscriptionSystem
                      ? isDark
                        ? `linear-gradient(135deg, ${alpha('#10B981', 0.2)} 0%, ${alpha('#047857', 0.12)} 100%)`
                        : `linear-gradient(135deg, ${alpha('#10B981', 0.12)} 0%, ${alpha('#047857', 0.06)} 100%)`
                      : isDark
                        ? `linear-gradient(135deg, ${alpha('#3B82F6', 0.2)} 0%, ${alpha('#1D4ED8', 0.12)} 100%)`
                        : `linear-gradient(135deg, ${alpha('#3B82F6', 0.1)} 0%, ${alpha('#1D4ED8', 0.05)} 100%)`,
                    border: `1px solid ${alpha(isOnSubscriptionSystem ? '#10B981' : '#3B82F6', isDark ? 0.3 : 0.22)}`,
                    boxShadow: `0 2px 12px ${alpha(isOnSubscriptionSystem ? '#10B981' : '#3B82F6', 0.1)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, color: isOnSubscriptionSystem ? (isDark ? 'success.light' : 'success.dark') : (isDark ? 'info.light' : 'info.dark') }}>
                      💰{' '}
                      {paymentSystemType === 'subscription_based' ? '0% Commission — Subscription Plan'
                        : paymentSystemType === 'float_based'     ? `Float — ${defaultCommissionPercentage}% Commission`
                        : isOnSubscriptionSystem                  ? '0% Commission — Active Subscription'
                        : `Hybrid — ${defaultCommissionPercentage}% Commission`}
                    </Typography>
                    {isOnFloatSystem && (
                      <Chip label={`Float: ${formatCurrency(floatBalance)}`} size="small"
                        color={isFloatNegative ? 'error' : isFloatLow ? 'warning' : 'success'}
                        onClick={() => router.push('/float')}
                        sx={{ cursor: 'pointer', fontWeight: 700, height: 24, boxShadow: `0 2px 8px ${alpha(isFloatNegative ? '#EF4444' : '#10B981', 0.3)}` }} />
                    )}
                  </Paper>
                </motion.div>
              )}

              {/* ── Online Toggle ─────────────────────────────────── */}
              <OnlineToggle
                isSubscriptionSystemEnabled={isSubscriptionSystemEnabled}
                isOnline={isOnline}
                subscriptionStatus={driverProfile?.currentSubscription}
                onToggle={handleToggleOnline}
                disabled={showVerificationAlert || showFloatBlockedAlert || showSubscriptionRequiredAlert}
              />

              {/* ── Stats Grid ────────────────────────────────────── */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', gap: 1.5, mb: 1.5, '& > *': { minWidth: 0, minHeight: 0 } }}>
                {[
                  { el: <EarningsCard title="Today's Earnings" amount={summary.totalEarnings} icon={<EarningsIcon />} color="earnings" onClick={() => router.push('/earnings')} />, delay: 0.08 },
                  { el: <StatCard title="Rides Today"  value={summary.completedRides}                   icon={<RidesIcon />}  color="primary" />, delay: 0.14 },
                  { el: <StatCard title="Rating"       value={lifetime.averageRating.toFixed(1)}         icon={<StarIcon />}   color="warning" />, delay: 0.20 },
                  { el: <StatCard title="Acceptance"   value={`${summary.acceptanceRate}%`}              icon={<SpeedIcon />}  color="info"    />, delay: 0.26 },
                ].map(({ el, delay }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24, delay }} style={{ height: '100%' }}>
                    {el}
                  </motion.div>
                ))}
              </Box>

              {/* ── Quick Actions ─────────────────────────────────── */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                {[
                  { label: 'Ride History', icon: <HistoryIcon />, path: '/rides'    },
                  { label: 'Earnings',     icon: <WalletIcon />,  path: '/earnings' },
                ].map(({ label, icon, path }, i) => (
                  <motion.div key={label} style={{ flex: 1 }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                    whileTap={{ scale: 0.97 }}>
                    <Button variant="outlined" fullWidth startIcon={icon} onClick={() => router.push(path)}
                      sx={{
                        borderRadius: 2.5, height: 48, fontWeight: 600, textTransform: 'none',
                        borderColor: isDark ? alpha(GREEN, 0.3) : alpha(GREEN, 0.5),
                        color: isDark ? GREEN : GREEN_DIM,
                        background: isDark ? alpha(GREEN, 0.06) : alpha(GREEN, 0.04),
                        '&:hover': {
                          borderColor: GREEN, background: alpha(GREEN, isDark ? 0.12 : 0.08),
                          boxShadow: `0 4px 14px ${alpha(GREEN, 0.22)}`,
                        },
                        transition: 'all 0.18s ease',
                      }}>
                      {label}
                    </Button>
                  </motion.div>
                ))}
              </Box>

              {/* ── Float / Subscription row ──────────────────────── */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {isFloatSystemEnabled && (
                    <Button
                      variant={isFloatNegative || isFloatLow ? 'contained' : 'outlined'} fullWidth
                      color={isFloatNegative ? 'error' : isFloatLow ? 'warning' : 'inherit'}
                      startIcon={<WalletIcon />} onClick={() => router.push('/float')}
                      sx={{
                        borderRadius: 2.5, height: 44, fontWeight: 600, textTransform: 'none', flex: 1,
                        ...(!isFloatNegative && !isFloatLow && {
                          borderColor: isDark ? alpha(GREEN, 0.3) : alpha(GREEN, 0.4),
                          color: isDark ? 'text.primary' : 'text.primary',
                        }),
                      }}>
                      Float: {formatCurrency(floatBalance)}
                    </Button>
                  )}
                  {isSubscriptionSystemEnabled && (
                    <Button variant="outlined" fullWidth
                      color={isSubscriptionExpired ? 'error' : isSubscriptionExpiringSoon ? 'warning' : 'inherit'}
                      onClick={() => router.push('/subscription/plans')}
                      sx={{
                        borderRadius: 2.5, height: 44, fontWeight: 600, textTransform: 'none', flex: 1,
                        borderColor: isDark ? alpha(GREEN, 0.3) : alpha(GREEN, 0.4),
                      }}>
                      {isSubscriptionExpired ? 'Renew Plan'
                        : ['active', 'trial'].includes(subscriptionStatus) ? `Plan: ${daysUntilExpiry}d left`
                        : 'View Plans'}
                    </Button>
                  )}
                </Box>
              </motion.div>
            </>
          )}
        </Box>

        {/* ── Ride Request Modal ──────────────────────────────────────── */}
        <AnimatePresence>
          {incomingRide && (
            <RideRequestModal open={!!incomingRide} rideRequest={incomingRide}
              onAccept={handleAcceptRide} onDecline={handleDeclineRide} />
          )}
        </AnimatePresence>
      </Box>
    </ClientOnly>
  )
}