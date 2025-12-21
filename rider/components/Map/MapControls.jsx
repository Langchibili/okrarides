// 'use client';

// import { Box, IconButton, Paper } from '@mui/material';
// import {
//   MyLocation as MyLocationIcon,
//   Add as ZoomInIcon,
//   Remove as ZoomOutIcon,
//   Traffic as TrafficIcon,
// } from '@mui/icons-material';
// import { motion } from 'framer-motion';

// export const MapControls = ({
//   onLocateMe,
//   onZoomIn,
//   onZoomOut,
//   onToggleTraffic,
//   showTraffic = false,
//   style = {},
// }) => {
//   return (
//     <Box
//       sx={{
//         position: 'absolute',
//         right: 16,
//         bottom: 120,
//         display: 'flex',
//         flexDirection: 'column',
//         gap: 1,
//         ...style,
//       }}
//     >
//       {/* Locate Me */}
//       <motion.div whileTap={{ scale: 0.9 }}>
//         <Paper elevation={3} sx={{ borderRadius: '50%', overflow: 'hidden' }}>
//           <IconButton
//             onClick={onLocateMe}
//             sx={{
//               width: 48,
//               height: 48,
//               bgcolor: 'background.paper',
//               '&:hover': { bgcolor: 'action.hover' },
//             }}
//           >
//             <MyLocationIcon />
//           </IconButton>
//         </Paper>
//       </motion.div>
      
//       {/* Zoom Controls */}
//       <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
//         <motion.div whileTap={{ scale: 0.9 }}>
//           <IconButton
//             onClick={onZoomIn}
//             sx={{
//               width: 48,
//               height: 48,
//               borderRadius: 0,
//               bgcolor: 'background.paper',
//               '&:hover': { bgcolor: 'action.hover' },
//             }}
//           >
//             <ZoomInIcon />
//           </IconButton>
//         </motion.div>
        
//         <Box sx={{ height: 1, bgcolor: 'divider' }} />
        
//         <motion.div whileTap={{ scale: 0.9 }}>
//           <IconButton
//             onClick={onZoomOut}
//             sx={{
//               width: 48,
//               height: 48,
//               borderRadius: 0,
//               bgcolor: 'background.paper',
//               '&:hover': { bgcolor: 'action.hover' },
//             }}
//           >
//             <ZoomOutIcon />
//           </IconButton>
//         </motion.div>
//       </Paper>
      
//       {/* Traffic Toggle */}
//       <motion.div whileTap={{ scale: 0.9 }}>
//         <Paper elevation={3} sx={{ borderRadius: '50%', overflow: 'hidden' }}>
//           <IconButton
//             onClick={onToggleTraffic}
//             sx={{
//               width: 48,
//               height: 48,
//               bgcolor: showTraffic ? 'primary.main' : 'background.paper',
//               color: showTraffic ? 'primary.contrastText' : 'inherit',
//               '&:hover': {
//                 bgcolor: showTraffic ? 'primary.dark' : 'action.hover',
//               },
//             }}
//           >
//             <TrafficIcon />
//           </IconButton>
//         </Paper>
//       </motion.div>
//     </Box>
//   );
// };


// components/Map/MapControls.jsx - UPDATED
'use client';

import { Box, IconButton, Paper } from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  Add as ZoomInIcon,
  Remove as ZoomOutIcon,
  Traffic as TrafficIcon,
} from '@mui/icons-material';

export const MapControls = ({ onLocateMe, onZoomIn, onZoomOut, onToggleTraffic, showTraffic = false, style = {} }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        ...style,
      }}
    >
      {/* Locate Me */}
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

      {/* Zoom Controls */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
      </Box>

      {/* Traffic Toggle */}
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