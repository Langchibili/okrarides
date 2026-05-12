// import { useState, useRef, useEffect, useMemo } from 'react'
// import {
//   Box,
//   Paper,
//   Typography,
//   Button,
//   IconButton,
//   LinearProgress,
//   Alert,
// } from '@mui/material'
// import {
//   CloudUpload as UploadIcon,
//   CheckCircle as CheckIcon,
//   Error as ErrorIcon,
//   Close as CloseIcon,
//   Description as FileIcon,
//   Image as ImageIcon,
// } from '@mui/icons-material'
// import { motion, AnimatePresence } from 'framer-motion'
// import { getImageUrl } from '@/Functions'

// export const DocumentUploadCard = ({
//   title,
//   description,
//   acceptedFormats = 'image/*,application/pdf',
//   maxSize = 10, // MB
//   onUpload,
//   uploadedFile,
//   onRemove,
// }) => {
//   const [file, setFile] = useState(null)
//   const [uploading, setUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [error, setError] = useState(null)
//   const fileInputRef = useRef(null)

//   // Get preview URL based on file type
//   const previewUrl = useMemo(() => {
//     if (!uploadedFile) return null

//     console.log('Uploaded file in DocumentUploadCard:', uploadedFile)

//     // If it's a File object (new upload)
//     if (uploadedFile instanceof File) {
//       return URL.createObjectURL(uploadedFile)
//     }

//     // If it's a Strapi media object with url
//     if (uploadedFile.url) {
//       // If it's a relative URL, prepend with Strapi URL
//       return process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL+getImageUrl(uploadedFile,'thumbnail')
//     }

//     // If it's just an ID (from the initial load), we might need to fetch it
//     // But for now, return null and rely on the parent to pass the full object
//     return null
//   }, [uploadedFile])

//   // Sync with uploadedFile prop
//   useEffect(() => {
//     if (uploadedFile) {
//       setFile(uploadedFile)
//     }
//   }, [uploadedFile])

//   // Clean up object URLs
//   useEffect(() => {
//     return () => {
//       if (uploadedFile instanceof File && previewUrl) {
//         URL.revokeObjectURL(previewUrl)
//       }
//     }
//   }, [uploadedFile, previewUrl])

//   const handleFileSelect = async (event) => {
//     const selectedFile = event.target.files[0]
//     if (!selectedFile) return

//     // Validate file size
//     if (selectedFile.size > maxSize * 1024 * 1024) {
//       setError(`File size must be less than ${maxSize}MB`)
//       return
//     }

//     setError(null)
//     setFile(selectedFile)
//     setUploading(true)

//     try {
//       // Simulate upload progress
//       const interval = setInterval(() => {
//         setUploadProgress((prev) => {
//           if (prev >= 90) {
//             clearInterval(interval)
//             return prev
//           }
//           return prev + 10
//         })
//       }, 200)

//       // Upload file
//       await onUpload(selectedFile)

//       clearInterval(interval)
//       setUploadProgress(100)
//       setTimeout(() => setUploading(false), 500)
//     } catch (err) {
//       setError(err.message || 'Upload failed')
//       setUploading(false)
//       setFile(null)
//       setUploadProgress(0)
//     }
//   }

//   const handleRemove = () => {
//     setFile(null)
//     setUploadProgress(0)
//     setError(null)
//     if (onRemove) onRemove()
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ''
//     }
//   }

//   const handleClick = () => {
//     fileInputRef.current?.click()
//   }

//   // Get file name from different object types
//   const getFileName = () => {
//     if (!file) return ''
//     if (file instanceof File) return file.name
//     if (file.name) return file.name
//     if (file.originalFilename) return file.originalFilename
//     return 'Uploaded file'
//   }

//   // Get file size from different object types
//   const getFileSize = () => {
//     if (!file) return 0
//     if (file instanceof File) return file.size
//     if (file.size) return file.size
//     return 0
//   }

//   // Check if file is an image
//   const isImage = () => {
//     if (!file) return false
//     if (file instanceof File) return file.type.startsWith('image/')
//     if (file.mime) return file.mime.startsWith('image/')
//     if (file.url) return /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url)
//     return false
//   }

