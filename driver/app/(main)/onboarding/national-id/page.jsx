// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   Box,
//   Typography,
//   Button,
//   Alert,
//   TextField,
// } from '@mui/material'
// import { motion } from 'framer-motion'
// import { OnboardingProgress } from '@/components/Driver/Onboarding/OnboardingProgress'
// import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard'
// import { uploadDocument } from '@/lib/api/onboarding'

// export default function NationalIdPage() {
//   const router = useRouter()
//   const [idNumber, setIdNumber] = useState('')
//   const [frontImage, setFrontImage] = useState(null)
//   const [backImage, setBackImage] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)

//   const canProceed = idNumber && frontImage && backImage

//   const handleUploadFront = async (file) => {
//     const response = await uploadDocument('national_id_front', file)
//     setFrontImage(response.data)
//   }

//   const handleUploadBack = async (file) => {
//     const response = await uploadDocument('national_id_back', file)
//     setBackImage(response.data)
//   }

//   const handleNext = async () => {
//     if (!canProceed) return

//     setLoading(true)
//     setError(null)

//     try {
//       await fetch('/api/driver/onboarding/national-id', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           idNumber,
//           frontImage: frontImage.id,
//           backImage: backImage.id,
//         }),
//       })

//       router.push('/onboarding/proof-of-address')
//     } catch (err) {
//       setError(err.message || 'Failed to save ID information')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Box sx={{ pt: 4 }}>
//       <OnboardingProgress currentStep="national-id" />

//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//         <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
//           National ID Card
//         </Typography>
//         <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
//           Upload clear photos of both sides of your NRC
//         </Typography>
//       </motion.div>

//       {/* ID Number */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.1 }}
//       >
//         <TextField
//           fullWidth
//           label="NRC Number"
//           value={idNumber}
//           onChange={(e) => setIdNumber(e.target.value)}
//           placeholder="e.g., 123456/78/9"
//           sx={{ mb: 3 }}
//         />
//       </motion.div>

//       {/* Front Image */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.2 }}
//       >
//         <Box sx={{ mb: 3 }}>
//           <DocumentUploadCard
//             title="Front of NRC"
//             description="Take a clear photo of the front side"
//             onUpload={handleUploadFront}
//             uploadedFile={frontImage}
//             onRemove={() => setFrontImage(null)}
//           />
//         </Box>
//       </motion.div>

//       {/* Back Image */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.3 }}
//       >
//         <Box sx={{ mb: 3 }}>
//           <DocumentUploadCard
//             title="Back of NRC"
//             description="Take a clear photo of the back side"
//             onUpload={handleUploadBack}
//             uploadedFile={backImage}
//             onRemove={() => setBackImage(null)}
//           />
//         </Box>
//       </motion.div>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
//           {error}
//         </Alert>
//       )}

//       {/* Navigation */}
//       <Box sx={{ display: 'flex', gap: 2 }}>
//         <Button
//           variant="outlined"
//           size="large"
//           onClick={() => router.back()}
//           sx={{ height: 56, borderRadius: 4, flex: 1 }}
//         >
//           Back
//         </Button>

//         <Button
//           variant="contained"
//           size="large"
//           onClick={handleNext}
//           disabled={!canProceed || loading}
//           sx={{ height: 56, borderRadius: 4, flex: 2 }}
//         >
//           {loading ? 'Saving...' : 'Next'}
//         </Button>
//       </Box>
//     </Box>
//   )
// }


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
import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard'
import { saveNationalIdInfo, uploadDocument } from '@/lib/api/onboarding'
import useDriver from '@/lib/hooks/useDriver' // Added for persistence

export default function NationalIdPage() {
  const router = useRouter()
  const { driverProfile } = useDriver() // Get existing profile data

  const [idNumber, setIdNumber] = useState('')
  const [frontImage, setFrontImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // FIX 1: Persistence - Load existing NRC data from driverProfile
  useEffect(() => {
    if (driverProfile) {
      if (driverProfile.nationalIdNumber) setIdNumber(driverProfile.nationalIdNumber);
      if (driverProfile.nationalIdFront) setFrontImage(driverProfile.nationalIdFront);
      if (driverProfile.nationalIdBack) setBackImage(driverProfile.nationalIdBack);
    }
  }, [driverProfile]);

  const canProceed = idNumber && frontImage && backImage

  const handleUploadFront = async (file) => {
    try {
      const response = await uploadDocument(
        'nationalIdFront', // Ensure this matches your Strapi attribute name
        file,
        'driver-profiles.driver-profile',
        driverProfile.id
      )
      // Strapi usually returns an array for uploads
      setFrontImage(Array.isArray(response) ? response[0] : response)
    } catch (err) {
      setError("Failed to upload front image")
    }
  }

  const handleUploadBack = async (file) => {
    try {
      const response = await uploadDocument(
        'nationalIdBack', // Ensure this matches your Strapi attribute name
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
      // Extract IDs whether they are raw IDs or objects from the upload response
      const frontId = frontImage?.id || frontImage;
      const backId = backImage?.id || backImage;

      saveNationalIdInfo({
          idNumber,
          frontImage: frontId,
          backImage: backId,
      })
      router.push('/onboarding/proof-of-address')
    } catch (err) {
      setError(err.message || 'Failed to save ID information')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ pt: 4 }}>
      <OnboardingProgress currentStep="national-id" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          National ID Card
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Upload clear photos of both sides of your NRC
        </Typography>
      </motion.div>

      {/* ID Number */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <TextField
          fullWidth
          label="NRC Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="e.g., 123456/78/9"
          sx={{ mb: 3 }}
        />
      </motion.div>

      {/* Front Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Box sx={{ mb: 3 }}>
          <DocumentUploadCard
            title="Front of NRC"
            description="Take a clear photo of the front side"
            onUpload={handleUploadFront}
            uploadedFile={frontImage}
            onRemove={() => setFrontImage(null)}
          />
        </Box>
      </motion.div>

      {/* Back Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Box sx={{ mb: 3 }}>
          <DocumentUploadCard
            title="Back of NRC"
            description="Take a clear photo of the back side"
            onUpload={handleUploadBack}
            uploadedFile={backImage}
            onRemove={() => setBackImage(null)}
          />
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', gap: 2 }}>
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