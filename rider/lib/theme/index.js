import { createTheme, alpha } from '@mui/material/styles';
import { colors } from './colors';
import { typography } from './typography';
import { shadows } from './shadows';
import { componentOverrides } from './components';

// Base theme configuration function
export const createAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';
  
  const baseTheme = createTheme({
    palette: {
      mode,
      ...(isDark ? {
        // Dark Mode Palette
        primary: {
          main: colors.primary[400],
          light: colors.primary[300],
          dark: colors.primary[600],
          contrastText: colors.neutral[900],
        },
        secondary: {
          main: colors.secondary[400],
          light: colors.secondary[300],
          dark: colors.secondary[600],
          contrastText: colors.neutral[900],
        },
        background: {
          default: '#121212',
          paper: '#1E1E1E',
          elevated: '#2A2A2A',
        },
        text: {
          primary: colors.neutral[50],
          secondary: colors.neutral[400],
          disabled: colors.neutral[600],
        },
        divider: colors.neutral[800],
        action: {
          active: colors.neutral[400],
          hover: alpha(colors.neutral[0], 0.08),
          selected: alpha(colors.primary[400], 0.16),
          disabled: colors.neutral[600],
          disabledBackground: colors.neutral[800],
        },
      } : {
        // Light Mode Palette
        primary: {
          main: colors.primary[500],
          light: colors.primary[300],
          dark: colors.primary[700],
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: colors.secondary[500],
          light: colors.secondary[300],
          dark: colors.secondary[700],
          contrastText: '#FFFFFF',
        },
        background: {
          default: colors.neutral[50],
          paper: colors.neutral[0],
          elevated: colors.neutral[0],
        },
        text: {
          primary: colors.neutral[900],
          secondary: colors.neutral[700],
          disabled: colors.neutral[500],
        },
        divider: colors.neutral[300],
        action: {
          active: colors.neutral[700],
          hover: alpha(colors.neutral[900], 0.04),
          selected: alpha(colors.primary[500], 0.08),
          disabled: colors.neutral[400],
          disabledBackground: colors.neutral[200],
        },
      }),
      
      // Common colors (same in both modes)
      success: {
        main: '#4CAF50',
        light: '#81C784',
        dark: '#388E3C',
        contrastText: '#FFFFFF',
      },
      error: {
        main: '#F44336',
        light: '#E57373',
        dark: '#D32F2F',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: '#FF9800',
        light: '#FFB74D',
        dark: '#F57C00',
        contrastText: '#FFFFFF',
      },
      info: {
        main: '#2196F3',
        light: '#64B5F6',
        dark: '#1976D2',
        contrastText: '#FFFFFF',
      },
    },
    
    typography,
    
    shape: {
      borderRadius: 16,
    },
    
    shadows,
    
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    
    // Custom tokens
    custom: {
      mapColors: {
        pickup: '#4CAF50',
        dropoff: '#F44336',
        route: '#2196F3',
        driver: colors.primary[500],
      },
      appBar: {
        height: 64,
        mobileHeight: 56,
      },
      bottomNav: {
        height: 80,
      },
      fab: {
        bottom: 96,
      },
    },
  });
  
  // Apply component overrides
  return createTheme(baseTheme, componentOverrides(baseTheme));
};

export default createAppTheme;
