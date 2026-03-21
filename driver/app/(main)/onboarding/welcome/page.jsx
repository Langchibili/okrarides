// //Okrarides\driver\app\(main)\onboarding\welcome\page.jsx
// 'use client'

// import { useState } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import {
//   Box,
//   Typography,
//   Button,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Alert,
//   Paper,
//   Divider,
// } from '@mui/material'
// import {
//   CheckCircle as CheckIcon,
//   DriveEta as CarIcon,
//   Description as DocumentIcon,
//   CreditCard as CardIcon,
//   Home as HomeIcon,
//   Timer as TimerIcon,
// } from '@mui/icons-material'
// import { motion } from 'framer-motion'

// export default function WelcomePage() {
//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const status = searchParams.get('status')
//   const [starting, setStarting] = useState(false)

//   const requirements = [
//     {
//       icon: <CardIcon />,
//       title: "Driver's License",
//       description: 'Valid Zambian driver\'s license',
//     },
//     {
//       icon: <DocumentIcon />,
//       title: 'National ID',
//       description: 'Your national identification card',
//     },
//     {
//       icon: <HomeIcon />,
//       title: 'Address',
//       description: 'Your current residential address',
//     },
//     {
//       icon: <CarIcon />,
//       title: 'Vehicle Information',
//       description: 'Vehicle registration and details',
//     },
//     {
//       icon: <TimerIcon />,
//       title: 'Time Needed',
//       description: '10-15 minutes to complete',
//     },
//   ]

//   const handleStart = () => {
//     setStarting(true)
//     router.push('/onboarding/license')
//   }

//   return (
//     <Box sx={{ pt: 4 }}>
//       {/* Header */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//       >
//         <Box sx={{ textAlign: 'center', mb: 4 }}>
//           <Box
//             sx={{
//               width: 100,
//               height: 100,
//               borderRadius: '50%',
//               bgcolor: 'primary.light',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               mx: 'auto',
//               mb: 3,
//             }}
//           >
//             <CarIcon sx={{ fontSize: 50, color: 'primary.dark' }} />
//           </Box>

//           <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
//             Become a Driver
//           </Typography>
//           <Typography variant="body1" color="text.secondary">
//             Start earning with OkraRides
//           </Typography>
//         </Box>
//       </motion.div>

//       {/* Rejection Alert */}
//       {status === 'rejected' && (
//         <motion.div
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//         >
//           <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
//             Your previous application was rejected. Please review your documents and try again.
//           </Alert>
//         </motion.div>
//       )}

//       {/* Requirements Card */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.1 }}
//       >
//         <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 4 }}>
//           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
//             What You'll Need
//           </Typography>

//           <List disablePadding>
//             {requirements.map((req, index) => (
//               <Box key={index}>
//                 <ListItem sx={{ px: 0, py: 1.5 }}>
//                   <ListItemIcon sx={{ minWidth: 48 }}>
//                     <Box
//                       sx={{
//                         width: 40,
//                         height: 40,
//                         borderRadius: 2,
//                         bgcolor: 'primary.light',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center',
//                         color: 'primary.dark',
//                       }}
//                     >
//                       {req.icon}
//                     </Box>
//                   </ListItemIcon>
//                   <ListItemText
//                     primary={req.title}
//                     secondary={req.description}
//                     primaryTypographyProps={{
//                       fontWeight: 600,
//                       variant: 'body1',
//                     }}
//                     secondaryTypographyProps={{
//                       variant: 'body2',
//                     }}
//                   />
//                 </ListItem>
//                 {index < requirements.length - 1 && <Divider />}
//               </Box>
//             ))}
//           </List>
//         </Paper>
//       </motion.div>

//       {/* Benefits Card */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.2 }}
//       >
//         <Paper
//           elevation={2}
//           sx={{
//             p: 3,
//             mb: 3,
//             borderRadius: 4,
//             bgcolor: 'success.light',
//           }}
//         >
//           <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
//             Why Drive with Us?
//           </Typography>

