// PATH: components/Skeletons/EarningsPageSkeleton.jsx
'use client';
import { Box, Grid, Paper, Skeleton } from '@mui/material';

export function EarningsPageSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {/* Hero */}
      <Paper elevation={4} sx={{ p: 4, mb: 2, borderRadius: 4, textAlign: 'center' }}>
        <Skeleton variant="text" width="40%" height={20} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width="70%" height={64} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width="50%" height={16} sx={{ mx: 'auto' }} />
      </Paper>
      {/* Balance row */}
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
        {[1,2].map(i => (
          <Grid item xs={6} key={i}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <Skeleton variant="text" width="70%" height={32} sx={{ mx: 'auto' }} />
              <Skeleton variant="text" width="50%" height={16} sx={{ mx: 'auto' }} />
            </Paper>
          </Grid>
        ))}
      </Box>
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
        {[1,2,3,4].map(i => (
          <Grid item xs={6} key={i}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
              <Skeleton variant="text" width="60%" height={28} sx={{ mx: 'auto' }} />
              <Skeleton variant="text" width="80%" height={16} sx={{ mx: 'auto' }} />
            </Paper>
          </Grid>
        ))}
      </Box>
      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Skeleton variant="rounded" height={52} sx={{ flex: 1, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={52} sx={{ flex: 1, borderRadius: 3 }} />
      </Box>
    </Box>
  );
}
export default EarningsPageSkeleton;