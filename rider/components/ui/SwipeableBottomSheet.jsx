// components/ui/SwipeableBottomSheet.jsx
'use client';

import { useState, useRef } from 'react';
import { Box, Paper } from '@mui/material';
import { motion, useDragControls } from 'framer-motion';

const SwipeableBottomSheet = ({
  children,
  open = true,
  onClose,
  initialHeight = 400,
  maxHeight = 600,
  minHeight = 200,
}) => {
  const [height, setHeight] = useState(initialHeight);
  const dragControls = useDragControls();
  const sheetRef = useRef(null);

  const handleDrag = (event, info) => {
    const newHeight = Math.max(minHeight, Math.min(maxHeight, height - info.delta.y));
    setHeight(newHeight);
  };

  const handleDragEnd = () => {
    // Snap to nearest height
    if (height < minHeight + 50) {
      setHeight(minHeight);
    } else if (height > maxHeight - 50) {
      setHeight(maxHeight);
    } else {
      setHeight(initialHeight);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      ref={sheetRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: `${height}px`,
      }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <Paper
        sx={{
          height: '100%',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
        }}
      >
        {/* Drag Handle */}
        <Box
          sx={{
            py: 1.5,
            display: 'flex',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
          onPointerDown={(e) => {
            dragControls.start(e);
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'divider',
            }}
          />
        </Box>

        {/* Content */}
        <motion.div
          drag="y"
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{
            flex: 1,
            overflow: 'hidden',
            touchAction: 'pan-y',
          }}
        >
          <Box sx={{ height: '100%', overflow: 'auto', pb: 2 }}>
            {children}
          </Box>
        </motion.div>
      </Paper>
    </motion.div>
  );
};

export default SwipeableBottomSheet;