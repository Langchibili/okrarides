'use client';

import { Paper, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/Functions';

export const EarningsCard = ({ title, amount, icon, color = 'primary', subtitle }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 3,
        textAlign: 'center',
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: `${color}.light`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 1,
        }}
      >
        {icon}
      </Box>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {formatCurrency(amount)}
        </Typography>
      </motion.div>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" display="block">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default EarningsCard;
