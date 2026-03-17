// PATH: components/Layout/BottomNav.jsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Paper, Box, Typography, ButtonBase } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Home as HomeIcon,
  DirectionsCar as RidesIcon,
  AccountBalanceWallet as EarningsIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Home',     value: '/',         icon: HomeIcon     },
  { label: 'Rides',    value: '/rides',    icon: RidesIcon    },
  { label: 'Earnings', value: '/earnings', icon: EarningsIcon },
  { label: 'Profile',  value: '/profile',  icon: ProfileIcon  },
];

// Per-tab accent colours (gradient pair)
const TAB_COLORS = {
  '/':         ['#10B981', '#059669'],
  '/rides':    ['#3B82F6', '#1D4ED8'],
  '/earnings': ['#F59E0B', '#D97706'],
  '/profile':  ['#8B5CF6', '#7C3AED'],
};

export const BottomNav = () => {
  const pathname = usePathname();
  const router   = useRouter();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';

  // Match the deepest route first, but '/' only when exactly '/' or '/home'
  const active = NAV_ITEMS.slice().reverse().find(item =>
    item.value === '/'
      ? pathname === '/' || pathname === '/home'
      : pathname.startsWith(item.value)
  )?.value ?? '/';

  const [c1, c2] = TAB_COLORS[active] ?? ['#6B7280', '#4B5563'];

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1200,
        borderTop: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.08)}`,
        background: isDark
          ? `linear-gradient(180deg, ${alpha('#0F172A', 0.92)} 0%, ${alpha('#0F172A', 0.98)} 100%)`
          : `linear-gradient(180deg, ${alpha('#ffffff', 0.88)} 0%, ${alpha('#ffffff', 0.97)} 100%)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        // Safe-area inset for notched phones / webviews
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Active-tab glow strip at very top of nav */}
      <motion.div
        layoutId="nav-glow-strip"
        animate={{ background: `linear-gradient(90deg, transparent 0%, ${alpha(c1, 0.55)} 50%, transparent 100%)` }}
        transition={{ duration: 0.35 }}
        style={{ height: 2, width: '100%' }}
      />

      <Box sx={{ display: 'flex', height: 58 }}>
        {NAV_ITEMS.map((item) => {
          const isActive   = item.value === active;
          const [ic1, ic2] = TAB_COLORS[item.value] ?? ['#6B7280', '#4B5563'];
          const Icon       = item.icon;

          return (
            <ButtonBase
              key={item.value}
              onClick={() => router.push(item.value)}
              disableRipple
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.4,
                py: 0.75,
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Pill background for active tab */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key="pill"
                    layoutId="nav-active-pill"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{   opacity: 0, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                    style={{
                      position: 'absolute',
                      top: 6,
                      width: 48,
                      height: 30,
                      borderRadius: 24,
                      background: `linear-gradient(135deg, ${alpha(ic1, isDark ? 0.28 : 0.14)} 0%, ${alpha(ic2, isDark ? 0.18 : 0.08)} 100%)`,
                      border: `1px solid ${alpha(ic1, isDark ? 0.3 : 0.18)}`,
                      boxShadow: `0 0 12px ${alpha(ic1, 0.28)}`,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.div
                animate={isActive
                  ? { scale: 1.15, y: -1 }
                  : { scale: 1,    y: 0  }
                }
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                style={{ position: 'relative', zIndex: 1, display: 'flex' }}
              >
                {isActive ? (
                  // Gradient icon via SVG filter trick — wrap in a box with gradient colour
                  <Box sx={{
                    '& svg': {
                      fontSize: 22,
                      filter: `drop-shadow(0 0 6px ${alpha(ic1, 0.6)})`,
                      // paint the icon in gradient using CSS
                      fill: `url(#nav-grad-${item.value.replace('/', 'root')})`,
                    },
                  }}>
                    <svg width={0} height={0} style={{ position: 'absolute' }}>
                      <defs>
                        <linearGradient id={`nav-grad-${item.value.replace('/', 'root')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%"   stopColor={ic1} />
                          <stop offset="100%" stopColor={ic2} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <Icon />
                  </Box>
                ) : (
                  <Icon sx={{ fontSize: 22, color: alpha(theme.palette.text.secondary, 0.55) }} />
                )}
              </motion.div>

              {/* Label */}
              <motion.div
                animate={isActive
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0.45, y: 0 }
                }
                transition={{ duration: 0.2 }}
                style={{ zIndex: 1 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: isActive ? 0.2 : 0,
                    background: isActive
                      ? `linear-gradient(135deg, ${ic1} 0%, ${ic2} 100%)`
                      : undefined,
                    WebkitBackgroundClip: isActive ? 'text' : undefined,
                    WebkitTextFillColor: isActive ? 'transparent' : undefined,
                    backgroundClip: isActive ? 'text' : undefined,
                    color: isActive ? undefined : 'text.secondary',
                    lineHeight: 1,
                    display: 'block',
                  }}
                >
                  {item.label}
                </Typography>
              </motion.div>
            </ButtonBase>
          );
        })}
      </Box>
    </Paper>
  );
};

export default BottomNav;