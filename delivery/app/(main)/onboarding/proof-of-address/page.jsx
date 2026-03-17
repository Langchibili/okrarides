// OkraRides/driver/app/(main)/onboarding/proof-of-address/page.jsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Alert,
  TextField,
} from '@mui/material'
import { motion } from 'framer-motion'
import { OnboardingProgress } from '@/components/Driver/Onboarding/OnboardingProgress'
import { saveProofOfAddress } from '@/lib/api/onboarding'
import { uploadDocument } from '@/lib/api/onboarding'          // ← added
import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard' // ← added
import { useAuth } from '@/lib/hooks/useAuth'

export default function ProofOfAddressPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [address, setAddress] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)   // ← new
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load existing data
  useEffect(() => {
    if (user?.address) setAddress(user.address)
    if (user?.profilePicture) setProfilePicture(user.profilePicture)
  }, [user])

  // Both address AND profile picture must be present
  const canProceed = address && address.trim().length > 5 && profilePicture

  // Upload handler for profile picture (uses user.id)
  const handleUploadProfilePicture = async (file) => {
    try {
      const response = await uploadDocument(
        'profilePicture',           // field name in User model
        file,
        'plugin::users-permissions.user',                    // Strapi collection
        user.id                     // user ID from permissions plugin
      )
      setProfilePicture(Array.isArray(response) ? response[0] : response)
    } catch (err) {
      setError('Failed to upload profile picture')
    }
  }

  const handleNext = async () => {
    if (!canProceed) return

    setLoading(true)
    setError(null)

    try {
      await saveProofOfAddress({
        address: address.trim(),
        documentType: null,
        document: null,
      })

      router.push('/onboarding/delivery-vehicle-type')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to save address information')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ pt: 4 }}>
      <OnboardingProgress currentStep="proof-of-address" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Residential Address & Profile Picture
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Please enter your current residential address and upload a clear profile photo.
        </Typography>
      </motion.div>

      {/* Address Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Full Residential Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House No, Street Name, Area, City"
          sx={{ mb: 4 }}
          variant="outlined"
        />
      </motion.div>

      {/* Profile Picture Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <DocumentUploadCard
          title="Profile Picture"
          description="Upload a clear photo of yourself (required)"
          acceptedFormats="image/*"
          maxSize={5}
          onUpload={handleUploadProfilePicture}
          uploadedFile={profilePicture}
          onRemove={() => setProfilePicture(null)}
        />
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mt: 3, mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', gap: 2, mt: 5 }}>
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
          disabled={!canProceed || loading}
          sx={{ height: 56, borderRadius: 4, flex: 2 }}
        >
          {loading ? 'Saving...' : 'Next'}
        </Button>
      </Box>
    </Box>
  )
}