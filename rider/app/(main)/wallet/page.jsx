'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  AccountBalance as WalletIcon,
  Add as AddIcon,
  Remove as WithdrawIcon,
  History as HistoryIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWallet } from '@/lib/hooks/useWallet';
import { formatCurrency, formatDate } from '@/Functions';
import { Button, Spinner, EmptyState } from '@/components/ui';

export default function WalletPage() {
  const router = useRouter();
  const { balance, transactions, loading, loadTransactions } = useWallet();
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Load recent transactions
  useState(() => {
    setLoadingTransactions(true);
    loadTransactions({ limit: 10 })
      .finally(() => setLoadingTransactions(false));
  }, []);

  const quickActions = [
    {
      icon: <AddIcon />,
      label: 'Top Up',
      color: 'success.main',
      action: () => router.push('/wallet/topup'),
    },
    {
      icon: <WithdrawIcon />,
      label: 'Withdraw',
      color: 'error.main',
      action: () => router.push('/wallet/withdraw'),
    },
    {
      icon: <PaymentIcon />,
      label: 'Payment Methods',
      color: 'primary.main',
      action: () => router.push('/wallet/payment-methods'),
    },
    {
      icon: <HistoryIcon />,
      label: 'All Transactions',
      color: 'info.main',
      action: () => router.push('/wallet/transactions'),
    },
  ];

  const getTransactionIcon = (type) => {
    const icons = {
      ride_payment: <TrendingDownIcon />,
      float_topup: <TrendingUpIcon />,
      withdrawal: <TrendingDownIcon />,
      refund: <TrendingUpIcon />,
    };
    return icons[type] || <HistoryIcon />;
  };

  const getTransactionColor = (type) => {
    const colors = {
      ride_payment: 'error.main',
      float_topup: 'success.main',
      withdrawal: 'error.main',
      refund: 'success.main',
    };
    return colors[type] || 'text.secondary';
  };

  const isCredit = (type) => {
    return ['float_topup', 'refund', 'affiliate_payout'].includes(type);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          pt: 4,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Wallet
        </Typography>
      </Box>

      {/* Balance Card */}
      <Box sx={{ p: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
              color: 'white',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WalletIcon sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Available Balance
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {loading ? '...' : formatCurrency(balance)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Zambian Kwacha (ZMW)
            </Typography>
          </Paper>
        </motion.div>

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={6} key={action.label}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paper
                  onClick={action.action}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${action.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.color,
                      mx: 'auto',
                      mb: 1,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                  >
                    {action.label}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Recent Transactions */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Transactions
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => router.push('/wallet/transactions')}
            >
              View All
            </Button>
          </Box>

          {loadingTransactions ? (
            <Spinner />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<HistoryIcon sx={{ fontSize: '3rem' }} />}
              title="No transactions yet"
              description="Your transaction history will appear here"
            />
          ) : (
            <Paper>
              <List disablePadding>
                {transactions.map((transaction, index) => (
                  <Box key={transaction.id}>
                    {index > 0 && <Divider />}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ListItem
                        button
                        onClick={() => router.push(`/wallet/transactions/${transaction.id}`)}
                      >
                        <ListItemIcon>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              bgcolor: `${getTransactionColor(transaction.type)}20`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: getTransactionColor(transaction.type),
                            }}
                          >
                            {getTransactionIcon(transaction.type)}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {transaction.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(transaction.createdAt, 'short')} • {formatDate(transaction.createdAt, 'time')}
                            </Typography>
                          }
                        />
                        <Box sx={{ textAlign: 'right', mr: 1 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: isCredit(transaction.type) ? 'success.main' : 'error.main',
                            }}
                          >
                            {isCredit(transaction.type) ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </Box>
                        <IconButton size="small">
                          <ChevronRightIcon />
                        </IconButton>
                      </ListItem>
                    </motion.div>
                  </Box>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
