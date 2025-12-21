'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Button,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Launch as ExternalLinkIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { APP_NAME, APP_VERSION, APP_TAGLINE } from '@/Constants';

export default function AboutPage() {
  const router = useRouter();

  const links = [
    { label: 'Terms of Service', url: 'https://okrarides.com/terms' },
    { label: 'Privacy Policy', url: 'https://okrarides.com/privacy' },
    { label: 'License Agreement', url: 'https://okrarides.com/license' },
    { label: 'Visit Website', url: 'https://okrarides.com' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton onClick={() => router.back()} edge="start">
          <BackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          About
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* App Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            sx={{
              p: 4,
              mb: 3,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {APP_NAME}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
              {APP_TAGLINE}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Version {APP_VERSION}
            </Typography>
          </Paper>
        </motion.div>

        {/* About Content */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Okra Rides is Zambia's leading multi-modal transport platform,
            connecting riders with safe, reliable, and affordable transportation
            options across the country.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>Features:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 3 }}>
            <li>Multiple transport options (Taxi, Bus, Motorcycle)</li>
            <li>Real-time tracking</li>
            <li>Secure payments</li>
            <li>24/7 support</li>
            <li>Rewards program</li>
          </Typography>
        </Paper>

        {/* Links */}
        <Paper sx={{ mb: 3 }}>
          {links.map((link, index) => (
            <Box key={link.label}>
              {index > 0 && <Divider />}
              <Button
                fullWidth
                endIcon={<ExternalLinkIcon />}
                onClick={() => window.open(link.url, '_blank')}
                sx={{
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  py: 2,
                  px: 2,
                }}
              >
                <Typography>{link.label}</Typography>
              </Button>
            </Box>
          ))}
        </Paper>

        {/* Copyright */}
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="caption" color="text.secondary">
            © 2025 Okra Rides. All rights reserved.
            <br />
            Made with ❤️ in Zambia 🇿🇲
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
