// // components/ui/SwipeableBottomSheet.jsx
// 'use client';

// import { useState, useRef, useEffect, useCallback } from 'react';
// import { Box } from '@mui/material';
// import { motion } from 'framer-motion';

// // ─────────────────────────────────────────────────────────────────────────────
// // BottomSheetDragPill
// // Place as the FIRST child inside your header Box.
// // Same container = same colour = zero seam/line.
// // ─────────────────────────────────────────────────────────────────────────────
// export const BottomSheetDragPill = ({ colored = false, sx = {} }) => (
//   <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.75, ...sx }}>
//     <Box
//       sx={{
//         width: 36,
//         height: 4,
//         borderRadius: 2,
//         bgcolor: colored ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.14)',
//         flexShrink: 0,
//       }}
//     />
//   </Box>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────
// function resolvePx(h) {
//   if (typeof h === 'string' && h.includes('%')) {
//     if (typeof window === 'undefined') return 400;
//     return Math.round(window.innerHeight * (parseFloat(h) / 100));
//   }
//   return Math.round(parseFloat(h) || 400);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // SwipeableBottomSheet
// // Props
// //   draggable      default true  — false locks the sheet (ride options use this)
// //   initialHeight  px or "80%"  — starting height
// //   maxHeight      px or "90%"  — hard ceiling when free-dragging
// //   expandedHeight px or "90%"  — programmatic expand target
// //   persistHeight               — keep expanded height until explicit swipe-down
// //   onSwipeDown                 — fired when user collapses
// // ─────────────────────────────────────────────────────────────────────────────
// const SwipeableBottomSheet = ({
//   children,
//   open = true,
//   initialHeight = 400,
//   maxHeight = '90%',
//   minHeight = 200,
//   expandedHeight = null,
//   onSwipeDown,
//   persistHeight = false,
//   draggable = true,
// }) => {
//   const [height, setHeight] = useState(() => resolvePx(initialHeight));
//   const [isExpanded, setIsExpanded] = useState(false);
//   const savedExpandedRef = useRef(null);
//   const lastH = useRef(resolvePx(initialHeight));
//   const scrollRef = useRef(null);

//   const getMax = useCallback(() => {
//     if (savedExpandedRef.current && isExpanded) return savedExpandedRef.current;
//     if (expandedHeight) return resolvePx(expandedHeight);
//     return resolvePx(maxHeight);
//   }, [expandedHeight, maxHeight, isExpanded]);

//   // Sync height from props
//   useEffect(() => {
//     if (expandedHeight) {
//       const h = resolvePx(expandedHeight);
//       savedExpandedRef.current = h;
//       lastH.current = h;
//       setHeight(h);
//       setIsExpanded(true);
//       // Scroll to top so user sees the header
//       if (scrollRef.current) scrollRef.current.scrollTop = 0;
//     } else if (!persistHeight || !isExpanded) {
//       const h = resolvePx(initialHeight);
//       lastH.current = h;
//       setHeight(h);
//       setIsExpanded(false);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [expandedHeight, initialHeight, persistHeight]);

//   // Scroll to top when sheet first appears
//   useEffect(() => {
//     if (open && scrollRef.current) scrollRef.current.scrollTop = 0;
//   }, [open]);

//   const handleDrag = useCallback((_, info) => {
//     if (!draggable) return;
//     const max = getMax();
//     const min = resolvePx(minHeight);
//     const next = Math.max(min, Math.min(max, lastH.current - info.delta.y));
//     lastH.current = next;
//     setHeight(next);
//   }, [draggable, minHeight, getMax]);

//   const handleDragEnd = useCallback((_, info) => {
//     if (!draggable) return;
//     const max = getMax();
//     const min = resolvePx(minHeight);
//     const init = resolvePx(initialHeight);
//     const mxH = resolvePx(maxHeight);

//     if (isExpanded) {
//       const collapse = info.velocity.y > 400 || lastH.current < max * 0.6;
//       if (collapse) {
//         lastH.current = init; setHeight(init);
//         setIsExpanded(false);
//         savedExpandedRef.current = null;
//         onSwipeDown?.();
//       } else {
//         lastH.current = max; setHeight(max);
//       }
//       return;
//     }

