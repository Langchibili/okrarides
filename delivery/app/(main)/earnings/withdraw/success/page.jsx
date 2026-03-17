'use client';

import { useRouter } from 'next/navigation';
import { Box, Paper, Typography, Button } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function WithdrawalSuccessPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <CheckIcon
              sx={{
                fontSize: 80,
                color: 'success.main',
                mb: 2,
              }}
            />
          </motion.div>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Withdrawal Requested!
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your withdrawal request has been submitted successfully. We'll process it within
            24 hours and send you an SMS confirmation.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => router.push('/earnings')}
            sx={{ mb: 1, height: 48, borderRadius: 3 }}
          >
            View Earnings
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => router.push('/home')}
            sx={{ height: 48, borderRadius: 3 }}
          >
            Go to Dashboard
          </Button>
        </Paper>
      </motion.div>
    </Box>
  );
}
