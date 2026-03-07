
// ============================================
// File: components/Map/LocationSearch.jsx
// ============================================
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export const LocationSearch = ({
  onSelectLocation,
  placeholder = "Search location",
  autoFocus = false,
  mapControls,
  value,
  onChange,
}) => {
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onChange?.(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!value || value.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    searchTimeout.current = setTimeout(() => {
      if (mapControls) {
        mapControls.searchLocation(value, (results) => {
          setPredictions(results || []);
          setLoading(false);
        });
      }
    }, 300);
  };

  const handleSelectPrediction = (prediction) => {
    if (mapControls) {
      mapControls.getPlaceDetails(prediction.place_id, (location) => {
        if (location) {
          onSelectLocation(location);
          setQuery(location.address);
          setPredictions([]);
          setFocused(false);
        }
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (mapControls) {
      mapControls.getCurrentLocation((location) => {
        if (location) {
          onSelectLocation(location);
          setQuery('Current Location');
          setPredictions([]);
          setFocused(false);
        }
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    onChange?.('');
    setPredictions([]);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon />
              )}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            borderRadius: 2,
          },
        }}
      />

      <AnimatePresence>
        {predictions.length > 0 && focused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                maxHeight: 300,
                overflow: 'auto',
                zIndex: 1000,
                borderRadius: 2,
              }}
            >
              <List sx={{ py: 1 }}>
                <ListItem
                  button
                  onClick={handleUseCurrentLocation}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon>
                    <MyLocationIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Use Current Location"
                    primaryTypographyProps={{
                      fontWeight: 600,
                      color: 'primary.main',
                    }}
                  />
                </ListItem>

                {predictions.map((prediction) => (
                  <ListItem
                    key={prediction.place_id}
                    button
                    onClick={() => handleSelectPrediction(prediction)}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={prediction.main_text}
                      secondary={prediction.secondary_text}
                      primaryTypographyProps={{ fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default LocationSearch;
