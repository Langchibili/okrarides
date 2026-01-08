'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Paper,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  DriveEta as CarIcon,
  Description as DocumentIcon,
  CreditCard as CardIcon,
  Home as HomeIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const [starting, setStarting] = useState(false)

  const requirements = [
    {
      icon: <CardIcon />,
      title: "Driver's License",
      description: 'Valid Zambian driver\'s license',
    },
    {
      icon: <DocumentIcon />,
      title: 'National ID',
      description: 'Your national identification card',
    },
    {
      icon: <HomeIcon />,
      title: 'Address',
      description: 'Your current residential address',
    },
    {
      icon: <CarIcon />,
      title: 'Vehicle Information',
      description: 'Vehicle registration and details',
    },
    {
      icon: <TimerIcon />,
      title: 'Time Needed',
      description: '10-15 minutes to complete',
    },
  ]

  const handleStart = () => {
    setStarting(true)
    router.push('/onboarding/license')
  }

  return (
    <Box sx={{ pt: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <CarIcon sx={{ fontSize: 50, color: 'primary.dark' }} />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Become a Driver
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Start earning with OkraRides
          </Typography>
        </Box>
      </motion.div>

      {/* Rejection Alert */}
      {status === 'rejected' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            Your previous application was rejected. Please review your documents and try again.
          </Alert>
        </motion.div>
      )}

      {/* Requirements Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            What You'll Need
          </Typography>

          <List disablePadding>
            {requirements.map((req, index) => (
              <Box key={index}>
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 48 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.dark',
                      }}
                    >
                      {req.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={req.title}
                    secondary={req.description}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      variant: 'body1',
                    }}
                    secondaryTypographyProps={{
                      variant: 'body2',
                    }}
                  />
                </ListItem>
                {index < requirements.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      </motion.div>

      {/* Benefits Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            bgcolor: 'success.light',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Why Drive with Us?
          </Typography>

          <List disablePadding>
            {[
              'Flexible schedule - work when you want',
              'Competitive earnings with zero commission',
              'Weekly payouts',
              '24/7 support',
              'Free training and onboarding',
            ].map((benefit, index) => (
              <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon sx={{ color: 'success.dark', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={benefit}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </motion.div>

      {/* Important Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Verification usually takes 24-48 hours
          </Typography>
          <Typography variant="caption">
            We'll notify you once your application is reviewed
          </Typography>
        </Alert>
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            <strong>Please note that all the identity, licence and address information collected here are for verification purposes only, and are never shown to any other user but you.</strong>
          </Typography>
        </Alert>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleStart}
          disabled={starting}
          sx={{
            height: 56,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 4,
          }}
        >
          {starting ? 'Starting...' : 'Get Started'}
        </Button>
      </motion.div>
    </Box>
  )
}

