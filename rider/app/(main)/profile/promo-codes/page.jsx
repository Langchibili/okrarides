'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Button,
  List,
  ListItem,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalOffer as PromoIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ridesAPI } from '@/lib/api/rides';
import { formatCurrency, formatDate } from '@/Functions';
import { EmptyState } from '@/components/ui';

export default function PromoCodesPage() {
  const router = useRouter();
  const [promoCode, setPromoCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [appliedPromos, setAppliedPromos] = useState([
    {
      id: 1,
      code: 'WELCOME20',
      discount: 20,
      type: 'percentage',
      expiresAt: '2025-12-31',
      usesLeft: 3,
    },
  ]);

  const handleValidate = async () => {
    if (!promoCode.trim()) {
      alert('Please enter a promo code');
      return;
    }

    try {
      setValidating(true);
      const result = await ridesAPI.validatePromoCode(promoCode.toUpperCase());
      if (result.valid) {
        alert('Promo code validated! You can use it on your next ride.');
        setPromoCode('');
      } else {
        alert(result.message || 'Invalid promo code');
      }
    } catch (error) {
      alert('Invalid or expired promo code');
    } finally {
      setValidating(false);
    }
  };

  const getDiscountText = (promo) => {
    if (promo.type === 'percentage') {
      return `${promo.discount}% OFF`;
    }
    return `${formatCurrency(promo.discount)} OFF`;
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
          Promo Codes
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Add Promo Code */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Enter Promo Code
          </Typography>
          <TextField
            fullWidth
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PromoIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleValidate}
            disabled={validating || !promoCode.trim()}
            startIcon={<AddIcon />}
            sx={{ height: 48 }}
          >
            {validating ? 'Validating...' : 'Apply Code'}
          </Button>
        </Paper>

        {/* Available Promos */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          My Promo Codes
        </Typography>

        {appliedPromos.length === 0 ? (
          <EmptyState
            icon={<PromoIcon sx={{ fontSize: '4rem' }} />}
            title="No promo codes"
            description="Add promo codes to get discounts on your rides"
          />
        ) : (
          <List disablePadding>
            {appliedPromos.map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Paper
                  sx={{
                    mb: 2,
                    p: 2,
                    border: 2,
                    borderColor: 'success.light',
                    borderStyle: 'dashed',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <PromoIcon sx={{ fontSize: '2rem', color: 'success.dark' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {promo.code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getDiscountText(promo)}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${promo.usesLeft} uses left`}
                      size="small"
                      color="success"
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Valid until {formatDate(promo.expiresAt, 'short')}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => router.push('/home')}
                    >
                      Use Now
                    </Button>
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
