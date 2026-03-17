'use client';
// PATH: app/(main)/onboarding/pending/page.jsx — UI POLISH ONLY
import { Box, Typography, Button, Paper, List, ListItem, ListItemIcon, ListItemText, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  HourglassEmpty as PendingIcon, CheckCircle as CheckIcon,
  Notifications as NotificationIcon, Email as EmailIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function PendingPage() {
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const item    = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } } };

  return (
    <Box sx={{
      minHeight: '100vh', marginLeft:'-20px', marginRight:'-20px', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3,
      background: isDark
        ? 'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)'
        : 'linear-gradient(160deg, #F0FDF4 0%, #ECFDF5 100%)',
    }}>
      {/* Ambient blob */}
      <Box sx={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(circle, ${alpha('#10B981', isDark ? 0.08 : 0.12)} 0%, transparent 70%)`,
      }} />

      <Box sx={{ maxWidth: 440, width: '100%', position: 'relative', zIndex: 1 }}>
        <motion.div variants={stagger} initial="hidden" animate="show">
          {/* Icon */}
          <motion.div variants={item} style={{ textAlign: 'center' }}>
            <Box sx={{
              width: 110, height: 110, borderRadius: '50%', mx: 'auto', mb: 3,
              background: isDark
                ? `linear-gradient(135deg, ${alpha('#F59E0B', 0.25)} 0%, ${alpha('#D97706', 0.15)} 100%)`
                : `linear-gradient(135deg, ${alpha('#FEF3C7', 1)} 0%, ${alpha('#FDE68A', 1)} 100%)`,
              border: `2px solid ${alpha('#F59E0B', isDark ? 0.4 : 0.5)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 32px ${alpha('#F59E0B', 0.3)}`,
            }}>
              <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 1.2, delay: 0.6, ease: 'easeInOut' }}>
                <PendingIcon sx={{ fontSize: 52, color: isDark ? '#FCD34D' : '#D97706' }} />
              </motion.div>
            </Box>
          </motion.div>

          <motion.div variants={item} style={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: -0.5 }}>Application Submitted!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>We're reviewing your documents. This usually takes 24–48 hours.</Typography>
          </motion.div>

          {/* What's next card */}
          <motion.div variants={item}>
            <Paper elevation={0} sx={{
              p: 3, mb: 2, borderRadius: 3.5,
              border: `1px solid ${alpha(isDark ? '#fff' : '#000', isDark ? 0.08 : 0.07)}`,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.07)',
              background: isDark
                ? `linear-gradient(145deg, ${alpha('#10B981', 0.07)} 0%, transparent 100%)`
                : 'linear-gradient(145deg, #FFFFFF 0%, #FAFAFA 100%)',
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>What's Next?</Typography>
              <List disablePadding>
                {[
                  { icon: <CheckIcon />, color: '#10B981', primary: 'Document Review',  secondary: 'Usually takes 24-48 hours'      },
                  { icon: <NotificationIcon />, color: '#3B82F6', primary: 'Notification', secondary: "We'll notify you once approved" },
                  { icon: <EmailIcon />, color: '#8B5CF6',         primary: 'Email Confirmation', secondary: 'Check your email for updates' },
                ].map(({ icon, color, primary, secondary }, i) => (
                  <ListItem key={primary} sx={{ px: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 42 }}>
                      <Box sx={{
                        width: 34, height: 34, borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(color, isDark ? 0.22 : 0.12)} 0%, ${alpha(color, isDark ? 0.1 : 0.06)} 100%)`,
                        border: `1px solid ${alpha(color, 0.25)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        '& svg': { fontSize: 18, color },
                      }}>
                        {icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>{primary}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </motion.div>

          {/* Mobile money setup */}
          <motion.div variants={item}>
            <Paper elevation={0} sx={{
              p: 3, mb: 3, borderRadius: 3.5,
              border: `1.5px solid ${alpha('#10B981', isDark ? 0.35 : 0.3)}`,
              boxShadow: `0 4px 20px ${alpha('#10B981', 0.12)}`,
              background: isDark
                ? `linear-gradient(135deg, ${alpha('#10B981', 0.12)} 0%, ${alpha('#059669', 0.06)} 100%)`
                : `linear-gradient(135deg, ${alpha('#ECFDF5', 1)} 0%, ${alpha('#D1FAE5', 0.5)} 100%)`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2,
                  background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 2px 8px ${alpha('#10B981', 0.4)}`,
                }}>
                  <AccountBalanceIcon sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Set Up Payment While You Wait</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add your mobile money numbers which riders can send payment to.
              </Typography>
              <Button fullWidth variant="contained" size="large" startIcon={<AccountBalanceIcon />}
                onClick={() => router.push('/mobile-money-numbers')}
                sx={{ height: 'auto', borderRadius: 3, fontWeight: 700,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: `0 4px 16px ${alpha('#10B981', 0.4)}`,
                }}>
                Add Mobile Money Numbers
              </Button>
            </Paper>
          </motion.div>

          {/* <motion.div variants={item}>
            <Button fullWidth variant="outlined" size="large" onClick={() => router.push('/')}
              sx={{ height: 56, borderRadius: 3.5, fontWeight: 600 }}>
              Back to Home
            </Button>
          </motion.div> */}
        </motion.div>
      </Box>
    </Box>
  );
}