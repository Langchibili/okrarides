// PATH: components/Skeletons/StatCardSkeleton.jsx
'use client';
import { Paper, Box, Skeleton } from '@mui/material';

export function StatCardSkeleton() {
  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, height: '100%' }}>
      <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2, mx: 'auto', mb: 1 }} />
      <Skeleton variant="text" width="60%" height={32} sx={{ mx: 'auto' }} />
      <Skeleton variant="text" width="80%" height={16} sx={{ mx: 'auto' }} />
    </Paper>
  );
}
export default StatCardSkeleton;