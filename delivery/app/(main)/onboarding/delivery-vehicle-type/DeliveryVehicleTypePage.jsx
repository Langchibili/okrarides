// PATH: driver/app/(main)/onboarding/delivery-vehicle-type/page.jsx
'use client';
 
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper, Grid, Radio, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  DriveEta as TaxiIcon,
  TwoWheeler as BikeIcon,
  LocalShipping as TruckIcon,
  BikeScooter,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import useDeliveryDriver from '@/lib/hooks/useDeliveryDriver';
 
const VEHICLE_TYPES = [
  {
    type: 'taxi',
    name: 'Car / Taxi',
    icon: <TaxiIcon sx={{ fontSize: 44 }} />,
    description: 'Deliver parcels and documents by car',
    color: '#F59E0B',
  },
  {
    type: 'motorbike',
    name: 'Motorbike',
    icon: <BikeIcon sx={{ fontSize: 44 }} />,
    description: 'Fast deliveries on a motorbike',
    color: '#10B981',
  },
  {
    type: 'motorcycle',
    name: 'Motorcycle',
    icon: <BikeScooter sx={{ fontSize: 44 }} />,
    description: 'Heavier packages on motorcycle',
    color: '#3B82F6',
  },
  {
    type: 'truck',
    name: 'Truck',
    icon: <TruckIcon sx={{ fontSize: 44 }} />,
    description: 'Large or bulk deliveries',
    color: '#8B5CF6',
  },
];
 
export default function DeliveryVehicleTypePage() {
  const { deliveryProfile } = useDeliveryDriver();
  const router   = useRouter();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
 
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading]           = useState(false);
 
  useEffect(() => {
    if (deliveryProfile) {
      const active = deliveryProfile.activeVehicleType;
      if (active && active !== 'none') setSelectedType(active);
    }
  }, [deliveryProfile]);
 
  const handleNext = async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      await apiClient.post('/delivery-driver/onboarding/vehicle-type', { vehicleType: selectedType });
      if(typeof window !== "undefined"){
        localStorage.setItem('onboarding_step_page','/vehicle/add')
      }
      router.push('/vehicle/add');
    } catch (err) {
      console.error('Error saving delivery vehicle type:', err);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <Box sx={{ pt: 4, px: 2, pb: 10 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.75, letterSpacing: -0.3 }}>Delivery Vehicle</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select the type of vehicle you'll use for deliveries
        </Typography>
      </motion.div>
 
      <Grid container spacing={1.5}>
        {VEHICLE_TYPES.map((vehicle, index) => {
          const isSelected = selectedType === vehicle.type;
          return (
            <Grid item xs={12} key={vehicle.type}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paper elevation={0} onClick={() => setSelectedType(vehicle.type)} sx={{
                  p: 2.5, borderRadius: 3.5, cursor: 'pointer',
                  border: `2px solid ${isSelected ? vehicle.color : alpha(isDark ? '#fff' : '#000', isDark ? 0.1 : 0.08)}`,
                  background: isSelected
                    ? isDark
                      ? `linear-gradient(135deg,${alpha(vehicle.color,0.18)} 0%,${alpha(vehicle.color,0.06)} 100%)`
                      : `linear-gradient(135deg,${alpha(vehicle.color,0.1)} 0%,${alpha(vehicle.color,0.04)} 100%)`
                    : isDark ? undefined : 'linear-gradient(145deg,#FFFFFF 0%,#F9FAFB 100%)',
                  boxShadow: isSelected ? `0 4px 20px ${alpha(vehicle.color,0.3)}` : isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: vehicle.color, transform: 'translateY(-2px)' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 72, height: 72, borderRadius: 3, flexShrink: 0,
                      background: isSelected
                        ? `linear-gradient(135deg,${alpha(vehicle.color,isDark?0.3:0.15)} 0%,${alpha(vehicle.color,isDark?0.15:0.08)} 100%)`
                        : isDark ? alpha(vehicle.color,0.12) : alpha(vehicle.color,0.08),
                      border: `1px solid ${alpha(vehicle.color, isSelected ? 0.4 : 0.2)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: vehicle.color,
                      boxShadow: isSelected ? `0 4px 12px ${alpha(vehicle.color,0.3)}` : 'none',
                    }}>
                      {vehicle.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: isSelected ? vehicle.color : 'text.primary' }}>
                        {vehicle.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{vehicle.description}</Typography>
                    </Box>
                    <Radio checked={isSelected} sx={{ flexShrink: 0, color: vehicle.color, '&.Mui-checked': { color: vehicle.color } }} />
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
 
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button variant="outlined" size="large" onClick={() => router.back()} sx={{ height: 56, borderRadius: 3.5, flex: 1, fontWeight: 600 }}>Back</Button>
        <Button variant="contained" size="large" onClick={handleNext} disabled={!selectedType || loading}
          sx={{ height: 56, borderRadius: 3.5, flex: 2, fontWeight: 700, background: 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)', boxShadow: `0 4px 20px ${alpha('#F59E0B',0.4)}` }}>
          {loading ? 'Saving...' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
}
 