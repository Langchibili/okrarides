//Okrarides\driver\app\(main)\vehicle\add\page.jsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  MenuItem,
  IconButton,
  Alert,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
  Autocomplete,
   Snackbar
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
  DirectionsCar as CarIcon,
  CalendarToday as CalendarIcon,
  ConfirmationNumber as PlateIcon,
  EventSeat as SeatsIcon,
} from '@mui/icons-material'
import { DocumentUploadCard } from '@/components/Driver/Onboarding/DocumentUploadCard'
import {
  addVehicle,
  updateVehicle,
  getVehicleDetails,
  getVehicleMakesAndModels,
  getAllowedVehicleYears,
  getDriverVehicle,
  submitForVerification
} from '@/lib/api/vehicle'
import { uploadDocument } from '@/lib/api/onboarding'
import { VEHICLE_TYPE } from '@/Constants'
import { useDriver } from '@/lib/hooks/useDriver'
import { useAdminSettings } from '@/lib/hooks/useAdminSettings'
import { VehicleColorPicker, getColorByKey } from '@/components/ui/VehicleColorPicker'

/* ─────────────────────────────────────────────────────────────────────────────
   Tiny layout helpers – plain CSS, no MUI Grid
───────────────────────────────────────────────────────────────────────────── */
const fieldStyles = {
  '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
}

const monoFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    fontFamily: 'monospace',
    fontWeight: 700,
    letterSpacing: 1,
  },
}

/** Full-width field wrapper */
const FullRow = ({ children }) => (
  <div style={{ width: '100%' }}>{children}</div>
)

/** Two equal columns, collapses to 1 on narrow screens */
const TwoCol = ({ children }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
    }}
    className="two-col-grid"
  >
    {children}
  </div>
)

/** Two equal columns for vehicle-photo cards */
const PhotoGrid = ({ children }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    }}
    className="photo-grid"
  >
    {children}
  </div>
)

/** Stack of form fields with consistent gap */
const FieldStack = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {children}
  </div>
)

/* ─────────────────────────────────────────────────────────────────────────────
   Global responsive CSS injected once
───────────────────────────────────────────────────────────────────────────── */
const ResponsiveStyle = () => (
  <style>{`
    @media (max-width: 600px) {
      .two-col-grid  { grid-template-columns: 1fr !important; }
      .photo-grid    { grid-template-columns: 1fr !important; }
    }
  `}</style>
)

