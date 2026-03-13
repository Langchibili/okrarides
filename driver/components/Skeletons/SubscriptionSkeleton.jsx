// PATH: components/Skeletons/SubscriptionSkeleton.jsx
'use client';
import { Box, Paper, Skeleton, Grid } from '@mui/material';

function PlanCardSkel() {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <Skeleton width="55%" height={28} sx={{ mb: 1 }} />
      <Skeleton width="80%" height={16} sx={{ mb: 2.5 }} />
      <Skeleton width="45%" height={48} sx={{ mb: 0.5 }} />
      <Skeleton width="30%" height={14} sx={{ mb: 2.5 }} />
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }} />
      {[1,2,3,4].map(i => (
        <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.25 }}>
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton width="75%" height={16} />
        </Box>
      ))}
      <Box sx={{ mt: 3 }}>
        <Skeleton variant="rounded" height={52} sx={{ borderRadius: 3 }} />
      </Box>
    </Paper>
  );
}

export function SubscriptionSkeleton() {
  return (
    <Box sx={{ p: 2.5 }}>
      <Box sx={{
                display: 'block',
                gridTemplateColumns: '1fr 1fr',
                gridAutoRows: '1fr',
                gap: 1.5,
                mb: 1.5,
                '& > *': { minWidth: 0, minHeight: 0 },
              }}>
        <Grid item xs={12} md={6}><PlanCardSkel /></Grid>
        <Grid item xs={12} md={6}><PlanCardSkel /></Grid>
      </Box>
      <Paper elevation={0} sx={{ p: 2.5, mt: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Skeleton width="40%" height={24} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[1,2,3,4].map(i => (
            <Grid item xs={12} sm={6} key={i}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="70%" height={18} sx={{ mb: 0.5 }} />
                  <Skeleton width="90%" height={14} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
export default SubscriptionSkeleton;