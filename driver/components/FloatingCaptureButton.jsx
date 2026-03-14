// use client';
// import { useState, useRef } from 'react';
// import {
//   Box, Typography, CircularProgress, Modal, Paper, Button,
// } from '@mui/material';
// import {
//   Close       as CloseIcon,
//   CameraAlt   as CameraIcon,
//   CloudUpload as UploadIcon,
//   CheckCircle as CheckIcon,
//   AddPhotoAlternate as AddPhotoIcon,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { alpha, useTheme }         from '@mui/material/styles';
// import { useScreenshot }           from '@/lib/contexts/ScreenshotContext';
// import { supportTicketsAPI }       from '@/lib/api/supportTickets';

// const ACCENT = '#10B981';

// export function FloatingCaptureButton() {
//   const theme  = useTheme();
//   const isDark = theme.palette.mode === 'dark';

//   const {
//     takingScreenshot, draftTicketId, screenshotCount,
//     stopScreenshotMode, onCaptured, MAX_SCREENSHOTS,
//   } = useScreenshot();

//   const [capturing,     setCapturing]     = useState(false);
//   const [justCaptured,  setJustCaptured]  = useState(false);
//   const [showFallback,  setShowFallback]  = useState(false); // permission denied modal
//   const [uploadMode,    setUploadMode]    = useState(false); // capture btn → upload btn
//   const [uploading,     setUploading]     = useState(false);
//   const fileInputRef = useRef(null);

//   const atLimit = screenshotCount >= MAX_SCREENSHOTS;

//   // ── Capture via getDisplayMedia ───────────────────────────────────────────
//   const handleCapture = async () => {
//     if (atLimit || capturing) return;
//     setCapturing(true);
//     try {
//       const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//       const video  = document.createElement('video');
//       video.srcObject = stream;
//       await new Promise(res => { video.onloadedmetadata = res; });
//       await video.play();

//       const canvas = document.createElement('canvas');
//       canvas.width  = video.videoWidth;
//       canvas.height = video.videoHeight;
//       canvas.getContext('2d').drawImage(video, 0, 0);
//       stream.getTracks().forEach(t => t.stop());

//       const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
//       await supportTicketsAPI.attachScreenshot(draftTicketId, blob);
//       onCaptured();

//       setJustCaptured(true);
//       setTimeout(() => setJustCaptured(false), 2000);
//     } catch {
//       // Permission denied or error — show fallback modal
//       setShowFallback(true);
//     } finally {
//       setCapturing(false);
//     }
//   };

//   // ── Fallback OK: close modal, switch to upload mode ───────────────────────
//   const handleFallbackOk = () => {
//     setShowFallback(false);
//     setUploadMode(true);
//   };

//   // ── Upload file (fallback mode) ───────────────────────────────────────────
//   const handleFileUpload = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file || !draftTicketId) return;
//     setUploading(true);
//     try {
//       await supportTicketsAPI.attachScreenshot(draftTicketId, file);
//       onCaptured();
//       setJustCaptured(true);
//       setTimeout(() => setJustCaptured(false), 2000);
//     } catch (err) {
//       console.error('Upload failed:', err);
//     } finally {
//       setUploading(false);
//       if (fileInputRef.current) fileInputRef.current.value = '';
//     }
//   };

