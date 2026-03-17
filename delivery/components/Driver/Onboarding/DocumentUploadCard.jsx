import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Description as FileIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '@/Functions'

export const DocumentUploadCard = ({
  title,
  description,
  acceptedFormats = 'image/*,application/pdf',
  maxSize = 10, // MB
  onUpload,
  uploadedFile,
  onRemove,
}) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // Get preview URL based on file type
  const previewUrl = useMemo(() => {
    if (!uploadedFile) return null
    
    console.log('Uploaded file in DocumentUploadCard:', uploadedFile)
    
    // If it's a File object (new upload)
    if (uploadedFile instanceof File) {
      return URL.createObjectURL(uploadedFile)
    }
    
    // If it's a Strapi media object with url
    if (uploadedFile.url) {
      // If it's a relative URL, prepend with Strapi URL
      return process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_API_URL+getImageUrl(uploadedFile,'thumbnail')
    }
    
    // If it's just an ID (from the initial load), we might need to fetch it
    // But for now, return null and rely on the parent to pass the full object
    return null
  }, [uploadedFile])

  // Sync with uploadedFile prop
  useEffect(() => {
    if (uploadedFile) {
      setFile(uploadedFile)
    }
  }, [uploadedFile])

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (uploadedFile instanceof File && previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [uploadedFile, previewUrl])

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    setError(null)
    setFile(selectedFile)
    setUploading(true)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Upload file
      await onUpload(selectedFile)

      clearInterval(interval)
      setUploadProgress(100)
      setTimeout(() => setUploading(false), 500)
    } catch (err) {
      setError(err.message || 'Upload failed')
      setUploading(false)
      setFile(null)
      setUploadProgress(0)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setUploadProgress(0)
    setError(null)
    if (onRemove) onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // Get file name from different object types
  const getFileName = () => {
    if (!file) return ''
    if (file instanceof File) return file.name
    if (file.name) return file.name
    if (file.originalFilename) return file.originalFilename
    return 'Uploaded file'
  }

  // Get file size from different object types
  const getFileSize = () => {
    if (!file) return 0
    if (file instanceof File) return file.size
    if (file.size) return file.size
    return 0
  }

  // Check if file is an image
  const isImage = () => {
    if (!file) return false
    if (file instanceof File) return file.type.startsWith('image/')
    if (file.mime) return file.mime.startsWith('image/')
    if (file.url) return /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url)
    return false
  }

  return (
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
      {/* ── Header band ─────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          background: error
            ? 'linear-gradient(135deg, rgba(211,47,47,0.08) 0%, rgba(211,47,47,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(255,140,0,0.1) 0%, rgba(255,193,7,0.06) 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            flexShrink: 0,
            mt: 0.25,
            background: error
              ? 'rgba(211,47,47,0.12)'
              : 'linear-gradient(135deg, rgba(255,140,0,0.2) 0%, rgba(255,193,7,0.14) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileIcon
            sx={{
              fontSize: 18,
              color: error ? 'error.main' : '#FF8C00',
            }}
          />
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

      {/* ── Body ────────────────────────────────────────────────────── */}
      <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>

        {/* Upload / Uploaded area */}
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Box
                onClick={handleClick}
                sx={{
                  border: '2px dashed',
                  borderColor: error ? 'error.main' : 'rgba(255,140,0,0.3)',
                  borderRadius: 3,
                  p: 3.5,
                  textAlign: 'center',
                  cursor: 'pointer',
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
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    mx: 'auto',
                    mb: 1.5,
                    background: error
                      ? 'rgba(211,47,47,0.1)'
                      : 'linear-gradient(135deg, rgba(255,140,0,0.15) 0%, rgba(255,193,7,0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UploadIcon
                    sx={{
                      fontSize: 26,
                      color: error ? 'error.main' : '#FF8C00',
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.4 }}>
                  Click to upload
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  PDF · JPG · PNG &nbsp;·&nbsp; Max {maxSize} MB
                </Typography>
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
                  borderRadius: 3,
                  p: 2,
                  background: uploading
                    ? 'linear-gradient(135deg, rgba(255,140,0,0.07) 0%, rgba(255,193,7,0.04) 100%)'
                    : 'linear-gradient(135deg, rgba(46,125,50,0.07) 0%, rgba(76,175,80,0.04) 100%)',
                  transition: 'all 0.25s ease',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {/* Thumbnail / Icon */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      flexShrink: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: uploading
                        ? 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)'
                        : 'linear-gradient(135deg, #388E3C 0%, #4CAF50 100%)',
                      boxShadow: uploading
                        ? '0 3px 10px rgba(255,140,0,0.3)'
                        : '0 3px 10px rgba(46,125,50,0.25)',
                      position: 'relative',
                    }}
                  >
                    {!uploading && isImage() && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
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
                        color: 'text.disabled',
                        flexShrink: 0,
                        '&:hover': { color: 'error.main', bgcolor: 'rgba(211,47,47,0.08)' },
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {/* Progress bar */}
                {uploading && (
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      mt: 1.5,
                      height: 5,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,140,0,0.12)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #FF8C00, #FFC107)',
                        borderRadius: 3,
                      },
                    }}
                  />
                )}

                {/* Full image preview */}
                {!uploading && isImage() && previewUrl && (
                  <Box
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      textAlign: 'center',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        display: 'block',
                        margin: '0 auto',
                      }}
                    />
                  </Box>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Choose File button */}
        {!file && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleClick}
            sx={{
              mt: 2,
              height: 46,
              borderRadius: 2.5,
              fontWeight: 700,
              borderColor: 'rgba(255,140,0,0.4)',
              color: '#FF8C00',
              '&:hover': {
                borderColor: '#FF8C00',
                bgcolor: 'rgba(255,140,0,0.05)',
              },
              transition: 'all 0.18s ease',
            }}
          >
            Choose File
          </Button>
        )}
      </Box>
    </Box>
  )
}