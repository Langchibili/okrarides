// PATH: components/Skeletons/RideDetailSkeleton.jsx
'use client';
import { Box, Paper, Skeleton, Grid } from '@mui/material';

function CardSkel({ rows = 3, height = 60 }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <Skeleton width="45%" height={22} sx={{ mb: 1.5 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width={i % 2 === 0 ? '90%' : '65%'} height={height / rows} sx={{ mb: 0.75 }} />
      ))}
    </Paper>
  );
}

export function RideDetailSkeleton() {
  return (
    <Box sx={{ p: 2.5 }}>
      {/* Map placeholder */}
      <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3, mb: 2 }} />
      {/* Rider */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <Skeleton width="40%" height={22} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Skeleton variant="circular" width={56} height={56} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={20} sx={{ mb: 0.75 }} />
            <Skeleton width="40%" height={16} />
          </Box>
        </Box>
      </Paper>
      <CardSkel rows={4} height={80} />
      <CardSkel rows={6} height={120} />
      {/* Stats */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Skeleton width="40%" height={22} sx={{ mb: 2 }} />
        <Grid container spacing={1.5}>
          {[1,2].map(i => <Grid item xs={6} key={i}><Skeleton variant="rounded" height={64} sx={{ borderRadius: 2 }} /></Grid>)}
        </Grid>
      </Paper>
    </Box>
  );
}
export default RideDetailSkeleton;