//   return (
//     <>
//       <AnimatePresence>
//         {takingScreenshot && (
//           <motion.div
//             key="float-btn"
//             initial={{ y: 120, opacity: 0 }}
//             animate={{ y: 0,   opacity: 1 }}
//             exit={{   y: 120, opacity: 0 }}
//             transition={{ type: 'spring', stiffness: 300, damping: 28 }}
//             style={{
//               position: 'fixed',
//               bottom: 28,
//               left: '50%',
//               transform: 'translateX(-50%)',
//               zIndex: 1400,
//               display: 'flex',
//               alignItems: 'center',
//               gap: 8,
//             }}
//           >
//             {/* ── Main pill: capture OR upload ─────────────────────────────── */}
//             <Box
//               onClick={uploadMode
//                 ? () => fileInputRef.current?.click()
//                 : (atLimit ? undefined : handleCapture)
//               }
//               sx={{
//                 display: 'flex', alignItems: 'center', gap: 1.25,
//                 px: 2.5, py: 1.25,
//                 borderRadius: 99,
//                 // upload mode is semi-transparent as requested
//                 backdropFilter: 'blur(16px)',
//                 background: atLimit
//                   ? alpha('#6B7280', 0.55)
//                   : justCaptured
//                     ? alpha('#10B981', 0.78)
//                     : uploadMode
//                       ? alpha(isDark ? '#0F172A' : '#1E293B', 0.45) // see-through
//                       : alpha(isDark ? '#0F172A' : '#1E293B', 0.72),
//                 border: `1.5px solid ${alpha(
//                   atLimit ? '#6B7280' : uploadMode ? '#3B82F6' : ACCENT,
//                   0.55
//                 )}`,
//                 boxShadow: atLimit
//                   ? 'none'
//                   : `0 8px 32px ${alpha(uploadMode ? '#3B82F6' : ACCENT, 0.35)}, 0 2px 8px rgba(0,0,0,0.3)`,
//                 cursor: atLimit ? 'not-allowed' : 'pointer',
//                 transition: 'background 0.25s, box-shadow 0.25s',
//                 '&:active': { transform: 'scale(0.96)' },
//               }}
//             >
//               {/* Icon */}
//               {(capturing || uploading) ? (
//                 <CircularProgress size={16} sx={{ color: '#fff' }} />
//               ) : justCaptured ? (
//                 <CheckIcon sx={{ fontSize: 17, color: '#fff' }} />
//               ) : uploadMode ? (
//                 <UploadIcon sx={{ fontSize: 17, color: '#fff' }} />
//               ) : (
//                 <CameraIcon sx={{ fontSize: 17, color: '#fff' }} />
//               )}

//               {/* Label */}
//               <Typography sx={{
//                 fontSize: 12, fontWeight: 700, color: '#fff',
//                 letterSpacing: 0.4, whiteSpace: 'nowrap',
//               }}>
//                 {atLimit
//                   ? `Max ${MAX_SCREENSHOTS} reached`
//                   : justCaptured
//                     ? `Saved! (${screenshotCount}/${MAX_SCREENSHOTS})`
//                     : capturing
//                       ? 'Capturing…'
//                       : uploading
//                         ? 'Uploading…'
//                         : uploadMode
//                           ? `Upload Screenshot (${screenshotCount}/${MAX_SCREENSHOTS})`
//                           : `Capture Screenshot (${screenshotCount}/${MAX_SCREENSHOTS})`
//                 }
//               </Typography>
//             </Box>

//             {/* ── Cancel X ─────────────────────────────────────────────────── */}
//             <Box
//               onClick={() => {
//                 stopScreenshotMode();
//                 setUploadMode(false);
//               }}
//               sx={{
//                 width: 36, height: 36, borderRadius: '50%',
//                 backdropFilter: 'blur(16px)',
//                 background: alpha(isDark ? '#0F172A' : '#1E293B', 0.7),
//                 border: `1.5px solid ${alpha('#EF4444', 0.5)}`,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//                 cursor: 'pointer',
//                 boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
//                 '&:active': { transform: 'scale(0.92)' },
//               }}
//             >
//               <CloseIcon sx={{ fontSize: 16, color: '#EF4444' }} />
//             </Box>

