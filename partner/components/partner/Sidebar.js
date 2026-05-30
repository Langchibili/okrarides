// PATH: componentsSidebar.js
'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Chip, IconButton, Drawer, useMediaQuery, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  PeopleAlt as DriversIcon,
  DirectionsCar as VehiclesIcon,
  AccountBalanceWallet as FloatIcon,
  Receipt as RidesIcon,
  Support as SupportIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion } from 'framer-motion';

const NAV = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
  { label: 'Drivers', icon: <DriversIcon />, href: '/drivers' },
  { label: 'Rides & Deliveries', icon: <RidesIcon />, href: '/rides' },
  { label: 'Vehicles', icon: <VehiclesIcon />, href: '/vehicles' },
  { label: 'Float / Wallet', icon: <FloatIcon />, href: '/float' },
  { label: 'Support', icon: <SupportIcon />, href: '/support' },
];

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const partner = user?.partnerProfile;

  return (
    <Box
      sx={{
        width: 260,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2,
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(5,150,105,0.4)',
            }}
          >
            <Typography sx={{ fontSize: 20, color: '#fff' }}>🚗</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', lineHeight: 1.2 }}>
              Okra Rides
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 1 }}>
              FLEET PARTNER
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Partner info */}
      <Box
        sx={{
          mx: 2, mb: 2, p: 1.5, borderRadius: 2.5,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
            {partner?.businessName?.[0] ?? user?.firstName?.[0] ?? 'P'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.8rem', lineHeight: 1.2 }} noWrap>
              {partner?.businessName ?? `${user?.firstName || ""} ${user?.lastName || ""}`}
            </Typography>
            <Chip
              label="APPROVED"
              size="small"
              sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'rgba(5,150,105,0.25)', color: '#10B981', mt: 0.25 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Nav */}
      <List sx={{ flex: 1, px: 1.5 }}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <motion.div key={item.href} whileTap={{ scale: 0.97 }}>
              <ListItemButton
                onClick={() => router.push(item.href)}
                sx={{
                  borderRadius: 2.5, mb: 0.5, px: 2, py: 1.2,
                  background: active ? 'linear-gradient(135deg, rgba(5,150,105,0.25) 0%, rgba(16,185,129,0.12) 100%)' : 'transparent',
                  border: active ? '1px solid rgba(5,150,105,0.3)' : '1px solid transparent',
                  '&:hover': { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' },
                  transition: 'all 0.18s ease',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? '#10B981' : 'rgba(255,255,255,0.45)' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  }}
                />
              </ListItemButton>
            </motion.div>
          );
        })}
      </List>

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2.5, px: 2, py: 1.2,
            '&:hover': { background: 'rgba(239,68,68,0.1)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'rgba(239,68,68,0.7)' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }} />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={() => setOpen(true)}
          sx={{ position: 'fixed', top: 12, left: 12, zIndex: 200, bgcolor: 'rgba(15,23,42,0.9)', color: '#fff' }}
        >
          <MenuIcon />
        </IconButton>
        <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { bgcolor: 'transparent' } }}>
          <SidebarContent />
        </Drawer>
      </>
    );
  }

  return <SidebarContent />;
}