/* ═════════════════════════════════════════════════════════════════════════════
   PAGE
═════════════════════════════════════════════════════════════════════════════ */
export default function AddVehiclePage() {
  const router = useRouter()
  const { driverProfile } = useDriver()
  const {
    loading: settingsLoading,
    isInsuranceRequired,
    isRoadTaxRequired,
    isFitnessDocumentRequired,
    isVehicleRegistrationRequired,
  } = useAdminSettings()

  const [loading, setLoading] = useState(false)
  const [loadingVehicle, setLoadingVehicle] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [savingBasicInfo, setSavingBasicInfo] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [existingVehicle, setExistingVehicle] = useState(null)
  const [vehicleId, setVehicleId] = useState(null)
  const [hasBasicInfoSaved, setHasBasicInfoSaved] = useState(false)

  const [makesAndModels, setMakesAndModels] = useState({})
  const [allowedYears, setAllowedYears] = useState([])
  const [makesList, setMakesList] = useState([])
  const [modelsList, setModelsList] = useState([])

  const getVehicleTypeFromDriverProfile = useMemo(() => {
    if (!driverProfile) return null
    if (driverProfile.taxiDriver?.isActive) return VEHICLE_TYPE.TAXI
    if (driverProfile.busDriver?.isActive) return VEHICLE_TYPE.BUS
    if (driverProfile.motorbikeRider?.isActive) return VEHICLE_TYPE.MOTORCYCLE
    return null
  }, [driverProfile])

  const [vehicleData, setVehicleData] = useState({
    vehicleType: getVehicleTypeFromDriverProfile || VEHICLE_TYPE.TAXI,
    numberPlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    seatingCapacity: 4,
    insuranceExpiryDate: '',
  })

  const [uploadedDocs, setUploadedDocs] = useState({
    registrationDocument: null,
    insuranceCertificate: null,
    roadTaxCertificate: null,
    fitnessDocument: null,
  })

  const [vehiclePhotos, setVehiclePhotos] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  })

  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        setLoadingData(true)
        const [makesModels, years] = await Promise.all([
          getVehicleMakesAndModels(),
          getAllowedVehicleYears(),
        ])
        setMakesAndModels(makesModels)
        setMakesList(Object.keys(makesModels))
        const extendedYears = extendYearsToCurrentYear(years)
        setAllowedYears(extendedYears)
      } catch (err) {
        console.error('Failed to load vehicle data:', err)
        setError('Failed to load vehicle makes and models')
      } finally {
        setLoadingData(false)
      }
    }
    loadVehicleData()
  }, [])

  const extendYearsToCurrentYear = (years) => {
    if (!years || years.length === 0) {
      const currentYear = new Date().getFullYear()
      const startYear = 2000
      return Array.from(
        { length: currentYear - startYear + 2 },
        (_, i) => (startYear + i).toString()
      )
    }
    const sortedYears = [...years].sort((a, b) => parseInt(a) - parseInt(b))
    const lastYear = parseInt(sortedYears[sortedYears.length - 1])
    const currentYear = new Date().getFullYear()
    if (lastYear >= currentYear) return sortedYears
    const missingYears = Array.from(
      { length: currentYear - lastYear + 1 },
      (_, i) => (lastYear + i + 1).toString()
    )
    return [...sortedYears, ...missingYears]
  }

  useEffect(() => {
    if (vehicleData.make && makesAndModels[vehicleData.make]) {
      setModelsList(makesAndModels[vehicleData.make])
    } else {
      setModelsList([])
    }
  }, [vehicleData.make, makesAndModels])

  useEffect(() => {
    if (getVehicleTypeFromDriverProfile && !isEditMode) {
      setVehicleData((prev) => ({ ...prev, vehicleType: getVehicleTypeFromDriverProfile }))
    }
  }, [getVehicleTypeFromDriverProfile, isEditMode])

  useEffect(() => {
    const loadExistingVehicle = async () => {
      if (!driverProfile?.assignedVehicle) return
      setLoadingVehicle(true)
      try {
        const response = await getDriverVehicle()
        if (response.success && response.hasVehicle) {
          const vehicle = response.vehicle
          setExistingVehicle(vehicle)
          setVehicleId(vehicle?.id)
          setHasBasicInfoSaved(true)
          setVehicleData({
            vehicleType: vehicle.vehicleType || getVehicleTypeFromDriverProfile,
            numberPlate: vehicle.numberPlate || '',
            make: vehicle.make || '',
            model: vehicle.model || '',
            year: vehicle.year || new Date().getFullYear(),
            color: vehicle.color || '',
            seatingCapacity: vehicle.seatingCapacity || 4,
            insuranceExpiryDate: vehicle.insuranceExpiryDate
              ? new Date(vehicle.insuranceExpiryDate).toISOString().split('T')[0]
              : '',
          })
          setUploadedDocs({
            registrationDocument: vehicle.registrationDocument || null,
            insuranceCertificate: vehicle.insuranceCertificate || null,
            roadTaxCertificate: vehicle.roadTaxCertificate || null,
            fitnessDocument: vehicle.fitnessDocument || null,
          })
          if (vehicle.vehiclePhotos && vehicle.vehiclePhotos.length > 0) {
            setVehiclePhotos({
              front: vehicle.vehiclePhotos[0] || null,
              back: vehicle.vehiclePhotos[1] || null,
              left: vehicle.vehiclePhotos[2] || null,
              right: vehicle.vehiclePhotos[3] || null,
            })
          }
          setIsEditMode(true)
        }
      } catch (error) {
        console.error('Failed to load vehicle details:', error)
        setError('Failed to load vehicle details')
      } finally {
        setLoadingVehicle(false)
      }
    }
    loadExistingVehicle()
  }, [driverProfile?.assignedVehicle, getVehicleTypeFromDriverProfile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setVehicleData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMakeChange = (event, newValue) => {
    setVehicleData((prev) => ({ ...prev, make: newValue || '', model: '' }))
  }

  const handleModelChange = (event, newValue) => {
    setVehicleData((prev) => ({ ...prev, model: newValue || '' }))
  }

  const handleSaveBasicInfo = async () => {
    if (!vehicleData.numberPlate.trim()) { setError('Number plate is required'); return }
    if (!vehicleData.make.trim()) { setError('Vehicle make is required'); return }
    if (!vehicleData.model.trim()) { setError('Vehicle model is required'); return }
    if (!vehicleData.color.trim()) { setError('Please select the color of the vehicle'); return }
    if (!vehicleData.insuranceExpiryDate) { setError('Insurance expiry date is required'); return }
    setSavingBasicInfo(true)
    setError(null)
    try {
      const response = await addVehicle({ ...vehicleData })
      if (response.success) {
        setVehicleId(response?.newVehicle?.id)
        setExistingVehicle(response.newVehicle)
        setHasBasicInfoSaved(true)
        setSuccess('Vehicle information saved! Now upload the required documents.')
      } else {
        setError(response.error || 'Failed to save vehicle information')
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setSavingBasicInfo(false)
    }
  }

  const handleDocumentUpload = async (file, docType) => {
    if (!vehicleId) { setError('Please save vehicle information first'); return }
    try {
      const response = await uploadDocument(docType, file, 'api::vehicle.vehicle', vehicleId)
      setUploadedDocs((prev) => ({ ...prev, [docType]: Array.isArray(response) ? response[0] : response }))
      setSuccess(`${docType} uploaded successfully`)
    } catch (err) {
      setError(`Failed to upload ${docType}`)
    }
  }

  const handleVehiclePhotoUpload = async (file, position) => {
    if (!vehicleId) { setError('Please save vehicle information first'); return }
    try {
      const response = await uploadDocument('vehiclePhotos', file, 'api::vehicle.vehicle', vehicleId)
      setVehiclePhotos((prev) => ({ ...prev, [position]: Array.isArray(response) ? response[0] : response }))
      setSuccess(`${position} photo uploaded successfully`)
    } catch (err) {
      setError(`Failed to upload ${position} photo`)
    }
  }

  const areAllDocumentsUploaded = () => {
    if (isVehicleRegistrationRequired && !uploadedDocs.registrationDocument) return false
    if (isInsuranceRequired && !uploadedDocs.insuranceCertificate) return false
    if (isRoadTaxRequired && !uploadedDocs.roadTaxCertificate) return false
    if (isFitnessDocumentRequired && !uploadedDocs.fitnessDocument) return false
    const requiredPhotos = ['front', 'back', 'left', 'right']
    if (requiredPhotos.filter((pos) => !vehiclePhotos[pos]).length > 0) return false
    return true
  }

  const validateForm = () => {
    if (!hasBasicInfoSaved) { setError('Please save vehicle information first'); return false }
    if (!areAllDocumentsUploaded()) { setError('Please upload all required documents and photos'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!validateForm()) return
    try {
      setLoading(true)
      const response = await submitForVerification()
      if (response.success) {
        setSuccess('Vehicle submitted for verification successfully!')
        if(typeof window !== "undefined"){
          localStorage.setItem('onboarding_step_page','/onboarding/pending')
        }
        setTimeout(() => router.push('/onboarding/pending'), 2000)
      } else {
        setError(response.error || 'Failed to submit vehicle for verification')
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditDialog = () => { setEditDialogOpen(true); setError(null); setSuccess(null) }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setError(null)
    if (existingVehicle) {
      setVehicleData({
        vehicleType: existingVehicle.vehicleType || getVehicleTypeFromDriverProfile,
        numberPlate: existingVehicle.numberPlate || '',
        make: existingVehicle.make || '',
        model: existingVehicle.model || '',
        year: existingVehicle.year || new Date().getFullYear(),
        color: existingVehicle.color || '',
        seatingCapacity: existingVehicle.seatingCapacity || 4,
        insuranceExpiryDate: existingVehicle.insuranceExpiryDate
          ? new Date(existingVehicle.insuranceExpiryDate).toISOString().split('T')[0]
          : '',
      })
    }
  }

  const handleUpdateVehicle = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSavingBasicInfo(true)
    try {
      const response = await updateVehicle(existingVehicle?.id, vehicleData)
      if (response.success) {
        setSuccess('Vehicle details updated successfully!')
        setEditDialogOpen(false)
        const updatedResponse = await getDriverVehicle()
        if (updatedResponse.success && updatedResponse.hasVehicle) {
          setExistingVehicle(updatedResponse.vehicle)
          setVehicleData({
            vehicleType: updatedResponse.vehicle.vehicleType || getVehicleTypeFromDriverProfile,
            numberPlate: updatedResponse.vehicle.numberPlate || '',
            make: updatedResponse.vehicle.make || '',
            model: updatedResponse.vehicle.model || '',
            year: updatedResponse.vehicle.year || new Date().getFullYear(),
            color: updatedResponse.vehicle.color || '',
            seatingCapacity: updatedResponse.vehicle.seatingCapacity || 4,
            insuranceExpiryDate: updatedResponse.vehicle.insuranceExpiryDate
              ? new Date(updatedResponse.vehicle.insuranceExpiryDate).toISOString().split('T')[0]
              : '',
          })
        }
      } else {
        setError(response.error || 'Failed to update vehicle')
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setSavingBasicInfo(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const isInsuranceExpired = () => {
    if (!existingVehicle?.insuranceExpiryDate) return false
    return new Date(existingVehicle.insuranceExpiryDate) < new Date()
  }

  const isInsuranceExpiringSoon = () => {
    if (!existingVehicle?.insuranceExpiryDate) return false
    const expiryDate = new Date(existingVehicle.insuranceExpiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return expiryDate > today && expiryDate < thirtyDaysFromNow
  }

  const getVehicleTypeName = (type) => {
    const names = { [VEHICLE_TYPE.TAXI]: 'Taxi', [VEHICLE_TYPE.BUS]: 'Bus', [VEHICLE_TYPE.MOTORCYCLE]: 'Motorcycle' }
    return names[type] || type
  }

  if (loadingVehicle || settingsLoading || loadingData) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  const insuranceChipLabel = isInsuranceExpired() ? 'EXPIRED' : isInsuranceExpiringSoon() ? 'EXPIRING SOON' : 'VALID'
  const insuranceChipColor = isInsuranceExpired() ? 'error' : isInsuranceExpiringSoon() ? 'warning' : 'success'

  return (
    <>
      <ResponsiveStyle />

      {/*
        ── Outer shell: full viewport height, scroll lives HERE ──
        scrollbar-width + ::-webkit-scrollbar hide the bar while keeping
        the scroll gesture fully functional on all platforms.
      */}
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',         // prevent the shell itself from scrolling
          bgcolor: 'background.default',
        }}
      >
        {/* ── Sticky header – outside the scroll area so it never moves ── */}
        <Box
          sx={{
            flexShrink: 0,
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            zIndex: 10,
          }}
        >
          <IconButton onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isEditMode ? 'Vehicle Details' : 'Add Vehicle'}
          </Typography>
          {isEditMode && (
            <Chip
              label="Edit Mode"
              color="primary"
              size="small"
              icon={<EditIcon />}
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>

        {/* ── Scrollable content area ── */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'scroll',
            pb: 10,
            /* hide scrollbar – Chrome/Safari */
            '&::-webkit-scrollbar': { display: 'none' },
            /* hide scrollbar – Firefox */
            scrollbarWidth: 'none',
            /* hide scrollbar – IE/Edge legacy */
            msOverflowStyle: 'none',
          }}
        >
          <Box sx={{ p: 3, }}>

            {/* Alert Messages */}
            {/* ── remove these two blocks ── */}
{/* {error && (
  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
)}
{success && (
  <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>
)} */}

            {/* Insurance Expiry Warnings */}
            {isEditMode && existingVehicle && isInsuranceExpired() && (
              <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
                Your insurance has expired! Please update your insurance documents and expiry date.
              </Alert>
            )}
            {isEditMode && existingVehicle && isInsuranceExpiringSoon() && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                Your insurance is expiring soon! Please renew and update your documents.
              </Alert>
            )}

            {/* ── Existing Vehicle Summary ── */}
            {isEditMode && existingVehicle && (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  mb: 3,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                   /* hide scrollbar – Chrome/Safari */
                  '&::-webkit-scrollbar': { display: 'none' },
                  /* hide scrollbar – Firefox */
                  scrollbarWidth: 'none',
                  /* hide scrollbar – IE/Edge legacy */
                  msOverflowStyle: 'none',
                }}
              >
                {/* Gradient header band */}
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 40, height: 40, borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <CarIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                        {existingVehicle.make} {existingVehicle.model}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                        {existingVehicle.year} · {getVehicleTypeName(existingVehicle.vehicleType)}
                      </Typography>
                    </Box>
                  </Box>
                  <Tooltip title="Edit Vehicle Details">
                    <IconButton
                      onClick={handleOpenEditDialog}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.22)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', transform: 'scale(1.06)' },
                        transition: 'all 0.16s ease',
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Detail grid */}
                <Box sx={{ p: 3 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Number plate — full width */}
                    <Box
                      sx={{
                        px: 2.5, py: 1.5, borderRadius: 2.5,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        border: '1.5px dashed',
                        borderColor: 'divider',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                      }}
                    >
                      <PlateIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                          Number Plate
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 900, letterSpacing: 2, fontFamily: 'monospace',
                            background: 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.2,
                          }}
                        >
                          {existingVehicle.numberPlate}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Color + Seating side by side */}
                    <TwoCol>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                          Color
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                              bgcolor: getColorByKey(existingVehicle.color)?.body,
                              border: '2px solid',
                              borderColor: getColorByKey(existingVehicle.color)?.outline,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            }}
                          />
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {getColorByKey(existingVehicle.color)?.label ?? existingVehicle.color}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                          Seating
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SeatsIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {existingVehicle.seatingCapacity} seats
                          </Typography>
                        </Box>
                      </Box>
                    </TwoCol>

                    {/* Insurance expiry — full width */}
                    <Box
                      sx={{
                        px: 2, py: 1.5, borderRadius: 2.5,
                        bgcolor: isInsuranceExpired()
                          ? 'rgba(211,47,47,0.06)'
                          : isInsuranceExpiringSoon()
                          ? 'rgba(237,108,2,0.06)'
                          : 'rgba(46,125,50,0.06)',
                        border: '1px solid',
                        borderColor: isInsuranceExpired()
                          ? 'rgba(211,47,47,0.2)'
                          : isInsuranceExpiringSoon()
                          ? 'rgba(237,108,2,0.2)'
                          : 'rgba(46,125,50,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CalendarIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.6rem', letterSpacing: 0.8, textTransform: 'uppercase', display: 'block' }}>
                            Insurance Expiry
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatDate(existingVehicle.insuranceExpiryDate)}
                          </Typography>
                        </Box>
                      </Box>
                      {existingVehicle.insuranceExpiryDate && (
                        <Chip
                          label={insuranceChipLabel}
                          color={insuranceChipColor}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  </div>
                </Box>
              </Paper>
            )}

            {/* ── Edit Vehicle Dialog ── */}
            <Dialog
              open={editDialogOpen}
              onClose={handleCloseEditDialog}
              maxWidth="md"
              fullWidth
              PaperProps={{ sx: { 
                borderRadius: 4, 
                overflow: 'auto',
               /* hide scrollbar – Chrome/Safari */
                '&::-webkit-scrollbar': { display: 'none' },
                /* hide scrollbar – Firefox */
                scrollbarWidth: 'none',
                /* hide scrollbar – IE/Edge legacy */
                msOverflowStyle: 'none', } }}
            >
              <form onSubmit={handleUpdateVehicle}>
                {/* Dialog header with gradient */}
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)',
                    px: 3, py: 2.5,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                  }}
                >
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EditIcon sx={{ color: 'white', fontSize: 18 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>
                    Edit Vehicle Details
                  </Typography>
                </Box>

                <DialogContent sx={{ pt: 3 }}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}

                  <FieldStack>
                    {/* Vehicle Type – full width */}
                    <FullRow>
                      <TextField
                        select fullWidth label="Vehicle Type" name="vehicleType"
                        value={vehicleData.vehicleType} onChange={handleChange}
                        required disabled
                        helperText="Vehicle type cannot be changed after creation"
                        sx={fieldStyles}
                      >
                        <MenuItem value={VEHICLE_TYPE.TAXI}>Taxi</MenuItem>
                        <MenuItem value={VEHICLE_TYPE.BUS}>Bus</MenuItem>
                        <MenuItem value={VEHICLE_TYPE.MOTORCYCLE}>Motorcycle</MenuItem>
                      </TextField>
                    </FullRow>

                    {/* Number Plate – full width */}
                    <FullRow>
                      <TextField
                        fullWidth label="Number Plate" name="numberPlate"
                        value={vehicleData.numberPlate} onChange={handleChange}
                        placeholder="e.g., BAZ 1234" required
                        sx={monoFieldStyles}
                      />
                    </FullRow>

                    {/* Make – full width */}
                    <FullRow>
                      <Autocomplete
                        fullWidth
                        freeSolo options={makesList} value={vehicleData.make}
                        onChange={handleMakeChange}
                        renderInput={(params) => (
                          <TextField {...params} label="Make" placeholder="e.g., Toyota" required sx={fieldStyles} />
                        )}
                      />
                    </FullRow>

                    {/* Model – full width */}
                    <FullRow>
                      <Autocomplete
                        fullWidth
                        freeSolo options={modelsList} value={vehicleData.model}
                        onChange={handleModelChange} disabled={!vehicleData.make}
                        renderInput={(params) => (
                          <TextField {...params} label="Model" placeholder="e.g., Corolla" required sx={fieldStyles} />
                        )}
                      />
                    </FullRow>

                    {/* Year + Seating – side by side */}
                    <TwoCol>
                      <TextField
                        select fullWidth label="Year" name="year"
                        value={vehicleData.year} onChange={handleChange} required
                        sx={fieldStyles}
                      >
                        {allowedYears.map((year) => (
                          <MenuItem key={year} value={parseInt(year)}>{year}</MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth type="number" label="Seating Capacity" name="seatingCapacity"
                        value={vehicleData.seatingCapacity} onChange={handleChange}
                        inputProps={{ min: 2, max: 50 }} required
                        sx={fieldStyles}
                      />
                    </TwoCol>

                    {/* Color picker – full width */}
                    <FullRow>
                      <VehicleColorPicker
                        value={vehicleData.color}
                        onChange={(colorKey) => setVehicleData((prev) => ({ ...prev, color: colorKey }))}
                        required
                        helperText="Select your vehicle's color"
                      />
                    </FullRow>

                    {/* Insurance Expiry – full width */}
                    <FullRow>
                      <TextField
                        fullWidth type="date" label="Insurance Expiry Date" name="insuranceExpiryDate"
                        value={vehicleData.insuranceExpiryDate} onChange={handleChange}
                        InputLabelProps={{ shrink: true }} required
                        helperText="When does your insurance expire?"
                        inputProps={{ min: new Date().toISOString().split('T')[0] }}
                        sx={fieldStyles}
                      />
                    </FullRow>
                  </FieldStack>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                  <Button
                    onClick={handleCloseEditDialog} color="inherit"
                    sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit" variant="contained" disabled={savingBasicInfo}
                    startIcon={savingBasicInfo ? <CircularProgress size={18} /> : <CheckIcon />}
                    sx={{
                      borderRadius: 2.5, px: 3, fontWeight: 700,
                      background: 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)',
                      boxShadow: '0 4px 14px rgba(255,140,0,0.35)',
                      '&:hover': { boxShadow: '0 6px 18px rgba(255,140,0,0.45)', transform: 'translateY(-1px)' },
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {savingBasicInfo ? 'Updating...' : 'Update Vehicle'}
                  </Button>
                </DialogActions>
              </form>
            </Dialog>

            {/* ── Add Vehicle Form ── */}
            {!isEditMode && (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  mb: 3,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {/* Form header */}
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)',
                    px: 3, py: 2,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                  }}
                >
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CarIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white' }}>
                    Vehicle Information
                  </Typography>
                </Box>

                <Box sx={{ p: 3 }}>
                  <FieldStack>
                    {/* Vehicle Type – full width */}
                    <FullRow>
                      <TextField
                        select fullWidth label="Vehicle Type" name="vehicleType"
                        value={vehicleData.vehicleType} onChange={handleChange}
                        required disabled
                        helperText={`Set based on your driver profile: ${getVehicleTypeName(vehicleData.vehicleType)}`}
                        sx={fieldStyles}
                      >
                        <MenuItem value={VEHICLE_TYPE.TAXI}>Taxi</MenuItem>
                        <MenuItem value={VEHICLE_TYPE.BUS}>Bus</MenuItem>
                        <MenuItem value={VEHICLE_TYPE.MOTORCYCLE}>Motorcycle</MenuItem>
                      </TextField>
                    </FullRow>

                    {/* Number Plate – full width */}
                    <FullRow>
                      <TextField
                        fullWidth label="Number Plate" name="numberPlate"
                        value={vehicleData.numberPlate} onChange={handleChange}
                        placeholder="e.g., BAZ 1234" required disabled={hasBasicInfoSaved}
                        sx={monoFieldStyles}
                      />
                    </FullRow>

                    {/* Make – full width */}
                    <FullRow>
                      <Autocomplete
                        fullWidth
                        freeSolo options={makesList} value={vehicleData.make}
                        onChange={handleMakeChange} disabled={hasBasicInfoSaved}
                        renderInput={(params) => (
                          <TextField {...params} label="Make" placeholder="e.g., Toyota" required sx={fieldStyles} />
                        )}
                      />
                    </FullRow>

                    {/* Model – full width */}
                    <FullRow>
                      <Autocomplete
                        fullWidth
                        freeSolo options={modelsList} value={vehicleData.model}
                        onChange={handleModelChange} disabled={!vehicleData.make || hasBasicInfoSaved}
                        renderInput={(params) => (
                          <TextField {...params} label="Model" placeholder="e.g., Corolla" required sx={fieldStyles} />
                        )}
                      />
                    </FullRow>

                    {/* Year + Seating – side by side */}
                    <TwoCol>
                      <TextField
                        select fullWidth label="Year" name="year"
                        value={vehicleData.year} onChange={handleChange}
                        required disabled={hasBasicInfoSaved}
                        sx={fieldStyles}
                      >
                        {allowedYears.map((year) => (
                          <MenuItem key={year} value={parseInt(year)}>{year}</MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth type="number" label="Seating Capacity" name="seatingCapacity"
                        value={vehicleData.seatingCapacity} onChange={handleChange}
                        inputProps={{ min: 2, max: 50 }} required disabled={hasBasicInfoSaved}
                        sx={fieldStyles}
                      />
                    </TwoCol>

                    {/* Color picker – full width */}
                    <FullRow>
                      <VehicleColorPicker
                        value={vehicleData.color}
                        onChange={(colorKey) => setVehicleData((prev) => ({ ...prev, color: colorKey }))}
                        required
                        disabled={hasBasicInfoSaved}
                        helperText="Select your vehicle's color"
                      />
                    </FullRow>

                    {/* Insurance Expiry – full width */}
                    <FullRow>
                      <TextField
                        fullWidth type="date" label="Insurance Expiry Date" name="insuranceExpiryDate"
                        value={vehicleData.insuranceExpiryDate} onChange={handleChange}
                        InputLabelProps={{ shrink: true }} required
                        helperText="When does your insurance expire?"
                        inputProps={{ min: new Date().toISOString().split('T')[0] }}
                        disabled={hasBasicInfoSaved}
                        sx={fieldStyles}
                      />
                    </FullRow>
                  </FieldStack>

                  {!hasBasicInfoSaved && (
                    <Button
                      fullWidth variant="contained" size="large"
                      onClick={handleSaveBasicInfo} disabled={savingBasicInfo}
                      startIcon={savingBasicInfo && <CircularProgress size={20} />}
                      sx={{
                        mt: 3, height: 56, borderRadius: 3, fontWeight: 700,
                        background: 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)',
                        boxShadow: '0 6px 20px rgba(255,140,0,0.35)',
                        '&:hover': { boxShadow: '0 8px 24px rgba(255,140,0,0.45)', transform: 'translateY(-1px)' },
                        '&:disabled': { background: 'rgba(0,0,0,0.12)' },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {savingBasicInfo ? 'Saving...' : 'Save Vehicle Information'}
                    </Button>
                  )}

                  {hasBasicInfoSaved && (
                    <Alert
                      severity="success" sx={{ mt: 3, borderRadius: 2.5 }}
                      icon={<CheckIcon />}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        Vehicle information saved! Now upload the required documents below.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Paper>
            )}

            {/* Documents locked hint */}
            {!hasBasicInfoSaved && !isEditMode && (
              <Alert severity="info" icon={<LockIcon />} sx={{ mb: 3, borderRadius: 2.5 }}>
                <Typography variant="body2" fontWeight="medium">
                  Document uploads will be enabled after you save the vehicle information above.
                </Typography>
              </Alert>
            )}

            {/* ── Vehicle Documents ── */}
            <Box sx={{ opacity: !vehicleId ? 0.5 : 1, pointerEvents: !vehicleId ? 'none' : 'auto' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Vehicle Documents
              </Typography>

              {isVehicleRegistrationRequired && (
                <Box sx={{ mb: 3 }}>
                  <DocumentUploadCard
                    title="Vehicle Registration (Blue Book)"
                    description="Upload all pages of your vehicle registration document clearly"
                    onUpload={(file) => handleDocumentUpload(file, 'registrationDocument')}
                    uploadedFile={uploadedDocs.registrationDocument}
                    onRemove={() => setUploadedDocs((prev) => ({ ...prev, registrationDocument: null }))}
                  />
                </Box>
              )}

              {isInsuranceRequired && (
                <Box sx={{ mb: 3 }}>
                  <DocumentUploadCard
                    title="Insurance Certificate"
                    description="Upload your valid comprehensive insurance certificate"
                    onUpload={(file) => handleDocumentUpload(file, 'insuranceCertificate')}
                    uploadedFile={uploadedDocs.insuranceCertificate}
                    onRemove={() => setUploadedDocs((prev) => ({ ...prev, insuranceCertificate: null }))}
                  />
                </Box>
              )}

              {isRoadTaxRequired && (
                <Box sx={{ mb: 3 }}>
                  <DocumentUploadCard
                    title="Road Tax Certificate"
                    description="Upload your valid road tax certificate"
                    onUpload={(file) => handleDocumentUpload(file, 'roadTaxCertificate')}
                    uploadedFile={uploadedDocs.roadTaxCertificate}
                    onRemove={() => setUploadedDocs((prev) => ({ ...prev, roadTaxCertificate: null }))}
                  />
                </Box>
              )}

              {isFitnessDocumentRequired && (
                <Box sx={{ mb: 3 }}>
                  <DocumentUploadCard
                    title="Fitness Certificate"
                    description="Upload your valid fitness/roadworthy certificate"
                    onUpload={(file) => handleDocumentUpload(file, 'fitnessDocument')}
                    uploadedFile={uploadedDocs.fitnessDocument}
                    onRemove={() => setUploadedDocs((prev) => ({ ...prev, fitnessDocument: null }))}
                  />
                </Box>
              )}

              {/* Vehicle Photos */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: 4 }}>
                Vehicle Photos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload clear photos of your vehicle from all angles
              </Typography>

              <PhotoGrid>
                <DocumentUploadCard
                  title="Front View" description="Take a photo of the vehicle from the front"
                  onUpload={(file) => handleVehiclePhotoUpload(file, 'front')}
                  uploadedFile={vehiclePhotos.front}
                  onRemove={() => setVehiclePhotos((prev) => ({ ...prev, front: null }))}
                />
                <DocumentUploadCard
                  title="Back View" description="Take a photo of the vehicle from the back"
                  onUpload={(file) => handleVehiclePhotoUpload(file, 'back')}
                  uploadedFile={vehiclePhotos.back}
                  onRemove={() => setVehiclePhotos((prev) => ({ ...prev, back: null }))}
                />
                <DocumentUploadCard
                  title="Left Side View" description="Take a photo of the vehicle from the left side"
                  onUpload={(file) => handleVehiclePhotoUpload(file, 'left')}
                  uploadedFile={vehiclePhotos.left}
                  onRemove={() => setVehiclePhotos((prev) => ({ ...prev, left: null }))}
                />
                <DocumentUploadCard
                  title="Right Side View" description="Take a photo of the vehicle from the right side"
                  onUpload={(file) => handleVehiclePhotoUpload(file, 'right')}
                  uploadedFile={vehiclePhotos.right}
                  onRemove={() => setVehiclePhotos((prev) => ({ ...prev, right: null }))}
                />
              </PhotoGrid>
            </Box>

            {/* Submit section – edit mode */}
            {(isEditMode || hasBasicInfoSaved) && (
              <>
                <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 3, borderRadius: 2.5 }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Important Notice
                  </Typography>
                  <Typography variant="body2">
                    After submitting your vehicle for verification, you will temporarily
                    not receive orders until we approve the vehicle. This typically takes
                    24-48 hours.
                  </Typography>
                </Alert>

                <Button
                  onClick={handleSubmit} fullWidth variant="contained" size="large"
                  disabled={loading || !vehicleId || !areAllDocumentsUploaded()}
                  startIcon={loading && <CircularProgress size={20} />}
                  sx={{
                    mt: 3, height: 56, borderRadius: 3, fontWeight: 700,
                    background: 'linear-gradient(135deg, #FF8C00 0%, #FFC107 100%)',
                    boxShadow: '0 6px 20px rgba(255,140,0,0.35)',
                    '&:hover': { boxShadow: '0 8px 24px rgba(255,140,0,0.45)', transform: 'translateY(-1px)' },
                    '&:disabled': { background: 'rgba(0,0,0,0.12)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Vehicle for Verification'}
                </Button>

                {vehicleId && !areAllDocumentsUploaded() && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                    Please upload all required documents and photos before submitting
                  </Typography>
                )}
              </>
            )}

          </Box>
        </Box>{/* end scrollable area */}
        {/* ── replace with these two Snackbars, placed anywhere inside the root Box, outside the scrollable area ── */}
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ zIndex: 9999 }}
        >
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ width: '100%', borderRadius: 2.5 }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={5000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ zIndex: 9999 }}
        >
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ width: '100%', borderRadius: 2.5 }}
          >
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </>
  )
}