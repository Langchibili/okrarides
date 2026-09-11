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
      style={{ position: 'relative' }}
    >
      {/* Ripple rings — behind the card */}
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
                  top: '50%',
                  left: '40%',
                  bottom:'30%',
                  transform: 'translate(-50%, -50%)',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.45)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          p: 3,
          mb: 2,
          borderRadius: 4,
          overflow: 'hidden',
          background: isOnline
            ? 'linear-gradient(135deg, #2E7D32 0%, #43A047 60%, #66BB6A 100%)'
            : 'linear-gradient(135deg, #424242 0%, #616161 60%, #757575 100%)',
          color: 'white',
          border: '1px solid',
          borderColor: isOnline ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
          boxShadow: isOnline
            ? '0 8px 32px rgba(46,125,50,0.45)'
            : '0 8px 24px rgba(0,0,0,0.2)',
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
          // Subtle highlight gloss at top
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '45%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '16px 16px 0 0',
            pointerEvents: 'none',
          },
        }}
      >
        {/* Status dot + text row */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            {/* Status indicator dot */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <motion.div
                animate={isOnline ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#A5D6A7' : 'rgba(255,255,255,0.35)',
                  boxShadow: isOnline ? '0 0 0 3px rgba(165,214,167,0.35)' : 'none',
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}
              >
                {isOnline ? "You're Online" : "You're Offline"}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8, pl: '17px' }}>
              {isOnline
                ? 'Ready to accept rides'
                : 'Toggle on to start earning'}
            </Typography>
          </Box>

          {/* Switch */}
          <Switch
            checked={isOnline}
            onChange={handleToggle}
            disabled={disabled}
            sx={{
              width: 58,
              height: 32,
              p: 0,
              '& .MuiSwitch-switchBase': {
                p: 0.5,
                '&.Mui-checked': {
                  transform: 'translateX(26px)',
                  color: isOnline ? '#2E7D32' : '#fff',
                  '& + .MuiSwitch-track': {
                    bgcolor: 'rgba(255,255,255,0.55)',
                    opacity: 1,
                  },
                },
              },
              '& .MuiSwitch-thumb': {
                width: 24,
                height: 24,
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              },
              '& .MuiSwitch-track': {
                borderRadius: 16,
                bgcolor: 'rgba(255,255,255,0.22)',
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* Listening chip */}
        <AnimatePresence>
          {isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22 }}
            >
              <Chip
                label="🔊 Listening for ride requests"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  height: 30,
                  border: '1px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(4px)',
                  '& .MuiChip-label': { px: 1.5 },
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subscription status */}
        {subscriptionStatus && isSubscriptionSystemEnabled && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 600, display: 'block', mb: 0.1 }}>
                {subscriptionStatus.plan?.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                {subscriptionStatus.daysRemaining} days remaining
              </Typography>
            </Box>
            {/* Days remaining pill */}
            <Box
              sx={{
                px: 1.5,
                py: 0.4,
                borderRadius: 10,
                bgcolor: subscriptionStatus.daysRemaining <= 3
                  ? 'rgba(255,152,0,0.3)'
                  : 'rgba(255,255,255,0.15)',
                border: '1px solid',
                borderColor: subscriptionStatus.daysRemaining <= 3
                  ? 'rgba(255,152,0,0.5)'
                  : 'rgba(255,255,255,0.2)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  color: subscriptionStatus.daysRemaining <= 3 ? '#FFCC80' : 'white',
                }}
              >
                {subscriptionStatus.daysRemaining}d
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

export default OnlineToggle;