// components/Layout/PageTransitionWrapper.jsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const PageTransitionWrapper = ({ children }) => {
  const pathname = usePathname();
  
  useEffect(() => {
    // Disable transitions during page changes
    const originalTransition = document.documentElement.style.transition;
    document.documentElement.style.transition = 'none';
    
    // Re-enable after a short delay
    const timer = setTimeout(() => {
      document.documentElement.style.transition = originalTransition;
    }, 50);
    
    return () => {
      clearTimeout(timer);
      document.documentElement.style.transition = originalTransition;
    };
  }, [pathname]);
  
  return children;
};