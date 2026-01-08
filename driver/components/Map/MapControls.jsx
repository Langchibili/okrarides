// ============================================
// File: components/Map/MapControls.jsx
// ============================================
'use client';

import { Box, IconButton, Paper } from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  Add as ZoomInIcon,
  Remove as ZoomOutIcon,
  Traffic as TrafficIcon,
} from '@mui/icons-material';

export const MapControls = ({
  onLocateMe,
  onZoomIn,
  onZoomOut,
  onToggleTraffic,
  showTraffic = false,
  style = {},
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        ...style,
      }}
    >
      <IconButton
        onClick={onLocateMe}
        sx={{
          borderRadius: 0,
          py: 1.5,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <MyLocationIcon />
      </IconButton>

      <Box sx={{ height: 1, bgcolor: 'divider' }} />

      <IconButton
        onClick={onZoomIn}
        sx={{
          borderRadius: 0,
          py: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ZoomInIcon />
      </IconButton>

      <Box sx={{ height: 1, bgcolor: 'divider' }} />

      <IconButton
        onClick={onZoomOut}
        sx={{
          borderRadius: 0,
          py: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <ZoomOutIcon />
      </IconButton>

      {onToggleTraffic && (
        <>
          <Box sx={{ height: 1, bgcolor: 'divider' }} />
          <IconButton
            onClick={onToggleTraffic}
            sx={{
              borderRadius: 0,
              py: 1.5,
              color: showTraffic ? 'primary.main' : 'inherit',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <TrafficIcon />
          </IconButton>
        </>
      )}
    </Paper>
  );
};

export default MapControls;
