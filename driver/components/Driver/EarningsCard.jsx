// // //Okrarides\driver\components\Driver\EarningsCard.jsx
// // 'use client';

// // import { Paper, Box, Typography } from '@mui/material';
// // import { motion } from 'framer-motion';
// // import { formatCurrency } from '@/Functions';

// // export const EarningsCard = ({ title, amount, icon, color = 'primary', subtitle }) => {
// //   return (
// //     <Paper
// //       elevation={2}
// //       sx={{
// //         p: 2,
// //         borderRadius: 3,
// //         textAlign: 'center',
// //         height: '100%',
// //       }}
// //     >
// //       <Box
// //         sx={{
// //           width: 48,
// //           height: 48,
// //           borderRadius: 2,
// //           bgcolor: `${color}.light`,
// //           display: 'flex',
// //           alignItems: 'center',
// //           justifyContent: 'center',
// //           mx: 'auto',
// //           mb: 1,
// //         }}
// //       >
// //         {icon}
// //       </Box>
// //       <motion.div
// //         initial={{ scale: 0.8 }}
// //         animate={{ scale: 1 }}
// //         transition={{ type: 'spring', stiffness: 200 }}
// //       >
// //         <Typography
// //           variant="h5"
// //           sx={{
// //             fontWeight: 700,
// //             mb: 0.5,
// //             fontFamily: "'JetBrains Mono', monospace",
// //           }}
// //         >
// //           {formatCurrency(amount)}
// //         </Typography>
// //       </motion.div>
// //       <Typography variant="caption" color="text.secondary">
// //         {title}
// //       </Typography>
// //       {subtitle && (
// //         <Typography variant="caption" color="text.secondary" display="block">
// //           {subtitle}
// //         </Typography>
// //       )}
// //     </Paper>
// //   );
// // };

// // export default EarningsCard;

// // PATH: components/Driver/EarningsCard.jsx
// 'use client';
// import { Paper, Box, Typography } from '@mui/material';
// import { motion } from 'framer-motion';
// import { useTheme, alpha } from '@mui/material/styles';
// import { formatCurrency } from '@/Functions';

// const COLOR_GRADIENTS = {
//   earnings: ['#F59E0B', '#D97706'],
//   primary:  ['#3B82F6', '#1D4ED8'],
//   success:  ['#10B981', '#047857'],
//   info:     ['#06B6D4', '#0E7490'],
//   warning:  ['#F97316', '#C2410C'],
//   error:    ['#EF4444', '#B91C1C'],
// };

// export const EarningsCard = ({ title, amount, icon, color = 'earnings', subtitle, onClick }) => {
//   const theme   = useTheme();
//   const isDark  = theme.palette.mode === 'dark';
//   const [c1, c2] = COLOR_GRADIENTS[color] ?? COLOR_GRADIENTS.earnings;

//   return (
//     <motion.div
//       whileTap={{ scale: 0.97 }}
//       initial={{ opacity: 0, y: 12 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ type: 'spring', stiffness: 260, damping: 20 }}
//       style={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }}
//       onClick={onClick}
//     >
//       <Paper
//         elevation={isDark ? 0 : 3}
//         sx={{
//           p: 2,
//           borderRadius: 3,
//           height: '100%',
//           position: 'relative',
//           overflow: 'hidden',
//           border: `1px solid ${alpha(c1, isDark ? 0.25 : 0.12)}`,
//           background: isDark
//             ? `linear-gradient(145deg, ${alpha(c1, 0.18)} 0%, ${alpha(c2, 0.08)} 100%)`
//             : `linear-gradient(145deg, ${alpha(c1, 0.06)} 0%, ${alpha(c2, 0.02)} 100%)`,
//           boxShadow: isDark
//             ? `0 4px 24px ${alpha(c1, 0.18)}, inset 0 1px 0 ${alpha(c1, 0.15)}`
//             : `0 4px 16px ${alpha(c1, 0.14)}`,
//           transition: 'box-shadow 0.2s ease, transform 0.2s ease',
//           '&:hover': onClick ? {
//             boxShadow: isDark
//               ? `0 8px 32px ${alpha(c1, 0.28)}`
//               : `0 8px 24px ${alpha(c1, 0.22)}`,
//           } : {},
//         }}
//       >
//         {/* Ambient glow blob */}
//         <Box sx={{
//           position: 'absolute', top: -20, right: -20, width: 80, height: 80,
//           borderRadius: '50%',
//           background: `radial-gradient(circle, ${alpha(c1, isDark ? 0.25 : 0.12)} 0%, transparent 70%)`,
//           pointerEvents: 'none',
//         }} />

