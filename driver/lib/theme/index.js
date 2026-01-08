// lib/theme/index.js - Main Theme Creator for Driver App
import { createTheme, alpha } from '@mui/material/styles';
import { driverColors } from './colors';

export const createDriverTheme = (mode) => {
  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light Mode
            primary: {
              main: driverColors.primary[500],
              light: driverColors.primary[300],
              dark: driverColors.primary[700],
              contrastText: '#FFFFFF',
            },
            secondary: {
              main: driverColors.secondary[500],
              light: driverColors.secondary[300],
              dark: driverColors.secondary[700],
              contrastText: '#000000',
            },
            background: {
              default: '#F5F5F5',
              paper: '#FFFFFF',
              elevated: '#FFFFFF',
            },
            text: {
              primary: '#212121',
              secondary: '#616161',
              disabled: '#9E9E9E',
            },
            divider: '#E0E0E0',
          }
        : {
            // Dark Mode
            primary: {
              main: driverColors.primary[400],
              light: driverColors.primary[300],
              dark: driverColors.primary[600],
              contrastText: '#000000',
            },
            secondary: {
              main: driverColors.secondary[400],
              light: driverColors.secondary[300],
              dark: driverColors.secondary[600],
              contrastText: '#000000',
            },
            background: {
              default: '#121212',
              paper: '#1E1E1E',
              elevated: '#2A2A2A',
            },
            text: {
              primary: '#FFFFFF',
              secondary: '#B0B0B0',
              disabled: '#666666',
            },
            divider: '#333333',
          }),
      // Common colors
      success: driverColors.success,
      error: driverColors.error,
      warning: driverColors.warning,
      info: driverColors.info,
      earnings: driverColors.earnings,
      status: driverColors.status,
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      // Display
      h1: {
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.6,
      },
      // Body
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
      // Special - Earnings Display
      earnings: {
        fontSize: '2rem',
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '-0.02em',
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      // Toggle Button (for online/offline)
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 58,
            height: 38,
            padding: 8,
          },
          switchBase: {
            padding: 11,
            '&.Mui-checked': {
              transform: 'translateX(20px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: driverColors.primary[500],
                opacity: 1,
              },
            },
          },
          thumb: {
            width: 16,
            height: 16,
            boxShadow: 'none',
          },
          track: {
            borderRadius: 19,
            backgroundColor: mode === 'light' ? '#E0E0E0' : '#616161',
            opacity: 1,
          },
        },
      },
      // Fab (for important actions)
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: '0px 4px 12px rgba(76, 175, 80, 0.3)',
            '&:hover': {
              boxShadow: '0px 6px 16px rgba(76, 175, 80, 0.4)',
            },
          },
          primary: {
            background: `linear-gradient(135deg, ${driverColors.primary[500]} 0%, ${driverColors.primary[600]} 100%)`,
          },
        },
      },
      // Card (for earnings, stats)
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            boxShadow: mode === 'light' 
              ? '0px 2px 8px rgba(0, 0, 0, 0.08)' 
              : '0px 4px 12px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      // Button
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 28,
            textTransform: 'none',
            fontWeight: 600,
            padding: '12px 24px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
            },
          },
          sizeLarge: {
            height: 56,
            fontSize: '1rem',
          },
        },
      },
      // AppBar
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            backdropFilter: 'blur(20px)',
            backgroundColor: mode === 'light' 
              ? alpha('#FFFFFF', 0.8) 
              : alpha('#1E1E1E', 0.9),
          },
        },
      },
      // Bottom Navigation
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: 80,
            borderTop: `1px solid ${mode === 'light' ? '#E0E0E0' : '#333333'}`,
            backgroundColor: mode === 'light' 
              ? alpha('#FFFFFF', 0.8) 
              : alpha('#1E1E1E', 0.95),
            backdropFilter: 'blur(20px)',
          },
        },
      },
    },
  });

  return theme;
};

export default createDriverTheme;