'use client'

import { Box, Typography, Button, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import {
  HourglassEmpty as PendingIcon,
  CheckCircle as CheckIcon,
  Notifications as NotificationIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const router = useRouter()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: 500, width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'warning.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <PendingIcon sx={{ fontSize: 50, color: 'warning.dark' }} />
          </Box>

          {/* Title */}
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
            Application Submitted!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, textAlign: 'center' }}
          >
            We're reviewing your documents
          </Typography>

          {/* Status Card */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              What's Next?
            </Typography>

            <List disablePadding>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Document Review"
                  secondary="Usually takes 24-48 hours"
                />
              </ListItem>

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Notification"
                  secondary="We'll notify you once approved"
                />
              </ListItem>

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <EmailIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Email Confirmation"
                  secondary="Check your email for updates"
                />
              </ListItem>
            </List>
          </Paper>

          {/* Action Button */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => router.push('/')}
            sx={{ height: 56, borderRadius: 4 }}
          >
            Back to Home
          </Button>
        </motion.div>