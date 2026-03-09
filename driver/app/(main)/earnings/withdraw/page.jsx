// // //Okrarides\driver\app\(main)\earnings\withdraw\page.jsx
// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { useRouter } from 'next/navigation';
// // import {
// //   Box,
// //   AppBar,
// //   Toolbar,
// //   Typography,
// //   IconButton,
// //   Paper,
// //   TextField,
// //   Button,
// //   InputAdornment,
// //   Alert,
// //   Radio,
// //   RadioGroup,
// //   FormControlLabel,
// //   FormControl,
// //   Chip,
// //   List,
// //   ListItem,
// //   ListItemText,
// // } from '@mui/material';
// // import { ArrowBack as BackIcon, AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
// // import { formatCurrency } from '@/Functions';
// // import { requestWithdrawal } from '@/Functions';
// // import { useDriver } from '@/lib/hooks/useDriver';
// // import { MINIMUM_WITHDRAWAL_AMOUNT } from '@/Constants';

// // export default function WithdrawPage() {
// //   const router = useRouter();
// //   const { driverProfile } = useDriver();
// //   const [amount, setAmount] = useState('');
// //   const [method, setMethod] = useState('okrapay');
// //   const [accountDetails, setAccountDetails] = useState({
// //     accountName: '',
// //     accountNumber: '',
// //     bankName: '',
// //   });
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState(null);

// //   const availableBalance = driverProfile?.currentBalance || 0;
// //   const minimumAmount = MINIMUM_WITHDRAWAL_AMOUNT;

// //   const quickAmounts = [100, 200, 500, 1000].filter((amt) => amt <= availableBalance);

// //   const handleQuickAmount = (value) => {
// //     setAmount(value.toString());
// //   };

// //   const handleMaxAmount = () => {
// //     setAmount(availableBalance.toString());
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();

// //     const numAmount = parseFloat(amount);

// //     // Validation
// //     if (!numAmount || numAmount < minimumAmount) {
// //       setError(`Minimum withdrawal amount is ${formatCurrency(minimumAmount)}`);
// //       return;
// //     }

// //     if (numAmount > availableBalance) {
// //       setError('Insufficient balance');
// //       return;
// //     }

// //     if (method === 'okrapay' && !accountDetails.accountNumber) {
// //       setError('Please enter your OkraPay phone number');
// //       return;
// //     }

// //     try {
// //       setLoading(true);
// //       setError(null);

// //       const response = await requestWithdrawal(numAmount, method, accountDetails);

// //       if (response.success) {
// //         router.push('/earnings/withdraw/success');
// //       } else {
// //         setError(response.error || 'Failed to request withdrawal');
// //       }
// //     } catch (err) {
// //       setError(err.message);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
// //       {/* AppBar */}
// //       <AppBar position="static" elevation={0}>
// //         <Toolbar>
// //           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
// //             <BackIcon />
// //           </IconButton>
// //           <Typography variant="h6" sx={{ flex: 1 }}>
// //             Withdraw Earnings
// //           </Typography>
// //         </Toolbar>
// //       </AppBar>

// //       <Box sx={{ p: 3 }}>
// //         {/* Available Balance */}
// //         <Paper
// //           elevation={3}
// //           sx={{
// //             p: 3,
// //             mb: 3,
// //             borderRadius: 4,
// //             background: `linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)`,
// //             color: 'white',
// //             textAlign: 'center',
// //           }}
// //         >
// //           <WalletIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
// //           <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
// //             Available Balance
// //           </Typography>
// //           <Typography
// //             variant="h2"
// //             sx={{
// //               fontWeight: 700,
// //               fontFamily: "'JetBrains Mono', monospace",
// //             }}
// //           >
// //             {formatCurrency(availableBalance)}
// //           </Typography>
// //         </Paper>

// //         <form onSubmit={handleSubmit}>
// //           {/* Amount Input */}
// //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
// //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// //               Withdrawal Amount
// //             </Typography>

