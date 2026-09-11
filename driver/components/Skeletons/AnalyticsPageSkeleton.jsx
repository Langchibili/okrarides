// PATH: components/Skeletons/AnalyticsPageSkeleton.jsx
'use client';
import { Box, Grid, Paper, Skeleton } from '@mui/material';

function ChartCard({ height = 200 }) {
  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
      <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1.5 }} />
      <Skeleton variant="rounded" height={height} sx={{ borderRadius: 2 }} />
    </Paper>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {/* KPI chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, overflowX: 'auto', pb: 1 }}>
        {[1,2,3,4,5].map(i => (
          <Skeleton key={i} variant="rounded" width={100} height={70} sx={{ borderRadius: 3, flexShrink: 0 }} />
        ))}
      </Box>
      <ChartCard height={200} />
      <ChartCard height={200} />
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6}><ChartCard height={160} /></Grid>
        <Grid item xs={6}><ChartCard height={160} /></Grid>
      </Grid>
      <ChartCard height={160} />
    </Box>
  );
}
export default AnalyticsPageSkeleton;