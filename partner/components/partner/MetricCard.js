// PATH: componentsMetricCard.js
'use client';
import { Paper, Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  green: ['#10B981', '#047857'],
  orange: ['#F59E0B', '#D97706'],
  blue: ['#3B82F6', '#1D4ED8'],
  red: ['#EF4444', '#B91C1C'],
  purple: ['#8B5CF6', '#6D28D9'],
  cyan: ['#06B6D4', '#0E7490'],
};

export default function MetricCard({ label, value, sub, color = 'green', icon, trend }) {
  const [c1, c2] = COLOR_MAP[color] || COLOR_MAP.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${alpha(c1, 0.18)}`,
          background: `linear-gradient(145deg, ${alpha(c1, 0.12)} 0%, ${alpha(c2, 0.05)} 100%)`,
          boxShadow: `0 4px 20px ${alpha(c1, 0.15)}`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(c1, 0.2)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
              boxShadow: `0 4px 12px ${alpha(c1, 0.4)}`,
              '& svg': { fontSize: 20, color: '#fff' },
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            lineHeight: 1,
            mb: 0.5,
            fontFamily: "'JetBrains Mono', monospace",
            background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          {label}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mt: 0.25 }}>
            {sub}
          </Typography>
        )}
        {trend !== undefined && trend !== null && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              fontWeight: 700,
              color: trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : 'rgba(255,255,255,0.4)',
            }}
          >
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'}{Math.abs(trend)}%
          </Typography>
        )}
      </Paper>
    </motion.div>
  );
}
