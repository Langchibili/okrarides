// PATH: lib/theme.js
import { createTheme } from '@mui/material/styles';

export const partnerTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#059669', dark: '#047857', light: '#10B981' },
    secondary: { main: '#F59E0B', dark: '#D97706', light: '#FCD34D' },
    background: { default: '#0f172a', paper: '#1e293b' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    info: { main: '#3B82F6' },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 700, borderRadius: 10 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
          boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(5,150,105,0.55)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700, borderRadius: 6 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderBottom: '1px solid rgba(255,255,255,0.05)' } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' },
      },
    },
  },
});
