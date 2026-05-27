'use client';
// PATH: components/Vehicle/VehicleColorPicker.jsx

import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Paper, Popper, ClickAwayListener,
  InputAdornment, TextField, Chip,
} from '@mui/material';
import { KeyboardArrowDown as ArrowIcon } from '@mui/icons-material';

// ─── Color Palette ─────────────────────────────────────────────────────────────
export const VEHICLE_COLORS = [
  { key: 'white',        label: 'White',         body: '#F8F8F8', dark: '#DCDCDC', window: '#BDE0FE', outline: '#DCDCDC' },
  { key: 'cream',        label: 'Cream White',   body: '#FFF8E7', dark: '#EDE0C4', window: '#BDE0FE', outline: '#E0D0A8' },
  { key: 'beige',        label: 'Beige',         body: '#E8D5B0', dark: '#C8B090', window: '#BDE0FE', outline: '#B89A70' },
  { key: 'light_grey',   label: 'Light Grey',    body: '#D0D0D0', dark: '#ACACAC', window: '#BDE0FE', outline: '#ACACAC' },
  { key: 'silver',       label: 'Silver Grey',   body: '#C0C8D0', dark: '#929DA8', window: '#BDE0FE', outline: '#8898A8' },
  { key: 'dark_grey',    label: 'Dark Grey',     body: '#5A5A5A', dark: '#3A3A3A', window: '#A8C8E0', outline: '#2A2A2A' },
  { key: 'black',        label: 'Black',         body: '#1A1A1A', dark: '#101010', window: '#3A5A70', outline: '#000000' },
  { key: 'light_blue',   label: 'Light Blue',    body: '#7EC8E3', dark: '#4AA8C8', window: '#C8EDFA', outline: '#3898B8' },
  { key: 'dark_blue',    label: 'Dark Blue',     body: '#1A3A6E', dark: '#102848', window: '#5880A8', outline: '#0A1838' },
  { key: 'indigo',       label: 'Indigo',        body: '#3D4FA0', dark: '#2A3878', window: '#8898D8', outline: '#1E2860' },
  { key: 'light_red',    label: 'Light Red',     body: '#F08080', dark: '#D05858', window: '#BDE0FE', outline: '#B04040' },
  { key: 'deep_red',     label: 'Deep Red',      body: '#8B0000', dark: '#5A0000', window: '#A85050', outline: '#400000' },
  { key: 'red',          label: 'Red',           body: '#CC2020', dark: '#981010', window: '#BDE0FE', outline: '#800808' },
  { key: 'pink',         label: 'Pink',          body: '#F4A0C0', dark: '#D07898', window: '#FAD0E0', outline: '#B85880' },
  { key: 'purple',       label: 'Purple',        body: '#7B3FA0', dark: '#582880', window: '#C0A0D8', outline: '#3E1860' },
  { key: 'dark_green',   label: 'Dark Green',    body: '#1A5C1A', dark: '#0E380E', window: '#80B880', outline: '#0A280A' },
  { key: 'light_green',  label: 'Light Green',   body: '#7CCA7C', dark: '#50A050', window: '#C8F0C8', outline: '#38803A' },
  { key: 'dark_yellow',  label: 'Dark Yellow',   body: '#C8A000', dark: '#987800', window: '#BDE0FE', outline: '#785800' },
  { key: 'light_yellow', label: 'Light Yellow',  body: '#FFF176', dark: '#F0D840', window: '#FFFAC8', outline: '#D0B020' },
  { key: 'golden',       label: 'Golden Yellow', body: '#D4A017', dark: '#A07808', window: '#F0D880', outline: '#785808' },
  { key: 'orange',       label: 'Orange',        body: '#E06820', dark: '#B04808', window: '#F8C090', outline: '#883010' },
  { key: 'light_brown',  label: 'Light Brown',   body: '#C8986C', dark: '#A07048', window: '#BDE0FE', outline: '#784828' },
  { key: 'dark_brown',   label: 'Dark Brown',    body: '#5C3010', dark: '#381808', window: '#A07858', outline: '#200800' },
  { key: 'teal',         label: 'Teal',          body: '#008080', dark: '#005858', window: '#80D8D8', outline: '#003838' },
];

export const getColorByKey = (key) =>
  VEHICLE_COLORS.find((c) => c.key === key || c.label.toLowerCase() === key?.toLowerCase())
  ?? VEHICLE_COLORS[0];

