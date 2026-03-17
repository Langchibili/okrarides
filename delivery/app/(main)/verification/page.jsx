'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  DirectionsCar as CarIcon,
  Description as DocumentIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDriver } from '@/lib/hooks/useDriver';
import { getVerificationStatus } from '@/Functions';
import { VERIFICATION_STATUS, DOCUMENT_TYPE } from '@/Constants';

export default function VerificationPage() {
  const router = useRouter();
  const { driverProfile, adminSettings, refreshDriverProfile } = useDriver();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await getVerificationStatus();
      if (response.success) {
        setVerificationData(response.verification);
        determineActiveStep(response.verification);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineActiveStep = (verification) => {
    if (!verification.documents || Object.keys(verification.documents).length === 0) {
      setActiveStep(0);
    } else if (!verification.vehicle) {
      setActiveStep(1);
    } else if (verification.status === VERIFICATION_STATUS.PENDING) {
      setActiveStep(2);
    } else if (verification.status === VERIFICATION_STATUS.APPROVED) {
      setActiveStep(3);
    }
  };

  const requiredDocuments = [
    {
      type: DOCUMENT_TYPE.DRIVERS_LICENSE,
      label: "Driver's License",
      required: adminSettings?.requireDriverLicense !== false,
    },
    {
      type: DOCUMENT_TYPE.NATIONAL_ID,
      label: 'National ID',
      required: adminSettings?.requireNationalId !== false,
    },
    {
      type: DOCUMENT_TYPE.PROOF_OF_ADDRESS,
      label: 'Proof of Address',
      required: adminSettings?.requireProofOfAddress !== false,
    },
  ];

  const vehicleDocuments = [
    {
      type: DOCUMENT_TYPE.VEHICLE_REGISTRATION,
      label: 'Vehicle Registration',
      required: true,
    },
    {
      type: DOCUMENT_TYPE.INSURANCE,
      label: 'Insurance Certificate',
      required: adminSettings?.requireInsurance !== false,
    },
    {
      type: DOCUMENT_TYPE.ROAD_TAX,
      label: 'Road Tax Certificate',
      required: adminSettings?.requireRoadTax !== false,
    },
    {
      type: DOCUMENT_TYPE.FITNESS_CERTIFICATE,
      label: 'Fitness Certificate',
      required: adminSettings?.requireFitnessDocument !== false,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case VERIFICATION_STATUS.APPROVED:
        return 'success';
      case VERIFICATION_STATUS.PENDING:
        return 'warning';
      case VERIFICATION_STATUS.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case VERIFICATION_STATUS.APPROVED:
        return <CheckIcon color="success" />;
      case VERIFICATION_STATUS.PENDING:
        return <PendingIcon color="warning" />;
      case VERIFICATION_STATUS.REJECTED:
        return <RejectedIcon color="error" />;
      default:
        return <UncheckedIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Loading verification status...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Driver Verification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete all steps to start driving
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Current Status Alert */}
        {driverProfile?.verificationStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert
              severity={
                driverProfile.verificationStatus === VERIFICATION_STATUS.APPROVED
                  ? 'success'
                  : driverProfile.verificationStatus === VERIFICATION_STATUS.PENDING
                  ? 'warning'
                  : driverProfile.verificationStatus === VERIFICATION_STATUS.REJECTED
                  ? 'error'
                  : 'info'
              }
              icon={getStatusIcon(driverProfile.verificationStatus)}
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Status: {driverProfile.verificationStatus.replace('_', ' ').toUpperCase()}
              </Typography>
              {driverProfile.verificationStatus === VERIFICATION_STATUS.PENDING && (
                <Typography variant="body2">
                  Your documents are under review. We'll notify you once approved.
                </Typography>
              )}
              {driverProfile.verificationStatus === VERIFICATION_STATUS.APPROVED && (
                <Typography variant="body2">
                  You're verified! You can now start accepting rides.
                </Typography>
              )}
              {driverProfile.verificationStatus === VERIFICATION_STATUS.REJECTED && (
                <Typography variant="body2">
                  Your verification was rejected. {driverProfile.verificationNotes}
                </Typography>
              )}
            </Alert>
          </motion.div>
        )}

        {/* Verification Steps */}
        {driverProfile?.verificationStatus === VERIFICATION_STATUS.PENDING? null : <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Upload Documents */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Upload Personal Documents</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Upload the following required documents:
                </Typography>
                <List>
                  {requiredDocuments
                    .filter((doc) => doc.required)
                    .map((doc) => {
                      const isUploaded = verificationData?.documents?.[doc.type];
                      return (
                        <ListItem key={doc.type}>
                          <ListItemIcon>
                            {isUploaded ? (
                              <CheckIcon color="success" />
                            ) : (
                              <UncheckedIcon />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={doc.label}
                            secondary={
                              isUploaded ? 'Uploaded' : 'Required'
                            }
                          />
                        </ListItem>
                      );
                    })}
                </List>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => router.push('/verification/documents')}
                    sx={{ mr: 1 }}
                  >
                    Upload Documents
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Add Vehicle */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Add Vehicle Information</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add your vehicle and upload required vehicle documents
                </Typography>
                {verificationData?.vehicle ? (
                  <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Vehicle Added: {verificationData.vehicle.make}{' '}
                      {verificationData.vehicle.model} (
                      {verificationData.vehicle.numberPlate})
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      No vehicle added yet
                    </Typography>
                  </Alert>
                )}
                <List>
                  {vehicleDocuments
                    .filter((doc) => doc.required)
                    .map((doc) => {
                      const isUploaded = verificationData?.vehicleDocuments?.[doc.type];
                      return (
                        <ListItem key={doc.type}>
                          <ListItemIcon>
                            {isUploaded ? (
                              <CheckIcon color="success" />
                            ) : (
                              <UncheckedIcon />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={doc.label}
                            secondary={
                              isUploaded ? 'Uploaded' : 'Required'
                            }
                          />
                        </ListItem>
                      );
                    })}
                </List>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<CarIcon />}
                    onClick={() => router.push('/vehicle/add')}
                    sx={{ mr: 1 }}
                  >
                    {verificationData?.vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Await Approval */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Verification Review</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your documents are being reviewed by our team. This usually takes
                  24-48 hours.
                </Typography>
                {driverProfile?.verificationStatus === VERIFICATION_STATUS.PENDING && (
                  <Alert severity="warning" icon={<PendingIcon />}>
                    <Typography variant="body2">
                      Verification in progress...
                    </Typography>
                  </Alert>
                )}
                {driverProfile?.verificationStatus === VERIFICATION_STATUS.REJECTED && (
                  <Alert severity="error" icon={<RejectedIcon />}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Verification Rejected
                    </Typography>
                    <Typography variant="body2">
                      {driverProfile.verificationNotes ||
                        'Please re-upload correct documents'}
                    </Typography>
                  </Alert>
                )}
              </StepContent>
            </Step>

            {/* Step 4: Approved */}
            <Step>
              <StepLabel>
                <Typography variant="h6">Verified & Ready!</Typography>
              </StepLabel>
              <StepContent>
                {driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED ? (
                  <Box>
                    <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Congratulations! You're verified.
                      </Typography>
                      <Typography variant="body2">
                        You can now subscribe and start accepting rides.
                      </Typography>
                    </Alert>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => router.push('/subscription/plans')}
                      sx={{ mr: 1 }}
                    >
                      View Subscription Plans
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => router.push('/home')}
                    >
                      Go to Dashboard
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Complete previous steps to get verified
                  </Typography>
                )}
              </StepContent>
            </Step>
          </Stepper>
        </Paper>}

        {/* Help Section */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Need Help?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            If you're having trouble with verification, please contact support:
          </Typography>
          <Button variant="outlined" href="tel:+260971234567">
            Call Support
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}