//           <List disablePadding>
//             {[
//               'Flexible schedule - work when you want',
//               'Competitive earnings with zero commission',
//               'Weekly payouts',
//               '24/7 support',
//               'Free training and onboarding',
//             ].map((benefit, index) => (
//               <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
//                 <ListItemIcon sx={{ minWidth: 32 }}>
//                   <CheckIcon sx={{ color: 'success.dark', fontSize: 20 }} />
//                 </ListItemIcon>
//                 <ListItemText
//                   primary={benefit}
//                   primaryTypographyProps={{ variant: 'body2' }}
//                 />
//               </ListItem>
//             ))}
//           </List>
//         </Paper>
//       </motion.div>

//       {/* Important Note */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.3 }}
//       >
//         <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
//           <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
//             Verification usually takes 24-48 hours
//           </Typography>
//           <Typography variant="caption">
//             We'll notify you once your application is reviewed
//           </Typography>
//         </Alert>
//         <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
//           <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
//             <strong>Please note that all the identity, licence and address information collected here are for verification purposes only, and are never shown to any other user but you.</strong>
//           </Typography>
//         </Alert>
//       </motion.div>

//       {/* Start Button */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.4 }}
//       >
//         <Button
//           fullWidth
//           variant="contained"
//           size="large"
//           onClick={handleStart}
//           disabled={starting}
//           sx={{
//             height: 56,
//             fontSize: '1rem',
//             fontWeight: 600,
//             borderRadius: 4,
//           }}
//         >
//           {starting ? 'Starting...' : 'Get Started'}
//         </Button>
//       </motion.div>
//     </Box>
//   )
// }