// ─── Van SVG ──────────────────────────────────────────────────────────────────
export const VanSVG = ({ colorKey, size = 200 }) => {
  const c = typeof colorKey === 'object' ? colorKey : getColorByKey(colorKey);
  const isLight = ['white', 'cream', 'beige', 'light_grey', 'silver', 'light_yellow', 'cream'].includes(c.key);
  const wheelRim = isLight ? '#555' : '#888';

  return (
    <svg
      width={size}
      height={Math.round(size * 0.58)}
      viewBox="0 0 200 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Ground shadow */}
      <ellipse cx="100" cy="112" rx="88" ry="5" fill="rgba(0,0,0,0.13)" />

      {/* Lower body slab */}
      <rect x="6" y="48" width="188" height="54" rx="8" fill={c.body} />

      {/* Body side shading */}
      <rect x="6" y="48" width="188" height="16" rx="8" fill={c.dark} opacity="0.55" />

      {/* Cab roof / upper body */}
      <path d="M12 48 L20 18 L148 18 L165 48 Z" fill={c.dark} />

      {/* Roof highlight */}
      <path d="M28 19 L140 19 L152 42 L22 42 Z" fill={c.body} opacity="0.5" />

      {/* Windshield */}
      <path d="M26 46 L34 22 L130 22 L144 46 Z" fill={c.window} opacity="0.88" />
      {/* Windshield center divider */}
      <line x1="85" y1="22" x2="85" y2="46" stroke={c.dark} strokeWidth="2" opacity="0.3" />
      {/* Windshield glare */}
      <path d="M34 24 L50 22 L58 38 L36 42 Z" fill="rgba(255,255,255,0.28)" />

      {/* Side windows row */}
      <rect x="22" y="52" width="30" height="18" rx="3" fill={c.window} opacity="0.82" />
      <rect x="58" y="52" width="30" height="18" rx="3" fill={c.window} opacity="0.82" />
      <rect x="94" y="52" width="30" height="18" rx="3" fill={c.window} opacity="0.82" />

      {/* Rear cab area */}
      <rect x="130" y="52" width="58" height="40" rx="4" fill={c.dark} opacity="0.25" />

      {/* Sliding door handle groove */}
      <line x1="22" y1="76" x2="124" y2="76" stroke={c.dark} strokeWidth="1.5" opacity="0.35" />
      <rect x="68" y="72" width="12" height="5" rx="2" fill={c.dark} opacity="0.4" />

      {/* Left headlight cluster */}
      <ellipse cx="16" cy="78" rx="10" ry="7" fill="#FEF3C7" />
      <ellipse cx="16" cy="78" rx="7"  ry="5"  fill="#FEF08A" />
      <ellipse cx="16" cy="78" rx="4"  ry="3"  fill="white" />
      <ellipse cx="20" cy="74" rx="3"  ry="2.5" fill="#FDE68A" opacity="0.7" />

      {/* Right taillight cluster */}
      <ellipse cx="184" cy="78" rx="10" ry="7" fill="#FEE2E2" />
      <ellipse cx="184" cy="78" rx="7"  ry="5"  fill="#FCA5A5" />
      <ellipse cx="184" cy="78" rx="4"  ry="3"  fill="#EF4444" />

      {/* Front bumper */}
      <rect x="4"   y="93" width="40"  height="8" rx="3" fill={c.dark} />
      {/* Rear bumper */}
      <rect x="156" y="93" width="40"  height="8" rx="3" fill={c.dark} />

      {/* Front grille */}
      <rect x="10"  y="83" width="26"  height="7" rx="2" fill={c.dark} opacity="0.8" />
      {[13, 17, 21, 25, 29].map((x) => (
        <rect key={x} x={x} y="84" width="2.5" height="5" rx="1" fill={c.body} opacity="0.6" />
      ))}

      {/* Rear number plate */}
      <rect x="162" y="84" width="28" height="8" rx="1.5" fill="#F8FAFC" />
      <rect x="163.5" y="85.5" width="25" height="5" rx="1" fill="#EFF2F7" />

      {/* Wheels */}
      {/* Front wheel */}
      <circle cx="40"  cy="102" r="14" fill="#1E293B" />
      <circle cx="40"  cy="102" r="10" fill="#334155" />
      <circle cx="40"  cy="102" r="6"  fill={wheelRim} />
      <circle cx="40"  cy="102" r="2.5" fill="#1E293B" />
      {/* Front wheel spokes */}
      {[0,60,120,180,240,300].map((deg) => (
        <line key={deg}
          x1={40 + 3.5 * Math.cos(deg * Math.PI/180)}
          y1={102 + 3.5 * Math.sin(deg * Math.PI/180)}
          x2={40 + 8.5 * Math.cos(deg * Math.PI/180)}
          y2={102 + 8.5 * Math.sin(deg * Math.PI/180)}
          stroke={wheelRim} strokeWidth="1.5" opacity="0.6"
        />
      ))}

      {/* Rear wheel */}
      <circle cx="162" cy="102" r="14" fill="#1E293B" />
      <circle cx="162" cy="102" r="10" fill="#334155" />
      <circle cx="162" cy="102" r="6"  fill={wheelRim} />
      <circle cx="162" cy="102" r="2.5" fill="#1E293B" />
      {[0,60,120,180,240,300].map((deg) => (
        <line key={deg}
          x1={162 + 3.5 * Math.cos(deg * Math.PI/180)}
          y1={102 + 3.5 * Math.sin(deg * Math.PI/180)}
          x2={162 + 8.5 * Math.cos(deg * Math.PI/180)}
          y2={102 + 8.5 * Math.sin(deg * Math.PI/180)}
          stroke={wheelRim} strokeWidth="1.5" opacity="0.6"
        />
      ))}

      {/* Roof rack detail */}
      <rect x="30" y="16" width="110" height="3" rx="1.5" fill={c.dark} opacity="0.5" />
      {[40, 60, 80, 100, 120].map((x) => (
        <rect key={x} x={x} y="14" width="3" height="5" rx="1" fill={c.dark} opacity="0.4" />
      ))}

      {/* Okra logo dot on front grille */}
      <circle cx="22" cy="87" r="2" fill="#22c55e" opacity="0.85" />

      {/* Body crease line */}
      <line x1="8" y1="66" x2="192" y2="66" stroke={c.dark} strokeWidth="1" opacity="0.18" />
    </svg>
  );
};

