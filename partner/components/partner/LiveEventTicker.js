// PATH: componentsLiveEventTicker.js
'use client';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_COLOR = {
  status: '#6B7280',
  ride_accepted: '#3B82F6',
  trip_started: '#F59E0B',
  trip_completed: '#10B981',
  ride_cancelled: '#EF4444',
  delivery_accepted: '#8B5CF6',
  delivery_completed: '#10B981',
  delivery_cancelled: '#EF4444',
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function LiveEventTicker({ events = [] }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Box
        sx={{
          px: 2.5, py: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '0.8rem', letterSpacing: 0.5 }}>
          Live Fleet Activity
        </Typography>
        <Box
          sx={{
            width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
          }}
        />
      </Box>

      <Box
        sx={{
          maxHeight: 320, overflowY: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {events.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
              Waiting for fleet activity…
            </Typography>
          </Box>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((ev) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                <Box
                  sx={{
                    px: 2.5, py: 1.25,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                    '&:hover': { background: 'rgba(255,255,255,0.03)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, mt: 0.75,
                      bgcolor: TYPE_COLOR[ev.type] ?? '#6B7280',
                      boxShadow: `0 0 6px ${TYPE_COLOR[ev.type] ?? '#6B7280'}`,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>
                      {ev.driverName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>
                      {ev.message}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', flexShrink: 0, mt: 0.25 }}>
                    {formatTime(ev.timestamp)}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
}