//   return (
//     <Box
//       sx={{
//         borderRadius: 3.5,
//         overflow: 'hidden',
//         border: '1px solid',
//         borderColor: error ? 'error.main' : 'divider',
//         transition: 'box-shadow 0.22s ease, border-color 0.22s ease',
//         '&:hover': {
//           boxShadow: error
//             ? '0 4px 20px rgba(211,47,47,0.12)'
//             : '0 4px 20px rgba(255,140,0,0.1)',
//         },
//       }}
//     >
//       {/* ── Header band ─────────────────────────────────────────────── */}
//       <Box
//         sx={{
//           px: 2.5,
//           py: 2,
//           background: error
//             ? 'linear-gradient(135deg, rgba(211,47,47,0.08) 0%, rgba(211,47,47,0.04) 100%)'
//             : 'linear-gradient(135deg, rgba(255,140,0,0.1) 0%, rgba(255,193,7,0.06) 100%)',
//           borderBottom: '1px solid',
//           borderColor: 'divider',
//           display: 'flex',
//           alignItems: 'flex-start',
//           gap: 1.5,
//         }}
//       >
//         <Box
//           sx={{
//             width: 36,
//             height: 36,
//             borderRadius: '50%',
//             flexShrink: 0,
//             mt: 0.25,
//             background: error
//               ? 'rgba(211,47,47,0.12)'
//               : 'linear-gradient(135deg, rgba(255,140,0,0.2) 0%, rgba(255,193,7,0.14) 100%)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//         >
//           <FileIcon
//             sx={{
//               fontSize: 18,
//               color: error ? 'error.main' : '#FF8C00',
//             }}
//           />
//         </Box>
//         <Box>
//           <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25, mb: 0.3 }}>
//             {title}
//           </Typography>
//           <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4, display: 'block' }}>
//             {description}
//           </Typography>
//         </Box>
//       </Box>

//       {/* ── Body ────────────────────────────────────────────────────── */}
//       <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>

//         {/* Upload / Uploaded area */}
//         <AnimatePresence mode="wait">
//           {!file ? (
//             <motion.div
//               key="upload"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//             >
//               <Box
//                 onClick={handleClick}
//                 sx={{
//                   border: '2px dashed',
//                   borderColor: error ? 'error.main' : 'rgba(255,140,0,0.3)',
//                   borderRadius: 3,
//                   p: 3.5,
//                   textAlign: 'center',
//                   cursor: 'pointer',
//                   transition: 'all 0.2s ease',
//                   '&:hover': {
//                     borderColor: error ? 'error.dark' : '#FF8C00',
//                     bgcolor: error ? 'rgba(211,47,47,0.03)' : 'rgba(255,140,0,0.04)',
//                     transform: 'translateY(-1px)',
//                   },
//                   '&:active': { transform: 'translateY(0)' },
//                 }}
//               >
//                 <Box
//                   sx={{
//                     width: 52,
//                     height: 52,
//                     borderRadius: '50%',
//                     mx: 'auto',
//                     mb: 1.5,
//                     background: error
//                       ? 'rgba(211,47,47,0.1)'
//                       : 'linear-gradient(135deg, rgba(255,140,0,0.15) 0%, rgba(255,193,7,0.1) 100%)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <UploadIcon
//                     sx={{
//                       fontSize: 26,
//                       color: error ? 'error.main' : '#FF8C00',
//                     }}
//                   />
//                 </Box>
//                 <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.4 }}>
//                   Click to upload
//                 </Typography>
//                 <Typography variant="caption" sx={{ color: 'text.disabled' }}>
//                   PDF · JPG · PNG &nbsp;·&nbsp; Max {maxSize} MB
//                 </Typography>
//               </Box>
//             </motion.div>
//           ) : (
//             <motion.div
//               key="uploaded"
//               initial={{ opacity: 0, scale: 0.97 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.97 }}
//               transition={{ duration: 0.18 }}
//             >
//               <Box
//                 sx={{
//                   border: '1.5px solid',
//                   borderColor: uploading ? 'rgba(255,140,0,0.4)' : 'rgba(46,125,50,0.35)',
//                   borderRadius: 3,
//                   p: 2,
//                   background: uploading
//                     ? 'linear-gradient(135deg, rgba(255,140,0,0.07) 0%, rgba(255,193,7,0.04) 100%)'
//                     : 'linear-gradient(135deg, rgba(46,125,50,0.07) 0%, rgba(76,175,80,0.04) 100%)',
//                   transition: 'all 0.25s ease',
//                 }}
//               >
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                   {/* Thumbnail / Icon */}
//                   <Box
//                     sx={{
//                       width: 48,
//                       height: 48,
//                       borderRadius: 2,
//                       flexShrink: 0,
//                       overflow: 'hidden',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       background: uploading
//                         ? 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)'
//                         : 'linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)',
//                       boxShadow: uploading
//                         ? '0 3px 10px rgba(255,140,0,0.3)'
//                         : '0 3px 10px rgba(46,125,50,0.25)',
//                       position: 'relative',
//                     }}
//                   >
//                     {!uploading && isImage() && previewUrl ? (
//                       <img
//                         src={previewUrl}
//                         alt="Preview"
//                         style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//                       />
//                     ) : uploading ? (
//                       <FileIcon sx={{ color: 'white', fontSize: 22 }} />
//                     ) : (
//                       <CheckIcon sx={{ color: 'white', fontSize: 22 }} />
//                     )}
//                   </Box>