// ─── Small inline van icon (for tracking page etc.) ───────────────────────────
export const VanIconSmall = ({ colorKey, size = 56 }) => (
  <VanSVG colorKey={colorKey} size={size} />
);

// ─── Color Picker Dropdown ─────────────────────────────────────────────────────
export const VehicleColorPicker = ({ value, onChange, disabled, required, error, helperText }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const selected = getColorByKey(value);

  const handleSelect = (colorKey) => {
    onChange(colorKey);
    setOpen(false);
  };

  return (
    <Box>
      {/* Trigger */}
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <Box>
          <Box
            ref={anchorRef}
            onClick={() => !disabled && setOpen((o) => !o)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              height: 56,
              borderRadius: 1,
              border: '1px solid',
              borderColor: error ? 'error.main' : open ? 'primary.main' : 'rgba(0,0,0,0.23)',
              bgcolor: disabled ? 'action.disabledBackground' : 'background.paper',
              cursor: disabled ? 'not-allowed' : 'pointer',
              boxShadow: open ? '0 0 0 2px rgba(25,118,210,0.2)' : 'none',
              transition: 'all 0.18s ease',
              '&:hover': !disabled ? { borderColor: 'text.primary' } : {},
              position: 'relative',
            }}
          >
            {/* Color swatch circle */}
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: selected?.body,
                border: '2px solid',
                borderColor: selected?.outline,
                flexShrink: 0,
                boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
              }}
            />
            <Typography
              variant="body1"
              sx={{
                flex: 1,
                color: value ? 'text.primary' : 'text.secondary',
                fontSize: '0.95rem',
              }}
            >
              {value ? selected?.label : 'Select Color'}
            </Typography>
            <ArrowIcon
              sx={{
                color: 'text.secondary',
                fontSize: 20,
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
            {/* Floating label */}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: -10,
                left: 10,
                bgcolor: 'background.paper',
                px: 0.5,
                color: error ? 'error.main' : open ? 'primary.main' : 'text.secondary',
                fontSize: '0.72rem',
                lineHeight: 1,
              }}
            >
              Color {required ? ' *' : ''}
            </Typography>
          </Box>

          {/* Dropdown panel */}
          <Popper
            open={open}
            anchorEl={anchorRef.current}
            placement="bottom-start"
            style={{ zIndex: 1400, width: anchorRef.current?.offsetWidth }}
          >
            <Paper
              elevation={8}
              sx={{
                mt: 0.5,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                maxHeight: 320,
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
              }}
            >
              {VEHICLE_COLORS.map((color) => (
                <Box
                  key={color.key}
                  onClick={() => handleSelect(color.key)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.2,
                    cursor: 'pointer',
                    bgcolor: value === color.key ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background 0.14s',
                  }}
                >
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      bgcolor: color.body,
                      border: '2px solid',
                      borderColor: color.outline,
                      flexShrink: 0,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: value === color.key ? 600 : 400 }}>
                    {color.label}
                  </Typography>
                  {value === color.key && (
                    <Box sx={{ ml: 'auto', width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  )}
                </Box>
              ))}
            </Paper>
          </Popper>
        </Box>
      </ClickAwayListener>

      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {/* Big van preview */}
      {value && (
        <Box
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <VanSVG colorKey={value} size={220} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: selected?.body,
                border: '2px solid',
                borderColor: selected?.outline,
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {selected?.label}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};