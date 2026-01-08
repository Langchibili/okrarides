'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  MobileStepper,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableViews from 'react-swipeable-views';

const onboardingSteps = [
  {
    title: "Welcome to OkraRides",
    description: "Your reliable transport partner in Zambia",
    illustration: "🚗",
    color: "#FFC107",
  },
  {
    title: "Book Your Ride",
    description: "Taxi, bus, or motorcycle - we've got you covered",
    illustration: "📱",
    color: "#4CAF50",
  },
  {
    title: "Track in Real-Time",
    description: "Know exactly where your driver is",
    illustration: "📍",
    color: "#2196F3",
  },
  {
    title: "Safe & Secure",
    description: "All drivers are verified for your safety",
    illustration: "🛡️",
    color: "#FF9800",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = onboardingSteps.length;

  const handleNext = () => {
    if (activeStep === maxSteps - 1) {
      // Navigate to signup
      router.push('/signup');
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    router.push('/signup');
  };

  const handleStepChange = (step) => {
    setActiveStep(step);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Skip button */}
      <Box
        sx={{
          p: 2,
          textAlign: 'right',
        }}
      >
        <Button onClick={handleSkip} sx={{ color: 'text.secondary' }}>
          Skip
        </Button>
      </Box>

      {/* Swipeable content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <SwipeableViews
          axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
          index={activeStep}
          onChangeIndex={handleStepChange}
          enableMouseEvents
          resistance
        >
          {onboardingSteps.map((step, index) => (
            <Box
              key={index}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 4,
                textAlign: 'center',
              }}
            >
              <AnimatePresence mode="wait">
                {activeStep === index && (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {/* Illustration */}
                    <Box
                      sx={{
                        fontSize: '8rem',
                        mb: 4,
                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                      }}
                    >
                      {step.illustration}
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: step.color,
                      }}
                    >
                      {step.title}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.secondary',
                        maxWidth: 300,
                      }}
                    >
                      {step.description}
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          ))}
        </SwipeableViews>
      </Box>

      {/* Bottom controls */}
      <Box sx={{ p: 3, pb: 4 }}>
        {/* Stepper dots */}
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{
            bgcolor: 'transparent',
            '& .MuiMobileStepper-dot': {
              width: 8,
              height: 8,
              mx: 0.5,
            },
            '& .MuiMobileStepper-dotActive': {
              bgcolor: onboardingSteps[activeStep].color,
              width: 24,
            },
          }}
          nextButton={null}
          backButton={null}
        />

        {/* Next button */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleNext}
            sx={{
              mt: 3,
              height: 56,
              bgcolor: onboardingSteps[activeStep].color,
              '&:hover': {
                bgcolor: onboardingSteps[activeStep].color,
                filter: 'brightness(0.9)',
              },
            }}
          >
            {activeStep === maxSteps - 1 ? 'Get Started' : 'Next'}
          </Button>
        </motion.div>
      </Box>
    </Box>
  );
}
