// PATH: components/Skeletons/EarningsCardSkeleton.jsx
'use client';
import { Paper, Skeleton } from '@mui/material';

export function EarningsCardSkeleton() {
  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 3, height: '100%' }}>
      <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2, mx: 'auto', mb: 1 }} />
      <Skeleton variant="text" width="70%" height={36} sx={{ mx: 'auto' }} />
      <Skeleton variant="text" width="50%" height={16} sx={{ mx: 'auto' }} />
    </Paper>
  );
}
export default EarningsCardSkeleton;