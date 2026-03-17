import { Box, Stepper, Step, StepLabel, useTheme, useMediaQuery } from '@mui/material'

const steps = [
  { label: 'License', key: 'license' },
  { label: 'ID', key: 'national-id' },
  { label: 'Address', key: 'proof-of-address' },
  { label: 'Vehicle', key: 'vehicle-type' },
  { label: 'Documents', key: 'vehicle-documents' },
  { label: 'Review', key: 'review' },
]

export const OnboardingProgress = ({ currentStep }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const activeStepIndex = steps.findIndex((step) => step.key === currentStep)

  return (
    <Box sx={{ mb: 4 }}>
      <Stepper activeStep={activeStepIndex} alternativeLabel={isMobile}>
        {steps.map((step, index) => (
          <Step key={step.key} completed={index < activeStepIndex}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                },
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}
