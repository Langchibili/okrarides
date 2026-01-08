'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '@/lib/hooks/useAuth'

export default function SetupDriverPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    // Check if user is authenticated
    if (!user) {
      router.push('')
      return
    }

    // Check driver profile status
    const driverProfile = user.driverProfile

    // If no driver profile, start onboarding
    if (!driverProfile || driverProfile.verificationStatus === 'not_started') {
      router.push('/onboarding/welcome')
      return
    }

    // If verification is pending, show pending screen
    if (driverProfile.verificationStatus === 'pending') {
      router.push('/onboarding/pending')
      return
    }

    // If approved, go to dashboard
    if (driverProfile.verificationStatus === 'approved') {
      router.push('/home')
      return
    }

    // If rejected, go to welcome with error message
    if (driverProfile.verificationStatus === 'rejected') {
      router.push('/onboarding/welcome?status=rejected')
      return
    }

    // Default: start onboarding
    router.push('/onboarding/welcome')
  }, [user, loading, router])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="body1" color="text.secondary">
        Loading...
      </Typography>
    </Box>
  )
}

