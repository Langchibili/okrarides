'use client';

import { useState, useMemo, createContext, useContext, useEffect, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '@/lib/theme';
import { useReactNative } from '@/lib/contexts/ReactNativeWrapper';
import ContextProviders from '@/lib/contexts/ContextProviders';

const ThemeContext = createContext();

// Default accent colour — matches the app's amber brand
const DEFAULT_COLOR = '#FFC107';

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  return <ContextProviders><RenderThemeProvider children={children}/></ContextProviders>
}

const RenderThemeProvider = ({children})=>{
  const [mode,  setMode]  = useState('light');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [isMounted, setIsMounted] = useState(false);

  const { handleChangeThemeMode } = useReactNative();

  // ── Hydrate from localStorage on first client render ──────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode  = localStorage.getItem('theme-mode');
      const savedColor = localStorage.getItem('theme-color');
      if (savedMode)  setMode(savedMode);
      else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setMode('dark');
      if (savedColor) setColor(savedColor);
      setIsMounted(true);
    }
  }, []);

  // ── Persist mode + active colour whenever they change ─────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode',  mode);
      localStorage.setItem('theme-color', color);
    }
  }, [mode, color]);

  // ── Re-resolve accent colour when mode flips ──────────────────────────────
  // If the consumer called setAccentColor(light, dark) we stored both variants.
  // Whenever mode changes we pick the matching stored colour automatically.
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;
    const key = mode === 'dark' ? 'theme-color-dark' : 'theme-color-light';
    const stored = localStorage.getItem(key);
    if (stored) setColor(stored);
  }, [mode, isMounted]);

  // ── Notify native layer on every mode or colour change ────────────────────
  useEffect(() => {
    if (isMounted && handleChangeThemeMode) {
      handleChangeThemeMode({ color, mode });
    }
  }, [mode, color, isMounted, handleChangeThemeMode]);

  // ── Listen for OS-level colour scheme changes ─────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem('theme-mode');
      if (!saved) setMode(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ── Build the MUI theme ───────────────────────────────────────────────────
  const theme = useMemo(() => createAppTheme(mode, color), [mode, color]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Flip between light and dark, keeping the current accent colour. */
  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  /**
   * Set mode and optionally a new accent colour in one call.
   *
   * @example
   * setTheme('dark', '#FF5722')  // switch mode + colour together
   * setTheme('light')            // switch mode, keep existing colour
   */
  const setTheme = useCallback((nextMode, nextColor) => {
    setMode(nextMode);
    if (nextColor !== undefined) setColor(nextColor);
  }, []);

  /**
   * Set separate accent colours for light and dark mode.
   * The correct one is applied immediately based on the current mode,
   * and will automatically switch whenever the mode changes later.
   *
   * @param {string} lightColor  - Colour to use in light mode (e.g. '#FFC107')
   * @param {string} [darkColor] - Colour to use in dark mode. Falls back to
   *                               lightColor if omitted.
   * @example
   * setAccentColor('#FFC107', '#FF8C00')
   * // → '#FFC107' active now in light; switches to '#FF8C00' when dark mode turns on
   */
  const setAccentColor = useCallback((lightColor, darkColor) => {
    const dark     = darkColor ?? lightColor;
    const resolved = mode === 'dark' ? dark : lightColor;

    // Apply the right colour for the current mode immediately
    setColor(resolved);

    // Persist both variants so mode switches can re-resolve them
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-color-light', lightColor);
      localStorage.setItem('theme-color-dark',  dark);
    }
  }, [mode]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    mode,
    color,
    theme,
    isMounted,
    // Setters
    setMode,
    setColor,
    setTheme,
    toggleTheme,
    setAccentColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
} 