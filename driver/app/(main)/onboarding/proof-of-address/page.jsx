//Okrarides\driver\app\(main)\onboarding\proof-of-address\page.jsx
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
import { useAuth } from '@/lib/hooks/useAuth' 

export default function ProofOfAddressPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load existing address if available
  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user]);

  // Simple validation: Ensure address is not empty
  const canProceed = address && address.trim().length > 5

  const handleNext = async () => {
    if (!canProceed) return

    setLoading(true)
    setError(null)

    try {
      // We only send the address string now
      await saveProofOfAddress({
          address: address,
          // We send null or omit the document fields as the backend handles optional updates
          documentType: null,
          document: null
      })

      router.push('/onboarding/vehicle-type')
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
          Residential Address
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Please enter your current residential address details.
        </Typography>
      </motion.div>

      {/* Address Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TextField
          fullWidth
          multiline
          rows={4} // Made slightly taller since it's the only field
          label="Full Residential Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House No, Street Name, Area, City"
          sx={{ mb: 3 }}
          variant="outlined"
        />
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mt: 3, mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

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
          disabled={!canProceed || loading}
          sx={{ height: 56, borderRadius: 4, flex: 2 }}
        >
          {loading ? 'Saving...' : 'Next'}
        </Button>
      </Box>
    </Box>
  )
}