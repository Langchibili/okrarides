'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, Button, Alert, TextField } from '@mui/material'
import { motion } from 'framer-motion'
import { OnboardingProgress } from '@/components/Driver/Onboarding/OnboardingProgress'
import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard'
import { saveLicenseInfo, uploadDocument } from '@/lib/api/onboarding'
import { useAuth } from '@/lib/hooks/useAuth'
import useDriver from '@/lib/hooks/useDriver'

export default function LicensePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { loading, driverProfile } = useDriver()
  const [licenseNumber, setLicenseNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [frontImage, setFrontImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [loadingNext, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // FIX 1: Persistence - Load existing data from driverProfile on mount
  useEffect(() => {
    if (driverProfile) {
      if (driverProfile.driverLicenseNumber) setLicenseNumber(driverProfile.driverLicenseNumber);
      if (driverProfile.licenseExpiryDate) setExpiryDate(driverProfile.licenseExpiryDate);
      // Strapi components return media as objects. Ensure DocumentUploadCard handles objects.
      if (driverProfile.driverLicenseFront) setFrontImage(driverProfile.driverLicenseFront);
      if (driverProfile.driverLicenseBack) setBackImage(driverProfile.driverLicenseBack);
    }
  }, [driverProfile])

  const canProceed = licenseNumber && expiryDate && frontImage && backImage

  const handleUploadFront = async (file) => {
    try {
      const response = await uploadDocument(
        'driverLicenseFront',
        file,
        'driver-profiles.driver-profile',
        driverProfile.id
      )
      // FIX 2: Corrected setter (was setBackImage)
      setFrontImage(Array.isArray(response) ? response[0] : response)
    } catch (err) {
      setError("Failed to upload front image")
    }
  }

  const handleUploadBack = async (file) => {
    try {
      const response = await uploadDocument(
        'driverLicenseBack',
        file,
        'driver-profiles.driver-profile',
        driverProfile.id
      )
      setBackImage(Array.isArray(response) ? response[0] : response)
    } catch (err) {
      setError("Failed to upload back image")
    }
  }

  const handleNext = async () => {
    if (!canProceed) return
    setLoading(true)
    setError(null)

    try {
      // Pass the IDs. We check if it's the raw object from profile or the upload response.
      const frontId = frontImage?.id || frontImage;
      const backId = backImage?.id || backImage;
      const response = await saveLicenseInfo({
          licenseNumber,
          expiryDate,
          frontImage: frontId,
          backImage: backId,
        })
      console.log('response',response)  
      // await fetch('/api/driver/onboarding/license', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     licenseNumber,
      //     expiryDate,
      //     frontImage: frontId,
      //     backImage: backId,
      //   }),
      // })

      router.push('/onboarding/national-id')
    } catch (err) {
      setError(err.message || 'Failed to save license information')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ pt: 4 }}>
      <OnboardingProgress currentStep="license" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Driver's License
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Upload clear photos of both sides of your driver's license
        </Typography>
      </motion.div>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="License Number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
          placeholder="e.g., DL123456789"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          type="date"
          label="Expiry Date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: new Date().toISOString().split('T')[0] }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <DocumentUploadCard
          title="Front of License"
          description="Take a clear photo of the front side"
          onUpload={handleUploadFront}
          uploadedFile={frontImage}
          onRemove={() => setFrontImage(null)}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <DocumentUploadCard
          title="Back of License"
          description="Take a clear photo of the back side"
          onUpload={handleUploadBack}
          uploadedFile={backImage}
          onRemove={() => setBackImage(null)}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
      
      {/* Important Note */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
        <Typography variant="caption">
          Make sure the license number and expiry date are clearly visible in the photos
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" size="large" onClick={() => router.back()} sx={{ height: 56, borderRadius: 4, flex: 1 }}>
          Back
        </Button>

        {loading? null : <Button
          variant="contained"
          size="large"
          onClick={handleNext}
          disabled={!canProceed || loadingNext}
          sx={{ height: 56, borderRadius: 4, flex: 2 }}
        >
          {loadingNext ? 'Saving...' : 'Next'}
        </Button>}
      </Box>
    </Box>
  )
}