//                   <Box sx={{ flex: 1, minWidth: 0 }}>
//                     <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
//                       {getFileName()}
//                     </Typography>
//                     <Typography variant="caption" sx={{ color: 'text.disabled' }}>
//                       {uploading
//                         ? `Uploading… ${uploadProgress}%`
//                         : getFileSize() > 0
//                         ? `${(getFileSize() / 1024 / 1024).toFixed(2)} MB · Uploaded`
//                         : 'Uploaded'}
//                     </Typography>
//                   </Box>

//                   {!uploading && (
//                     <IconButton
//                       size="small"
//                       onClick={handleRemove}
//                       sx={{
//                         color: 'text.disabled',
//                         flexShrink: 0,
//                         '&:hover': { color: 'error.main', bgcolor: 'rgba(211,47,47,0.08)' },
//                         transition: 'all 0.15s ease',
//                       }}
//                     >
//                       <CloseIcon fontSize="small" />
//                     </IconButton>
//                   )}
//                 </Box>

//                 {/* Progress bar */}
//                 {uploading && (
//                   <LinearProgress
//                     variant="determinate"
//                     value={uploadProgress}
//                     sx={{
//                       mt: 1.5,
//                       height: 5,
//                       borderRadius: 3,
//                       bgcolor: 'rgba(255,140,0,0.12)',
//                       '& .MuiLinearProgress-bar': {
//                         background: 'linear-gradient(90deg, #FF8C00, #FFC107)',
//                         borderRadius: 3,
//                       },
//                     }}
//                   />
//                 )}

//                 {/* Full image preview */}
//                 {!uploading && isImage() && previewUrl && (
//                   <Box
//                     sx={{
//                       mt: 2,
//                       borderRadius: 2,
//                       overflow: 'hidden',
//                       border: '1px solid',
//                       borderColor: 'divider',
//                       textAlign: 'center',
//                     }}
//                   >
//                     <img
//                       src={previewUrl}
//                       alt="Document preview"
//                       style={{
//                         maxWidth: '100%',
//                         maxHeight: 200,
//                         display: 'block',
//                         margin: '0 auto',
//                       }}
//                     />
//                   </Box>
//                 )}
//               </Box>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Error message */}
//         {error && (
//           <Alert
//             severity="error"
//             icon={<ErrorIcon />}
//             sx={{ mt: 2, borderRadius: 2.5 }}
//             onClose={() => setError(null)}
//           >
//             {error}
//           </Alert>
//         )}

//         {/* Hidden file input */}
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept={acceptedFormats}
//           style={{ display: 'none' }}
//           onChange={handleFileSelect}
//         />

//         {/* Choose File button */}
//         {!file && (
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<UploadIcon />}
//             onClick={handleClick}
//             sx={{
//               mt: 2,
//               height: 46,
//               borderRadius: 2.5,
//               fontWeight: 700,
//               borderColor: 'rgba(255,140,0,0.4)',
//               color: '#FF8C00',
//               '&:hover': {
//                 borderColor: '#FF8C00',
//                 bgcolor: 'rgba(255,140,0,0.05)',
//               },
//               transition: 'all 0.18s ease',
//             }}
//           >
//             Choose File
//           </Button>
//         )}
//       </Box>
//     </Box>
//   )
// }

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Dialog,
  DialogContent,
  Fab,
  Tooltip,
  Fade,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Description as FileIcon,
  CameraAlt as CameraIcon,
  FiberManualRecord as CaptureIcon,
  Cameraswitch as SwitchCameraIcon,
  FlipCameraIos as FlipIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '@/Functions'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compress an image File/Blob to stay under `maxSizeMB`.
 * Pure browser — no external library needed.
 */
