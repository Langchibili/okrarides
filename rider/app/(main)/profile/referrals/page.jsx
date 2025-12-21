'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  CardGiftcard as GiftIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { profileAPI } from '@/lib/api/profile';
import { formatCurrency, formatDate, copyToClipboard } from '@/Functions';
import { useAuth } from '@/lib/hooks/useAuth';
import { Spinner } from '@/components/ui';

export default function ReferralsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const referralCode = user?.affiliateProfile?.referralCode || 'LOADING...';
  const referralLink = `https://okrarides.com/signup?ref=${referralCode}`;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, txData] = await Promise.all([
        profileAPI.getReferralStats(),
        profileAPI.getReferralTransactions({ limit: 10 }),
      ]);
      setStats(statsData);
      setTransactions(txData.data);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Okra Rides!',
          text: `Use my referral code ${referralCode} to get K20 bonus on your first ride!`,
          url: referralLink,
        });
      } catch (error) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const copied = await copyToClipboard(referralLink);
    if (copied) {
      alert('Referral link copied to clipboard!');
    }
  };

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
        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
          Refer & Earn
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* Referral Code Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
                  color: 'white',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.9 }}>
                  Your Referral Code
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  {referralCode}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ShareIcon />}
                    onClick={handleShare}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                    }}
                  >
                    Share
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CopyIcon />}
                    onClick={handleCopy}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' },
                    }}
                  >
                    Copy Link
                  </Button>
                </Box>
              </Paper>
            </motion.div>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: '2rem', color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats?.totalReferrals || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Referrals
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
              <Grid item xs={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <GiftIcon sx={{ fontSize: '2rem', color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {formatCurrency(stats?.pointsBalance || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Points Balance
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>

            {/* How It Works */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                How It Works
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Share your code
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Send your referral code to friends and family
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      They sign up
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      They get K20 bonus on their first ride
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      You earn points
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get K50 in points for each successful referral
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Recent Activity */}
            {transactions.length > 0 && (
              <Paper sx={{ mb: 3 }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Recent Activity
                  </Typography>
                </Box>
                <Divider />
                <List disablePadding>
                  {transactions.map((txn, index) => (
                    <Box key={txn.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText
                          primary={`${txn.referredUser?.firstName || 'User'} signed up`}
                          secondary={formatDate(txn.createdAt, 'short')}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                          +{formatCurrency(txn.amount)}
                        </Typography>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </Paper>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