// //             <TextField
// //               fullWidth
// //               label="Amount"
// //               type="number"
// //               value={amount}
// //               onChange={(e) => setAmount(e.target.value)}
// //               InputProps={{
// //                 startAdornment: <InputAdornment position="start">K</InputAdornment>,
// //                 endAdornment: (
// //                   <InputAdornment position="end">
// //                     <Button size="small" onClick={handleMaxAmount}>
// //                       MAX
// //                     </Button>
// //                   </InputAdornment>
// //                 ),
// //               }}
// //               helperText={`Min: ${formatCurrency(minimumAmount)} • Max: ${formatCurrency(
// //                 availableBalance
// //               )}`}
// //               sx={{ mb: 2 }}
// //               required
// //             />

// //             {/* Quick Amounts */}
// //             {quickAmounts.length > 0 && (
// //               <>
// //                 <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
// //                   Quick Amounts:
// //                 </Typography>
// //                 <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
// //                   {quickAmounts.map((value) => (
// //                     <Chip
// //                       key={value}
// //                       label={formatCurrency(value)}
// //                       onClick={() => handleQuickAmount(value)}
// //                       sx={{
// //                         cursor: 'pointer',
// //                         fontWeight: 600,
// //                         bgcolor: amount === value.toString() ? 'primary.main' : 'default',
// //                         color: amount === value.toString() ? 'white' : 'inherit',
// //                       }}
// //                     />
// //                   ))}
// //                 </Box>
// //               </>
// //             )}
// //           </Paper>

// //           {/* Withdrawal Method */}
// //           <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
// //             <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// //               Withdrawal Method
// //             </Typography>

// //             <FormControl component="fieldset" fullWidth>
// //               <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
// //                 <FormControlLabel
// //                   value="okrapay"
// //                   control={<Radio />}
// //                   label={
// //                     <Box>
// //                       <Typography variant="body1" sx={{ fontWeight: 600 }}>
// //                         💳 OkraPay
// //                       </Typography>
// //                       <Typography variant="caption" color="text.secondary">
// //                         Instant withdrawal to mobile money
// //                       </Typography>
// //                     </Box>
// //                   }
// //                   sx={{
// //                     border: 1,
// //                     borderColor: method === 'okrapay' ? 'primary.main' : 'divider',
// //                     borderRadius: 2,
// //                     p: 2,
// //                     mb: 1,
// //                   }}
// //                 />
// //               </RadioGroup>
// //             </FormControl>

// //             {/* Account Details */}
// //             {method === 'okrapay' && (
// //               <TextField
// //                 fullWidth
// //                 label="Mobile Money Number"
// //                 placeholder="+260 9X XXX XXXX"
// //                 value={accountDetails.accountNumber}
// //                 onChange={(e) =>
// //                   setAccountDetails({ ...accountDetails, accountNumber: e.target.value })
// //                 }
// //                 sx={{ mt: 2 }}
// //                 required
// //               />
// //             )}
// //           </Paper>

// //           {/* Processing Info */}
// //           <Alert severity="info" sx={{ mb: 3 }}>
// //             <Typography variant="body2">
// //               Withdrawals are typically processed within 24 hours during business days.
// //               You'll receive an SMS confirmation once processed.
// //             </Typography>
// //           </Alert>

// //           {/* Error Alert */}
// //           {error && (
// //             <Alert severity="error" sx={{ mb: 3 }}>
// //               {error}
// //             </Alert>
// //           )}

// //           {/* Summary */}
// //           {amount && parseFloat(amount) >= minimumAmount && (
// //             <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
// //               <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
// //                 Withdrawal Summary
// //               </Typography>
// //               <List disablePadding>
// //                 <ListItem sx={{ px: 0 }}>
// //                   <ListItemText primary="Withdrawal Amount" />
// //                   <Typography fontWeight={600}>{formatCurrency(parseFloat(amount))}</Typography>
// //                 </ListItem>
// //                 <ListItem sx={{ px: 0 }}>
// //                   <ListItemText primary="Processing Fee" />
// //                   <Typography>K 0.00</Typography>
// //                 </ListItem>
// //                 <ListItem sx={{ px: 0, pt: 2, borderTop: 1, borderColor: 'divider' }}>
// //                   <ListItemText
// //                     primary="You'll Receive"
// //                     primaryTypographyProps={{ fontWeight: 700 }}
// //                   />
// //                   <Typography fontWeight={700} color="success.main" fontSize="1.1rem">
// //                     {formatCurrency(parseFloat(amount))}
// //                   </Typography>
// //                 </ListItem>
// //               </List>
// //             </Paper>
// //           )}