async function compressImage(file, maxSizeMB = 2, maxDimension = 1920) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Iteratively reduce quality until under maxSizeMB
      let quality = 0.85
      const step = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas toBlob failed'))
            if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.2) {
              const compressed = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })
              resolve(compressed)
            } else {
              quality -= 0.1
              step()
            }
          },
          'image/jpeg',
          quality,
        )
      }
      step()
    }

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

// ─── In-Browser Camera Modal ─────────────────────────────────────────────────

const CameraModal = ({ open, onClose, onCapture }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [facingMode, setFacingMode] = useState('environment') // 'user' | 'environment'
  const [ready, setReady] = useState(false)
  const [flash, setFlash] = useState(false)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [camError, setCamError] = useState(null)

  // Start / restart stream whenever facingMode changes (or modal opens)
  const startStream = useCallback(async (facing) => {
    // Tear down any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setReady(false)
    setCamError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }

      // Detect if device has >1 camera so we can show the flip button
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter((d) => d.kind === 'videoinput')
      setHasMultipleCameras(videoInputs.length > 1)
    } catch (err) {
      setCamError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : `Camera error: ${err.message}`,
      )
    }
  }, [])

  useEffect(() => {
    if (open) startStream(facingMode)
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps — intentional: only on open/close

  const handleFlipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startStream(next)
  }

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !ready) return

    // Flash feedback
    setFlash(true)
    setTimeout(() => setFlash(false), 200)

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const raw = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
      // Compress before handing off — modern phone photos can be 5–15 MB
      const compressed = await compressImage(raw, 2, 1920)
      onCapture(compressed)
      onClose()
    }, 'image/jpeg', 0.92)
  }, [ready, onCapture, onClose])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      TransitionComponent={Fade}
      PaperProps={{ sx: { bgcolor: '#000', m: 0 } }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Close */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            color: 'white', bgcolor: 'rgba(0,0,0,0.45)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Camera error */}
        {camError ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CameraIcon sx={{ fontSize: 56, color: 'grey.600', mb: 2 }} />
            <Typography color="grey.400" variant="body2">{camError}</Typography>
          </Box>
        ) : (
          <>
            {/* Viewfinder */}
            <Box
              component="video"
              ref={videoRef}
              autoPlay
              playsInline
              muted
              sx={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                transition: 'opacity 0.3s',
                opacity: ready ? 1 : 0,
              }}
            />

            {/* Capture flash overlay */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  key="flash"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'white',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Corner guides */}
            {ready && (
              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
                {[
                  { top: '12%', left: '8%', borderTop: '3px solid', borderLeft: '3px solid' },
                  { top: '12%', right: '8%', borderTop: '3px solid', borderRight: '3px solid' },
                  { bottom: '22%', left: '8%', borderBottom: '3px solid', borderLeft: '3px solid' },
                  { bottom: '22%', right: '8%', borderBottom: '3px solid', borderRight: '3px solid' },
                ].map((style, i) => (
                  <Box key={i} sx={{ position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.7)', ...style }} />
                ))}
              </Box>
            )}

            {/* Controls row */}
            <Box
              sx={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                pb: 5, pt: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                zIndex: 3,
              }}
            >
              {/* Flip camera */}
              {hasMultipleCameras && (
                <Tooltip title="Flip camera">
                  <IconButton
                    onClick={handleFlipCamera}
                    sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.12)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
                  >
                    <FlipIcon />
                  </IconButton>
                </Tooltip>
              )}

              {/* Shutter */}
              <Fab
                onClick={handleCapture}
                disabled={!ready}
                sx={{
                  width: 72, height: 72,
                  bgcolor: 'white',
                  border: '4px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 0 0 6px rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'grey.100', transform: 'scale(1.05)' },
                  '&:active': { transform: 'scale(0.96)' },
                  transition: 'all 0.15s ease',
                  '&.Mui-disabled': { bgcolor: 'grey.700' },
                }}
              >
                <CaptureIcon sx={{ fontSize: 30, color: ready ? '#FF8C00' : 'grey.500' }} />
              </Fab>

              {/* Spacer to balance the flip button */}
              {hasMultipleCameras && <Box sx={{ width: 40, height: 40 }} />}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'documentUploadCard_pendingState'

