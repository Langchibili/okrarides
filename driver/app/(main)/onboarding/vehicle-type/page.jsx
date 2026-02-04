'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Radio,
} from '@mui/material'
import {
  DriveEta as TaxiIcon,
  DirectionsBus as BusIcon,
  TwoWheeler as BikeIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { OnboardingProgress } from '@/components/Driver/Onboarding/OnboardingProgress'
import { saveVehicleType } from '@/lib/api/onboarding'
import useDriver from '@/lib/hooks/useDriver'

const vehicleTypes = [
  {
    type: 'taxi',
    name: 'Taxi Driver',
    icon: <TaxiIcon sx={{ fontSize: 48 }} />,
    description: 'Drive a car and transport passengers',
    color: '#FFC107',
  },
  {
    type: 'bus',
    name: 'Bus Driver',
    icon: <BusIcon sx={{ fontSize: 48 }} />,
    description: 'Drive a bus on fixed routes',
    color: '#4CAF50',
  },
  {
    type: 'motorbike',
    name: 'Motorbike Rider',
    icon: <BikeIcon sx={{ fontSize: 48 }} />,
    description: 'Ride a motorcycle for quick trips',
    color: '#FF9800',
  },
]

export default function VehicleTypePage() {
  const { driverProfile } = useDriver() // Get existing profile data
  const router = useRouter()
  const [selectedType, setSelectedType] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (driverProfile) {
      if(driverProfile?.taxiDriver?.isActive) setSelectedType('taxi')
      if(driverProfile?.busDriver?.isActive) setSelectedType('bus')
      if(driverProfile?.motorbikeRider?.isActive) setSelectedType('motorbike')
    }
  }, [driverProfile])

  const handleNext = async () => {
    if (!selectedType) return

    setLoading(true)

    try {
      // Save vehicle type selection
      saveVehicleType({ vehicleType: selectedType })

      // router.push('/onboarding/vehicle-details')
      router.push('/vehicle/add')
    } catch (error) {
      console.error('Error saving vehicle type:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ pt: 4 }}>
      <OnboardingProgress currentStep="vehicle-type" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Vehicle Type
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Select the type of vehicle you'll be driving
        </Typography>
      </motion.div>

      <Grid container spacing={2}>
        {vehicleTypes.map((vehicle, index) => (
          <Grid item xs={12} key={vehicle.type}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Paper
                elevation={selectedType === vehicle.type ? 4 : 2}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: 2,
                  borderColor:
                    selectedType === vehicle.type ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
                onClick={() => setSelectedType(vehicle.type)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 3,
                      bgcolor: `${vehicle.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: vehicle.color,
                      flexShrink: 0,
                    }}
                  >
                    {vehicle.icon}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {vehicle.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vehicle.description}
                    </Typography>
                  </Box>

                  <Radio
                    checked={selectedType === vehicle.type}
                    sx={{ flexShrink: 0 }}
                  />
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Navigation */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => router.back()}
          sx={{ height: 56, borderRadius: 4, flex: 1 }}
        >
          Back
        </Button>

        <Button
          variant="contained"
          size="large"
          onClick={handleNext}
          disabled={!selectedType || loading}
          sx={{ height: 56, borderRadius: 4, flex: 2 }}
        >
          {loading ? 'Saving...' : 'Next'}
        </Button>
      </Box>
    </Box>
  )
}

