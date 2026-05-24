// 'use client';

// import { useState, useMemo, createContext, useContext, useEffect, useCallback } from 'react';
// import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme } from '@mui/material';
// import { partnerTheme } from '@/lib/theme';

// const ThemeContext = createContext();

// const DEFAULT_COLOR = '#10B981';

// export const useThemeMode = () => {
//   const context = useContext(ThemeContext);
//   if (!context) throw new Error('useThemeMode must be used within ThemeProvider');
//   return context;
// };

// export function ThemeProvider({ children }) {
//   return <RenderThemeProvider>{children}</RenderThemeProvider>;
// }

// const RenderThemeProvider = ({ children }) => {
//   const [mode, setMode] = useState('dark');
//   const [color, setColor] = useState(DEFAULT_COLOR);
//   const [isMounted, setIsMounted] = useState(false);

//   // ── Hydrate from localStorage on first client render ──────────────────────
//   useEffect(() => {
//     if (typeof window === 'undefined') return;
//     const savedMode = localStorage.getItem('theme-mode');
//     const savedColor = localStorage.getItem('theme-color');
//     if (savedMode) setMode(savedMode);
//     else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setMode('dark');
//     if (savedColor) setColor(savedColor);
//     setIsMounted(true);
//   }, []);

//   // ── Persist mode + colour whenever they change ─────────────────────────────
//   useEffect(() => {
//     if (typeof window === 'undefined') return;
//     localStorage.setItem('theme-mode', mode);
//     localStorage.setItem('theme-color', color);
//   }, [mode, color]);

//   // ── Re-resolve accent colour when mode flips ──────────────────────────────
//   useEffect(() => {
//     if (typeof window === 'undefined' || !isMounted) return;
//     const key = mode === 'dark' ? 'theme-color-dark' : 'theme-color-light';
//     const stored = localStorage.getItem(key);
//     if (stored) setColor(stored);
//   }, [mode, isMounted]);

//   // ── Listen for OS-level colour scheme changes ─────────────────────────────
//   useEffect(() => {
//     if (typeof window === 'undefined') return;
//     const mq = window.matchMedia('(prefers-color-scheme: dark)');
//     const handleChange = (e) => {
//       if (!localStorage.getItem('theme-mode')) setMode(e.matches ? 'dark' : 'light');
//     };
//     mq.addEventListener('change', handleChange);
//     return () => mq.removeEventListener('change', handleChange);
//   }, []);

//   // ── Build theme: partnerTheme as base, mode + accent merged on top ─────────
//   // createTheme(base, overrides) deep-merges so all component overrides,
//   // typography, and shape from theme.js are preserved automatically.
//   const theme = useMemo(() => createTheme(partnerTheme, {
//     palette: {
//       mode,
//       primary: {
//         main: color,
//         dark: color,
//         light: color,
//       },
//       background: mode === 'dark'
//         ? { default: '#0f172a', paper: '#1e293b' }
//         : { default: '#f8fafc', paper: '#ffffff' },
//     },
//   }), [mode, color]);

//   // ── Helpers ───────────────────────────────────────────────────────────────

//   /** Flip between light and dark, keeping the current accent colour. */
//   const toggleTheme = useCallback(() => {
//     setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
//   }, []);

//   /**
//    * Set mode and optionally a new accent colour in one call.
//    * @example setTheme('dark', '#FF5722')
//    */
//   const setTheme = useCallback((nextMode, nextColor) => {
//     setMode(nextMode);
//     if (nextColor !== undefined) setColor(nextColor);
//   }, []);

//   /**
//    * Set separate accent colours for light and dark mode.
//    * The correct one is applied immediately; switches automatically on mode change.
//    * @example setAccentColor('#FFC107', '#FF8C00')
//    */
//   const setAccentColor = useCallback((lightColor, darkColor) => {
//     const dark = darkColor ?? lightColor;
//     const resolved = mode === 'dark' ? dark : lightColor;
//     setColor(resolved);
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('theme-color-light', lightColor);
//       localStorage.setItem('theme-color-dark', dark);
//     }
//   }, [mode]);

//   const value = {
//     mode,
//     color,
//     theme,
//     isMounted,
//     setMode,
//     setColor,
//     setTheme,
//     toggleTheme,
//     setAccentColor,
//   };

//   return (
//     <ThemeContext.Provider value={value}>
//       <MuiThemeProvider theme={theme}>
//         <CssBaseline />
//         {children}
//       </MuiThemeProvider>
//     </ThemeContext.Provider>
//   );
// };
'use client';

import { useState, useMemo, createContext, useContext, useEffect, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { partnerTheme } from '@/lib/theme';

const DEFAULT_COLOR = '#10B981';

// Provide a safe default so useThemeMode never throws during SSR or when
// consumed outside the provider tree (e.g. in a Server Component shell).
const DEFAULT_CONTEXT = {
  mode: 'dark',
  color: DEFAULT_COLOR,
  theme: partnerTheme,
  isMounted: false,
  setMode: () => { },
  setColor: () => { },
  setTheme: () => { },
  toggleTheme: () => { },
  setAccentColor: () => { },
};

const ThemeContext = createContext(DEFAULT_CONTEXT);

/** Safe hook — returns the default context instead of throwing when used
 *  outside the provider (avoids the SSR crash on first render). */
export const useThemeMode = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  return <RenderThemeProvider>{children}</RenderThemeProvider>;
}

const RenderThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [isMounted, setIsMounted] = useState(false);

  // ── Hydrate from localStorage on first client render ──────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('theme-mode');
    const savedColor = localStorage.getItem('theme-color');
    if (savedMode) setMode(savedMode);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setMode('dark');
    if (savedColor) setColor(savedColor);
    setIsMounted(true);
  }, []);

  // ── Persist mode + colour whenever they change ─────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('theme-color', color);
  }, [mode, color]);

  // ── Re-resolve accent colour when mode flips ──────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;
    const key = mode === 'dark' ? 'theme-color-dark' : 'theme-color-light';
    const stored = localStorage.getItem(key);
    if (stored) setColor(stored);
  }, [mode, isMounted]);

  // ── Listen for OS-level colour scheme changes ─────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme-mode')) setMode(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // ── Build theme: partnerTheme as base, mode + accent merged on top ─────────
  const theme = useMemo(() => createTheme(partnerTheme, {
    palette: {
      mode,
      primary: { main: color, dark: color, light: color },
      background: mode === 'dark'
        ? { default: '#0f172a', paper: '#1e293b' }
        : { default: '#f8fafc', paper: '#ffffff' },
    },
  }), [mode, color]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((nextMode, nextColor) => {
    setMode(nextMode);
    if (nextColor !== undefined) setColor(nextColor);
  }, []);

  const setAccentColor = useCallback((lightColor, darkColor) => {
    const dark = darkColor ?? lightColor;
    const resolved = mode === 'dark' ? dark : lightColor;
    setColor(resolved);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-color-light', lightColor);
      localStorage.setItem('theme-color-dark', dark);
    }
  }, [mode]);

  const value = {
    mode, color, theme, isMounted,
    setMode, setColor, setTheme, toggleTheme, setAccentColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};