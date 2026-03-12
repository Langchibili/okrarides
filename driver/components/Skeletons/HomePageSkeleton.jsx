// PATH: components/Skeletons/HomePageSkeleton.jsx
'use client';
import { Box, Grid, Paper, Skeleton } from '@mui/material';
import { OnlineToggleSkeleton } from './OnlineToggleSkeleton';
import { StatCardSkeleton }     from './StatCardSkeleton';
import { EarningsCardSkeleton } from './EarningsCardSkeleton';

export function HomePageSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {/* Alert placeholder */}
      <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2, mb: 2 }} />
      {/* Payment banner */}
      <Skeleton variant="rounded" height={44} sx={{ borderRadius: 2, mb: 2 }} />
      {/* Online toggle */}
      <OnlineToggleSkeleton />
      {/* Stats grid */}
      <Box
        sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridAutoRows: '1fr',        // ← forces every row to equal height
            gap: 1.5,
            mb: 1.5,
            '& > *': {                  // every direct child fills its cell
            minWidth: 0,
            minHeight: 0,
            },
        }}
        >
        <Grid item xs={6}><EarningsCardSkeleton /></Grid>
        <Grid item xs={6}><StatCardSkeleton /></Grid>
        <Grid item xs={6}><StatCardSkeleton /></Grid>
        <Grid item xs={6}><StatCardSkeleton /></Grid>
      </Box>
      {/* Quick actions */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: 2 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: 2 }} />
        <Skeleton variant="rounded" height={44} sx={{ flex: 1, borderRadius: 2 }} />
      </Box>
    </Box>
  );
}
export default HomePageSkeleton;