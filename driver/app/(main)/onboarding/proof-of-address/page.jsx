// // 'use client'

// // import { useState } from 'react'
// // import { useRouter } from 'next/navigation'
// // import {
// //   Box,
// //   Typography,
// //   Button,
// //   Alert,
// //   FormControl,
// //   InputLabel,
// //   Select,
// //   MenuItem,
// //   TextField,
// // } from '@mui/material'
// // import { motion } from 'framer-motion'
// // import { OnboardingProgress } from '@/components/Driver/Onboarding/OnboardingProgress'
// // import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard'
// // import { uploadDocument } from '@/lib/api/onboarding'

// // const documentTypes = [
// //   'Utility Bill (ZESCO/Water)',
// //   'Bank Statement',
// //   'Rental Agreement',
// //   'Council Rates',
// //   'Other',
// // ]

// // export default function ProofOfAddressPage() {
// //   const router = useRouter()
// //   const [documentType, setDocumentType] = useState('')
// //   const [address, setAddress] = useState('')
// //   const [document, setDocument] = useState(null)
// //   const [loading, setLoading] = useState(false)
// //   const [error, setError] = useState(null)

// //   const canProceed = documentType && address && document

// //   const handleUpload = async (file) => {
// //     const response = await uploadDocument('proof_of_address', file)
// //     setDocument(response.data)
// //   }

// //   const handleNext = async () => {
// //     if (!canProceed) return

// //     setLoading(true)
// //     setError(null)

// //     try {
// //       await fetch('/api/driver/onboarding/proof-of-address', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({
// //           documentType,
// //           address,
// //           document: document.id,
// //         }),
// //       })

