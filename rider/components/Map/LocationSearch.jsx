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
import { debounce } from '@/Functions';

export const LocationSearch = ({
  onSelectLocation,
  placeholder = "Search location",
  autoFocus = false,
  currentLocation = null,
}) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  
  // Initialize Google Places services
  useEffect(() => {
    if (window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
    }
  }, []);
  
  // Debounced search
  const debouncedSearch = useRef(
    debounce((value) => {
      if (!value || value.length < 3) {
        setPredictions([]);
        return;
      }
      
      if (!autocompleteService.current) return;
      
      setLoading(true);
      
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: 'zm' },
          types: ['geocode', 'establishment'],
        },
        (results, status) => {
          setLoading(false);
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 300)
  ).current;
  
  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };
  
  // Handle location selection
  const handleSelectPrediction = (prediction) => {
    if (!placesService.current) return;
    
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address', 'name'],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address,
            name: place.name,
            placeId: prediction.place_id,
          };
          
          onSelectLocation(location);
          setQuery(place.formatted_address);
          setPredictions([]);
        }
      }
    );
  };
  
  // Use current location
  const handleUseCurrentLocation = () => {
    if (!currentLocation) return;
    
    onSelectLocation({
      ...currentLocation,
      address: 'Current Location',
    });
    setQuery('Current Location');
    setPredictions([]);
  };
  
  // Clear input
  const handleClear = () => {
    setQuery('');
    setPredictions([]);
  };
  
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Search Input */}
      <TextField
        fullWidth
        value={query}
        onChange={handleInputChange}
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
            boxShadow: 2,
          },
        }}
      />
      
      {/* Predictions Dropdown */}
      <AnimatePresence>
        {(predictions.length > 0 || currentLocation) && (
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
                top: '100%',
                left: 0,
                right: 0,
                mt: 1,
                maxHeight: 300,
                overflow: 'auto',
                zIndex: 1000,
                borderRadius: 3,
              }}
            >
              <List>
                {/* Current Location Option */}
                {currentLocation && (
                  <ListItem
                    button
                    onClick={handleUseCurrentLocation}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
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
                )}
                
                {/* Predictions */}
                {predictions.map((prediction) => (
                  <ListItem
                    key={prediction.place_id}
                    button
                    onClick={() => handleSelectPrediction(prediction)}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={prediction.structured_formatting.main_text}
                      secondary={prediction.structured_formatting.secondary_text}
                      primaryTypographyProps={{
                        fontWeight: 500,
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                      }}
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
