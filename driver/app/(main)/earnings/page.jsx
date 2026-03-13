// PATH: app/(main)/earnings/page.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box, AppBar, Toolbar, Typography, Tabs, Tab, Paper,
  Grid, Button, IconButton, Divider, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as BackIcon,
  TrendingUp as TrendingUpIcon,
  LocalAtm as MoneyIcon,
  Assessment as ChartIcon,
  AccountBalanceWallet as WalletIcon,
  DirectionsCar as RidesIcon,
  Route as DistanceIcon,
  Percent as CommissionIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useDriverStats }        from '@/lib/hooks/useDriverStats';
import { useDriver }             from '@/lib/hooks/useDriver';
import { EarningsPageSkeleton }  from '@/components/Skeletons/EarningsPageSkeleton';
import { formatCurrency }        from '@/Functions';

// ── Hide scrollbar helper ─────────────────────────────────────────────────
const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

// ── Stat tile ─────────────────────────────────────────────────────────────
function Tile({ label, value, sub, color, accent, onClick }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div whileTap={{ scale: 0.96 }} style={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <Paper elevation={isDark ? 0 : 2} sx={{
        p: 2, borderRadius: 3, textAlign: 'center', height: '100%',
        border: `1px solid ${alpha(accent ?? theme.palette.divider, isDark ? 0.18 : 0.1)}`,
        background: accent
          ? isDark
            ? `linear-gradient(145deg, ${alpha(accent, 0.14)} 0%, transparent 100%)`
            : `linear-gradient(145deg, ${alpha(accent, 0.06)} 0%, transparent 100%)`
          : undefined,
        boxShadow: accent ? `0 2px 12px ${alpha(accent, 0.1)}` : undefined,
        transition: 'box-shadow 0.2s',
        '&:hover': onClick ? { boxShadow: `0 4px 20px ${alpha(accent ?? '#000', 0.18)}` } : {},
      }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: color ?? 'text.primary', mb: 0.25, lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }} display="block">
          {label}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.25, fontSize: 10 }}>
            {sub}
          </Typography>
        )}
      </Paper>
    </motion.div>
  );
}

const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'Week',  value: 'week'  },
  { label: 'Month', value: 'month' },
  { label: 'Year',  value: 'year'  },
];

