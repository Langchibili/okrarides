// PATH: components/Skeletons/OnlineToggleSkeleton.jsx
'use client';
import { Paper, Box, Skeleton } from '@mui/material';

export function OnlineToggleSkeleton() {
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="50%" height={32} />
          <Skeleton variant="text" width="70%" height={20} />
        </Box>
        <Skeleton variant="rounded" width={58} height={34} sx={{ borderRadius: 4 }} />
      </Box>
      <Skeleton variant="rounded" width={220} height={28} sx={{ borderRadius: 4, mt: 2 }} />
    </Paper>
  );
}
export default OnlineToggleSkeleton;