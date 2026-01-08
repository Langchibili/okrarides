'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Button,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  TrendingUp as TrendingUpIcon,
  LocalAtm as MoneyIcon,
  Assessment as ChartIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEarnings } from '@/lib/hooks/useEarnings';
import { EarningsCard } from '@/components/Driver/EarningsCard';
import { formatCurrency } from '@/Functions';

export default function EarningsPage() {
  const router = useRouter();
  const { earnings, fetchEarnings } = useEarnings();
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [period]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      await fetchEarnings(period);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event, newValue) => {
    setPeriod(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Earnings
          </Typography>
        </Toolbar>
        <Tabs
          value={period}
          onChange={handlePeriodChange}
          variant="fullWidth"
          textColor="inherit"
          TabIndicatorProps={{
            sx: { bgcolor: 'white', height: 3 },
          }}
        >
          <Tab label="Today" value="today" />
          <Tab label="Week" value="week" />
          <Tab label="Month" value="month" />
          <Tab label="Year" value="year" />
        </Tabs>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Total Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 4,
              background: `linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)`,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              Total Earnings
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                mb: 1,
              }}
            >
              {formatCurrency(earnings?.total || 0)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {period === 'today' && "Today's"}
              {period === 'week' && 'This Week'}
              {period === 'month' && 'This Month'}
              {period === 'year' && 'This Year'} earnings
            </Typography>
          </Paper>
        </motion.div>

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <EarningsCard
              title="Cash Rides"
              amount={earnings?.cash || 0}
              icon={<MoneyIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={6}>
            <EarningsCard
              title="Digital Rides"
              amount={earnings?.digital || 0}
              icon={<MoneyIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={6}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {earnings?.totalRides || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Rides
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {formatCurrency(earnings?.averageRide || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg per Ride
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<TrendingUpIcon />}
            onClick={() => router.push('/earnings/analytics')}
            sx={{ height: 56, borderRadius: 3 }}
          >
            View Analytics
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<MoneyIcon />}
            onClick={() => router.push('/earnings/withdraw')}
            sx={{ height: 56, borderRadius: 3 }}
          >
            Withdraw
          </Button>
        </Box>

        {/* Recent Transactions */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Recent Transactions
          </Typography>
          {/* Add transaction list here */}
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No transactions yet
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