//     if (lastH.current < min + 50)       { lastH.current = min;  setHeight(min);  }
//     else if (lastH.current > mxH - 50)  { lastH.current = mxH;  setHeight(mxH);  }
//     else                                 { lastH.current = init; setHeight(init); }
//   }, [draggable, isExpanded, initialHeight, maxHeight, minHeight, getMax, onSwipeDown]);

//   if (!open) return null;

//   return (
//     <motion.div
//       style={{
//         position: 'absolute',
//         bottom: 0, left: 0, right: 0,
//         zIndex: 100,
//         height: `${height}px`,
//         maxWidth: '100%',
//         // Contain everything — no horizontal leak
//         overflow: 'hidden',
//       }}
//       initial={{ y: '100%' }}
//       animate={{ y: 0 }}
//       exit={{ y: '100%' }}
//       transition={{ type: 'spring', damping: 30, stiffness: 240 }}
//     >
//       <motion.div
//         drag={draggable ? 'y' : false}
//         dragConstraints={{ top: 0, bottom: 0 }}
//         dragElastic={0.04}
//         dragMomentum={false}
//         onDrag={handleDrag}
//         onDragEnd={handleDragEnd}
//         style={{
//           height: '100%',
//           display: 'flex',
//           flexDirection: 'column',
//           borderTopLeftRadius: 24,
//           borderTopRightRadius: 24,
//           // IMPORTANT: overflow hidden — children manage their own scroll.
//           // This ensures the footer in RideOptionsSheet is never clipped
//           // by an ancestor scroll container.
//           overflow: 'hidden',
//           backgroundColor: '#ffffff',
//           boxShadow: '0 -8px 40px rgba(0,0,0,0.13)',
//           userSelect: draggable ? 'none' : 'auto',
//           WebkitUserSelect: draggable ? 'none' : 'auto',
//           width: '100%',
//           maxWidth: '100%',
//           boxSizing: 'border-box',
//         }}
//       >
//         {/*
//           The inner Box is intentionally overflow:hidden — NOT overflow:auto.
//           Children (e.g. RideOptionsSheet) receive the full height via
//           flex and manage their own scrollable region internally.
//           This guarantees a sticky footer always sits at the bottom.
//         */}
//         <Box
//           ref={scrollRef}
//           sx={{
//             flex: 1,
//             minHeight: 0,
//             display: 'flex',
//             flexDirection: 'column',
//             overflow: 'hidden',
//             width: '100%',
//             maxWidth: '100%',
//             boxSizing: 'border-box',
//           }}
//         >
//           {children}
//         </Box>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default SwipeableBottomSheet;
// components/ui/SwipeableBottomSheet.jsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// BottomSheetDragPill
// Place as the FIRST child inside your header Box.
// Same container = same colour = zero seam/line.
// ─────────────────────────────────────────────────────────────────────────────
export const BottomSheetDragPill = ({ colored = false, sx = {} }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.75, ...sx }}>
    <Box
      sx={{
        width: 36,
        height: 4,
        borderRadius: 2,
        bgcolor: colored ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.14)',
        flexShrink: 0,
      }}
    />
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function resolvePx(h) {
  if (typeof h === 'string' && h.includes('%')) {
    if (typeof window === 'undefined') return 400;
    return Math.round(window.innerHeight * (parseFloat(h) / 100));
  }
  return Math.round(parseFloat(h) || 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// SwipeableBottomSheet
// Props
//   draggable      default true  — false locks the sheet (ride options use this)
//   initialHeight  px or "80%"  — starting height
//   maxHeight      px or "90%"  — hard ceiling when free-dragging
//   expandedHeight px or "90%"  — programmatic expand target
//   persistHeight               — keep expanded height until explicit swipe-down
//   onSwipeDown                 — fired when user collapses
// ─────────────────────────────────────────────────────────────────────────────
const SwipeableBottomSheet = ({
  children,
  open = true,
  initialHeight = 400,
  maxHeight = '90%',
  minHeight = 200,
  expandedHeight = null,
  onSwipeDown,
  persistHeight = false,
  draggable = true,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [height, setHeight] = useState(() => resolvePx(initialHeight));
  const [isExpanded, setIsExpanded] = useState(false);
  const savedExpandedRef = useRef(null);
  const lastH = useRef(resolvePx(initialHeight));
  const scrollRef = useRef(null);

  const getMax = useCallback(() => {
    if (savedExpandedRef.current && isExpanded) return savedExpandedRef.current;
    if (expandedHeight) return resolvePx(expandedHeight);
    return resolvePx(maxHeight);
  }, [expandedHeight, maxHeight, isExpanded]);

  // Sync height from props
  useEffect(() => {
    if (expandedHeight) {
      const h = resolvePx(expandedHeight);
      savedExpandedRef.current = h;
      lastH.current = h;
      setHeight(h);
      setIsExpanded(true);
      // Scroll to top so user sees the header
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else if (!persistHeight || !isExpanded) {
      const h = resolvePx(initialHeight);
      lastH.current = h;
      setHeight(h);
      setIsExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedHeight, initialHeight, persistHeight]);

  // Scroll to top when sheet first appears
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [open]);

  const handleDrag = useCallback((_, info) => {
    if (!draggable) return;
    const max = getMax();
    const min = resolvePx(minHeight);
    const next = Math.max(min, Math.min(max, lastH.current - info.delta.y));
    lastH.current = next;
    setHeight(next);
  }, [draggable, minHeight, getMax]);

  const handleDragEnd = useCallback((_, info) => {
    if (!draggable) return;
    const max = getMax();
    const min = resolvePx(minHeight);
    const init = resolvePx(initialHeight);
    const mxH = resolvePx(maxHeight);

    if (isExpanded) {
      const collapse = info.velocity.y > 400 || lastH.current < max * 0.6;
      if (collapse) {
        lastH.current = init; setHeight(init);
        setIsExpanded(false);
        savedExpandedRef.current = null;
        onSwipeDown?.();
      } else {
        lastH.current = max; setHeight(max);
      }
      return;
    }

    if (lastH.current < min + 50)       { lastH.current = min;  setHeight(min);  }
    else if (lastH.current > mxH - 50)  { lastH.current = mxH;  setHeight(mxH);  }
    else                                 { lastH.current = init; setHeight(init); }
  }, [draggable, isExpanded, initialHeight, maxHeight, minHeight, getMax, onSwipeDown]);

  if (!open) return null;

  // ── Theme-aware surface colours ──────────────────────────────────────────
  // Light: pure white.
  // Dark:  MUI's paper background — one step up from the default surface,
  //        so the sheet visually floats above the map in dark mode.
  const sheetBg     = isDark ? theme.palette.background.paper : '#ffffff';
  const sheetShadow = isDark
    ? '0 -8px 40px rgba(0,0,0,0.55)'
    : '0 -8px 40px rgba(0,0,0,0.13)';

  return (
    <motion.div
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 100,
        height: `${height}px`,
        maxWidth: '100%',
        // Contain everything — no horizontal leak
        overflow: 'hidden',
      }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 240 }}
    >
      <motion.div
        drag={draggable ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.04}
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          // IMPORTANT: overflow hidden — children manage their own scroll.
          // This ensures the footer in RideOptionsSheet is never clipped
          // by an ancestor scroll container.
          overflow: 'hidden',
          backgroundColor: sheetBg,
          boxShadow: sheetShadow,
          userSelect: draggable ? 'none' : 'auto',
          WebkitUserSelect: draggable ? 'none' : 'auto',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/*
          The inner Box is intentionally overflow:hidden — NOT overflow:auto.
          Children (e.g. RideOptionsSheet) receive the full height via
          flex and manage their own scrollable region internally.
          This guarantees a sticky footer always sits at the bottom.
        */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </Box>
      </motion.div>
    </motion.div>
  );
};

export default SwipeableBottomSheet;