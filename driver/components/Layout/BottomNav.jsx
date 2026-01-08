'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Home as HomeIcon,
  DirectionsCar as RidesIcon,
  AccountBalanceWallet as EarningsIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Home', value: '/home', icon: <HomeIcon /> },
    { label: 'Rides', value: '/rides', icon: <RidesIcon /> },
    { label: 'Earnings', value: '/earnings', icon: <EarningsIcon /> },
    { label: 'Profile', value: '/profile', icon: <ProfileIcon /> },
  ];

  const currentValue = navItems.find((item) => pathname.startsWith(item.value))?.value || '/home';

  const handleChange = (event, newValue) => {
    router.push(newValue);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation value={currentValue} onChange={handleChange} showLabels>
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
