'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
} from '@mui/material';
import {
  Home as HomeIcon,
  History as HistoryIcon,
  AccountBalance as WalletIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export const BottomNav = ({ userType = 'rider' }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Navigation items for rider
  const riderNavItems = [
    { label: 'Home', icon: <HomeIcon />, path: '/' },
    { label: 'Trips', icon: <HistoryIcon />, path: '/trips' },
    { label: 'Wallet', icon: <WalletIcon />, path: '/wallet' },
    { label: 'Profile', icon: <ProfileIcon />, path: '/profile' },
  ];
  
  const navItems = riderNavItems;
  
  // Find current active index
  const activeValue = navItems.find(item => pathname.startsWith(item.path))?.path || navItems[0].path;
  
  const handleChange = (event, newValue) => {
    router.push(newValue);
  };
  
  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
      }}
    >
      <BottomNavigation
        value={activeValue}
        onChange={handleChange}
        showLabels
      >
        {navItems.map((item, index) => {
          const isActive = activeValue === item.path;
          
          return (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -4 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {item.icon}
                </motion.div>
              }
              value={item.path}
              sx={{
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s',
                },
                '&.Mui-selected': {
                  '& .MuiSvgIcon-root': {
                    color: 'primary.main',
                  },
                },
              }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;

