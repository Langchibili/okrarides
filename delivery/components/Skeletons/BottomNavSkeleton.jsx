// PATH: components/Skeletons/BottomNavSkeleton.jsx
'use client';
import { Paper, Box, Skeleton } from '@mui/material';
import { alpha, useTheme }      from '@mui/material/styles';

export function BottomNavSkeleton() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1200,
        borderTop: `1px solid ${alpha(theme.palette.divider, isDark ? 0.12 : 0.08)}`,
        background: isDark
          ? alpha('#0F172A', 0.96)
          : alpha('#ffffff', 0.96),
        backdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Glow strip placeholder */}
      <Skeleton variant="rectangular" height={2} sx={{ mb: 0 }} />

      <Box sx={{ display: 'flex', height: 58 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              py: 0.75,
            }}
          >
            <Skeleton
              variant="rounded"
              width={28}
              height={28}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton variant="text" width={28} height={10} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default BottomNavSkeleton;