// //           {/* Submit Button */}
// //           <Button
// //             type="submit"
// //             fullWidth
// //             variant="contained"
// //             size="large"
// //             disabled={loading || !amount || parseFloat(amount) < minimumAmount}
// //             sx={{ height: 56, borderRadius: 3, fontWeight: 600 }}
// //           >
// //             {loading
// //               ? 'Processing...'
// //               : `Request Withdrawal of ${formatCurrency(parseFloat(amount) || 0)}`}
// //           </Button>
// //         </form>
// //       </Box>
// //     </Box>
// //   );
// // }
// 'use client';
// // PATH: driver/app/(main)/earnings/withdraw/page.jsx

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Box, AppBar, Toolbar, Typography, IconButton, Paper,
//   TextField, Button, InputAdornment, Alert, Chip,
//   List, ListItem, ListItemText, Divider,
// } from '@mui/material';
// import {
//   ArrowBack            as BackIcon,
//   AccountBalanceWallet as WalletIcon,
//   Lock                 as LockIcon,
//   PhoneAndroid         as PhoneIcon,
// } from '@mui/icons-material';
// import { formatCurrency } from '@/Functions';
// import { requestWithdrawal } from '@/Functions';
// import { useDriver } from '@/lib/hooks/useDriver';
// import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
// import OkraPayModal from '@/components/OkraPay/OkraPayModal';

// export default function WithdrawPage() {
//   const router = useRouter();
//   const { driverProfile } = useDriver();
//   const {
//     isWithdrawFromFloat,
//     withdrawableBalance,   // 'float' | 'earnings'
//     minimumWithdrawAmount,
//   } = useAdminSettings();

//   const [amount,  setAmount]  = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error,   setError]   = useState(null);

//   // ── Resolve the correct balance pool ────────────────────────────────────────
//   // isWithdrawFromFloat = true  → use withdrawableFloatBalance
//   // isWithdrawFromFloat = false → use currentBalance (ride earnings)
//   const withdrawableFloatBalance = parseFloat(driverProfile?.withdrawableFloatBalance ?? 0);
//   const currentBalance           = parseFloat(driverProfile?.currentBalance           ?? 0);
//   const pendingWithdrawal        = parseFloat(driverProfile?.pendingWithdrawal        ?? 0);

//   const availablePool    = isWithdrawFromFloat ? withdrawableFloatBalance : currentBalance;
//   const availableBalance = Math.max(0, availablePool - pendingWithdrawal);

//   // Also expose total float for the info note when mode is 'float'
//   const totalFloat = parseFloat(driverProfile?.floatBalance ?? 0);
//   const promoFloat = isWithdrawFromFloat
//     ? Math.max(0, totalFloat - withdrawableFloatBalance)
//     : 0;

//   // ── Labels that change based on mode ────────────────────────────────────────
//   const balanceLabel = isWithdrawFromFloat ? 'Withdrawable Float' : 'Available Earnings';
//   const pageTitle    = isWithdrawFromFloat ? 'Withdraw Float'     : 'Withdraw Earnings';
//   const poolNote     = isWithdrawFromFloat
//     ? 'Float you personally topped up — promo credit excluded'
//     : 'Ride earnings accumulated on the platform';

//   // ── Quick amounts filtered to what's actually available ─────────────────────
//   const quickAmounts = [100, 200, 500, 1000].filter(
//     (v) => v <= availableBalance && v >= minimumWithdrawAmount,
//   );

//   const handleMaxAmount = () => setAmount(availableBalance.toFixed(2));

//   // ── Validation ───────────────────────────────────────────────────────────────
//   const numAmount    = parseFloat(amount) || 0;
//   const isBelowMin   = numAmount > 0 && numAmount < minimumWithdrawAmount;
//   const isOverMax    = numAmount > availableBalance;
//   const isFormValid  = numAmount >= minimumWithdrawAmount && numAmount <= availableBalance;

