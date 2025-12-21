// components/Rider/LocationChipInput.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Chip,
  InputAdornment,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Close as CloseIcon,
  Navigation as NavigationIcon,
  Place as PlaceIcon,
} from '@mui/icons-material';

export const LocationChipInput = ({
  label,
  value,
  onChange,
  onClear,
  icon,
  placeholder,
  currentLocation = null,
  onUseCurrentLocation,
  predictions = [],
  loadingPredictions = false,
  onSelectPrediction,
  showSearchResults = false,
  onFocus,
  active = false,
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleUseCurrentLocation = () => {
    if (onUseCurrentLocation) {
      onUseCurrentLocation();
    }
  };

  const hasValue = value && value !== 'Current Location';

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onFocus={onFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ ml: 0, mr: 1 }}>
              {hasValue ? (
                <Chip
                  label={value.length > 20 ? `${value.substring(0, 20)}...` : value}
                  onDelete={handleClear}
                  size="small"
                  sx={{
                    maxWidth: 180,
                    height: 32,
                    '& .MuiChip-label': {
                      px: 1.5,
                      py: 0.5,
                    },
                    '& .MuiChip-deleteIcon': {
                      fontSize: 16,
                      ml: 0.5,
                    },
                  }}
                  deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {icon}
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      color: active ? 'primary.main' : 'text.secondary',
                      fontWeight: active ? 600 : 400,
                      fontSize: '0.875rem',
                    }}
                  >
                    {label}
                  </Box>
                </Box>
              )}
            </InputAdornment>
          ),
          endAdornment: localValue ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                sx={{ mr: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: {
            height: 56,
            '& .MuiInputBase-input': {
              paddingLeft: hasValue ? 0 : 1,
              fontSize: '0.875rem',
              fontWeight: 500,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: active ? 'primary.main' : 'divider',
              borderWidth: active ? 2 : 1,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: active ? 'primary.main' : 'text.secondary',
            },
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: active ? 'action.selected' : 'background.paper',
            pl: hasValue ? 0.5 : 2,
          },
        }}
      />
    </Box>
  );
};

export default LocationChipInput;