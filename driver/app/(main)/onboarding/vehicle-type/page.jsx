'use client';
// PATH: app/(main)/onboarding/vehicle-type/page.jsx — UI POLISH ONLY
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper, Grid, Radio, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DriveEta as TaxiIcon, DirectionsBus as BusIcon, TwoWheeler as BikeIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { OnboardingProgress } from '@/components/Driver/Onboarding/OnboardingProgress';
import { saveVehicleType } from '@/lib/api/onboarding';
import useDriver from '@/lib/hooks/useDriver';

const vehicleTypes = [
  { type: 'taxi',      name: 'Taxi Driver',      icon: <TaxiIcon sx={{ fontSize: 44 }} />, description: 'Drive a car and transport passengers', color: '#10B981' },
  { type: 'bus',       name: 'Bus Driver',        icon: <BusIcon  sx={{ fontSize: 44 }} />, description: 'Drive a bus on fixed routes',          color: '#3B82F6' },
  { type: 'motorbike', name: 'Motorbike Rider',   icon: <BikeIcon sx={{ fontSize: 44 }} />, description: 'Ride a motorcycle for quick trips',     color: '#F59E0B' },
];

export default function VehicleTypePage() {
  const { driverProfile } = useDriver();
  const router = useRouter();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driverProfile) {
      if (driverProfile?.taxiDriver?.isActive)     setSelectedType('taxi');
      if (driverProfile?.busDriver?.isActive)      setSelectedType('bus');
      if (driverProfile?.motorbikeRider?.isActive) setSelectedType('motorbike');
    }
  }, [driverProfile]);

  const handleNext = async () => {
    if (!selectedType) return;
    setLoading(true);
    try { 
      saveVehicleType({ vehicleType: selectedType })
      if(typeof window !== "undefined"){
        localStorage.setItem('onboarding_step_page','/vehicle/add')
      }
      router.push('/vehicle/add')
    }
    catch (error) { console.error('Error saving vehicle type:', error); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ pt: 4 }}>
      <OnboardingProgress currentStep="vehicle-type" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.75, letterSpacing: -0.3 }}>Vehicle Type</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Select the type of vehicle you'll be driving</Typography>
      </motion.div>

      <Grid container spacing={1.5}>
        {vehicleTypes.map((vehicle, index) => {
          const isSelected = selectedType === vehicle.type;
          return (
            <Grid item xs={12} key={vehicle.type}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} whileTap={{ scale: 0.98 }}>
                <Paper elevation={0} onClick={() => setSelectedType(vehicle.type)} sx={{
                  p: 2.5, borderRadius: 3.5, cursor: 'pointer',
                  border: `2px solid ${isSelected ? vehicle.color : alpha(isDark ? '#fff' : '#000', isDark ? 0.1 : 0.08)}`,
                  background: isSelected
                    ? isDark
                      ? `linear-gradient(135deg, ${alpha(vehicle.color, 0.18)} 0%, ${alpha(vehicle.color, 0.06)} 100%)`
                      : `linear-gradient(135deg, ${alpha(vehicle.color, 0.1)} 0%, ${alpha(vehicle.color, 0.04)} 100%)`
                    : isDark ? undefined : 'linear-gradient(145deg, #FFFFFF 0%, #F9FAFB 100%)',
                  boxShadow: isSelected
                    ? `0 4px 20px ${alpha(vehicle.color, 0.3)}`
                    : isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: vehicle.color,
                    boxShadow: `0 6px 24px ${alpha(vehicle.color, 0.25)}`,
                    transform: 'translateY(-2px)',
                  },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 72, height: 72, borderRadius: 3, flexShrink: 0,
                      background: isSelected
                        ? `linear-gradient(135deg, ${alpha(vehicle.color, isDark ? 0.3 : 0.15)} 0%, ${alpha(vehicle.color, isDark ? 0.15 : 0.08)} 100%)`
                        : isDark ? alpha(vehicle.color, 0.12) : alpha(vehicle.color, 0.08),
                      border: `1px solid ${alpha(vehicle.color, isSelected ? 0.4 : 0.2)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: vehicle.color,
                      boxShadow: isSelected ? `0 4px 12px ${alpha(vehicle.color, 0.3)}` : 'none',
                    }}>
                      {vehicle.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: -0.2, color: isSelected ? vehicle.color : 'text.primary' }}>
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
        <Button variant="outlined" size="large" onClick={() => router.back()}
          sx={{ height: 56, borderRadius: 3.5, flex: 1, fontWeight: 600 }}>Back</Button>
        <Button variant="contained" size="large" onClick={handleNext} disabled={!selectedType || loading}
          sx={{ height: 56, borderRadius: 3.5, flex: 2, fontWeight: 700,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow: `0 4px 20px ${alpha('#10B981', 0.4)}`,
          }}>
          {loading ? 'Saving...' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
}