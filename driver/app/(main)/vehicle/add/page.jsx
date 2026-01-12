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
  Grid,
  IconButton,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
  Autocomplete,
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
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

  // Vehicle makes, models, and years
  const [makesAndModels, setMakesAndModels] = useState({})
  const [allowedYears, setAllowedYears] = useState([])
  const [makesList, setMakesList] = useState([])
  const [modelsList, setModelsList] = useState([])

  // Get vehicle type from active driver profile
  const getVehicleTypeFromDriverProfile = useMemo(() => {
    if (!driverProfile) return null

    // Map driver type to vehicle type (note: motorbikeRider -> motorcycle)
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

  // Load vehicle makes, models, and years
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

        // Extend years to current year if needed
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

  // Extend years list to include current year if missing
  const extendYearsToCurrentYear = (years) => {
    if (!years || years.length === 0) {
      // Generate default years if none provided
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

    if (lastYear >= currentYear) {
      return sortedYears
    }

    // Add missing years from lastYear + 1 to currentYear + 1
    const missingYears = Array.from(
      { length: currentYear - lastYear + 1 },
      (_, i) => (lastYear + i + 1).toString()
    )

    return [...sortedYears, ...missingYears]
  }

  // Update models list when make changes
  useEffect(() => {
    if (vehicleData.make && makesAndModels[vehicleData.make]) {
      setModelsList(makesAndModels[vehicleData.make])
    } else {
      setModelsList([])
    }
  }, [vehicleData.make, makesAndModels])

  // Update vehicle type when driver profile loads
  useEffect(() => {
    if (getVehicleTypeFromDriverProfile && !isEditMode) {
      setVehicleData((prev) => ({
        ...prev,
        vehicleType: getVehicleTypeFromDriverProfile,
      }))
    }
  }, [getVehicleTypeFromDriverProfile, isEditMode])

  // Load existing vehicle details
  useEffect(() => {
    const loadExistingVehicle = async () => {
      if (!driverProfile?.assignedVehicle) return

      setLoadingVehicle(true)
      try {
        const response = await getDriverVehicle()

        if (response.success && response.hasVehicle) {
          const vehicle = response.vehicle
          setExistingVehicle(vehicle)
          setVehicleId(vehicle.id)
          setHasBasicInfoSaved(true)

          // Pre-fill form with existing data
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

          // Load existing documents
          setUploadedDocs({
            registrationDocument: vehicle.registrationDocument || null,
            insuranceCertificate: vehicle.insuranceCertificate || null,
            roadTaxCertificate: vehicle.roadTaxCertificate || null,
            fitnessDocument: vehicle.fitnessDocument || null,
          })

          // Load existing vehicle photos
          if (vehicle.vehiclePhotos && vehicle.vehiclePhotos.length > 0) {
            const photos = {
              front: vehicle.vehiclePhotos[0] || null,
              back: vehicle.vehiclePhotos[1] || null,
              left: vehicle.vehiclePhotos[2] || null,
              right: vehicle.vehiclePhotos[3] || null,
            }
            setVehiclePhotos(photos)
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
    setVehicleData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMakeChange = (event, newValue) => {
    setVehicleData((prev) => ({
      ...prev,
      make: newValue || '',
      model: '', // Reset model when make changes
    }))
  }

  const handleModelChange = (event, newValue) => {
    setVehicleData((prev) => ({
      ...prev,
      model: newValue || '',
    }))
  }

  // Save basic vehicle information first to get vehicle ID
  const handleSaveBasicInfo = async () => {
    // Validate basic info
    if (!vehicleData.numberPlate.trim()) {
      setError('Number plate is required')
      return
    }
    if (!vehicleData.make.trim()) {
      setError('Vehicle make is required')
      return
    }
    if (!vehicleData.model.trim()) {
      setError('Vehicle model is required')
      return
    }
    if (!vehicleData.insuranceExpiryDate) {
      setError('Insurance expiry date is required')
      return
    }

    setSavingBasicInfo(true)
    setError(null)
    try {
      const response = await addVehicle({
        ...vehicleData,
      })

      if (response.success) {
        setVehicleId(response.vehicle.id)
        setExistingVehicle(response.vehicle)
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
    if (!vehicleId) {
      setError('Please save vehicle information first')
      return
    }

    try {
      const response = await uploadDocument(
        docType,
        file,
        'api::vehicle.vehicle',
        vehicleId
      )
      setUploadedDocs((prev) => ({
        ...prev,
        [docType]: Array.isArray(response) ? response[0] : response,
      }))
      setSuccess(`${docType} uploaded successfully`)
    } catch (err) {
      setError(`Failed to upload ${docType}`)
    }
  }

  const handleVehiclePhotoUpload = async (file, position) => {
    if (!vehicleId) {
      setError('Please save vehicle information first')
      return
    }

    try {
      const response = await uploadDocument(
        'vehiclePhotos',
        file,
        'api::vehicle.vehicle',
        vehicleId
      )
      setVehiclePhotos((prev) => ({
        ...prev,
        [position]: Array.isArray(response) ? response[0] : response,
      }))
      setSuccess(`${position} photo uploaded successfully`)
    } catch (err) {
      setError(`Failed to upload ${position} photo`)
    }
  }

  // Check if all required documents are uploaded
  const areAllDocumentsUploaded = () => {
    if (isVehicleRegistrationRequired && !uploadedDocs.registrationDocument) {
      return false
    }

    if (isInsuranceRequired && !uploadedDocs.insuranceCertificate) {
      return false
    }

    if (isRoadTaxRequired && !uploadedDocs.roadTaxCertificate) {
      return false
    }

    if (isFitnessDocumentRequired && !uploadedDocs.fitnessDocument) {
      return false
    }

    // Check vehicle photos
    const requiredPhotos = ['front', 'back', 'left', 'right']
    const missingPhotos = requiredPhotos.filter((pos) => !vehiclePhotos[pos])

    if (missingPhotos.length > 0) {
      return false
    }

    return true
  }

  const validateForm = () => {
    // Check if basic info is saved
    if (!hasBasicInfoSaved) {
      setError('Please save vehicle information first')
      return false
    }

    // Check if all required documents are uploaded
    if (!areAllDocumentsUploaded()) {
      setError('Please upload all required documents and photos')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      // All documents are already uploaded, just submit for verification
      const response = await submitForVerification()

      if (response.success) {
        setSuccess('Vehicle submitted for verification successfully!')
        // Redirect to verification page after a short delay
        setTimeout(() => {
          router.push('/onboarding/pending')
        }, 2000)
      } else {
        setError(response.error || 'Failed to submit vehicle for verification')
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditDialog = () => {
    setEditDialogOpen(true)
    setError(null)
    setSuccess(null)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setError(null)

    // Reset form to original values
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
      const response = await updateVehicle(existingVehicle.id, vehicleData)

      if (response.success) {
        setSuccess('Vehicle details updated successfully!')
        setEditDialogOpen(false)

        // Refresh vehicle data
        const updatedResponse = await getDriverVehicle()
        if (updatedResponse.success && updatedResponse.hasVehicle) {
          setExistingVehicle(updatedResponse.vehicle)
          setVehicleData({
            vehicleType:
              updatedResponse.vehicle.vehicleType || getVehicleTypeFromDriverProfile,
            numberPlate: updatedResponse.vehicle.numberPlate || '',
            make: updatedResponse.vehicle.make || '',
            model: updatedResponse.vehicle.model || '',
            year: updatedResponse.vehicle.year || new Date().getFullYear(),
            color: updatedResponse.vehicle.color || '',
            seatingCapacity: updatedResponse.vehicle.seatingCapacity || 4,
            insuranceExpiryDate: updatedResponse.vehicle.insuranceExpiryDate
              ? new Date(updatedResponse.vehicle.insuranceExpiryDate)
                  .toISOString()
                  .split('T')[0]
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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isInsuranceExpired = () => {
    if (!existingVehicle?.insuranceExpiryDate) return false
    const expiryDate = new Date(existingVehicle.insuranceExpiryDate)
    const today = new Date()
    return expiryDate < today
  }

  const isInsuranceExpiringSoon = () => {
    if (!existingVehicle?.insuranceExpiryDate) return false
    const expiryDate = new Date(existingVehicle.insuranceExpiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return expiryDate > today && expiryDate < thirtyDaysFromNow
  }

  const getVehicleTypeName = (type) => {
    const names = {
      [VEHICLE_TYPE.TAXI]: 'Taxi',
      [VEHICLE_TYPE.BUS]: 'Bus',
      [VEHICLE_TYPE.MOTORCYCLE]: 'Motorcycle',
    }
    return names[type] || type
  }

  if (loadingVehicle || settingsLoading || loadingData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
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

      <Box sx={{ p: 3 }}>
        {/* Alert Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Insurance Expiry Warning */}
        {isEditMode && existingVehicle && isInsuranceExpired() && (
          <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
            Your insurance has expired! Please update your insurance documents and expiry
            date.
          </Alert>
        )}

        {isEditMode && existingVehicle && isInsuranceExpiringSoon() && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
            Your insurance is expiring soon! Please renew and update your documents.
          </Alert>
        )}

        {/* Existing Vehicle Summary */}
        {isEditMode && existingVehicle && (
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Current Vehicle
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Vehicle
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {existingVehicle.make} {existingVehicle.model} ({existingVehicle.year})
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Number Plate
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {existingVehicle.numberPlate}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Color
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {existingVehicle.color}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Seating Capacity
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {existingVehicle.seatingCapacity} seats
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Vehicle Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {getVehicleTypeName(existingVehicle.vehicleType)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Insurance Expiry
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(existingVehicle.insuranceExpiryDate)}
                      </Typography>
                      {existingVehicle.insuranceExpiryDate && (
                        <Chip
                          label={
                            isInsuranceExpired()
                              ? 'EXPIRED'
                              : isInsuranceExpiringSoon()
                              ? 'EXPIRING SOON'
                              : 'VALID'
                          }
                          color={
                            isInsuranceExpired()
                              ? 'error'
                              : isInsuranceExpiringSoon()
                              ? 'warning'
                              : 'success'
                          }
                          size="small"
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Tooltip title="Edit Vehicle Details">
                <IconButton
                  color="primary"
                  onClick={handleOpenEditDialog}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        )}

        {/* Edit Vehicle Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleUpdateVehicle}>
            <DialogTitle>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Edit Vehicle Details
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Vehicle Type"
                    name="vehicleType"
                    value={vehicleData.vehicleType}
                    onChange={handleChange}
                    required
                    disabled // Can't change vehicle type after creation
                    helperText="Vehicle type cannot be changed after creation"
                  >
                    <MenuItem value={VEHICLE_TYPE.TAXI}>Taxi</MenuItem>
                    <MenuItem value={VEHICLE_TYPE.BUS}>Bus</MenuItem>
                    <MenuItem value={VEHICLE_TYPE.MOTORCYCLE}>Motorcycle</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Number Plate"
                    name="numberPlate"
                    value={vehicleData.numberPlate}
                    onChange={handleChange}
                    placeholder="e.g., BAZ 1234"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    options={makesList}
                    value={vehicleData.make}
                    onChange={handleMakeChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Make"
                        placeholder="e.g., Toyota"
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    options={modelsList}
                    value={vehicleData.model}
                    onChange={handleModelChange}
                    disabled={!vehicleData.make}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Model"
                        placeholder="e.g., Corolla"
                        required
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Year"
                    name="year"
                    value={vehicleData.year}
                    onChange={handleChange}
                    required
                  >
                    {allowedYears.map((year) => (
                      <MenuItem key={year} value={parseInt(year)}>
                        {year}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    name="color"
                    value={vehicleData.color}
                    onChange={handleChange}
                    placeholder="e.g., White"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Seating Capacity"
                    name="seatingCapacity"
                    value={vehicleData.seatingCapacity}
                    onChange={handleChange}
                    inputProps={{ min: 2, max: 50 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Insurance Expiry Date"
                    name="insuranceExpiryDate"
                    value={vehicleData.insuranceExpiryDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    helperText="When does your insurance expire?"
                    inputProps={{
                      min: new Date().toISOString().split('T')[0],
                    }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button onClick={handleCloseEditDialog} color="inherit">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={savingBasicInfo}
                startIcon={
                  savingBasicInfo ? <CircularProgress size={20} /> : <CheckIcon />
                }
              >
                {savingBasicInfo ? 'Updating...' : 'Update Vehicle'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Add Vehicle Form - Only show if not in edit mode */}
        {!isEditMode && (
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Vehicle Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Vehicle Type"
                  name="vehicleType"
                  value={vehicleData.vehicleType}
                  onChange={handleChange}
                  required
                  disabled // Auto-set based on driver profile
                  helperText={`Set based on your driver profile: ${getVehicleTypeName(
                    vehicleData.vehicleType
                  )}`}
                >
                  <MenuItem value={VEHICLE_TYPE.TAXI}>Taxi</MenuItem>
                  <MenuItem value={VEHICLE_TYPE.BUS}>Bus</MenuItem>
                  <MenuItem value={VEHICLE_TYPE.MOTORCYCLE}>Motorcycle</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Number Plate"
                  name="numberPlate"
                  value={vehicleData.numberPlate}
                  onChange={handleChange}
                  placeholder="e.g., BAZ 1234"
                  required
                  disabled={hasBasicInfoSaved}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={makesList}
                  value={vehicleData.make}
                  onChange={handleMakeChange}
                  disabled={hasBasicInfoSaved}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Make"
                      placeholder="e.g., Toyota"
                      required
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={modelsList}
                  value={vehicleData.model}
                  onChange={handleModelChange}
                  disabled={!vehicleData.make || hasBasicInfoSaved}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Model"
                      placeholder="e.g., Corolla"
                      required
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Year"
                  name="year"
                  value={vehicleData.year}
                  onChange={handleChange}
                  required
                  disabled={hasBasicInfoSaved}
                >
                  {allowedYears.map((year) => (
                    <MenuItem key={year} value={parseInt(year)}>
                      {year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Color"
                  name="color"
                  value={vehicleData.color}
                  onChange={handleChange}
                  placeholder="e.g., White"
                  required
                  disabled={hasBasicInfoSaved}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Seating Capacity"
                  name="seatingCapacity"
                  value={vehicleData.seatingCapacity}
                  onChange={handleChange}
                  inputProps={{ min: 2, max: 50 }}
                  required
                  disabled={hasBasicInfoSaved}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Insurance Expiry Date"
                  name="insuranceExpiryDate"
                  value={vehicleData.insuranceExpiryDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  helperText="When does your insurance expire?"
                  inputProps={{
                    min: new Date().toISOString().split('T')[0],
                  }}
                  disabled={hasBasicInfoSaved}
                />
              </Grid>
            </Grid>

            {/* Save Basic Info Button */}
            {!hasBasicInfoSaved && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSaveBasicInfo}
                disabled={savingBasicInfo}
                sx={{ mt: 3, height: 56, borderRadius: 3, fontWeight: 600 }}
                startIcon={savingBasicInfo && <CircularProgress size={20} />}
              >
                {savingBasicInfo ? 'Saving...' : 'Save Vehicle Information'}
              </Button>
            )}

            {hasBasicInfoSaved && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight="medium">
                  Vehicle information saved! Now upload the required documents below.
                </Typography>
              </Alert>
            )}
          </Paper>
        )}

        {/* Documents and Photos - Always visible, but disabled if no vehicle ID */}
        {!hasBasicInfoSaved && !isEditMode && (
          <Alert severity="info" icon={<LockIcon />} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="medium">
              Document uploads will be enabled after you save the vehicle information above.
            </Typography>
          </Alert>
        )}

        {/* Vehicle Documents */}
        <Box sx={{ opacity: !vehicleId ? 0.5 : 1, pointerEvents: !vehicleId ? 'none' : 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Vehicle Documents
          </Typography>

          {isVehicleRegistrationRequired && (
            <Box sx={{ mb: 3 }}>
              <DocumentUploadCard
                title="Vehicle Registration (Blue Book)"
                description="Upload all pages of your vehicle registration document clearly"
                onUpload={(file) =>
                  handleDocumentUpload(file, 'registrationDocument')
                }
                uploadedFile={uploadedDocs.registrationDocument}
                onRemove={() =>
                  setUploadedDocs((prev) => ({
                    ...prev,
                    registrationDocument: null,
                  }))
                }
              />
            </Box>
          )}

          {isInsuranceRequired && (
            <Box sx={{ mb: 3 }}>
              <DocumentUploadCard
                title="Insurance Certificate"
                description="Upload your valid comprehensive insurance certificate"
                onUpload={(file) =>
                  handleDocumentUpload(file, 'insuranceCertificate')
                }
                uploadedFile={uploadedDocs.insuranceCertificate}
                onRemove={() =>
                  setUploadedDocs((prev) => ({
                    ...prev,
                    insuranceCertificate: null,
                  }))
                }
              />
            </Box>
          )}

          {isRoadTaxRequired && (
            <Box sx={{ mb: 3 }}>
              <DocumentUploadCard
                title="Road Tax Certificate"
                description="Upload your valid road tax certificate"
                onUpload={(file) =>
                  handleDocumentUpload(file, 'roadTaxCertificate')
                }
                uploadedFile={uploadedDocs.roadTaxCertificate}
                onRemove={() =>
                  setUploadedDocs((prev) => ({
                    ...prev,
                    roadTaxCertificate: null,
                  }))
                }
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
                onRemove={() =>
                  setUploadedDocs((prev) => ({ ...prev, fitnessDocument: null }))
                }
              />
            </Box>
          )}

          {/* Vehicle Photos */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
            Vehicle Photos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload clear photos of your vehicle from all angles
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <DocumentUploadCard
                title="Front View"
                description="Take a photo of the vehicle from the front"
                onUpload={(file) => handleVehiclePhotoUpload(file, 'front')}
                uploadedFile={vehiclePhotos.front}
                onRemove={() =>
                  setVehiclePhotos((prev) => ({ ...prev, front: null }))
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DocumentUploadCard
                title="Back View"
                description="Take a photo of the vehicle from the back"
                onUpload={(file) => handleVehiclePhotoUpload(file, 'back')}
                uploadedFile={vehiclePhotos.back}
                onRemove={() =>
                  setVehiclePhotos((prev) => ({ ...prev, back: null }))
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DocumentUploadCard
                title="Left Side View"
                description="Take a photo of the vehicle from the left side"
                onUpload={(file) => handleVehiclePhotoUpload(file, 'left')}
                uploadedFile={vehiclePhotos.left}
                onRemove={() =>
                  setVehiclePhotos((prev) => ({ ...prev, left: null }))
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DocumentUploadCard
                title="Right Side View"
                description="Take a photo of the vehicle from the right side"
                onUpload={(file) => handleVehiclePhotoUpload(file, 'right')}
                uploadedFile={vehiclePhotos.right}
                onRemove={() =>
                  setVehiclePhotos((prev) => ({ ...prev, right: null }))
                }
              />
            </Grid>
          </Grid>
        </Box>

        {/* Important Notice and Submit - Only in add mode */}
        {isEditMode && (
          <>
            <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 3 }}>
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
              onClick={handleSubmit}
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !vehicleId || !areAllDocumentsUploaded()}
              sx={{ mt: 3, height: 56, borderRadius: 3, fontWeight: 600 }}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading
                ? 'Submitting...'
                : 'Submit Vehicle for Verification'}
            </Button>

            {vehicleId && !areAllDocumentsUploaded() && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mt: 2 }}
              >
                Please upload all required documents and photos before submitting
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}