//   const handleSubmit = async () => {
//     if (!isFormValid) return;
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await requestWithdrawal(numAmount, 'mobile_money', {});
//       if (response.success) {
//         router.push('/earnings/withdraw/success');
//       } else {
//         setError(response.error || 'Failed to request withdrawal');
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Nothing available ───────────────────────────────────────────────────────
//   const hasNothing = availableBalance <= 0;
//   const hasTooLittle = availableBalance > 0 && availableBalance < minimumWithdrawAmount;

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>

//       {/* ── App Bar ─────────────────────────────────────────────────────────── */}
//       <AppBar position="static" elevation={0}>
//         <Toolbar>
//           <IconButton edge="start" color="inherit" onClick={() => router.back()}>
//             <BackIcon />
//           </IconButton>
//           <Typography variant="h6" sx={{ flex: 1 }}>{pageTitle}</Typography>
//         </Toolbar>
//       </AppBar>

//       <Box sx={{ p: 3 }}>

//         {/* ── Balance Card ─────────────────────────────────────────────────────── */}
//         <Paper
//           elevation={3}
//           sx={{
//             p: 3, mb: 3, borderRadius: 4,
//             background: hasNothing || hasTooLittle
//               ? 'linear-gradient(135deg, #757575 0%, #424242 100%)'
//               : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
//             color: 'white', textAlign: 'center',
//           }}
//         >
//           <WalletIcon sx={{ fontSize: 44, mb: 1, opacity: 0.9 }} />
//           <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 0.5 }}>
//             {balanceLabel}
//           </Typography>
//           <Typography
//             variant="h2"
//             sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", mb: 0.5 }}
//           >
//             {formatCurrency(availableBalance)}
//           </Typography>
//           <Typography variant="caption" sx={{ opacity: 0.7 }}>{poolNote}</Typography>

//           {/* Promo float note — only when mode is float and promo exists */}
//           {isWithdrawFromFloat && promoFloat > 0 && (
//             <Box sx={{
//               mt: 2, pt: 2,
//               borderTop: '1px solid rgba(255,255,255,0.25)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
//             }}>
//               <LockIcon sx={{ fontSize: 14, opacity: 0.7 }} />
//               <Typography variant="caption" sx={{ opacity: 0.7 }}>
//                 {formatCurrency(promoFloat)} promotional float not included
//               </Typography>
//             </Box>
//           )}

//           {/* Pending withdrawal note */}
//           {pendingWithdrawal > 0 && (
//             <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
//               <Typography variant="caption" sx={{ opacity: 0.7 }}>
//                 {formatCurrency(pendingWithdrawal)} pending withdrawal deducted
//               </Typography>
//             </Box>
//           )}
//         </Paper>

//         {/* ── Blocking states ───────────────────────────────────────────────────── */}
//         {hasNothing && (
//           <Alert severity="warning" sx={{ mb: 3 }}>
//             <Typography variant="subtitle2" fontWeight={600}>
//               No {isWithdrawFromFloat ? 'withdrawable float' : 'earnings'} available
//             </Typography>
//             <Typography variant="body2">
//               {isWithdrawFromFloat
//                 ? 'Top up your float and the portion you paid in will appear here once processed.'
//                 : 'Complete rides to accumulate earnings you can withdraw.'}
//             </Typography>
//           </Alert>
//         )}

//         {hasTooLittle && (
//           <Alert severity="info" sx={{ mb: 3 }}>
//             <Typography variant="subtitle2" fontWeight={600}>Below minimum withdrawal</Typography>
//             <Typography variant="body2">
//               You have {formatCurrency(availableBalance)} but the minimum withdrawal is{' '}
//               {formatCurrency(minimumWithdrawAmount)}.{' '}
//               {isWithdrawFromFloat
//                 ? 'Top up more float to reach the threshold.'
//                 : 'Complete more rides to reach the minimum.'}
//             </Typography>
//           </Alert>
//         )}

