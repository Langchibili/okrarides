'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { walletAPI } from '@/lib/api/wallet';
import { formatCurrency, formatDate } from '@/Functions';
import { Spinner } from '@/components/ui';

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadTransaction();
    }
  }, [params.id]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const data = await walletAPI.getTransaction(params.id);
      setTransaction(data);
    } catch (error) {
      console.error('Error loading transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'success',
      pending: 'warning',
      failed: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const isCredit = (type) => {
    return ['float_topup', 'refund', 'affiliate_payout'].includes(type);
  };

  const handleDownloadReceipt = () => {
    // Create a simple receipt JSON
    const receipt = {
      transactionId: transaction.id,
      date: formatDate(transaction.createdAt, 'long'),
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
    };

    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `okra-transaction-${transaction.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Okra Rides Transaction',
          text: `Transaction: ${formatCurrency(transaction.amount)} - ${formatDate(
            transaction.createdAt,
            'short'
          )}`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Spinner />
      </Box>
    );
  }

  if (!transaction) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        <Typography>Transaction not found</Typography>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

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
          Transaction Details
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Amount Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              textAlign: 'center',
              background: isCredit(transaction.type)
                ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'
                : 'linear-gradient(135deg, #F44336 0%, #E57373 100%)',
              color: 'white',
            }}
          >
            <ReceiptIcon sx={{ fontSize: '3rem', mb: 2, opacity: 0.9 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {isCredit(transaction.type) ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Typography>
            <Chip
              label={transaction.status.toUpperCase()}
              size="small"
              color={getStatusColor(transaction.status)}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </Paper>
        </motion.div>

        {/* Transaction Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Transaction Information
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Transaction ID
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {transaction.id}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Type
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {transaction.type
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Date & Time
              </Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDate(transaction.createdAt, 'long')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(transaction.createdAt, 'time')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={transaction.status.toUpperCase()}
                size="small"
                color={getStatusColor(transaction.status)}
              />
            </Box>

            {transaction.paymentMethod && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {transaction.paymentMethod === 'cash' ? 'Cash' : 'OkraPay'}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </motion.div>

        {/* Related Ride Info */}
        {transaction.ride && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Related Ride
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Ride Code
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {transaction.ride.rideCode}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    mt: 0.5,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    From
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {transaction.ride.pickupLocation?.address || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ width: 2, height: 16, bgcolor: 'divider', ml: '5px', mb: 2 }} />

              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 1,
                    bgcolor: 'error.main',
                    mt: 0.5,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    To
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {transaction.ride.dropoffLocation?.address || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push(`/trips/${transaction.ride.id}`)}
                sx={{ mt: 2 }}
              >
                View Ride Details
              </Button>
            </Paper>
          </motion.div>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReceipt}
            sx={{ height: 48 }}
          >
            Download
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShare}
            sx={{ height: 48 }}
          >
            Share
          </Button>
        </Box>

        {/* Support Note */}
        <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            ℹ️ <strong>Need Help?</strong> If you have any questions about this
            transaction, please contact our support team.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
