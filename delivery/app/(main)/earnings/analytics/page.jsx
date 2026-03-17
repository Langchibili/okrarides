// PATH: app/(main)/earnings/analytics/page.jsx
// No external chart library — all charts are pure SVG.
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Tabs, Tab,
  Paper, Grid, Chip, useTheme,
} from '@mui/material';
import { alpha }      from '@mui/material/styles';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter }              from 'next/navigation';
import { useDriverStats }         from '@/lib/hooks/useDriverStats';
import { useDriver }              from '@/lib/hooks/useDriver';
import { AnalyticsPageSkeleton }  from '@/components/Skeletons/AnalyticsPageSkeleton';
import { formatCurrency }         from '@/Functions';

// ── scrollbar hide ────────────────────────────────────────────────────────
const hideScrollbar = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

// ─────────────────────────────────────────────────────────────────────────
// SVG CHART PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────

/** Smooth SVG area + line chart */
function SvgAreaChart({ data, dataKey, color, height = 180, formatY, formatX }) {
  const W = 400;
  if (!data.length) return <EmptyChart height={height} />;

  const values = data.map(d => d[dataKey] ?? 0);
  const max    = Math.max(...values, 1);
  const pts    = values.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: height - 8 - (v / max) * (height - 24),
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${W},${height} L 0,${height} Z`;
  const gradId   = `grad-${dataKey}-${color.replace('#', '')}`;

  const xLabels = data.map((d, i) => {
    if (data.length <= 7) return d.date ?? '';
    return i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0 ? (d.date ?? '') : '';
  });

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${height + 20}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={0} y1={(height - 8) * (1 - t) + 8} x2={W} y2={(height - 8) * (1 - t) + 8}
            stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
        ))}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots on last point */}
        {pts.length > 0 && (
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4} fill={color} />
        )}
        {/* X labels */}
        {xLabels.map((lbl, i) => lbl && (
          <text key={i} x={pts[i].x} y={height + 16} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">
            {lbl}
          </text>
        ))}
      </svg>
    </Box>
  );
}

/** Grouped bar chart — two series side by side */
function SvgGroupedBars({ data, keys, colors, height = 180, formatY }) {
  const W = 400;
  if (!data.length) return <EmptyChart height={height} />;

  const max    = Math.max(...data.flatMap(d => keys.map(k => d[k] ?? 0)), 1);
  const bW     = Math.max(6, (W / data.length - 8) / keys.length);
  const gap    = bW * 0.3;
  const groupW = bW * keys.length + gap * (keys.length - 1);

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${height + 20}`} width="100%" style={{ display: 'block' }}>
        {[0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={0} y1={(height) * (1 - t)} x2={W} y2={(height) * (1 - t)}
            stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const cx  = (i / data.length) * W + W / data.length / 2;
          const x0  = cx - groupW / 2;
          return (
            <g key={i}>
              {keys.map((k, ki) => {
                const bh = ((d[k] ?? 0) / max) * (height - 8);
                const bx = x0 + ki * (bW + gap);
                const by = height - bh;
                return <rect key={ki} x={bx} y={by} width={bW} height={bh}
                  fill={colors[ki]} rx="2" opacity="0.9" />;
              })}
              {/* x label */}
              <text x={cx} y={height + 14} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">
                {d.date ?? ''}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 2, mt: 0.5, justifyContent: 'center' }}>
        {keys.map((k, i) => (
          <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: colors[i] }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{k}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** Donut / pie chart */
function SvgDonut({ data, colors, size = 120 }) {
  const total  = data.reduce((s, d) => s + (d.value ?? 0), 0);
  if (!total) return <EmptyChart height={size} />;

  const R  = 42;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * R;

  let cumulative = 0;
  const slices = data.map((d, i) => {
    const pct  = d.value / total;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    const rot  = cumulative * 360 - 90;
    cumulative += pct;
    return { dash, gap, rot, color: colors[i], label: d.name, pct };
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* bg ring */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth={14} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={s.color} strokeWidth={14}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeLinecap="round"
            transform={`rotate(${s.rot} ${cx} ${cy})`}
            opacity="0.92"
          />
        ))}
        {/* Centre total */}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor">
          {total}
        </text>
        <text x={cx} y={cy + 17} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.5">rides</text>
      </svg>
      {/* Legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 0.5 }}>
        {slices.map(s => (
          <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
              {s.label} {(s.pct * 100).toFixed(0)}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** Horizontal bar chart for hourly activity */
function SvgHourBars({ data, color, barHeight = 18, gap = 4 }) {
  const W          = 400;
  const ROW        = barHeight + gap;
  const LABEL_W    = 36;
  const totalH     = data.length * ROW;
  const max        = Math.max(...data.map(d => d.Rides ?? 0), 1);

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      <svg
        viewBox={`0 0 ${W} ${totalH}`}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        {data.map((d, i) => {
          const rides = d.Rides ?? 0;
          const barW  = Math.max((rides / max) * (W - LABEL_W - 8), rides > 0 ? 4 : 1);
          const y     = i * ROW;
          const midY  = y + barHeight / 2 + 3; // vertical centre of bar for text baseline

          return (
            <g key={i}>
              {/* Hour label */}
              <text
                x={LABEL_W - 4}
                y={midY}
                fontSize={10}
                textAnchor="end"
                fill="currentColor"
                opacity={0.5}
              >
                {d.hour?.replace(':00', '') ?? i}
              </text>

              {/* Track (background) */}
              <rect
                x={LABEL_W}
                y={y}
                width={W - LABEL_W}
                height={barHeight}
                fill="currentColor"
                opacity={0.06}
                rx={3}
              />

              {/* Bar */}
              <rect
                x={LABEL_W}
                y={y}
                width={barW}
                height={barHeight}
                fill={color}
                opacity={0.85}
                rx={3}
              />

              {/* Value label */}
              {rides > 0 && (
                <text
                  x={LABEL_W + barW + 5}
                  y={midY}
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.6}
                >
                  {rides}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
}

function EmptyChart({ height = 160 }) {
  return (
    <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="caption" color="text.disabled">No data for this period</Typography>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LAYOUT HELPERS
// ─────────────────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', display: 'block', mb: 1.25 }}>
      {children}
    </Typography>
  );
}

function ChartCard({ title, children, accent, sx = {} }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
      <Paper elevation={isDark ? 0 : 2} sx={{
        p: 2, borderRadius: 3, mb: 2,
        border: `1px solid ${alpha(accent ?? theme.palette.divider, isDark ? 0.16 : 0.1)}`,
        background: accent
          ? isDark
            ? `linear-gradient(145deg, ${alpha(accent, 0.1)} 0%, transparent 60%)`
            : `linear-gradient(145deg, ${alpha(accent, 0.04)} 0%, transparent 60%)`
          : undefined,
        boxShadow: accent ? `0 2px 16px ${alpha(accent, 0.1)}` : undefined,
        ...sx,
      }}>
        {title && <SectionTitle>{title}</SectionTitle>}
        {children}
      </Paper>
    </motion.div>
  );
}

function KpiChip({ label, value, color }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper elevation={isDark ? 0 : 2} sx={{
      p: 1.5, borderRadius: 3, textAlign: 'center', minWidth: 90, flexShrink: 0,
      border: `1px solid ${alpha(color ?? theme.palette.divider, isDark ? 0.18 : 0.08)}`,
      background: color
        ? isDark
          ? `linear-gradient(145deg, ${alpha(color, 0.15)} 0%, transparent 100%)`
          : `linear-gradient(145deg, ${alpha(color, 0.06)} 0%, transparent 100%)`
        : undefined,
    }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: color ?? 'text.primary', mb: 0.25, lineHeight: 1.1, fontSize: 13 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 500 }} display="block">
        {label}
      </Typography>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PERIOD CONFIG
// ─────────────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Week',  value: 'week'  },
  { label: 'Month', value: 'month' },
  { label: 'Year',  value: 'year'  },
];

// ─────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router  = useRouter();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const { paymentSystemType } = useDriver();
  const { stats, loading, fetchStats } = useDriverStats();
  const [period, setPeriod] = useState('week');

  const isFloat = paymentSystemType === 'float_based';
  const isSub   = paymentSystemType === 'subscription_based';

  useEffect(() => { fetchStats(period); }, [period]);

  const { summary, lifetime, balances, dailyBreakdown, hourlyBreakdown } = stats;

  // Colour palette
  const C = {
    earnings:     '#F59E0B',
    commission:   '#EF4444',
    cash:         '#10B981',
    digital:      '#3B82F6',
    subscription: '#06B6D4',
    float:        '#8B5CF6',
  };

  const paymentPieData  = [
    { name: 'Cash',    value: summary.cashRides    },
    { name: 'Digital', value: summary.digitalRides },
  ].filter(d => d.value > 0);

  const rideTypePieData = [
    { name: 'Float', value: summary.floatRides        },
    { name: 'Sub',   value: summary.subscriptionRides },
  ].filter(d => d.value > 0);

  const earningsVsComm = dailyBreakdown.map(d => ({
    date:       (d.date ?? '').slice(5),
    Earnings:   parseFloat((d.earnings  ?? 0).toFixed(2)),
    Commission: parseFloat((d.commission ?? 0).toFixed(2)),
  }));

  const hourlyActivity = hourlyBreakdown.map(h => ({
    hour:  `${h.hour}:00`,
    Rides: h.rides,
  }));

  const formattedDaily = dailyBreakdown.map(d => ({
    ...d,
    date:     (d.date ?? '').slice(5),
    earnings: parseFloat((d.earnings ?? 0).toFixed(2)),
  }));

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
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>Analytics</Typography>
          <Chip label={isFloat ? 'Float' : 'Subscription'} size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 700, height: 24 }} />
        </Toolbar>
        <Tabs value={period} onChange={(_, v) => setPeriod(v)} variant="fullWidth" textColor="inherit"
          TabIndicatorProps={{ sx: { bgcolor: 'white', height: 3, borderRadius: '3px 3px 0 0' } }}>
          {PERIOD_OPTIONS.map(p => (
            <Tab key={p.value} label={p.label} value={p.value} sx={{ fontWeight: 600, fontSize: 13 }} />
          ))}
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
          const currentIndex = PERIOD_OPTIONS.findIndex(p => p.value === period);
          if (diff > 60 && currentIndex < PERIOD_OPTIONS.length - 1) {
            setPeriod(PERIOD_OPTIONS[currentIndex + 1].value);
          } else if (diff < -60 && currentIndex > 0) {
            setPeriod(PERIOD_OPTIONS[currentIndex - 1].value);
          }
          e.currentTarget._touchStartX = null;
        }}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalyticsPageSkeleton />
            </motion.div>
          ) : (
            <motion.div key={period} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}>

              {/* ── KPI strip ──────────────────────────────────────────── */}
              <Box sx={{ display: 'flex', gap: 1.25, overflowX: 'auto', pb: 1, mb: 2, ...hideScrollbar }}>
                <KpiChip label="Earnings"   value={formatCurrency(summary.totalEarnings)} color={C.earnings}   />
                <KpiChip label="Rides"      value={summary.completedRides}                                      />
                <KpiChip label="Avg Ride"   value={formatCurrency(summary.averageRide)}   color={C.subscription} />
                <KpiChip label="Distance"   value={`${summary.totalDistance.toFixed(0)}km`}                    />
                <KpiChip label="Rating ★"  value={lifetime.averageRating.toFixed(1)}     color={C.earnings}   />
                {isFloat && (
                  <KpiChip label="Float"
                    value={formatCurrency(balances.floatBalance)}
                    color={balances.floatBalance < 0 ? C.commission : C.cash} />
                )}
              </Box>

              {/* ── 1. Daily earnings trend ─────────────────────────────── */}
              <ChartCard title="Daily Earnings" accent={C.earnings}>
                <SvgAreaChart data={formattedDaily} dataKey="earnings" color={C.earnings} height={170} />
              </ChartCard>

              {/* ── 2. Earnings vs Commission (float only) ──────────────── */}
              {isFloat && (
                <ChartCard title="Earnings vs Commission" accent={C.commission}>
                  <SvgGroupedBars data={earningsVsComm} keys={['Earnings', 'Commission']}
                    colors={[C.earnings, C.commission]} height={170} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`Float: ${formatCurrency(balances.floatBalance)}`}
                      color={balances.floatBalance < 0 ? 'error' : 'success'} sx={{ fontWeight: 700 }} />
                    <Chip size="small" label={`Withdrawable: ${formatCurrency(balances.withdrawableFloatBalance)}`}
                      color="info" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Chip size="small" label={`Deducted: ${formatCurrency(summary.floatDeducted)}`}
                      color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
                  </Box>
                </ChartCard>
              )}

              {/* ── 3. Pie charts row ──────────────────────────────────── */}
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
                  <ChartCard title="Payment Split" accent={C.cash} sx={{ mb: 0, height: '100%' }}>
                    <SvgDonut data={paymentPieData} colors={[C.cash, C.digital]} size={120} />
                  </ChartCard>
                </Grid>
                <Grid item xs={6}>
                  <ChartCard title="Ride Type" accent={C.float} sx={{ mb: 0, height: '100%' }}>
                    <SvgDonut data={rideTypePieData} colors={[C.float, C.subscription]} size={120} />
                  </ChartCard>
                </Grid>
              </Box>

              {/* ── 4. Hourly activity ─────────────────────────────────── */}
              <ChartCard title="Hourly Activity" accent={C.digital}>
                <SvgHourBars data={hourlyActivity} color={C.digital} height={148} />
              </ChartCard>

              {/* ── 5. Lifetime summary table ──────────────────────────── */}
              <ChartCard title="Lifetime Overview">
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
                    { label: 'Total Rides',      value: lifetime.totalRides                        },
                    { label: 'Completed',         value: lifetime.completedRides                   },
                    { label: 'Cancelled',         value: lifetime.cancelledRides                   },
                    { label: 'Total Earnings',    value: formatCurrency(lifetime.totalEarnings)    },
                    { label: 'Km Driven',         value: `${lifetime.totalDistance.toFixed(0)} km` },
                    { label: 'Avg Rating',        value: `★ ${lifetime.averageRating.toFixed(1)}`  },
                    { label: 'Acceptance Rate',   value: `${lifetime.acceptanceRate.toFixed(0)}%`  },
                    { label: 'Completion Rate',   value: `${lifetime.completionRate.toFixed(0)}%`  },
                  ].map(({ label, value }) => (
                    <Grid item xs={6} key={label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.9, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{label}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>{value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Box>
              </ChartCard>

            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}