//         {!hasNothing && !hasTooLittle && (
//           <>
//             {/* ── Amount Input ─────────────────────────────────────────────────── */}
//             <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
//               <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
//                 Withdrawal Amount
//               </Typography>

//               <TextField
//                 fullWidth
//                 label="Amount"
//                 type="number"
//                 value={amount}
//                 onChange={(e) => {
//                   setAmount(e.target.value);
//                   setError(null);
//                 }}
//                 InputProps={{
//                   startAdornment: <InputAdornment position="start">K</InputAdornment>,
//                   endAdornment: (
//                     <InputAdornment position="end">
//                       <Button size="small" onClick={handleMaxAmount} sx={{ fontWeight: 700 }}>
//                         MAX
//                       </Button>
//                     </InputAdornment>
//                   ),
//                 }}
//                 helperText={
//                   isBelowMin
//                     ? `Minimum is ${formatCurrency(minimumWithdrawAmount)}`
//                     : isOverMax
//                     ? `Max available is ${formatCurrency(availableBalance)}`
//                     : `Min: ${formatCurrency(minimumWithdrawAmount)} · Max: ${formatCurrency(availableBalance)}`
//                 }
//                 error={isBelowMin || isOverMax}
//                 sx={{ mb: quickAmounts.length > 0 ? 2 : 0 }}
//               />

//               {quickAmounts.length > 0 && (
//                 <>
//                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
//                     Quick amounts:
//                   </Typography>
//                   <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
//                     {quickAmounts.map((v) => (
//                       <Chip
//                         key={v}
//                         label={formatCurrency(v)}
//                         onClick={() => { setAmount(v.toString()); setError(null); }}
//                         color={amount === v.toString() ? 'primary' : 'default'}
//                         sx={{ cursor: 'pointer', fontWeight: 600 }}
//                       />
//                     ))}
//                   </Box>
//                 </>
//               )}
//             </Paper>

//             {/* ── Withdrawal Method ─────────────────────────────────────────────── */}
//             <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
//               <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
//                 Withdrawal Method
//               </Typography>

//               {/* Saved payment numbers from driver profile */}
//               <PaymentNumberSelector driverProfile={driverProfile} />
//             </Paper>

//             {/* ── Info ──────────────────────────────────────────────────────────── */}
//             <Alert severity="info" sx={{ mb: 3 }}>
//               <Typography variant="body2">
//                 Withdrawals are typically processed within 24 hours on business days.
//                 You'll receive an SMS once processed.
//               </Typography>
//             </Alert>

//             {/* ── Error ─────────────────────────────────────────────────────────── */}
//             {error && (
//               <Alert severity="error" sx={{ mb: 3 }}>
//                 {error}
//               </Alert>
//             )}

//             {/* ── Summary ───────────────────────────────────────────────────────── */}
//             {isFormValid && (
//               <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
//                 <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
//                   Summary
//                 </Typography>
//                 <List disablePadding>
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText
//                       primary={balanceLabel}
//                       secondary="Before withdrawal"
//                     />
//                     <Typography fontWeight={600}>{formatCurrency(availableBalance)}</Typography>
//                   </ListItem>
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText primary="Withdrawal Amount" />
//                     <Typography color="error.main" fontWeight={600}>
//                       − {formatCurrency(numAmount)}
//                     </Typography>
//                   </ListItem>
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText primary="Processing Fee" />
//                     <Typography color="text.secondary">K 0.00</Typography>
//                   </ListItem>
//                   <Divider sx={{ my: 1 }} />
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText
//                       primary="Remaining Balance"
//                       primaryTypographyProps={{ fontWeight: 700 }}
//                     />
//                     <Typography fontWeight={700}>
//                       {formatCurrency(availableBalance - numAmount)}
//                     </Typography>
//                   </ListItem>
//                   <ListItem sx={{ px: 0 }}>
//                     <ListItemText
//                       primary="You'll Receive"
//                       primaryTypographyProps={{ fontWeight: 700, color: 'success.main' }}
//                     />
//                     <Typography fontWeight={700} color="success.main" fontSize="1.1rem">
//                       {formatCurrency(numAmount)}
//                     </Typography>
//                   </ListItem>
//                 </List>
//               </Paper>
//             )}

