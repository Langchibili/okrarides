'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Timer as TimerIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { formatCurrency } from '@/Functions';

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const {
    plans,
    currentSubscription,
    loading,
    error,
    fetchPlans,
    startFreeTrial,
    subscribe,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      await fetchPlans();
    } catch (err) {
      console.error('Error loading plans:', err);
    }
  };

  const handleStartTrial = async (plan) => {
    if (window.confirm(`Start ${plan.freeTrialDays}-day free trial?`)) {
      try {
        setActionLoading(true);
        const response = await startFreeTrial(plan.id);
        if (response.success) {
          router.push('/home');
        }
      } catch (err) {
        console.error('Error starting trial:', err);
        alert(err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setActionLoading(true);
      setSelectedPlan(plan.id);
      const response = await subscribe(plan.id);
      if (response.success) {
        // Redirect to payment
        window.location.href = response.paymentUrl;
      }
    } catch (err) {
      console.error('Error subscribing:', err);
      alert(err.message);
    } finally {
      setActionLoading(false);
      setSelectedPlan(null);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
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
        }}
      >
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
          sx={{ minWidth: 'auto' }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Subscription Plans
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a plan and keep 100% of your earnings
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Subscription */}
        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${
                  currentSubscription.status === 'active'
                    ? '#4CAF50'
                    : '#FF9800'
                } 0%, ${
                  currentSubscription.status === 'active'
                    ? '#388E3C'
                    : '#F57C00'
                } 100%)`,
                color: 'white',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Current Plan: {currentSubscription.plan?.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                Status: {currentSubscription.status}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {currentSubscription.daysRemaining} days remaining • Expires:{' '}
                {new Date(currentSubscription.expiresAt).toLocaleDateString()}
              </Typography>
            </Paper>
          </motion.div>
        )}

        {/* Plans Grid */}
        <Grid container spacing={2}>
          {plans.map((plan, index) => (
            <Grid item xs={12} md={6} key={plan.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Paper
                  elevation={plan.isPopular ? 6 : 2}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    height: '100%',
                    position: 'relative',
                    border: plan.isPopular ? 3 : 0,
                    borderColor: 'primary.main',
                  }}
                >
                  {plan.isPopular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      icon={<StarIcon />}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 600,
                      }}
                    />
                  )}

                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {plan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 700, color: 'primary.main' }}
                    >
                      {formatCurrency(plan.price)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      per {plan.durationType}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {plan.hasFreeTrial && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <TimerIcon sx={{ color: 'success.dark' }} />
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: 'success.dark' }}
                      >
                        {plan.freeTrialDays} days free trial
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  {plan.hasFreeTrial && !currentSubscription && (
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      onClick={() => handleStartTrial(plan)}
                      disabled={actionLoading}
                      sx={{ mt: 2, height: 56, borderRadius: 3, fontWeight: 600 }}
                    >
                      {actionLoading && selectedPlan === plan.id ? (
                        <CircularProgress size={24} />
                      ) : (
                        `Start ${plan.freeTrialDays}-Day Free Trial`
                      )}
                    </Button>
                  )}

                  <Button
                    fullWidth
                    variant={plan.isPopular ? 'contained' : 'outlined'}
                    size="large"
                    onClick={() => handleSubscribe(plan)}
                    disabled={
                      currentSubscription?.plan?.id === plan.id || actionLoading
                    }
                    sx={{
                      mt: 2,
                      height: 56,
                      borderRadius: 3,
                      fontWeight: 600,
                    }}
                  >
                    {actionLoading && selectedPlan === plan.id ? (
                      <CircularProgress size={24} />
                    ) : currentSubscription?.plan?.id === plan.id ? (
                      'Current Plan'
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Benefits Section */}
        <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Why Subscribe?
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckIcon sx={{ color: 'success.dark' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Zero Commission
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep 100% of your ride earnings
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckIcon sx={{ color: 'primary.dark' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Unlimited Rides
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accept as many rides as you want
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckIcon sx={{ color: 'info.dark' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Priority Support
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get help faster when you need it
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'warning.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckIcon sx={{ color: 'warning.dark' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Real-time Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track your earnings and performance
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}

