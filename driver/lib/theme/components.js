import { alpha } from '@mui/material/styles';
import { colors } from './colors';

export const componentOverrides = (theme) => ({
  components: {
    // Button - App-like styling
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          padding: '12px 24px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.shadows[2],
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: theme.shadows[4],
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
          height: 56,
        },
        sizeSmall: {
          padding: '8px 16px',
          fontSize: '0.875rem',
          height: 36,
        },
      },
    },
    
    // Fab
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: theme.shadows[4],
          '&:hover': {
            boxShadow: theme.shadows[6],
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },
    
    // Card
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: theme.palette.mode === 'light' ? theme.shadows[1] : theme.shadows[3],
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    
    // TextField
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    
    // AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.mode === 'light' 
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
      },
    },
    
    // BottomNavigation
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 80,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.mode === 'light'
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
      },
    },
    
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 64,
          padding: '8px 12px 12px',
          '&.Mui-selected': {
            paddingTop: 8,
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 600,
            },
          },
        },
        label: {
          fontSize: '0.75rem',
          fontWeight: 500,
          '&.Mui-selected': {
            fontSize: '0.75rem',
          },
        },
      },
    },
    
    // Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 24,
        },
        elevation1: {
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 2px 8px rgba(0, 0, 0, 0.05)'
            : '0px 2px 8px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    
    // Chip
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
        filled: {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.15),
          },
        },
      },
    },
    
    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          '@media (max-width: 600px)': {
            margin: 16,
            maxHeight: 'calc(100% - 32px)',
          },
        },
        paperFullScreen: {
          borderRadius: 0,
        },
      },
    },
    
    // Switch - iOS style
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 52,
          height: 32,
          padding: 0,
        },
        switchBase: {
          padding: 0,
          margin: 4,
          transitionDuration: '300ms',
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            '& + .MuiSwitch-track': {
              backgroundColor: theme.palette.primary.main,
              opacity: 1,
              border: 0,
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
          boxShadow: theme.shadows[1],
        },
        track: {
          borderRadius: 32 / 2,
          backgroundColor: theme.palette.mode === 'light' 
            ? colors.neutral[300] 
            : colors.neutral[700],
          opacity: 1,
        },
      },
    },
    
    // ListItem
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginBottom: 4,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
      },
    },
    
    // Backdrop
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        },
      },
    },
  },
});
