'use client'

import { Box, Container, useTheme } from '@mui/material'
import { usePathname } from 'next/navigation'

export default function OnboardingLayout({ children }) {
  const theme = useTheme()
  const pathname = usePathname()
  
  // Hide header on welcome screen
  const isWelcomeScreen = pathname.includes('/welcome')

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 4,
      }}
    >
      <Container maxWidth="sm">
        {children}
      </Container>
    </Box>
  )
}