//         {/* Icon */}
//         <Box sx={{
//           width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.25,
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
//           boxShadow: `0 4px 12px ${alpha(c1, 0.4)}`,
//           '& svg': { fontSize: 22, color: '#fff' },
//         }}>
//           {icon}
//         </Box>

//         {/* Amount */}
//         <motion.div
//           initial={{ scale: 0.75, opacity: 0 }}
//           animate={{ scale: 1,    opacity: 1 }}
//           transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
//         >
//           <Typography variant="h5" sx={{
//             fontWeight: 800, mb: 0.25, textAlign: 'center',
//             fontFamily: "'JetBrains Mono', monospace",
//             background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
//             WebkitBackgroundClip: 'text',
//             WebkitTextFillColor: 'transparent',
//             backgroundClip: 'text',
//             lineHeight: 1.2,
//           }}>
//             {formatCurrency(amount)}
//           </Typography>
//         </motion.div>

//         <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', fontWeight: 500 }}>
//           {title}
//         </Typography>
//         {subtitle && (
//           <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 0.25 }}>
//             {subtitle}
//           </Typography>
//         )}
//       </Paper>
//     </motion.div>
//   );
// };
// export default EarningsCard;
'use client';
import { Paper, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import { formatCurrency } from '@/Functions';

const COLOR_GRADIENTS = {
  earnings: ['#F59E0B', '#D97706'],
  primary:  ['#3B82F6', '#1D4ED8'],
  success:  ['#10B981', '#047857'],
  info:     ['#06B6D4', '#0E7490'],
  warning:  ['#F97316', '#C2410C'],
  error:    ['#EF4444', '#B91C1C'],
};

const MotionPaper = motion(Paper);

export const EarningsCard = ({ title, amount, icon, color = 'earnings', subtitle, onClick }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [c1, c2] = COLOR_GRADIENTS[color] ?? COLOR_GRADIENTS.earnings;

  return (
    <MotionPaper
      elevation={isDark ? 0 : 3}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 3,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${alpha(c1, isDark ? 0.25 : 0.12)}`,
        background: isDark
          ? `linear-gradient(145deg, ${alpha(c1, 0.18)} 0%, ${alpha(c2, 0.08)} 100%)`
          : `linear-gradient(145deg, ${alpha(c1, 0.06)} 0%, ${alpha(c2, 0.02)} 100%)`,
        boxShadow: isDark
          ? `0 4px 24px ${alpha(c1, 0.18)}, inset 0 1px 0 ${alpha(c1, 0.15)}`
          : `0 4px 16px ${alpha(c1, 0.14)}`,
        transition: 'box-shadow 0.2s ease',
        '&:hover': onClick ? {
          boxShadow: isDark
            ? `0 8px 32px ${alpha(c1, 0.28)}`
            : `0 8px 24px ${alpha(c1, 0.22)}`,
        } : {},
      }}
    >
      {/* Ambient glow blob */}
      <Box sx={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(c1, isDark ? 0.25 : 0.12)} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <Box sx={{
        width: 44, height: 44, borderRadius: 2.5, mx: 'auto', mb: 1.25,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
        boxShadow: `0 4px 12px ${alpha(c1, 0.4)}`,
        '& svg': { fontSize: 22, color: '#fff' },
      }}>
        {icon}
      </Box>

      {/* Amount */}
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.05 }}
      >
        <Typography variant="h5" sx={{
          fontWeight: 800, mb: 0.25, textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.2,
        }}>
          {formatCurrency(amount)}
        </Typography>
      </motion.div>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', fontWeight: 500 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}
    </MotionPaper>
  );
};
export default EarningsCard;