export const DocumentUploadCard = ({
  title,
  description,
  acceptedFormats = 'image/*,application/pdf',
  maxSize = 10, // MB
  onUpload,
  uploadedFile,
  onRemove,
  /** Unique key per card so localStorage doesn't collide between multiple instances */
  storageKey = STORAGE_KEY,
}) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraSupported, setCameraSupported] = useState(false)
  const fileInputRef = useRef(null)

  // ── Detect camera support (getUserMedia) ──────────────────────────────────
  useEffect(() => {
    setCameraSupported(
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia,
    )
  }, [])

  // ── Restore any in-flight state saved before a native camera switch ───────
  // (Fallback for browsers/devices that don't support getUserMedia)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        sessionStorage.removeItem(storageKey)
        // Parent form state restoration can be handled here if needed
      }
    } catch (_) { }
  }, [storageKey])

  // ── Preview URL ───────────────────────────────────────────────────────────
  const previewUrl = useMemo(() => {
    if (!uploadedFile) return null
    if (uploadedFile instanceof File) return URL.createObjectURL(uploadedFile)
    if (uploadedFile.url) {
      return process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL + getImageUrl(uploadedFile, 'thumbnail')
    }
    return null
  }, [uploadedFile])

  useEffect(() => {
    if (uploadedFile) setFile(uploadedFile)
  }, [uploadedFile])

  // Revoke object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (uploadedFile instanceof File && previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [uploadedFile, previewUrl])

  // ── Upload helper (shared by file picker + camera capture) ───────────────
  const processFile = useCallback(async (selectedFile) => {
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize} MB`)
      return
    }

    setError(null)
    setFile(selectedFile)
    setUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((p) => (p >= 90 ? p : p + 10))
    }, 200)

    try {
      // Compress images before upload (handles camera & gallery photos)
      const toUpload = selectedFile.type.startsWith('image/')
        ? await compressImage(selectedFile, Math.min(maxSize, 2))
        : selectedFile

      await onUpload(toUpload)
      clearInterval(interval)
      setUploadProgress(100)
      setTimeout(() => setUploading(false), 500)
    } catch (err) {
      clearInterval(interval)
      setError(err.message || 'Upload failed')
      setUploading(false)
      setFile(null)
      setUploadProgress(0)
    }
  }, [maxSize, onUpload])

  const handleFileSelect = (e) => {
    const f = e.target.files[0]
    if (f) processFile(f)
  }

  const handleCameraCapture = useCallback((capturedFile) => {
    processFile(capturedFile)
  }, [processFile])

  const handleRemove = () => {
    setFile(null)
    setUploadProgress(0)
    setError(null)
    onRemove?.()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Derived file metadata ─────────────────────────────────────────────────
  const getFileName = () => {
    if (!file) return ''
    if (file instanceof File) return file.name
    return file.name || file.originalFilename || 'Uploaded file'
  }

  const getFileSize = () => {
    if (!file) return 0
    return file instanceof File ? file.size : (file.size ?? 0)
  }

  const isImage = () => {
    if (!file) return false
    if (file instanceof File) return file.type.startsWith('image/')
    if (file.mime) return file.mime.startsWith('image/')
    if (file.url) return /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url)
    return false
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── In-browser camera (keeps browser in foreground → no OS kill) ── */}
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <Box
        sx={{
          borderRadius: 3.5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: error ? 'error.main' : 'divider',
          transition: 'box-shadow 0.22s ease, border-color 0.22s ease',
          '&:hover': {
            boxShadow: error
              ? '0 4px 20px rgba(211,47,47,0.12)'
              : '0 4px 20px rgba(255,140,0,0.1)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5, py: 2,
            background: error
              ? 'linear-gradient(135deg, rgba(211,47,47,0.08) 0%, rgba(211,47,47,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(255,140,0,0.1) 0%, rgba(255,193,7,0.06) 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex', alignItems: 'flex-start', gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0, mt: 0.25,
              background: error
                ? 'rgba(211,47,47,0.12)'
                : 'linear-gradient(135deg, rgba(255,140,0,0.2) 0%, rgba(255,193,7,0.14) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <FileIcon sx={{ fontSize: 18, color: error ? 'error.main' : '#FF8C00' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25, mb: 0.3 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4, display: 'block' }}>
              {description}
            </Typography>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Drop zone */}
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: '2px dashed',
                    borderColor: error ? 'error.main' : 'rgba(255,140,0,0.3)',
                    borderRadius: 3, p: 3.5, textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: error ? 'error.dark' : '#FF8C00',
                      bgcolor: error ? 'rgba(211,47,47,0.03)' : 'rgba(255,140,0,0.04)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': { transform: 'translateY(0)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 52, height: 52, borderRadius: '50%', mx: 'auto', mb: 1.5,
                      background: error
                        ? 'rgba(211,47,47,0.1)'
                        : 'linear-gradient(135deg, rgba(255,140,0,0.15) 0%, rgba(255,193,7,0.1) 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 26, color: error ? 'error.main' : '#FF8C00' }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.4 }}>
                    Click to upload
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    PDF · JPG · PNG &nbsp;·&nbsp; Max {maxSize} MB
                  </Typography>
                </Box>

                {/* Action buttons */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      height: 46, borderRadius: 2.5, fontWeight: 700,
                      borderColor: 'rgba(255,140,0,0.4)', color: '#FF8C00',
                      '&:hover': { borderColor: '#FF8C00', bgcolor: 'rgba(255,140,0,0.05)' },
                      transition: 'all 0.18s ease',
                    }}
                  >
                    Choose File
                  </Button>

                  {/* Camera button — only shown when getUserMedia is available */}
                  {cameraSupported && (
                    <Tooltip title="Take photo with camera">
                      <Button
                        variant="outlined"
                        onClick={() => setCameraOpen(true)}
                        sx={{
                          height: 46, minWidth: 52, px: 1.5, borderRadius: 2.5,
                          borderColor: 'rgba(255,140,0,0.4)', color: '#FF8C00',
                          '&:hover': { borderColor: '#FF8C00', bgcolor: 'rgba(255,140,0,0.05)' },
                          transition: 'all 0.18s ease',
                          flexShrink: 0,
                        }}
                      >
                        <CameraIcon />
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </motion.div>
            ) : (
              <motion.div
                key="uploaded"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                <Box
                  sx={{
                    border: '1.5px solid',
                    borderColor: uploading ? 'rgba(255,140,0,0.4)' : 'rgba(46,125,50,0.35)',
                    borderRadius: 3, p: 2,
                    background: uploading
                      ? 'linear-gradient(135deg, rgba(255,140,0,0.07) 0%, rgba(255,193,7,0.04) 100%)'
                      : 'linear-gradient(135deg, rgba(46,125,50,0.07) 0%, rgba(76,175,80,0.04) 100%)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 48, height: 48, borderRadius: 2, flexShrink: 0,
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: uploading
                          ? 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)'
                          : 'linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)',
                        boxShadow: uploading
                          ? '0 3px 10px rgba(255,140,0,0.3)'
                          : '0 3px 10px rgba(46,125,50,0.25)',
                      }}
                    >
                      {!uploading && isImage() && previewUrl ? (
                        <img src={previewUrl} alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : uploading ? (
                        <FileIcon sx={{ color: 'white', fontSize: 22 }} />
                      ) : (
                        <CheckIcon sx={{ color: 'white', fontSize: 22 }} />
                      )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                        {getFileName()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {uploading
                          ? `Uploading… ${uploadProgress}%`
                          : getFileSize() > 0
                            ? `${(getFileSize() / 1024 / 1024).toFixed(2)} MB · Uploaded`
                            : 'Uploaded'}
                      </Typography>
                    </Box>

                    {!uploading && (
                      <IconButton
                        size="small"
                        onClick={handleRemove}
                        sx={{
                          color: 'text.disabled', flexShrink: 0,
                          '&:hover': { color: 'error.main', bgcolor: 'rgba(211,47,47,0.08)' },
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  {uploading && (
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                      sx={{
                        mt: 1.5, height: 5, borderRadius: 3,
                        bgcolor: 'rgba(255,140,0,0.12)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #FF8C00, #FFC107)',
                          borderRadius: 3,
                        },
                      }}
                    />
                  )}

                  {!uploading && isImage() && previewUrl && (
                    <Box
                      sx={{
                        mt: 2, borderRadius: 2, overflow: 'hidden',
                        border: '1px solid', borderColor: 'divider', textAlign: 'center',
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt="Document preview"
                        style={{ maxWidth: '100%', maxHeight: 200, display: 'block', margin: '0 auto' }}
                      />
                    </Box>
                  )}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <Alert
              severity="error"
              icon={<ErrorIcon />}
              sx={{ mt: 2, borderRadius: 2.5 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Hidden native file input (no capture="" attr → avoids native camera switch) */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </Box>
      </Box>
    </>
  )
}