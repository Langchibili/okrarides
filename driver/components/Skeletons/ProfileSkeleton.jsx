// PATH: components/Skeletons/ProfileSkeleton.jsx
'use client';
import { Box, Paper, Skeleton } from '@mui/material';

export function ProfileSkeleton() {
  return (
    <Box sx={{ p: 2.5 }}>
      {/* Header card */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, mb: 2.5, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="circular" width={100} height={100} sx={{ mx: 'auto', mb: 2 }} />
        <Skeleton width="50%" height={28} sx={{ mx: 'auto', mb: 0.75 }} />
        <Skeleton width="40%" height={18} sx={{ mx: 'auto', mb: 1.5 }} />
        <Skeleton variant="rounded" width={90} height={26} sx={{ mx: 'auto', borderRadius: 3, mb: 2.5 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {[1,2,3].map(i => (
            <Box key={i}>
              <Skeleton width="60%" height={24} sx={{ mx: 'auto', mb: 0.5 }} />
              <Skeleton width="80%" height={14} sx={{ mx: 'auto' }} />
            </Box>
          ))}
        </Box>
      </Paper>
      {/* Section cards */}
      {[4, 4, 3].map((rows, si) => (
        <Paper key={si} elevation={0} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
            <Skeleton width="35%" height={14} />
          </Box>
          {Array.from({ length: rows }).map((_, i) => (
            <Box key={i}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.75 }}>
                <Skeleton variant="circular" width={24} height={24} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="55%" height={16} sx={{ mb: 0.5 }} />
                  <Skeleton width="75%" height={13} />
                </Box>
                <Skeleton variant="rounded" width={20} height={20} />
              </Box>
              {i < rows - 1 && <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mx: 2 }} />}
            </Box>
          ))}
        </Paper>
      ))}
    </Box>
  );
}
export default ProfileSkeleton;