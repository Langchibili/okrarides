'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  IconButton,
  Chip,
  Switch,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PersonOutline as ProfileIcon,
  Settings as SettingsIcon,
  DirectionsCar as VehicleIcon,
  VerifiedUser as VerifiedIcon,
  Assessment as PerformanceIcon,
  CardGiftcard as ReferralIcon,
  Help as HelpIcon,
  Description as DocumentIcon,
  Logout as LogoutIcon,
  ChevronRight as ChevronIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  CardGiftcard,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDriver } from '@/lib/hooks/useDriver';
import { VERIFICATION_STATUS } from '@/Constants';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { driverProfile, isOnline, toggleOnline } = useDriver();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const getVerificationBadge = () => {
    switch (driverProfile?.verificationStatus) {
      case VERIFICATION_STATUS.APPROVED:
        return (
          <Chip
            label="✓ Verified"
            color="success"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      case VERIFICATION_STATUS.PENDING:
        return (
          <Chip
            label="⏳ Pending"
            color="warning"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      case VERIFICATION_STATUS.REJECTED:
        return (
          <Chip
            label="✗ Rejected"
            color="error"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            label="Not Verified"
            color="default"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* AppBar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Profile
          </Typography>
          <IconButton color="inherit" onClick={() => router.push('/profile/edit')}>
            <EditIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 4, mb: 3, textAlign: 'center' }}>
            <Avatar
              src={user?.profilePicture}
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 2,
                border: 3,
                borderColor: 'primary.main',
              }}
            >
              {user?.firstName?.[0]}
            </Avatar>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {user?.firstName} {user?.lastName}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user?.phoneNumber}
            </Typography>

            {getVerificationBadge()}

            {/* Driver Stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 2,
                mt: 3,
                pt: 3,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {driverProfile?.totalRides || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Rides
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  <StarIcon
                    sx={{ fontSize: 20, color: 'warning.main', verticalAlign: 'middle' }}
                  />{' '}
                  {driverProfile?.averageRating?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rating
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {driverProfile?.completionRate?.toFixed(0) || 0}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completion
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Account Section */}
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
          <List disablePadding>
            <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                ACCOUNT
              </Typography>
            </ListItem>

            <ListItemButton onClick={() => router.push('/profile/edit')}>
              <ListItemIcon>
                <ProfileIcon />
              </ListItemIcon>
              <ListItemText
                primary="Edit Profile"
                secondary="Name, photo, contact info"
              />
              <ChevronIcon />
            </ListItemButton>

            <Divider />

            <ListItemButton onClick={() => router.push('/verification')}>
              <ListItemIcon>
                <VerifiedIcon color={driverProfile?.verificationStatus === VERIFICATION_STATUS.APPROVED ? 'success' : 'default'} />
              </ListItemIcon>
              <ListItemText
                primary="Verification Status"
                secondary={driverProfile?.verificationStatus || 'Not started'}
              />
              <ChevronIcon />
            </ListItemButton>

            <Divider />

            <ListItemButton onClick={() => router.push('/vehicle')}>
              <ListItemIcon>
                <VehicleIcon />
              </ListItemIcon>
              <ListItemText
                primary="Vehicle Information"
                secondary={
                  driverProfile?.assignedVehicle
                    ? `${driverProfile.assignedVehicle.make} ${driverProfile.assignedVehicle.model}`
                    : 'No vehicle added'
                }
              />
              <ChevronIcon />
            </ListItemButton>

            <Divider />

            <ListItemButton onClick={() => router.push('/profile/performance')}>
              <ListItemIcon>
                <PerformanceIcon />
              </ListItemIcon>
              <ListItemText
                primary="Performance Metrics"
                secondary="Stats, ratings, completion rate"
              />
              <ChevronIcon />
            </ListItemButton>
          </List>
        </Paper>

        {/* Earnings & Finance */}
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
          <List disablePadding>
            <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                EARNINGS & FINANCE
              </Typography>
            </ListItem>

            <ListItemButton onClick={() => router.push('/subscription')}>
              <ListItemIcon>
                <CardGiftcard/>
              </ListItemIcon>
              <ListItemText
                primary="Subscription"
                secondary={
                  driverProfile?.subscriptionStatus === 'active'
                    ? 'Active - No commission'
                    : 'View plans'
                }
              />
              <ChevronIcon />
            </ListItemButton>

            <Divider />

            <ListItemButton onClick={() => router.push('/earnings/withdraw')}>
              <ListItemIcon>
                <DocumentIcon />
              </ListItemIcon>
              <ListItemText
                primary="Withdrawals"
                secondary="Request withdrawal"
              />
              <ChevronIcon />
            </ListItemButton>

            <Divider />

            <ListItemButton onClick={() => router.push('/profile/referrals')}>
              <ListItemIcon>
                <ReferralIcon />
              </ListItemIcon>
              <ListItemText
                primary="Referral Program"
                secondary="Earn points by referring"
              />
              <ChevronIcon />
            </ListItemButton>
          </List>
        </Paper>

        {/* Support & Settings */}
        <Paper elevation={2} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
          <List disablePadding>
            <ListItem sx={{ bgcolor: 'background.default', py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                SUPPORT & SETTINGS
              </Typography>
            </ListItem>

            <ListItemButton onClick={() => router.push('/profile/settings')}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                secondary="App preferences, notifications"
              />
              <ChevronIcon />
            </ListItemButton>

            <Divider />

            <ListItemButton onClick={() => router.push('/help')}>
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText
                primary="Help Center"
                secondary="FAQs, guides, contact support"
              />
              <ChevronIcon />
            </ListItemButton>

            <Divider />

            <ListItemButton onClick={() => router.push('/profile/legal')}>
              <ListItemIcon>
                <DocumentIcon />
              </ListItemIcon>
              <ListItemText
                primary="Legal"
                secondary="Terms, privacy policy"
              />
              <ChevronIcon />
            </ListItemButton>
          </List>
        </Paper>

        {/* Logout */}
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <ListItemButton onClick={handleLogout} sx={{ py: 2 }}>
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ color: 'error.main', fontWeight: 600 }}
            />
          </ListItemButton>
        </Paper>

        {/* App Version */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3 }}
        >
          OkraRides Driver v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}
