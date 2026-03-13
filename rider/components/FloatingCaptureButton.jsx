'use client';
import { useState, useRef } from 'react';
import {
  Box, Typography, IconButton, CircularProgress,
  Modal, Paper, Button,
} from '@mui/material';
import {
  Close       as CloseIcon,
  CameraAlt   as CameraIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
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
    stopScreenshotMode, onCaptured, MAX_SCREENSHOTS,
  } = useScreenshot();

  const [capturing,    setCapturing]    = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef(null);

  const atLimit = screenshotCount >= MAX_SCREENSHOTS;

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

  // ── Manual file upload (fallback) ─────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await supportTicketsAPI.attachScreenshot(draftTicketId, file);
      onCaptured();
      setJustCaptured(true);
      setTimeout(() => setJustCaptured(false), 2000);
      setShowFallback(false);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* ── Floating pill button ─────────────────────────────────────────── */}
      <AnimatePresence>
        {takingScreenshot && (
          <motion.div
            key="float-capture"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0,   opacity: 1 }}
            exit={{   y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1400,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {/* Main capture pill */}
            <Box
              onClick={atLimit ? undefined : handleCapture}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.25,
                px: 2.5, py: 1.25,
                borderRadius: 99,
                backdropFilter: 'blur(16px)',
                background: atLimit
                  ? alpha('#6B7280', 0.55)
                  : justCaptured
                    ? alpha('#10B981', 0.78)
                    : alpha(isDark ? '#0F172A' : '#1E293B', 0.72),
                border: `1.5px solid ${alpha(atLimit ? '#6B7280' : ACCENT, 0.55)}`,
                boxShadow: atLimit
                  ? 'none'
                  : `0 8px 32px ${alpha(ACCENT, 0.35)}, 0 2px 8px rgba(0,0,0,0.3)`,
                cursor: atLimit ? 'not-allowed' : 'pointer',
                transition: 'background 0.25s, box-shadow 0.25s',
                '&:active': { transform: 'scale(0.96)' },
              }}
            >
              {capturing ? (
                <CircularProgress size={16} sx={{ color: '#fff' }} />
              ) : justCaptured ? (
                <CheckIcon sx={{ fontSize: 17, color: '#fff' }} />
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
                    ? `Captured! (${screenshotCount}/${MAX_SCREENSHOTS})`
                    : capturing
                      ? 'Capturing…'
                      : `Capture Screenshot (${screenshotCount}/${MAX_SCREENSHOTS})`
                }
              </Typography>
            </Box>

            {/* Cancel X */}
            <Box
              onClick={stopScreenshotMode}
              sx={{
                width: 36, height: 36, borderRadius: '50%',
                backdropFilter: 'blur(16px)',
                background: alpha(isDark ? '#0F172A' : '#1E293B', 0.7),
                border: `1.5px solid ${alpha('#EF4444', 0.5)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
                '&:active': { transform: 'scale(0.92)' },
              }}
            >
              <CloseIcon sx={{ fontSize: 16, color: '#EF4444' }} />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fallback modal ──────────────────────────────────────────────────── */}
      <Modal open={showFallback} onClose={() => setShowFallback(false)}>
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          p: 2,
        }}>
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <Paper elevation={24} sx={{
              p: 3.5, borderRadius: 4, maxWidth: 360, width: '100%',
              background: isDark
                ? 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)'
                : '#fff',
              border: `1px solid ${alpha(ACCENT, 0.2)}`,
            }}>
              {/* Icon */}
              <Box sx={{
                width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2,
                background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.18)} 0%, ${alpha('#D97706', 0.08)} 100%)`,
                border: `1px solid ${alpha('#F59E0B', 0.3)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontSize: 26 }}>📱</Typography>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', mb: 1 }}>
                Screenshot Permission Denied
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2.5, lineHeight: 1.6 }}>
                Please use your phone's built-in screenshot method (usually{' '}
                <strong>Power + Volume Down</strong>), then upload the image below.
              </Typography>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={uploading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <UploadIcon />}
                disabled={uploading || atLimit}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  height: 50, borderRadius: 3, fontWeight: 700,
                  textTransform: 'none', mb: 1.5,
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #059669 100%)`,
                  boxShadow: `0 4px 16px ${alpha(ACCENT, 0.36)}`,
                }}
              >
                {uploading ? 'Uploading…' : 'Upload Screenshot'}
              </Button>

              <Button
                fullWidth variant="text" size="small"
                onClick={() => setShowFallback(false)}
                sx={{ borderRadius: 3, fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}
              >
                OK, I'll do it later
              </Button>
            </Paper>
          </motion.div>
        </Box>
      </Modal>
    </>
  );
}