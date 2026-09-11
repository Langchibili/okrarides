'use client';
// PATH: lib/contexts/BottomNavContext.jsx
//
// Provides show/hide control of the bottom navigation bar from any page.
//
// Usage:
//   const { hideNav, showNav } = useBottomNav();
//
//   // Hide while input is focused:
//   <TextField onFocus={hideNav} onBlur={showNav} />
//
//   // Hide while estimates panel is open:
//   useEffect(() => {
//     if (estimatesVisible) hideNav();
//     else showNav();
//   }, [estimatesVisible]);
//
//   // Imperatively from anywhere:
//   const { setNavVisible } = useBottomNav();
//   setNavVisible(false);

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const BottomNavContext = createContext(null);

export function BottomNavProvider({ children }) {
  const [visible, setVisible] = useState(true);

  // ref-based counter so multiple simultaneous callers of hideNav()
  // don't race — nav only re-appears when ALL callers have called showNav()
  const hideCount = useRef(0);

  const hideNav = useCallback(() => {
    hideCount.current += 1;
    setVisible(false);
  }, []);

  const showNav = useCallback(() => {
    hideCount.current = Math.max(0, hideCount.current - 1);
    if (hideCount.current === 0) setVisible(true);
  }, []);

  // Hard set — bypasses the counter (use for page-level overrides)
  const setNavVisible = useCallback((v) => {
    hideCount.current = v ? 0 : 1;
    setVisible(v);
  }, []);

  return (
    <BottomNavContext.Provider value={{ visible, hideNav, showNav, setNavVisible }}>
      {children}
    </BottomNavContext.Provider>
  );
}

export function useBottomNav() {
  const ctx = useContext(BottomNavContext);
  if (!ctx) throw new Error('useBottomNav must be used within BottomNavProvider');
  return ctx;
}

export default BottomNavContext;