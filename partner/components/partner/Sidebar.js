// PATH: components/Sidebar.js
'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box, Typography, List, ListItemButton, ListItemIcon, ListItemText,
  Chip, IconButton, Drawer, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PeopleAlt as DriversIcon,
  DirectionsCar as VehiclesIcon,
  AccountBalanceWallet as FloatIcon,
  Receipt as RidesIcon,
  Support as SupportIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '@/lib/hooks/useAuth';
import { getImageUrl } from '@/Functions';
import { motion } from 'framer-motion';

const NAV = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
  { label: 'Drivers', icon: <DriversIcon />, href: '/drivers' },
  { label: 'Rides & Deliveries', icon: <RidesIcon />, href: '/rides' },
  { label: 'Vehicles', icon: <VehiclesIcon />, href: '/vehicles' },
  { label: 'Float / Wallet', icon: <FloatIcon />, href: '/float' },
  { label: 'Support', icon: <SupportIcon />, href: '/support' },
];

// ─── Partner logo / avatar ────────────────────────────────────────────────────
function PartnerLogo({ logo, businessName, size = 36 }) {
  const [imgError, setImgError] = useState(false);

  const initial = businessName?.[0]?.toUpperCase() ?? 'P';

  if (logo && !imgError) {
    const src =
      (process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL ?? '') +
      getImageUrl(logo, 'thumbnail');
    return (
      <Box
        component="img"
        src={src}
        alt={businessName}
        onError={() => setImgError(true)}
        sx={{
          width: size,
          height: size,
          borderRadius: 1.5,
          objectFit: 'cover',
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: '#059669',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        fontFamily: 'inherit',
      }}
    >
      {initial}
    </Box>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({ onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const partner = user?.partnerProfile;

  function handleNav(href) {
    router.push(href);
    onNavigate?.(); // close drawer on mobile
  }

  return (
    <Box
      sx={{
        width: 260,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Brand ── */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            component="img"
            src="/okra-tech-logo.png"
            alt="Okra"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              objectFit: 'contain',
              // Fallback background in case image is slow / missing
              bgcolor: 'rgba(5,150,105,0.15)',
              flexShrink: 0,
            }}
            onError={(e) => {
              // If the image fails, swap to the green square fallback
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
          {/* Hidden fallback icon — shown only if logo fails */}
          <Box
            sx={{
              display: 'none',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(5,150,105,0.4)',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ fontSize: 20, color: '#fff' }}>🚗</Typography>
          </Box>

          <Box>
            <Typography
              sx={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', lineHeight: 1.2 }}
            >
              Okra Rides
            </Typography>
            <Typography
              sx={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.45)',
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              FLEET PARTNER
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Partner info ── */}
      <Box
        sx={{
          mx: 2, mb: 2, p: 1.5, borderRadius: 2.5,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PartnerLogo logo={partner?.logo} businessName={partner?.businessName ?? user?.firstName} size={36} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontWeight: 700, color: '#fff', fontSize: '0.8rem', lineHeight: 1.2 }}
              noWrap
            >
              {partner?.businessName ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
            </Typography>
            <Chip
              label="APPROVED"
              size="small"
              sx={{
                height: 16,
                fontSize: '0.55rem',
                fontWeight: 700,
                bgcolor: 'rgba(5,150,105,0.25)',
                color: '#10B981',
                mt: 0.25,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Nav ── */}
      <List sx={{ flex: 1, px: 1.5 }}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <motion.div key={item.href} whileTap={{ scale: 0.97 }}>
              <ListItemButton
                onClick={() => handleNav(item.href)}
                sx={{
                  borderRadius: 2.5, mb: 0.5, px: 2, py: 1.2,
                  background: active
                    ? 'linear-gradient(135deg, rgba(5,150,105,0.25) 0%, rgba(16,185,129,0.12) 100%)'
                    : 'transparent',
                  border: active
                    ? '1px solid rgba(5,150,105,0.3)'
                    : '1px solid transparent',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  },
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

      {/* ── Logout ── */}
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
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 200,
            bgcolor: 'rgba(15,23,42,0.9)',
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(15,23,42,1)' },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          // Give the Paper an actual solid background so it isn't transparent
          PaperProps={{
            sx: {
              bgcolor: 'transparent',
              boxShadow: 'none',
              // The SidebarContent div carries its own background; this just
              // removes the default white Paper background that would clash.
            },
          }}
          // ModalProps: keep the backdrop but make sure the Paper is visible
          ModalProps={{ keepMounted: true }}
        >
          {/* Close button sits inside the drawer for easy dismissal */}
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setOpen(false)}
              size="small"
              sx={{
                marginBottom: '20px',
                position: 'absolute',
                top: 10,
                right: -44, // peek outside the sidebar into the backdrop area
                zIndex: 10,
                bgcolor: 'rgba(15,23,42,0.85)',
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { bgcolor: 'rgba(15,23,42,1)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            <SidebarContent onNavigate={() => setOpen(false)} />
          </Box>
        </Drawer>
      </>
    );
  }

  // Desktop: fixed sidebar, no drawer needed
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <SidebarContent />
    </Box>
  );
}