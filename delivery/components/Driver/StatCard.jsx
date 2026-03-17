// // //Okrarides\driver\components\Driver\StatCard.jsx
'use client';
import { Paper, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';

const COLOR_MAP = {
  primary: ['#3B82F6', '#1D4ED8'],
  warning: ['#F59E0B', '#B45309'],
  info:    ['#06B6D4', '#0E7490'],
  success: ['#10B981', '#047857'],
  error:   ['#EF4444', '#B91C1C'],
};

const MotionPaper = motion(Paper);

export const StatCard = ({ title, value, icon, color = 'primary', subtitle, trend }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [c1, c2] = COLOR_MAP[color] ?? COLOR_MAP.primary;

  return (
    <MotionPaper
      elevation={isDark ? 0 : 2}
      sx={{
        p: 2, borderRadius: 3, height: '100%', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        border: `1px solid ${alpha(c1, isDark ? 0.2 : 0.1)}`,
        background: isDark
          ? `linear-gradient(145deg, ${alpha(c1, 0.14)} 0%, ${alpha(c2, 0.06)} 100%)`
          : `linear-gradient(145deg, ${alpha(c1, 0.05)} 0%, ${alpha(c2, 0.02)} 100%)`,
        boxShadow: isDark ? `0 2px 16px ${alpha(c1, 0.14)}` : `0 2px 12px ${alpha(c1, 0.1)}`,
      }}
    >
      <Box sx={{
        position: 'absolute', top: -16, right: -16, width: 64, height: 64,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(c1, isDark ? 0.2 : 0.1)} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <Box sx={{
        width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.25,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
        boxShadow: `0 4px 12px ${alpha(c1, 0.38)}`,
        '& svg': { fontSize: 22, color: '#fff' },
      }}>
        {icon}
      </Box>

      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
      >
        <Typography variant="h5" sx={{
          fontWeight: 800, mb: 0.25,
          background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.2,
        }}>
          {value}
        </Typography>
      </motion.div>

      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}

      {trend !== undefined && trend !== null && (
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="caption" sx={{
            fontWeight: 700,
            color: trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.disabled',
          }}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
          </Typography>
        </Box>
      )}
    </MotionPaper>
  );
};
export default StatCard;