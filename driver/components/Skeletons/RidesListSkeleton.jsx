// PATH: components/Skeletons/RidesListSkeleton.jsx
'use client';
import { Box, Paper, Skeleton } from '@mui/material';

function RideRowSkel() {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
        <Skeleton variant="rounded" width={80} height={22} sx={{ borderRadius: 4 }} />
        <Skeleton width={60} height={16} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
        <Skeleton variant="circular" width={12} height={12} sx={{ mt: 0.5, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="80%" height={16} sx={{ mb: 0.5 }} />
          <Skeleton width="55%" height={14} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Skeleton variant="rounded" width={12} height={12} sx={{ mt: 0.5, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="70%" height={16} sx={{ mb: 0.5 }} />
          <Skeleton width="45%" height={14} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Skeleton width={80} height={16} />
        <Skeleton width={70} height={22} />
      </Box>
    </Paper>
  );
}

export function RidesListSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {[1,2,3,4,5].map(i => <RideRowSkel key={i} />)}
    </Box>
  );
}
export default RidesListSkeleton;