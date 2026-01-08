// 'use client';

// import { useState, useMemo, createContext, useContext, useEffect } from 'react';
// import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
// import { createAppTheme } from '@/lib/theme';

// const ThemeContext = createContext();

// export const useThemeMode = () => {
//   const context = useContext(ThemeContext);
//   if (!context) {
//     throw new Error('useThemeMode must be used within ThemeProvider');
//   }
//   return context;
// };

// export function ThemeProvider({ children }) {
//   // Start with 'light' mode to match server render
//   const [mode, setMode] = useState('light');
//   const [isMounted, setIsMounted] = useState(false);

//   // Load theme preference only on client after hydration
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const saved = localStorage.getItem('theme-mode');
//       if (saved) {
//         setMode(saved);
//       } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
//         setMode('dark');
//       }
//       setIsMounted(true);
//     }
//   }, []);
  
//   // Create theme based on mode
//   const theme = useMemo(() => createAppTheme(mode), [mode]);
  
//   // Save to localStorage
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('theme-mode', mode);
//     }
//   }, [mode]);
  
//   // Listen for system theme changes
//   useEffect(() => {
//     if (typeof window === 'undefined') return;
    
//     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//     const handleChange = (e) => {
//       // Only auto-switch if user hasn't manually set preference
//       const saved = localStorage.getItem('theme-mode');
//       if (!saved) {
//         setMode(e.matches ? 'dark' : 'light');
//       }
//     };
    
//     mediaQuery.addEventListener('change', handleChange);
//     return () => mediaQuery.removeEventListener('change', handleChange);
//   }, []);
  
//   // Toggle function
//   const toggleTheme = () => {
//     setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
//   };
  
//   const value = {
//     mode,
//     toggleTheme,
//     setMode,
//   };
  
//   return (
//     <ThemeContext.Provider value={value}>
//       <MuiThemeProvider theme={theme}>
//         <CssBaseline />
//         {children}
//       </MuiThemeProvider>
//     </ThemeContext.Provider>
//   );
// }
'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createDriverTheme } from '@/lib/theme';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme preference from localStorage
    const savedMode = localStorage.getItem('theme_mode');
    if (savedMode) {
      setMode(savedMode);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme_mode', newMode);
  };

  const theme = useMemo(() => createDriverTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleTheme,
    }),
    [mode]
  );

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}