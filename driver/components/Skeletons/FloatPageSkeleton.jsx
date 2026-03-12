// PATH: components/Skeletons/FloatPageSkeleton.jsx
'use client';
import { Box, Paper, Skeleton, Grid } from '@mui/material';

export function FloatPageSkeleton() {
  return (
    <Box sx={{ p: 2.5 }}>
      {/* Balance hero */}
      <Paper elevation={0} sx={{ p: 4, mb: 2.5, borderRadius: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 2 }} />
        <Skeleton width="35%" height={16} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton width="60%" height={56} sx={{ mx: 'auto', mb: 1.5 }} />
        <Skeleton variant="rounded" width={200} height={28} sx={{ mx: 'auto', borderRadius: 4, mb: 2.5 }} />
        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Skeleton width="40%" height={14} sx={{ mx: 'auto', mb: 0.75 }} />
          <Skeleton width="55%" height={32} sx={{ mx: 'auto' }} />
        </Box>
      </Paper>
      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
        <Skeleton variant="rounded" height={52} sx={{ flex: 1, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={52} sx={{ flex: 1, borderRadius: 3 }} />
      </Box>
      {/* Details card */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Skeleton width="45%" height={22} sx={{ mb: 2 }} />
        {[1,2,3,4].map(i => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: i < 4 ? '1px solid' : 'none', borderColor: 'divider' }}>
            <Box>
              <Skeleton width={100} height={16} sx={{ mb: 0.5 }} />
              <Skeleton width={140} height={13} />
            </Box>
            <Skeleton width={70} height={20} />
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
export default FloatPageSkeleton;