// //       router.push('/onboarding/vehicle-type')
// //     } catch (err) {
// //       setError(err.message || 'Failed to save address information')
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   return (
// //     <Box sx={{ pt: 4 }}>
// //       <OnboardingProgress currentStep="proof-of-address" />

// //       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
// //         <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
// //           Proof of Address
// //         </Typography>
// //         <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
// //           Upload a document showing your current residential address
// //         </Typography>
// //       </motion.div>

// //       {/* Document Type */}
// //       <motion.div
// //         initial={{ opacity: 0, y: 20 }}
// //         animate={{ opacity: 1, y: 0 }}
// //         transition={{ delay: 0.1 }}
// //       >
// //         <FormControl fullWidth sx={{ mb: 2 }}>
// //           <InputLabel>Document Type</InputLabel>
// //           <Select
// //             value={documentType}
// //             onChange={(e) => setDocumentType(e.target.value)}
// //             label="Document Type"
// //           >
// //             {documentTypes.map((type) => (
// //               <MenuItem key={type} value={type}>
// //                 {type}
// //               </MenuItem>
// //             ))}
// //           </Select>
// //         </FormControl>
// //       </motion.div>

// //       {/* Address */}
// //       <motion.div
// //         initial={{ opacity: 0, y: 20 }}
// //         animate={{ opacity: 1, y: 0 }}
// //         transition={{ delay: 0.2 }}
// //       >
// //         <TextField
// //           fullWidth
// //           multiline
// //           rows={3}
// //           label="Residential Address"
// //           value={address}
// //           onChange={(e) => setAddress(e.target.value)}
// //           placeholder="Enter your full residential address"
// //           sx={{ mb: 3 }}
// //         />
// //       </motion.div>

// //       {/* Document Upload */}
// //       <motion.div
// //         initial={{ opacity: 0, y: 20 }}
// //         animate={{ opacity: 1, y: 0 }}
// //         transition={{ delay: 0.3 }}
// //       >
// //         <DocumentUploadCard
// //           title="Upload Document"
// //           description="Document must be dated within the last 3 months"
// //           onUpload={handleUpload}
// //           uploadedFile={document}
// //           onRemove={() => setDocument(null)}
// //         />
// //       </motion.div>

// //       {error && (
// //         <Alert severity="error" sx={{ mt: 3, borderRadius: 3 }}>
// //           {error}
// //         </Alert>
// //       )}

// //       <Alert severity="info" sx={{ mt: 3, mb: 3, borderRadius: 3 }}>
// //         <Typography variant="caption">
// //           Document must show your name and current address clearly
// //         </Typography>
// //       </Alert>

// //       {/* Navigation */}
// //       <Box sx={{ display: 'flex', gap: 2 }}>
// //         <Button
// //           variant="outlined"
// //           size="large"
// //           onClick={() => router.back()}
// //           sx={{ height: 56, borderRadius: 4, flex: 1 }}
// //         >
// //           Back
// //         </Button>

// //         <Button
// //           variant="contained"
// //           size="large"
// //           onClick={handleNext}
// //           disabled={!canProceed || loading}
// //           sx={{ height: 56, borderRadius: 4, flex: 2 }}
// //         >
// //           {loading ? 'Saving...' : 'Next'}
// //         </Button>
// //       </Box>
// //     </Box>
// //   )
// // }

// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   Box,
//   Typography,
//   Button,
//   Alert,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   TextField,
// } from '@mui/material'
// import { motion } from 'framer-motion'
// import { OnboardingProgress } from '@/components/Driver/Onboarding/OnboardingProgress'
// import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard'
// import { saveProofOfAddress, uploadDocument } from '@/lib/api/onboarding'
// import useDriver from '@/lib/hooks/useDriver' // Added for persistence
// import { useAuth } from '@/lib/hooks/useAuth' // Added if address is on the user object

// const documentTypes = [
//   'Utility Bill (ZESCO/Water)',
//   'Bank Statement',
//   'Rental Agreement',
//   'Council Rates',
//   'Other',
// ]

// export default function ProofOfAddressPage() {
//   const router = useRouter()
//   const { user } = useAuth()
//   const { driverProfile } = useDriver()

//   const [documentType, setDocumentType] = useState('')
//   const [address, setAddress] = useState('')
//   const [document, setDocument] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)

//   // FIX 1: Persistence - Load existing address data
//   useEffect(() => {
//     // If address is on the driverProfile component
//     if (driverProfile) {
//       if (driverProfile.addressType) setDocumentType(driverProfile.addressType);
//       if (driverProfile.proofOfAddress) setDocument(driverProfile.proofOfAddress);
//     }
//     // If the textual address is stored on the root user object (referencing your schema)
//     if (user?.address) {
//       setAddress(user.address);
//     }
//   }, [driverProfile, user]);

//   const canProceed = documentType && address && document

//   const handleUpload = async (file) => {
//     try {
//       const response = await uploadDocument(
//         'proofOfAddress', // Verify this field name in your Strapi component
//         file,
//         'driver-profiles.driver-profile',
//         driverProfile.id
//       )
//       // Strapi upload returns an array
//       setDocument(Array.isArray(response) ? response[0] : response)
//     } catch (err) {
//       setError("Failed to upload document")
//     }
//   }

//   const handleNext = async () => {
//     if (!canProceed) return

//     setLoading(true)
//     setError(null)

//     try {
//       // Safely get the ID from the file object
//       const documentId = document?.id || document;
//       saveProofOfAddress({
//           documentType,
//           address,
//           document: documentId
//       })

//       router.push('/onboarding/vehicle-type')
//     } catch (err) {
//       setError(err.message || 'Failed to save address information')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Box sx={{ pt: 4 }}>
//       <OnboardingProgress currentStep="proof-of-address" />

//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//         <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
//           Proof of Address
//         </Typography>
//         <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
//           Upload a document showing your current residential address
//         </Typography>
//       </motion.div>

//       {/* Document Type */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.1 }}
//       >
//         <FormControl fullWidth sx={{ mb: 2 }}>
//           <InputLabel>Document Type</InputLabel>
//           <Select
//             value={documentType}
//             onChange={(e) => setDocumentType(e.target.value)}
//             label="Document Type"
//           >
//             {documentTypes.map((type) => (
//               <MenuItem key={type} value={type}>
//                 {type}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//       </motion.div>

//       {/* Address */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.2 }}
//       >
//         <TextField
//           fullWidth
//           multiline
//           rows={3}
//           label="Residential Address"
//           value={address}
//           onChange={(e) => setAddress(e.target.value)}
//           placeholder="Enter your full residential address"
//           sx={{ mb: 3 }}
//         />
//       </motion.div>

//       {/* Document Upload */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.3 }}
//       >
//         <DocumentUploadCard
//           title="Upload Document"
//           description="Document must be dated within the last 3 months"
//           onUpload={handleUpload}
//           uploadedFile={document}
//           onRemove={() => setDocument(null)}
//         />
//       </motion.div>

//       {error && (
//         <Alert severity="error" sx={{ mt: 3, borderRadius: 3 }}>
//           {error}
//         </Alert>
//       )}

//       <Alert severity="info" sx={{ mt: 3, mb: 3, borderRadius: 3 }}>
//         <Typography variant="caption">
//           Document must show your name and current address clearly
//         </Typography>
//       </Alert>

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