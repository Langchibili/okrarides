'use client';
// PATH: components/Skeletons/HomePageSkeleton.jsx
// Matches the rider home page layout:
//   - AppBar (APPS | theme toggle | HELP)
//   - Full-screen map shimmer
//   - Bottom sheet: amber gradient header + inputs + recent locations + Send a Package CTA

import { Box, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';

const AMBER = '#FFC107';

// Shimmer road lines drawn on the fake map
const RoadShimmer = () => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.18 }}>
    {/* Horizontal roads */}
    {[18, 38, 55, 72, 88].map(t => (
      <Box key={`h${t}`} sx={{ position: 'absolute', left: 0, right: 0, top: `${t}%`, height: 3, bgcolor: '#cbd5e1', borderRadius: 2 }} />
    ))}
    {/* Vertical roads */}
    {[12, 28, 45, 62, 80].map(l => (
      <Box key={`v${l}`} sx={{ position: 'absolute', top: 0, bottom: 0, left: `${l}%`, width: 3, bgcolor: '#cbd5e1', borderRadius: 2 }} />
    ))}
    {/* City blocks */}
    {[
      { t: 20, l: 14, w: 12, h: 14 },
      { t: 20, l: 30, w: 13, h: 14 },
      { t: 20, l: 47, w: 13, h: 14 },
      { t: 40, l: 14, w: 12, h: 12 },
      { t: 40, l: 30, w: 13, h: 12 },
      { t: 40, l: 47, w: 13, h: 12 },
      { t: 58, l: 14, w: 12, h: 12 },
      { t: 58, l: 30, w: 13, h: 12 },
      { t: 58, l: 64, w: 14, h: 12 },
    ].map((b, i) => (
      <Box key={i} sx={{ position: 'absolute', top: `${b.t}%`, left: `${b.l}%`, width: `${b.w}%`, height: `${b.h}%`, bgcolor: '#e2e8f0', borderRadius: 1 }} />
    ))}
  </Box>
);

export function HomePageSkeleton() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── AppBar skeleton ─────────────────────────────────────────────── */}
      <Box sx={{
        height: 56, flexShrink: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, gap: 1,
      }}>
        {/* APPS button ghost */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Skeleton variant="rounded" width={14} height={14} sx={{ borderRadius: 0.5 }} />
          <Skeleton variant="text"    width={30} height={14} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Theme toggle pill ghost */}
        <Skeleton variant="rounded" width={74} height={30} sx={{ borderRadius: 15 }} />

        {/* HELP button ghost */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Skeleton variant="text"    width={30} height={14} sx={{ borderRadius: 1 }} />
          <Skeleton variant="circular" width={18} height={18} />
        </Box>
      </Box>

      {/* ── Map area ──────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, position: 'relative', bgcolor: '#e8edf2', overflow: 'hidden' }}>
        <RoadShimmer />

        {/* Shimmer wave over map */}
        <Skeleton
          animation="wave"
          variant="rectangular"
          sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0)', transform: 'none' }}
        />

        {/* Map locate-me button (right side) */}
        <Box sx={{ position: 'absolute', right: 16, bottom: '38%', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.7)' }} />
          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.7)' }} />
          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.7)' }} />
        </Box>
      </Box>

      {/* ── Bottom sheet skeleton ─────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.1 }}
        style={{ flexShrink: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', zIndex: 5 }}
      >
        {/* ── Gradient header block ── */}
        <Box sx={{
          background: 'linear-gradient(-60deg, #FFB300 0%, #FF8A00 25%, #FFC107 50%, #FF6D00 75%, #FFD54F 100%)',
          backgroundSize: '300% 300%',
          animation: 'skeletonHeaderWave 6s ease infinite',
          '@keyframes skeletonHeaderWave': {
            '0%':   { backgroundPosition: '0% 50%' },
            '50%':  { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
          px: 3, pt: 1.5, pb: 2.5,
        }}>
          {/* Drag pill */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }} />
          </Box>

          {/* "Okra Rides" title ghost */}
          <Skeleton animation="wave" variant="text" width={100} height={26}
            sx={{ bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 1, mb: 1.25 }} />

          {/* Location row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
            <Skeleton animation="wave" width={72} height={12} sx={{ bgcolor: 'rgba(255,255,255,0.22)', borderRadius: 1 }} />
            <Skeleton animation="wave" width={120} height={12} sx={{ bgcolor: 'rgba(255,255,255,0.22)', borderRadius: 1 }} />
          </Box>

          {/* Change / I am here buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Skeleton animation="wave" variant="rounded" height={36} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.22)', borderRadius: 2 }} />
            <Skeleton animation="wave" variant="rounded" height={36} sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.28)', borderRadius: 2 }} />
          </Box>

          {/* Pickup input */}
          <Box sx={{ mb: 0.5 }}>
            <Skeleton animation="wave" width={44} height={10} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1, mb: 0.5, ml: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.88)', borderRadius: 2, height: 52, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.45)' }}>
              <Box sx={{ width: 44, height: '100%', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1.5px solid rgba(255,255,255,0.3)' }}>
                <Skeleton variant="circular" width={18} height={18} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
              </Box>
              <Box sx={{ flex: 1, px: 1.5 }}>
                <Skeleton animation="wave" width="55%" height={14} sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.07)' }} />
              </Box>
            </Box>
          </Box>

          {/* Connector line */}
          <Box sx={{ display: 'flex', alignItems: 'center', pl: '21px', my: 0.25 }}>
            <Box sx={{ width: 2, height: 16, bgcolor: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
          </Box>

          {/* Dropoff input */}
          <Box>
            <Skeleton animation="wave" width={60} height={10} sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1, mb: 0.5, ml: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.88)', borderRadius: 2, height: 52, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.45)' }}>
              <Box sx={{ width: 44, height: '100%', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1.5px solid rgba(255,255,255,0.3)' }}>
                <Skeleton variant="circular" width={18} height={18} sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} />
              </Box>
              <Box sx={{ flex: 1, px: 1.5 }}>
                <Skeleton animation="wave" width="40%" height={14} sx={{ borderRadius: 1, bgcolor: 'rgba(0,0,0,0.07)' }} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ── White content area below gradient ── */}
        <Box sx={{ bgcolor: 'background.paper', px: 2.5, pt: 1.5, pb: 3 }}>

          {/* Recent destinations header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Skeleton animation="wave" width={110} height={11} sx={{ borderRadius: 1 }} />
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
            <Skeleton variant="circular" width={14} height={14} />
          </Box>

          {/* Recent location rows */}
          {[0, 1].map(i => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, mb: 0.5 }}>
              <Skeleton variant="circular" width={36} height={36} sx={{ flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton animation="wave" width="60%" height={14} sx={{ borderRadius: 1, mb: 0.4 }} />
                <Skeleton animation="wave" width="80%" height={11} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
          ))}

          {/* Send a Package CTA ghost */}
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderRadius: 3, border: `1.5px solid ${alpha(AMBER, 0.25)}`, bgcolor: alpha(AMBER, 0.04) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 2, bgcolor: alpha(AMBER, 0.18) }} />
              <Box>
                <Skeleton animation="wave" width={100} height={14} sx={{ borderRadius: 1, mb: 0.4 }} />
                <Skeleton animation="wave" width={120} height={11} sx={{ borderRadius: 1 }} />
              </Box>
            </Box>
            <Skeleton variant="circular" width={28} height={28} sx={{ bgcolor: alpha(AMBER, 0.18) }} />
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}