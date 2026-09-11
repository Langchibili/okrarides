'use client';
import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import { Box, Typography }     from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha } from '@mui/material/styles';

export default function Error({ error, reset }) {
  const router      = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="help-bar"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0,    opacity: 1 }}
          exit={{   y: -100,  opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30, delay: 0.1 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            height: 100,
            zIndex: 9999,
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          onClick={() => router.push('/help')}
        >
          <Box sx={{
            height: '100%',
            background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
            display: 'flex', alignItems: 'center',
            px: 2.5, gap: 1.5,
            boxShadow: `0 8px 32px ${alpha('#EF4444', 0.5)}`,
            position: 'relative', overflow: 'hidden',
          }}>

            {/* Ambient glow blob */}
            <Box sx={{
              position: 'absolute', top: -20, right: -20,
              width: 120, height: 120, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Pulsing SOS icon */}
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ flexShrink: 0 }}
            >
              <Box sx={{
                width: 42, height: 42, borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.18)',
                border: '2px solid rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                🆘
              </Box>
            </motion.div>

            {/* Text */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1.25 }}>
                Need Help?
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.82), fontSize: 11.5, lineHeight: 1.4, mt: 0.25 }}>
                Something went wrong — tap here to visit the Help Center
              </Typography>
            </Box>

            {/* Animated tap-me chevrons */}
            <motion.div
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                {['›', '›'].map((ch, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
                  >
                    <Typography sx={{
                      fontSize: 22, fontWeight: 900, color: '#fff',
                      lineHeight: 0.75, fontFamily: 'monospace',
                    }}>
                      {ch}
                    </Typography>
                  </motion.div>
                ))}
              </Box>
            </motion.div>

          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}