'use client'
export const dynamic = 'force-dynamic';
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box, Typography, Button, List, ListItem,
  ListItemIcon, ListItemText, Alert, Paper, Divider,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  DriveEta    as CarIcon,
  Description as DocumentIcon,
  CreditCard  as CardIcon,
  Home        as HomeIcon,
  Timer       as TimerIcon,
} from '@mui/icons-material'
import { alpha, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } } }

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme  = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const status = searchParams.get('status')
  const [starting, setStarting] = useState(false)

  const requirements = [
    { icon: <CardIcon />,     title: "Driver's License",   description: "Valid Zambian driver's license",    color: '#3B82F6' },
    { icon: <DocumentIcon />, title: 'National ID',         description: 'Your national identification card', color: '#8B5CF6' },
    { icon: <HomeIcon />,     title: 'Address',             description: 'Your current residential address',  color: '#10B981' },
    { icon: <CarIcon />,      title: 'Vehicle Information', description: 'Vehicle registration and details',  color: '#F59E0B' },
    { icon: <TimerIcon />,    title: 'Time Needed',         description: '10-15 minutes to complete',         color: '#06B6D4' },
  ]

  const benefits = [
    'Flexible schedule — work when you want',
    'Competitive earnings with zero commission',
    'Weekly payouts directly to mobile money',
    '24/7 dedicated driver support',
    'Free training and onboarding',
  ]

  const handleStart = () => {
    setStarting(true)
    router.push('/onboarding/license')
  }

  return (
    <Box sx={{
      pt: 3, pb: 4,
      background: isDark ? 'transparent' : 'transparent',
    }}>

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box sx={{
            width: 96, height: 96, borderRadius: '50%', mx: 'auto', mb: 2.5,
            background: isDark
              ? `linear-gradient(135deg, ${alpha('#10B981', 0.22)} 0%, ${alpha('#3B82F6', 0.14)} 100%)`
              : `linear-gradient(135deg, ${alpha('#10B981', 0.15)} 0%, ${alpha('#3B82F6', 0.08)} 100%)`,
            border: `2px solid ${isDark ? alpha('#10B981', 0.3) : alpha('#10B981', 0.22)}`,
            boxShadow: isDark
              ? `0 8px 32px ${alpha('#10B981', 0.2)}`
              : `0 8px 32px ${alpha('#10B981', 0.14)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <CarIcon sx={{ fontSize: 48, color: isDark ? '#34D399' : '#059669' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.75, letterSpacing: -0.5 }}>
            Become a Driver
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Start earning with OkraRides
          </Typography>
        </Box>
      </motion.div>

      {/* Rejection alert */}
      {status === 'rejected' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }}>
            Your previous application was rejected. Please review your documents and try again.
          </Alert>
        </motion.div>
      )}

      {/* ── Requirements card ────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <Paper elevation={isDark ? 0 : 2} sx={{
            p: 2.5, mb: 2, borderRadius: 4,
            border: `1px solid ${isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07)}`,
            background: isDark
              ? `linear-gradient(145deg, ${alpha('#3B82F6', 0.07)} 0%, transparent 100%)`
              : `linear-gradient(145deg, ${alpha('#3B82F6', 0.04)} 0%, #ffffff 100%)`,
            boxShadow: isDark ? 'none' : `0 4px 20px rgba(0,0,0,0.07)`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative blob */}
            <Box sx={{
              position: 'absolute', top: -20, right: -20, width: 80, height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#3B82F6', isDark ? 0.12 : 0.07)} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, letterSpacing: -0.2 }}>
              What You'll Need
            </Typography>

            <List disablePadding>
              {requirements.map((req, index) => (
                <Box key={index}>
                  <ListItem sx={{ px: 0, py: 1.25 }}>
                    <ListItemIcon sx={{ minWidth: 46 }}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: 2.5, flexShrink: 0,
                        background: isDark
                          ? `linear-gradient(135deg, ${alpha(req.color, 0.22)} 0%, ${alpha(req.color, 0.12)} 100%)`
                          : `linear-gradient(135deg, ${alpha(req.color, 0.14)} 0%, ${alpha(req.color, 0.07)} 100%)`,
                        border: `1px solid ${alpha(req.color, isDark ? 0.25 : 0.15)}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: req.color,
                        boxShadow: isDark ? 'none' : `0 2px 8px ${alpha(req.color, 0.12)}`,
                      }}>
                        {req.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={700}>{req.title}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary">{req.description}</Typography>}
                    />
                  </ListItem>
                  {index < requirements.length - 1 && (
                    <Divider sx={{ ml: 7, opacity: 0.5 }} />
                  )}
                </Box>
              ))}
            </List>
          </Paper>
        </motion.div>

        {/* ── Benefits card ──────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Paper elevation={isDark ? 0 : 2} sx={{
            p: 2.5, mb: 2, borderRadius: 4,
            background: isDark
              ? `linear-gradient(145deg, ${alpha('#10B981', 0.12)} 0%, ${alpha('#059669', 0.06)} 100%)`
              : `linear-gradient(145deg, ${alpha('#10B981', 0.08)} 0%, ${alpha('#ECFDF5', 1)} 100%)`,
            border: `1px solid ${alpha('#10B981', isDark ? 0.22 : 0.18)}`,
            boxShadow: isDark ? `0 4px 20px ${alpha('#10B981', 0.1)}` : `0 4px 20px ${alpha('#10B981', 0.08)}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <Box sx={{
              position: 'absolute', bottom: -16, right: -16, width: 70, height: 70,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#10B981', isDark ? 0.15 : 0.1)} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.75, color: isDark ? '#34D399' : '#059669', letterSpacing: -0.2 }}>
              Why Drive with Us?
            </Typography>
            <List disablePadding>
              {benefits.map((benefit, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.6 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <Box sx={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <CheckIcon sx={{ fontSize: 11, color: '#fff' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary={<Typography variant="body2" fontWeight={500}>{benefit}</Typography>} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </motion.div>

        {/* ── Notice cards ───────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Alert severity="info" sx={{ mb: 1.5, borderRadius: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>Verification usually takes 24–48 hours</Typography>
            <Typography variant="caption">We'll notify you once your application is reviewed.</Typography>
          </Alert>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              All identity, licence and address information is used for verification only and is never shown to other users.
            </Typography>
          </Alert>
        </motion.div>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Button fullWidth variant="contained" size="large" onClick={handleStart} disabled={starting}
            sx={{
              height: 56, fontSize: '1rem', fontWeight: 700, borderRadius: 4,
              background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
              boxShadow: `0 6px 20px ${alpha('#10B981', 0.4)}`,
              textTransform: 'none',
              '&:hover': {
                background: `linear-gradient(135deg, #059669 0%, #047857 100%)`,
                boxShadow: `0 8px 28px ${alpha('#10B981', 0.5)}`,
              },
            }}>
            {starting ? 'Starting…' : 'Get Started'}
          </Button>
        </motion.div>
      </motion.div>
    </Box>
  )
}