export default function EarningsPage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { paymentSystemType } = useDriver();
  const { stats, loading, fetchStats } = useDriverStats();
  const [period, setPeriod] = useState('today');

  const isFloat = paymentSystemType === 'float_based';
  const isSub   = paymentSystemType === 'subscription_based';

  useEffect(() => { fetchStats(period); }, [period]);

  const { summary, lifetime, balances } = stats;

  const heroGradient = isFloat
    ? isDark ? 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
    : isDark ? 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)';

  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? '';

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item    = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } } };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>

      {/* ── AppBar ─────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0} sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#1E293B', 0.98)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}><BackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Earnings</Typography>
        </Toolbar>
        <Tabs value={period} onChange={(_, v) => setPeriod(v)} variant="fullWidth" textColor="inherit"
          TabIndicatorProps={{ sx: { bgcolor: 'white', height: 3, borderRadius: '3px 3px 0 0' } }}>
          {PERIODS.map(p => <Tab key={p.value} label={p.label} value={p.value} sx={{ fontWeight: 600, fontSize: 13 }} />)}
        </Tabs>
      </AppBar>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <Box
        sx={{ flex: 1, overflowY: 'auto', p: 2, pb: 10, ...hideScrollbar }}
        onTouchStart={(e) => {
          e.currentTarget._touchStartX = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const startX = e.currentTarget._touchStartX;
          if (startX == null) return;
          const diff = startX - e.changedTouches[0].clientX;
          const currentIndex = PERIODS.findIndex(p => p.value === period);
          if (diff > 60 && currentIndex < PERIODS.length - 1) {
            setPeriod(PERIODS[currentIndex + 1].value);
          } else if (diff < -60 && currentIndex > 0) {
            setPeriod(PERIODS[currentIndex - 1].value);
          }
          e.currentTarget._touchStartX = null;
        }}
      >
        {loading ? (
          <EarningsPageSkeleton />
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show">

            {/* ── Hero card ──────────────────────────────────────────── */}
            <motion.div variants={item}>
              <Paper elevation={0} sx={{
                p: 3, mb: 2, borderRadius: 4,
                background: heroGradient,
                color: 'white',
                position: 'relative', overflow: 'hidden',
                boxShadow: isFloat
                  ? `0 12px 40px ${alpha('#3B82F6', isDark ? 0.4 : 0.32)}`
                  : `0 12px 40px ${alpha('#10B981', isDark ? 0.4 : 0.32)}`,
              }}>
                {/* Decorative blobs */}
                <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5, fontWeight: 500 }}>
                  {periodLabel} Total Earnings
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", mb: 0.5, lineHeight: 1.1 }}>
                  {formatCurrency(summary.totalEarnings)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  {summary.completedRides} ride{summary.completedRides !== 1 ? 's' : ''} completed
                  {summary.totalDistance > 0 && ` · ${summary.totalDistance.toFixed(1)} km`}
                </Typography>

                {isFloat && summary.floatDeducted > 0 && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Float deducted</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9 }}>{formatCurrency(summary.floatDeducted)}</Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>

            {/* ── Balance row ────────────────────────────────────────── */}
            <motion.div variants={item}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridAutoRows: '1fr',        // ← forces every row to equal height
                  gap: 1.5,
                  mb: 1.5,
                  '& > *': {                  // every direct child fills its cell
                    minWidth: 0,
                    minHeight: 0,
                  },
                }}
              >

                {isFloat ? (
                  <>
                    <Grid item xs={6}>
                      <Tile label="Float Balance" value={formatCurrency(balances.floatBalance)}
                        color={balances.floatBalance < 0 ? theme.palette.error.main : theme.palette.success.main}
                        accent={balances.floatBalance < 0 ? '#EF4444' : '#10B981'}
                        onClick={() => router.push('/float')} />
                    </Grid>
                    <Grid item xs={6}>
                      <Tile label="Withdrawable Float" value={formatCurrency(balances.withdrawableFloatBalance)}
                        color={theme.palette.info.main} accent="#06B6D4"
                        onClick={() => router.push('/float')} />
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={6}>
                      <Tile label="Lifetime Earnings" value={formatCurrency(lifetime.totalEarnings)}
                        color={theme.palette.success.main} accent="#10B981" />
                    </Grid>
                    <Grid item xs={6}>
                      <Tile label="Commission Saved" sub="vs 15% float rate"
                        value={formatCurrency(summary.totalFareCollected * 0.15)}
                        color={theme.palette.success.dark} accent="#059669" />
                    </Grid>
                  </>
                )}
              </Box>
            </motion.div>

            {/* ── Ride breakdown ─────────────────────────────────────── */}
            <motion.div variants={item}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridAutoRows: '1fr',        // ← forces every row to equal height
                  gap: 1.5,
                  mb: 1.5,
                  '& > *': {                  // every direct child fills its cell
                    minWidth: 0,
                    minHeight: 0,
                  },
                }}
              >
                <Grid item xs={6}>
                  <Tile label="Cash Rides"    value={summary.cashRides}    accent="#F59E0B"
                    sub={formatCurrency(summary.totalEarnings * (summary.cashRides / Math.max(summary.completedRides, 1)))} />
                </Grid>
                <Grid item xs={6}>
                  <Tile label="Digital Rides" value={summary.digitalRides} accent="#3B82F6"
                    sub={formatCurrency(summary.totalEarnings * (summary.digitalRides / Math.max(summary.completedRides, 1)))} />
                </Grid>
                <Grid item xs={6}>
                  <Tile label="Avg per Ride"  value={formatCurrency(summary.averageRide)} accent="#8B5CF6" />
                </Grid>
                <Grid item xs={6}>
                  <Tile label="Distance"      value={`${summary.totalDistance.toFixed(1)} km`} accent="#06B6D4" />
                </Grid>
                {isSub && (
                  <Grid item xs={6}>
                    <Tile label="Sub Rides" sub="0% commission" value={summary.subscriptionRides}
                      color={theme.palette.success.main} accent="#10B981" />
                  </Grid>
                )}
                {isFloat && summary.totalCommission > 0 && (
                  <Grid item xs={6}>
                    <Tile label="Commission Paid" value={formatCurrency(summary.totalCommission)}
                      color={theme.palette.warning.main} accent="#F97316" />
                  </Grid>
                )}
              </Box>
            </motion.div>

            <Divider sx={{ my: 2 }} />

            {/* ── Lifetime performance ─────────────────────────────── */}
            <motion.div variants={item}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, display: 'block', mb: 1.5 }}>
                Lifetime Performance
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridAutoRows: '1fr',        // ← forces every row to equal height
                  gap: 1.5,
                  mb: 1.5,
                  '& > *': {                  // every direct child fills its cell
                    minWidth: 0,
                    minHeight: 0,
                  },
                }}
              >
                {[
                  { label: 'Total Rides',   value: lifetime.totalRides,                             accent: '#3B82F6' },
                  { label: 'Completion',    value: `${lifetime.completionRate.toFixed(0)}%`,         accent: '#10B981', color: theme.palette.success.main },
                  { label: 'Rating ★',     value: lifetime.averageRating.toFixed(1),               accent: '#F59E0B', color: theme.palette.warning.main  },
                  { label: 'Acceptance',    value: `${lifetime.acceptanceRate.toFixed(0)}%`,         accent: '#06B6D4' },
                  { label: 'Cancellation',  value: `${lifetime.cancellationRate.toFixed(0)}%`,       accent: '#EF4444', color: lifetime.cancellationRate > 20 ? theme.palette.error.main : undefined },
                  { label: 'Km Driven',     value: `${lifetime.totalDistance.toFixed(0)} km`,        accent: '#8B5CF6' },
                ].map(t => (
                  <Grid item xs={4} key={t.label}>
                    <Tile {...t} />
                  </Grid>
                ))}
              </Box>
            </motion.div>

            {/* ── Action buttons ─────────────────────────────────────── */}
            <motion.div variants={item}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="contained" fullWidth startIcon={<ChartIcon />}
                  onClick={() => router.push('/earnings/analytics')}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.36)}` }}>
                  Analytics
                </Button>
                <Button variant="outlined" fullWidth startIcon={<MoneyIcon />}
                  onClick={() => router.push('/earnings/withdraw')}
                  sx={{ height: 52, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}>
                  Withdraw
                </Button>
              </Box>
            </motion.div>

          </motion.div>
        )}
      </Box>
    </Box>
  );
}