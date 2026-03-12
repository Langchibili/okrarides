//Okrarides\driver\components\Driver\OnlineToggle.jsx
'use client';

import { Paper, Box, Typography, Switch, Chip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

export const OnlineToggle = ({
  isSubscriptionSystemEnabled,
  isOnline,
  subscriptionStatus,
  onToggle,
  disabled = false,
}) => {
  const theme = useTheme();

  const handleToggle = () => {
    if (!disabled) {
      onToggle(!isOnline);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence>
      {isOnline && (
        <>
          {[0, 0.6, 1.2].map((delay, i) => (
            <motion.div
              key={`ripple-${i}`}
              initial={{ opacity: 0.5, scale: 0.4 }}
              animate={{ opacity: 0, scale: 2.2 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeOut',
                delay,
              }}
              style={{
                position: 'absolute',
                top: '35%',
                left: '40%',
                transform: 'translate(-50%, -50%)',
                width: 80,           // ← fixed px, not '100%'
                height: 80,          // ← fixed px, not '100%'
                borderRadius: '50%', // ← circle, not card shape
                border: '2px solid rgba(255,255,255,0.45)',
                pointerEvents: 'none',
              }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 2,
          borderRadius: 4,
          background: isOnline
            ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
            : `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[600]} 100%)`,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {isOnline ? "You're Online" : "You're Offline"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {isOnline
                ? 'Ready to accept rides'
                : 'Toggle on to start earning'}
            </Typography>
          </Box>
          <Switch
            checked={isOnline}
            onChange={handleToggle}
            disabled={disabled}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: 'white',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                bgcolor: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          />
        </Box>

        {isOnline && (
          <Chip
            label="🔊 Listening for ride requests"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 600,
            }}
          />
        )}

        {/* Subscription Status */}
        {subscriptionStatus && isSubscriptionSystemEnabled && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Subscription: {subscriptionStatus.plan?.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}
            >
              {subscriptionStatus.daysRemaining} days remaining
            </Typography>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default OnlineToggle;


