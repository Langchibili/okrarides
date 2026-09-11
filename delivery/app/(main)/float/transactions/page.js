'use client';
// PATH: driver/app/(main)/float/transactions/page.js
//
// Fetches ledger entries of type float_topup and withdrawal for the
// authenticated driver and renders them as a scrollable transaction list
// with a summary card at the top.
//
// API:   GET /api/ledger-entries?filters[driver][:eq]={userId}&filters[type][$in][0]=float_topup&filters[type][$in][1]=withdrawal&sort=createdAt:desc&populate=*&pagination[pageSize]=30&pagination[page]={page}
// The response follows standard Strapi pagination:
//   { data: [...], meta: { pagination: { page, pageCount, total } } }

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Paper,
  Chip, CircularProgress, Alert, Divider, Button,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack         as BackIcon,
  ArrowUpward       as TopupIcon,
  ArrowDownward     as WithdrawIcon,
  AccountBalanceWallet as WalletIcon,
  FilterList        as FilterIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@/Functions';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 30;

const TYPE_META = {
  float_topup: {
    label:  'Float Top-up',
    icon:   TopupIcon,
    color:  'success',
    sign:   '+',
    bgHex:  '#e8f5e9',
    iconHex:'#2e7d32',
  },
  withdrawal: {
    label:  'Withdrawal',
    icon:   WithdrawIcon,
    color:  'error',
    sign:   '-',
    bgHex:  '#fce4ec',
    iconHex:'#c62828',
  },
};

const STATUS_CHIP = {
  settled:    { label: 'Settled',    color: 'success' },
  pending:    { label: 'Pending',    color: 'warning' },
  processing: { label: 'Processing', color: 'warning' },
  failed:     { label: 'Failed',     color: 'error'   },
  reversed:   { label: 'Reversed',   color: 'default' },
};

const FILTERS = [
  { value: 'all',        label: 'All'         },
  { value: 'float_topup',label: 'Top-ups'     },
  { value: 'withdrawal', label: 'Withdrawals' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });
}