//             {/* ── Submit ────────────────────────────────────────────────────────── */}
//             <Button
//               fullWidth
//               variant="contained"
//               size="large"
//               disabled={loading || !isFormValid}
//               onClick={handleSubmit}
//               sx={{ height: 56, borderRadius: 3, fontWeight: 700 }}
//             >
//               {loading
//                 ? 'Processing...'
//                 : isFormValid
//                 ? `Withdraw ${formatCurrency(numAmount)}`
//                 : `Enter an amount (min. ${formatCurrency(minimumWithdrawAmount)})`}
//             </Button>
//           </>
//         )}
//       </Box>
//     </Box>
//   );
// }

// // ─── Payment number selector ──────────────────────────────────────────────────
// // Shows the driver's saved mobile money numbers from their profile.
// // The withdrawal API uses the saved number on the backend — this just lets
// // the driver confirm which account they're withdrawing to.

// function PaymentNumberSelector({ driverProfile }) {
//   const numbers = driverProfile?.paymentPhoneNumbers ?? [];

//   if (numbers.length === 0) {
//     return (
//       <Alert severity="warning" icon={<PhoneIcon />}>
//         <Typography variant="body2" fontWeight={600}>No payment number saved</Typography>
//         <Typography variant="body2">
//           Add a mobile money number in your profile settings before withdrawing.
//         </Typography>
//         {/* TODO: link to profile payment numbers page when built */}
//       </Alert>
//     );
//   }