//             {/* Hidden file input for upload mode */}
//             <input
//               type="file"
//               accept="image/*"
//               ref={fileInputRef}
//               style={{ display: 'none' }}
//               onChange={handleFileUpload}
//             />
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ── Permission denied modal ─────────────────────────────────────────── */}
//       <Modal open={showFallback} onClose={() => setShowFallback(false)}>
//         <Box sx={{
//           position: 'absolute', inset: 0,
//           display: 'flex', alignItems: 'center', justifyContent: 'center',
//           p: 2,
//         }}>
//           <motion.div
//             initial={{ scale: 0.88, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             transition={{ type: 'spring', stiffness: 300, damping: 26 }}
//           >
//             <Paper elevation={24} sx={{
//               p: 3.5, borderRadius: 4, maxWidth: 340, width: '100%',
//               background: isDark
//                 ? 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)'
//                 : '#fff',
//               border: `1px solid ${alpha('#F59E0B', 0.2)}`,
//             }}>
//               <Box sx={{
//                 width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2,
//                 background: alpha('#F59E0B', 0.12),
//                 border: `1px solid ${alpha('#F59E0B', 0.3)}`,
//                 display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}>
//                 <Typography sx={{ fontSize: 26 }}>📱</Typography>
//               </Box>

//               <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', mb: 1 }}>
//                 Screenshot Permission Denied
//               </Typography>
//               <Typography variant="body2" color="text.secondary"
//                 sx={{ textAlign: 'center', mb: 3, lineHeight: 1.6 }}>
//                 Try getting a screenshot using your phone's normal way of taking
//                 screenshots (<strong>Power + Volume Down</strong>), then upload it
//                 using the button that will appear.
//               </Typography>

//               <Button
//                 fullWidth variant="contained" size="large"
//                 onClick={handleFallbackOk}
//                 sx={{
//                   height: 50, borderRadius: 3, fontWeight: 700, textTransform: 'none',
//                   background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
//                   boxShadow: `0 4px 16px ${alpha(ACCENT, 0.36)}`,
//                 }}
//               >
//                 OK
//               </Button>
//             </Paper>
//           </motion.div>
//         </Box>
//       </Modal>
//     </>
//   );
// }
'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Modal, Paper,
  Button, IconButton, Divider,
} from '@mui/material';
import {
  Close            as CloseIcon,
  CameraAlt        as CameraIcon,
  CloudUpload      as UploadIcon,
  CheckCircle      as CheckIcon,
  Send             as SendIcon,
  AddPhotoAlternate as AddPhotoIcon,
  ArrowDownward    as ArrowDownIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha, useTheme }         from '@mui/material/styles';
import { useScreenshot }           from '@/lib/contexts/ScreenshotContext';
import { supportTicketsAPI }       from '@/lib/api/supportTickets';

const ACCENT = '#10B981';

