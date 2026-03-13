// // PATH: components/Skeletons/HomePageSkeleton.jsx
// 'use client';
// import { Box, Grid, Paper, Skeleton } from '@mui/material';
// import { OnlineToggleSkeleton } from './OnlineToggleSkeleton';
// import { StatCardSkeleton }     from './StatCardSkeleton';
// import { EarningsCardSkeleton } from './EarningsCardSkeleton';

// export function HomePageSkeleton() {
//   return (
//     <Box sx={{ p: 2 }}>
//       {/* Alert placeholder */}
//       <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2, mb: 2 }} />
//       {/* Payment banner */}
//       <Skeleton variant="rounded" height={44} sx={{ borderRadius: 2, mb: 2 }} />
//       {/* Online toggle */}
//       <OnlineToggleSkeleton />
//       {/* Stats grid */}
//       <Box
//         sx={{
//             display: 'grid',
//             gridTemplateColumns: '1fr 1fr',
//             gridAutoRows: '1fr',        // ← forces every row to equal height
//             gap: 1.5,
//             mb: 1.5,
//             '& > *': {                  // every direct child fills its cell
//             minWidth: 0,
//             minHeight: 0,
//             },
//         }}
//         >
//         <Grid item xs={6}><EarningsCardSkeleton /></Grid>
//         <Grid item xs={6}><StatCardSkeleton /></Grid>
//         <Grid item xs={6}><StatCardSkeleton /></Grid>
//         <Grid item xs={6}><StatCardSkeleton /></Grid>
//       </Box>
//       {/* Quick actions */}
//       <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
//         <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: 2 }} />
//         <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: 2 }} />
//       </Box>
//       <Box sx={{ display: 'flex', gap: 1 }}>
//         <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: 2 }} />
//         <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: 2 }} />
//       </Box>
//     </Box>
//   );
// }
// export default HomePageSkeleton;
// PATH: components/Skeletons/HomePageSkeleton.jsx
'use client';
import { Box } from '@mui/material';
import {
  ShimmerDiv,
  ShimmerButton,
} from 'shimmer-effects-react';

export function HomePageSkeleton() {
  return (
    <Box sx={{ p: 2 }}>

      {/* Alert placeholder */}
      <ShimmerDiv mode="light" height={64} rounded={8} style={{ marginBottom: 16 }} />

      {/* Payment banner */}
      <ShimmerDiv mode="light" height={44} rounded={8} style={{ marginBottom: 16 }} />

      {/* Online toggle */}
      <ShimmerDiv mode="light" height={56} rounded={28} style={{ marginBottom: 12 }} />

      {/* Stats grid — 2 columns, equal rows */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridAutoRows: '1fr',
          gap: 1.5,
          mb: 1.5,
          '& > *': { minWidth: 0, minHeight: 0 },
        }}
      >
        {/* EarningsCard — taller */}
        <ShimmerDiv mode="light" height={140} rounded={12} />
        {/* Three StatCards */}
        <ShimmerDiv mode="light" height={140} rounded={12} />
        <ShimmerDiv mode="light" height={140} rounded={12} />
        <ShimmerDiv mode="light" height={140} rounded={12} />
      </Box>

      {/* Quick actions — row 1 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <ShimmerButton size="lg" mode="light" style={{ flex: 1, height: 44, borderRadius: 8 }} />
        <ShimmerButton size="lg" mode="light" style={{ flex: 1, height: 44, borderRadius: 8 }} />
      </Box>

      {/* Quick actions — row 2 */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <ShimmerButton size="lg" mode="light" style={{ flex: 1, height: 44, borderRadius: 8 }} />
        <ShimmerButton size="lg" mode="light" style={{ flex: 1, height: 44, borderRadius: 8 }} />
      </Box>

    </Box>
  );
}

export default HomePageSkeleton;