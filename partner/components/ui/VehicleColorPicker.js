// PATH: components/ui/VehicleColorPicker.js
'use client';
import { Box, Typography } from '@mui/material';
import { VEHICLE_COLORS, getColorByKey } from '@/constants';

export { getColorByKey };

export default function VehicleColorPicker({ value, onChange }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1.5, fontWeight: 600 }}>
        Vehicle Color
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {VEHICLE_COLORS.map((c) => {
          const selected = value === c.key;
          return (
            <Box
              key={c.key}
              onClick={() => onChange(c.key)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                opacity: selected ? 1 : 0.6,
                transition: 'all 0.15s ease',
                '&:hover': { opacity: 1, transform: 'scale(1.05)' },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: c.body,
                  border: selected ? `3px solid #10B981` : `2px solid ${c.outline}`,
                  boxShadow: selected ? '0 0 0 2px rgba(16,185,129,0.4)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
              <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', fontWeight: selected ? 700 : 500 }}>
                {c.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