function groupByDate(entries) {
  const groups = {};
  entries.forEach(entry => {
    const d     = new Date(entry.createdAt || entry.attributes?.createdAt);
    const label = d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  });
  return groups;
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5 }}>
      <Skeleton variant="circular" width={44} height={44} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="55%" height={18} />
        <Skeleton width="35%" height={14} sx={{ mt: 0.5 }} />
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Skeleton width={70} height={18} />
        <Skeleton width={50} height={14} sx={{ mt: 0.5 }} />
      </Box>
    </Box>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TransactionRow({ entry, index }) {
  const raw    = entry.attributes ?? entry;
  const type   = raw.type || 'float_topup';
  const meta   = TYPE_META[type] || TYPE_META.float_topup;
  const Icon   = meta.icon;
  const status = raw.ledgerStatus || 'settled';
  const chip   = STATUS_CHIP[status] || STATUS_CHIP.settled;
  const amount = Math.abs(parseFloat(raw.amount || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Box sx={{
        display:        'flex',
        alignItems:     'center',
        gap:            2,
        px:             2,
        py:             1.75,
        cursor:         'default',
        transition:     'background 0.15s',
        '&:hover':      { bgcolor: 'action.hover' },
      }}>
        {/* Icon */}
        <Box sx={{
          width:          44,
          height:         44,
          borderRadius:   '50%',
          bgcolor:        meta.bgHex,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
        }}>
          <Icon sx={{ fontSize: 22, color: meta.iconHex }} />
        </Box>

        {/* Description */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {meta.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            {formatDate(raw.createdAt)}
          </Typography>
          {raw.description && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {raw.description}
            </Typography>
          )}
        </Box>

        {/* Amount + status */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            color={type === 'float_topup' ? 'success.main' : 'error.main'}
          >
            {meta.sign}{formatCurrency(amount)}
          </Typography>
          <Chip
            label={chip.label}
            color={chip.color}
            size="small"
            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, mt: 0.25 }}
          />
        </Box>
      </Box>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function FloatTransactionsPage() {
  const router       = useRouter();
  const { user }     = useAuth();

  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore,setLoadingMore]= useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(false);
  const [filter,     setFilter]     = useState('all');
  const [summary,    setSummary]    = useState({ totalTopup: 0, totalWithdrawal: 0, net: 0 });

  // ── Build API query ──────────────────────────────────────────────────────────
  const buildQuery = useCallback((pg = 1, typeFilter = 'all') => {
    const base = `/ledger-entries?populate=*&pagination[pageSize]=${PAGE_SIZE}&pagination[page]=${pg}&sort=createdAt:desc`;

    const userId = user?.id;
    const userFilter = userId ? `&filters[driver][$eq]=${userId}` : '';

    if (typeFilter === 'all') {
      return `${base}${userFilter}&filters[type][$in][0]=float_topup&filters[type][$in][1]=withdrawal`;
    }
    return `${base}${userFilter}&filters[type][$eq]=${typeFilter}`;
  }, [user?.id]);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async (pg = 1, typeFilter = 'all', append = false) => {
    if (pg === 1) setLoading(true);
    else          setLoadingMore(true);
    setError(null);

    try {
      const res = await apiClient.get(buildQuery(pg, typeFilter));

      // Normalise — Strapi v4 wraps in data.data; some setups return flat arrays
      const raw       = res?.data ?? res;
      const items     = Array.isArray(raw) ? raw : (raw?.data ?? []);
      const pagination= res?.meta?.pagination ?? raw?.meta?.pagination ?? {};
      const pageCount = pagination.pageCount ?? 1;

      const normalised = items.map(item => ({
        id:          item.id,
        ...(item.attributes ?? item),
      }));

      setEntries(prev => append ? [...prev, ...normalised] : normalised);
      setHasMore(pg < pageCount);

      // ── Summary (only recalculate on full reload, not append) ────────────────
      if (!append) {
        // Fetch ALL to compute summary (or trust the server to send aggregates).
        // For simplicity we sum from the first page; a backend aggregate endpoint
        // would be more accurate for large datasets.
        let totalTopup      = 0;
        let totalWithdrawal = 0;
        normalised.forEach(e => {
          const amt = Math.abs(parseFloat(e.amount || 0));
          if (e.type === 'float_topup')  totalTopup      += amt;
          if (e.type === 'withdrawal')   totalWithdrawal += amt;
        });
        setSummary({ totalTopup, totalWithdrawal, net: totalTopup - totalWithdrawal });
      }
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    if (user?.id) {
      setPage(1);
      fetchEntries(1, filter, false);
    }
  }, [user?.id, filter]); // eslint-disable-line

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage, filter, true);
  };

  const handleFilterChange = (value) => {
    if (value === filter) return;
    setFilter(value);
    setPage(1);
  };

  // ── Driver's current float balance from useAuth ───────────────────────────
  const floatBalance = parseFloat(
    user?.driverProfile?.floatBalance ??
    user?.driver_profile?.floatBalance ??
    0,
  );

  // ── Group entries by date ─────────────────────────────────────────────────
  const grouped = groupByDate(entries);

  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>

      {/* ── App bar ────────────────────────────────────────────────────────── */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.back()} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            Float Transactions
          </Typography>
          <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        </Toolbar>
      </AppBar>

      {/* ── Summary card ───────────────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        px: 3, pt: 3, pb: 4,
      }}>
        {/* Balance */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <WalletIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8, textTransform: 'uppercase', fontSize: '0.65rem' }}>
              Current Float Balance
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              {formatCurrency(floatBalance)}
            </Typography>
          </Box>
        </Box>

        {/* In / Out tiles */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Box sx={{
            p: 1.75, borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <TopupIcon sx={{ fontSize: 14, color: '#69f0ae' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Total Topped Up
              </Typography>
            </Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#69f0ae' }}>
              {formatCurrency(summary.totalTopup)}
            </Typography>
          </Box>
          <Box sx={{
            p: 1.75, borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <WithdrawIcon sx={{ fontSize: 14, color: '#ff5252' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Total Withdrawn
              </Typography>
            </Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#ff5252' }}>
              {formatCurrency(summary.totalWithdrawal)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', gap: 1 }}>
        {FILTERS.map(f => (
          <Chip
            key={f.value}
            label={f.label}
            onClick={() => handleFilterChange(f.value)}
            variant={filter === f.value ? 'filled' : 'outlined'}
            color={filter === f.value ? 'primary' : 'default'}
            size="small"
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />
        ))}
      </Box>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading && (
        <Paper elevation={0} sx={{ mx: 2, mt: 1, borderRadius: 3, overflow: 'hidden' }}>
          {[...Array(8)].map((_, i) => (
            <Box key={i}>
              {i > 0 && <Divider />}
              <SkeletonRow />
            </Box>
          ))}
        </Paper>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mx: 2, mt: 2 }}>{error}</Alert>
      )}

      {!loading && !error && entries.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
          <WalletIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No transactions yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            {filter === 'all'
              ? 'Your float top-ups and withdrawals will appear here.'
              : filter === 'float_topup'
              ? 'No top-ups found.'
              : 'No withdrawals found.'}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 3, borderRadius: 2, fontWeight: 600 }}
            onClick={() => router.push('/float/topup')}
          >
            Top Up Float
          </Button>
        </Box>
      )}

      {!loading && !error && entries.length > 0 && (
        <Box sx={{ mx: 2, mt: 1 }}>
          {Object.entries(grouped).map(([dateLabel, dayEntries]) => (
            <Box key={dateLabel} sx={{ mb: 1 }}>
              {/* Date heading */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  px: 1,
                  pt: 2,
                  pb: 0.5,
                  color: 'text.disabled',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                }}
              >
                {dateLabel}
              </Typography>

              <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <AnimatePresence>
                  {dayEntries.map((entry, i) => (
                    <Box key={entry.id}>
                      {i > 0 && <Divider />}
                      <TransactionRow
                        entry={entry}
                        index={i}
                      />
                    </Box>
                  ))}
                </AnimatePresence>
              </Paper>
            </Box>
          ))}

          {/* Load more */}
          {hasMore && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              {loadingMore
                ? <CircularProgress size={24} />
                : (
                  <Button
                    variant="outlined"
                    onClick={handleLoadMore}
                    sx={{ borderRadius: 2.5, fontWeight: 600 }}
                  >
                    Load More
                  </Button>
                )
              }
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}