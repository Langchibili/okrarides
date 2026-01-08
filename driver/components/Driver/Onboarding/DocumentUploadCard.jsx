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

export const DocumentUploadCard = ({
  title,
  description,
  acceptedFormats = 'image/*,application/pdf',
  maxSize = 5, // MB
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
      // Handle both absolute and relative URLs
      const url = uploadedFile.url
      if (url.startsWith('http')) {
        return url
      }
      // If it's a relative URL, prepend with Strapi URL
      const baseUrl = process.env.NEXT_UPLOAD_PUBLIC_API_URL || 'http://localhost:1343'
      return `${baseUrl}${url}`
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
    
    if (file instanceof File) {
      return file.name
    }
    
    // Strapi media object
    if (file.name) return file.name
    if (file.originalFilename) return file.originalFilename
    
    return 'Uploaded file'
  }

  // Get file size from different object types
  const getFileSize = () => {
    if (!file) return 0
    
    if (file instanceof File) {
      return file.size
    }
    
    // Strapi media object
    if (file.size) return file.size
    
    return 0
  }

  // Check if file is an image
  const isImage = () => {
    if (!file) return false
    
    if (file instanceof File) {
      return file.type.startsWith('image/')
    }
    
    // Strapi media object - check by URL extension or mime
    if (file.mime) {
      return file.mime.startsWith('image/')
    }
    if (file.url) {
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url)
    }
    
    return false
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 4,
        border: error ? 2 : 0,
        borderColor: 'error.main',
      }}
    >
      {/* Header */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>

      {/* Upload Area */}
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
                border: 2,
                borderStyle: 'dashed',
                borderColor: error ? 'error.main' : 'divider',
                borderRadius: 3,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: error ? 'error.dark' : 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <UploadIcon
                sx={{
                  fontSize: 48,
                  color: error ? 'error.main' : 'action.active',
                  mb: 2,
                }}
              />
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Click to upload
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PDF, JPG, PNG (Max {maxSize}MB)
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Box
              sx={{
                border: 2,
                borderColor: uploading ? 'primary.main' : 'success.main',
                borderRadius: 3,
                p: 2,
                bgcolor: uploading ? 'primary.light' : 'success.light',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Thumbnail/Icon */}
                {uploading ? (
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileIcon sx={{ color: 'white' }} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isImage() && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <CheckIcon sx={{ color: 'white' }} />
                    )}
                  </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                    noWrap
                  >
                    {getFileName()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getFileSize() > 0 ? `${(getFileSize() / 1024 / 1024).toFixed(2)} MB` : 'Uploaded'}
                  </Typography>
                </Box>

                {!uploading && (
                  <IconButton size="small" onClick={handleRemove}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {uploading && (
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{ mt: 2, height: 6, borderRadius: 3 }}
                />
              )}

              {/* Image Preview (full size for images) */}
              {!uploading && isImage() && previewUrl && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                    }}
                  />
                </Box>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          sx={{ mt: 2, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Upload Button (Alternative) */}
      {!file && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleClick}
          sx={{ mt: 2, height: 48, borderRadius: 3 }}
        >
          Choose File
        </Button>
      )}
    </Paper>
  )
}