export function FloatingCaptureButton() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    takingScreenshot, draftTicketId, screenshotCount,
    draftSubject, draftCategory,
    stopScreenshotMode, onCaptured, clearDraft, MAX_SCREENSHOTS,
  } = useScreenshot();

  const [capturing,       setCapturing]       = useState(false);
  const [justCaptured,    setJustCaptured]    = useState(false);
  const [showFallback,    setShowFallback]    = useState(false);  // permission denied modal
  const [uploadMode,      setUploadMode]      = useState(false);  // switch btn label
  const [showArrowOverlay,setShowArrowOverlay]= useState(false);  // bouncing arrow overlay
  const [showUploadModal, setShowUploadModal] = useState(false);  // full upload modal
  const [uploading,       setUploading]       = useState(false);
  const [uploadSuccess,   setUploadSuccess]   = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [submitDone,      setSubmitDone]      = useState(false);

  const fileInputRef    = useRef(null);
  const overlayTimer    = useRef(null);

  const atLimit = screenshotCount >= MAX_SCREENSHOTS;

  // Auto-dismiss arrow overlay after 800ms
  useEffect(() => {
    if (showArrowOverlay) {
      overlayTimer.current = setTimeout(() => setShowArrowOverlay(false), 800);
    }
    return () => clearTimeout(overlayTimer.current);
  }, [showArrowOverlay]);

  // ── Capture via getDisplayMedia ───────────────────────────────────────────
  const handleCapture = async () => {
    if (atLimit || capturing) return;
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video  = document.createElement('video');
      video.srcObject = stream;
      await new Promise(res => { video.onloadedmetadata = res; });
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      stream.getTracks().forEach(t => t.stop());

      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      await supportTicketsAPI.attachScreenshot(draftTicketId, blob);
      onCaptured();
      setJustCaptured(true);
      setTimeout(() => setJustCaptured(false), 2000);
    } catch {
      setShowFallback(true);
    } finally {
      setCapturing(false);
    }
  };

  // ── Fallback OK — switch to upload mode + show arrow overlay ─────────────
  const handleFallbackOk = () => {
    setShowFallback(false);
    setUploadMode(true);
    // slight delay so modal fully closes before overlay appears
    setTimeout(() => setShowArrowOverlay(true), 350);
  };

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !draftTicketId) return;
    setUploading(true);
    setUploadSuccess(false);
    try {
      await supportTicketsAPI.attachScreenshot(draftTicketId, file);
      onCaptured();
      setUploadSuccess(true);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Submit from within upload modal ───────────────────────────────────────
  const handleSubmit = async () => {
    if (!draftTicketId) return;
    setSubmitting(true);
    try {
      await supportTicketsAPI.submitTicket(draftTicketId);
      setSubmitDone(true);
      setTimeout(() => {
        clearDraft();
        setShowUploadModal(false);
        setSubmitDone(false);
        setUploadSuccess(false);
        setUploadMode(false);
      }, 1800);
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    stopScreenshotMode();
    setUploadMode(false);
    setShowArrowOverlay(false);
  };

  return (
    <>
      {/* ── Arrow overlay — tap anywhere to dismiss ───────────────────────── */}
      <AnimatePresence>
        {showArrowOverlay && (
          <motion.div
            key="arrow-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              clearTimeout(overlayTimer.current);
              setShowArrowOverlay(false);
            }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1399,
              background: alpha('#000', 0.5),
              backdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 100,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ textAlign: 'center', marginBottom: 12 }}
            >
              <Typography sx={{
                color: '#fff', fontWeight: 800, fontSize: 16,
                textShadow: '0 2px 12px rgba(0,0,0,0.7)',
                mb: 1, px: 3,
              }}>
                Click the button below to upload the screenshot you have taken.
              </Typography>
              <Typography sx={{ color: alpha('#fff', 0.65), fontSize: 12 }}>
                Tap anywhere to dismiss
              </Typography>
            </motion.div>

            {/* Bouncing arrow */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowDownIcon sx={{
                fontSize: 36, color: ACCENT,
                filter: `drop-shadow(0 2px 8px ${alpha(ACCENT, 0.7)})`,
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating pill ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {takingScreenshot && (
          <motion.div
            key="float-btn"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: 120,  opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1400,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Main pill */}
            <Box
              onClick={uploadMode
                ? () => setShowUploadModal(true)
                : (atLimit ? undefined : handleCapture)
              }
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.25,
                px: 2.5, py: 1.25,
                borderRadius: 99,
                backdropFilter: 'blur(16px)',
                background: atLimit
                  ? alpha('#6B7280', 0.55)
                  : justCaptured
                    ? alpha(ACCENT, 0.85)
                    : uploadMode
                      ? alpha(isDark ? '#0F172A' : '#1E293B', 0.45)
                      : alpha(isDark ? '#0F172A' : '#1E293B', 0.72),
                border: `1.5px solid ${alpha(
                  atLimit ? '#6B7280' : uploadMode ? '#3B82F6' : ACCENT,
                  0.6
                )}`,
                boxShadow: atLimit
                  ? 'none'
                  : `0 8px 32px ${alpha(uploadMode ? '#3B82F6' : ACCENT, 0.38)}, 0 2px 8px rgba(0,0,0,0.35)`,
                cursor: atLimit ? 'not-allowed' : 'pointer',
                transition: 'background 0.25s, box-shadow 0.25s',
                '&:active': !atLimit ? { transform: 'scale(0.96)' } : {},
              }}
            >
              {capturing ? (
                <CircularProgress size={16} sx={{ color: '#fff' }} />
              ) : justCaptured ? (
                <CheckIcon sx={{ fontSize: 17, color: '#fff' }} />
              ) : uploadMode ? (
                <UploadIcon sx={{ fontSize: 17, color: '#fff' }} />
              ) : (
                <CameraIcon sx={{ fontSize: 17, color: '#fff' }} />
              )}

              <Typography sx={{
                fontSize: 12, fontWeight: 700, color: '#fff',
                letterSpacing: 0.4, whiteSpace: 'nowrap',
              }}>
                {atLimit
                  ? `Max ${MAX_SCREENSHOTS} reached`
                  : justCaptured
                    ? `Saved! (${screenshotCount}/${MAX_SCREENSHOTS})`
                    : capturing
                      ? 'Capturing…'
                      : uploadMode
                        ? `Upload Screenshot (${screenshotCount}/${MAX_SCREENSHOTS})`
                        : `Capture Screenshot (${screenshotCount}/${MAX_SCREENSHOTS})`
                }
              </Typography>
            </Box>

            {/* ── X cancel button ───────────────────────────────────────── */}
            <Box
              onClick={handleCancel}
              sx={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                backdropFilter: 'blur(16px)',
                background: alpha('#EF4444', 0.88),
                border: `1.5px solid ${alpha('#fff', 0.3)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${alpha('#EF4444', 0.45)}`,
                transition: 'transform 0.15s',
                '&:active': { transform: 'scale(0.9)' },
              }}
            >
              <CloseIcon sx={{ fontSize: 18, color: '#fff' }} />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        type="file" accept="image/*" ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* ── Permission denied modal ─────────────────────────────────────────── */}
      <Modal open={showFallback} onClose={() => setShowFallback(false)}>
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        }}>
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <Paper elevation={24} sx={{
              p: 3.5, borderRadius: 4, maxWidth: 340, width: '100%',
              background: isDark
                ? 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)'
                : '#fff',
              border: `1px solid ${alpha('#F59E0B', 0.25)}`,
            }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2,
                background: alpha('#F59E0B', 0.12),
                border: `1px solid ${alpha('#F59E0B', 0.3)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontSize: 26 }}>📱</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', mb: 1 }}>
                Screenshot Permission Denied
              </Typography>
              <Typography variant="body2" color="text.secondary"
                sx={{ textAlign: 'center', mb: 3, lineHeight: 1.6 }}>
                Try getting a screenshot using your phone's normal method{' '}
                (<strong>Power + Volume Down</strong>), then upload it using the
                button that will appear.
              </Typography>
              <Button
                fullWidth variant="contained" size="large"
                onClick={handleFallbackOk}
                sx={{
                  height: 50, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                  boxShadow: `0 4px 16px ${alpha(ACCENT, 0.36)}`,
                }}
              >
                OK
              </Button>
            </Paper>
          </motion.div>
        </Box>
      </Modal>

      {/* ── Upload + Submit modal ──────────────────────────────────────────── */}
      <Modal open={showUploadModal} onClose={() => !submitting && setShowUploadModal(false)}>
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <motion.div
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ width: '100%', maxWidth: 480 }}
          >
            <Paper elevation={24} sx={{
              p: 3, borderRadius: '24px 24px 0 0',
              background: isDark
                ? 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)'
                : '#fff',
            }}>
              {/* Drag handle */}
              <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mb: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={800}>
                  {submitDone ? 'Ticket Submitted! 🎉' : 'Upload & Submit'}
                </Typography>
                {!submitting && !submitDone && (
                  <IconButton size="small" onClick={() => setShowUploadModal(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {/* Submit done state */}
              <AnimatePresence mode="wait">
                {submitDone ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  >
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Box sx={{
                        width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 2,
                        background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 8px 24px ${alpha(ACCENT, 0.4)}`,
                      }}>
                        <CheckIcon sx={{ fontSize: 32, color: '#fff' }} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                        Ticket Submitted!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Our support team will get back to you shortly.
                      </Typography>
                    </Box>
                  </motion.div>
                ) : (
                  <motion.div key="upload-form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Ticket subject */}
                    {draftSubject && (
                      <Box sx={{
                        p: 1.5, mb: 2, borderRadius: 2.5,
                        bgcolor: alpha(ACCENT, isDark ? 0.12 : 0.06),
                        border: `1px solid ${alpha(ACCENT, 0.2)}`,
                      }}>
                        <Typography variant="caption" color="text.disabled"
                          sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block' }}>
                          Issue
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color={ACCENT}>
                          {draftSubject}
                        </Typography>
                      </Box>
                    )}

                    {/* Screenshot count */}
                    {screenshotCount > 0 && (
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        p: 1.25, mb: 2, borderRadius: 2,
                        bgcolor: alpha(ACCENT, isDark ? 0.08 : 0.04),
                        border: `1px solid ${alpha(ACCENT, 0.15)}`,
                      }}>
                        <CheckIcon sx={{ fontSize: 16, color: ACCENT }} />
                        <Typography variant="body2" fontWeight={700} color={ACCENT}>
                          {screenshotCount}/{MAX_SCREENSHOTS} screenshot{screenshotCount !== 1 ? 's' : ''} attached
                        </Typography>
                      </Box>
                    )}

                    {/* Upload success flash */}
                    <AnimatePresence>
                      {uploadSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                        >
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            p: 1.5, mb: 2, borderRadius: 2.5,
                            background: `linear-gradient(135deg, ${alpha(ACCENT, 0.18)} 0%, ${alpha('#047857', 0.1)} 100%)`,
                            border: `1px solid ${alpha(ACCENT, 0.35)}`,
                          }}>
                            <Box sx={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: `0 2px 8px ${alpha(ACCENT, 0.4)}`,
                            }}>
                              <CheckIcon sx={{ fontSize: 16, color: '#fff' }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={800} color={ACCENT}>
                                Screenshot uploaded successfully!
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                You can upload more or submit your ticket now.
                              </Typography>
                            </Box>
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Upload button */}
                    {screenshotCount < MAX_SCREENSHOTS && (
                      <Button
                        fullWidth variant="outlined"
                        startIcon={uploading
                          ? <CircularProgress size={16} />
                          : screenshotCount > 0 ? <AddPhotoIcon /> : <UploadIcon />
                        }
                        disabled={uploading}
                        onClick={() => {
                          setUploadSuccess(false);
                          fileInputRef.current?.click();
                        }}
                        sx={{
                          mb: 1.5, height: 50, borderRadius: 3, fontWeight: 700,
                          textTransform: 'none',
                          borderColor: alpha('#3B82F6', 0.45), color: '#3B82F6',
                          '&:hover': { borderColor: '#3B82F6', bgcolor: alpha('#3B82F6', 0.06) },
                        }}
                      >
                        {uploading
                          ? 'Uploading…'
                          : screenshotCount > 0
                            ? 'Upload Another Screenshot'
                            : 'Upload Screenshot'
                        }
                      </Button>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    {/* Submit button */}
                    <Button
                      fullWidth variant="contained" size="large"
                      startIcon={submitting
                        ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                        : <SendIcon />
                      }
                      disabled={submitting || !draftTicketId}
                      onClick={handleSubmit}
                      sx={{
                        height: 52, borderRadius: 3, fontWeight: 800,
                        textTransform: 'none', fontSize: 15,
                        background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                        boxShadow: `0 4px 20px ${alpha(ACCENT, 0.38)}`,
                        '&:disabled': { opacity: 0.5 },
                      }}
                    >
                      {submitting ? 'Submitting…' : 'Submit Ticket'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Paper>
          </motion.div>
        </Box>
      </Modal>
    </>
  );
}