//   return (
//     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
//       <Typography variant="body2" color="text.secondary">
//         Funds will be sent to your saved mobile money number:
//       </Typography>
//       {numbers.map((n, i) => (
//         <Box
//           key={i}
//           sx={{
//             display:      'flex',
//             alignItems:   'center',
//             gap:          1.5,
//             p:            1.75,
//             borderRadius: 2,
//             border:       '1px solid',
//             borderColor:  'divider',
//             bgcolor:      'action.hover',
//           }}
//         >
//           <PhoneIcon sx={{ color: 'primary.main', fontSize: 20 }} />
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="body2" fontWeight={600}>{n.mobileNumber}</Typography>
//             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
//               {n.mobileType} · {n.name}
//             </Typography>
//           </Box>
//           {i === 0 && (
//             <Chip label="Primary" size="small" color="primary" sx={{ fontWeight: 700 }} />
//           )}
//         </Box>
//       ))}
//     </Box>
//   );
// }
'use client';
// PATH: driver/app/(main)/earnings/withdraw/page.jsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Paper,
  TextField, Button, InputAdornment, Alert, Chip,
  List, ListItem, ListItemText, Divider, CircularProgress,
} from '@mui/material';
import {
  ArrowBack            as BackIcon,
  AccountBalanceWallet as WalletIcon,
  Lock                 as LockIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/Functions';
import { apiClient } from '@/lib/api/client';
import { useAdminSettings } from '@/lib/hooks/useAdminSettings';
import { useAuth } from '@/lib/hooks/useAuth';
import OkraPayModal from '@/components/OkraPay/OkraPayModal';

// ─────────────────────────────────────────────────────────────────────────────
// This page does NOT call requestWithdrawal() from @/Functions.
// Instead it opens OkraPayModal with purpose="withdraw" which calls
// POST /okrapay/request-withdrawal on the backend, handles polling,
// and shows success/failure states internally.
// ─────────────────────────────────────────────────────────────────────────────

export default function WithdrawPage() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    loading:               settingsLoading,
    refresh:               refreshSettings,
    isWithdrawFromFloat,
    minimumWithdrawAmount,
  } = useAdminSettings();

  const [profile,     setProfile]     = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [amount,      setAmount]      = useState('');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [error,       setError]       = useState(null);

  // Force-refresh settings on mount (same reason as float page)
  useEffect(() => {
    refreshSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await apiClient.get('/driver/me');
      const dp =
        res?.data?.driverProfile ??
        res?.driverProfile ??
        res?.data ??
        res;
      if (dp) setProfile(dp);
    } catch (err) {
      console.error('[WithdrawPage] Failed to load profile:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // ── Balance resolution ─────────────────────────────────────────────────────
  const p = profile ?? {};

  const withdrawableFloatBalance = Number(p.withdrawableFloatBalance) || 0;
  const currentBalance           = Number(p.currentBalance)           || 0;
  const pendingWithdrawal        = Number(p.pendingWithdrawal)        || 0;

  // The pool configured by admin
  const availablePool    = isWithdrawFromFloat ? withdrawableFloatBalance : currentBalance;
  const availableBalance = Math.max(0, availablePool - pendingWithdrawal);

  // Promo float info for the card note
  const totalFloat = Number(p.floatBalance) || 0;
  const promoFloat = isWithdrawFromFloat
    ? Math.max(0, totalFloat - withdrawableFloatBalance)
    : 0;

  // ── Labels ─────────────────────────────────────────────────────────────────
  const balanceLabel = isWithdrawFromFloat ? 'Withdrawable Float' : 'Available Earnings';
  const poolNote     = isWithdrawFromFloat
    ? 'Float you personally topped up — promo credit excluded'
    : 'Ride earnings accumulated on the platform';

  // ── Country / currency for modal ──────────────────────────────────────────
  const userCountry = user?.country;
  const phoneCode   = String(userCountry?.phoneCode  || '260').replace(/\D/g, '');
  const currency    = (userCountry?.currency?.code   || 'ZMW').toUpperCase();
  const acceptedMM  = Array.isArray(userCountry?.acceptedMobileMoneyPayments)
    ? userCountry.acceptedMobileMoneyPayments
    : null;

  // ── Amount validation ──────────────────────────────────────────────────────
  const numAmount   = parseFloat(amount) || 0;
  const isBelowMin  = numAmount > 0 && numAmount < minimumWithdrawAmount;
  const isOverMax   = numAmount > availableBalance;
  const isFormValid = numAmount >= minimumWithdrawAmount && numAmount <= availableBalance;

  const settingsReady = !settingsLoading && minimumWithdrawAmount != null;
  const hasNothing    = availableBalance <= 0;
  const hasTooLittle  = availableBalance > 0 && settingsReady && availableBalance < minimumWithdrawAmount;

  // Quick amounts filtered to what's actually available AND above the minimum
  const quickAmounts = settingsReady
    ? [100, 200, 500, 1000].filter(v => v <= availableBalance && v >= minimumWithdrawAmount)
    : [];

  const handleOpenModal = () => {
    if (!isFormValid) return;
    setError(null);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    setModalOpen(false);
    router.push('/earnings/withdraw/success');
  };

  const handleError = (err) => {
    setModalOpen(false);
    setError(err?.message || 'Withdrawal failed. Please try again.');
  };

  const isLoading = dataLoading || settingsLoading;

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => router.back()}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6">Withdraw</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>

      {/* ── App Bar ─────────────────────────────────────────────────────────── */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.back()}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {isWithdrawFromFloat ? 'Withdraw Float' : 'Withdraw Earnings'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>

        {/* ── Balance Card ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3, mb: 3, borderRadius: 4,
              background: hasNothing || hasTooLittle
                ? 'linear-gradient(135deg, #757575 0%, #424242 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              color: 'white', textAlign: 'center',
            }}
          >
            <WalletIcon sx={{ fontSize: 44, mb: 1, opacity: 0.9 }} />
            <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 0.5 }}>
              {balanceLabel}
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", mb: 0.5 }}>
              {formatCurrency(availableBalance)}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>{poolNote}</Typography>

            {isWithdrawFromFloat && promoFloat > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                <LockIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {formatCurrency(promoFloat)} promotional float not included
                </Typography>
              </Box>
            )}

            {pendingWithdrawal > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {formatCurrency(pendingWithdrawal)} pending withdrawal deducted
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>

        {/* ── Blocking states ───────────────────────────────────────────────────── */}
        {hasNothing && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              No {isWithdrawFromFloat ? 'withdrawable float' : 'earnings'} available
            </Typography>
            <Typography variant="body2">
              {isWithdrawFromFloat
                ? 'Top up your float — the portion you paid in becomes withdrawable once processed.'
                : 'Complete rides to accumulate earnings you can withdraw.'}
            </Typography>
          </Alert>
        )}

        {hasTooLittle && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600}>Below minimum withdrawal</Typography>
            <Typography variant="body2">
              You have {formatCurrency(availableBalance)} but the minimum is{' '}
              {formatCurrency(minimumWithdrawAmount)}.{' '}
              {isWithdrawFromFloat ? 'Top up more float to reach the threshold.' : 'Complete more rides to reach the minimum.'}
            </Typography>
          </Alert>
        )}

        {!hasNothing && !hasTooLittle && (
          <>
            {/* ── Amount Input ─────────────────────────────────────────────────── */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Withdrawal Amount
              </Typography>

              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(null); }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">K</InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => { setAmount(availableBalance.toFixed(2)); setError(null); }}
                        sx={{ fontWeight: 700 }}
                      >
                        MAX
                      </Button>
                    </InputAdornment>
                  ),
                }}
                helperText={
                  isBelowMin
                    ? `Minimum is ${formatCurrency(minimumWithdrawAmount)}`
                    : isOverMax
                    ? `Max available is ${formatCurrency(availableBalance)}`
                    : `Min: ${formatCurrency(minimumWithdrawAmount)} · Max: ${formatCurrency(availableBalance)}`
                }
                error={isBelowMin || isOverMax}
                sx={{ mb: quickAmounts.length > 0 ? 2 : 0 }}
              />

              {quickAmounts.length > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Quick amounts:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {quickAmounts.map(v => (
                      <Chip
                        key={v}
                        label={formatCurrency(v)}
                        onClick={() => { setAmount(v.toString()); setError(null); }}
                        color={amount === v.toString() ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Paper>

            {/* ── Info ──────────────────────────────────────────────────────────── */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Withdrawals are typically processed within 24 hours on business days.
                You'll receive an SMS once processed.
              </Typography>
            </Alert>

            {/* ── Error ─────────────────────────────────────────────────────────── */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* ── Summary ───────────────────────────────────────────────────────── */}
            {isFormValid && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Summary</Typography>
                <List disablePadding>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary={balanceLabel} secondary="Before withdrawal" />
                    <Typography fontWeight={600}>{formatCurrency(availableBalance)}</Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Withdrawal Amount" />
                    <Typography color="error.main" fontWeight={600}>− {formatCurrency(numAmount)}</Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Processing Fee" />
                    <Typography color="text.secondary">K 0.00</Typography>
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="Remaining Balance" primaryTypographyProps={{ fontWeight: 700 }} />
                    <Typography fontWeight={700}>{formatCurrency(availableBalance - numAmount)}</Typography>
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText primary="You'll Receive" primaryTypographyProps={{ fontWeight: 700, color: 'success.main' }} />
                    <Typography fontWeight={700} color="success.main" fontSize="1.1rem">
                      {formatCurrency(numAmount)}
                    </Typography>
                  </ListItem>
                </List>
              </Paper>
            )}

            {/* ── Submit ────────────────────────────────────────────────────────── */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={!isFormValid}
              onClick={handleOpenModal}
              sx={{ height: 56, borderRadius: 3, fontWeight: 700 }}
            >
              {isFormValid
                ? `Withdraw ${formatCurrency(numAmount)}`
                : `Enter an amount (min. ${formatCurrency(minimumWithdrawAmount)})`}
            </Button>
          </>
        )}
      </Box>

      {/* ── OkraPayModal ────────────────────────────────────────────────────────
           purpose="withdraw" tells the modal to hit /okrapay/request-withdrawal
           and show the withdrawal-specific polling screen.
           The modal handles the full flow: submit → poll → success/failure.
      ─────────────────────────────────────────────────────────────────────── */}
      <OkraPayModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        amount={numAmount}
        purpose="withdraw"
        currency={currency}
        phoneCode={phoneCode}
        acceptedMobileMoneyPayments={acceptedMM}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </Box>
  );
}