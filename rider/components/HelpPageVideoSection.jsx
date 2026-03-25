'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, Modal, IconButton, LinearProgress,
  Paper, Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  PlayArrow  as PlayIcon,
  Pause      as PauseIcon,
  Close      as CloseIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material';

const VIDEOS = [
  {
    id:       'main',
    src:      '/assets/how-to-set-draw-over-permissions-hd.mp4',
    label:    'Watch video on how to set permissions',
    sublabel: 'Shows how to enable "Display over other apps"',
    emoji:    '🎬',
    color:    '#667eea',
  },
  {
    id:       'samsung',
    src:      '/assets/sumsung-permissions-video.mp4',
    label:    "Watch this if you can't see \"Display over apps\"",
    sublabel: 'Alternative guide for Samsung devices',
    emoji:    '📱',
    color:    '#1428A0',
  },
  {
    id:       'apple',
    src:      '/assets/how-to-set-background-running-ios.mp4',
    label:    "Watch this on how to set the app to work in the background, helps you not miss any rides",
    sublabel: 'On ios devices only',
    emoji:    '📱',
    color:    '#de3385',
  },
];

// ── Portrait video player modal ───────────────────────────────────────────────
function VideoModal({ open, src, title, onClose }) {
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && videoRef.current) {
      setIsLoading(true);
      setProgress(0);
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    if (!open && videoRef.current) {
      videoRef.current.pause();
    }
  }, [open, src]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Box
        sx={{
          position:      'relative',
          width:         '100%',
          maxWidth:      390,
          maxHeight:     '92vh',
          bgcolor:       '#000',
          borderRadius:  3,
          overflow:      'hidden',
          outline:       'none',
          display:       'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              bgcolor: 'rgba(0,0,0,0.55)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            zIndex: 5,
            px: 2, pt: 1.5, pb: 1,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#fff', fontWeight: 700, fontSize: 13, pr: 4 }}
            noWrap
          >
            {title}
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', flex: 1, display: 'flex' }}>
          <video
            ref={videoRef}
            src={src}
            style={{
              width: '100%',
              maxHeight: '85vh',
              objectFit: 'contain',
              background: '#000',
            }}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={onTimeUpdate}
            onCanPlay={() => setIsLoading(false)}
            onWaiting={() => setIsLoading(true)}
          />

          {isLoading && (
            <Box
              sx={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.45)',
              }}
            >
              <Box
                sx={{
                  width: 48, height: 48,
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
                }}
              />
            </Box>
          )}

          <Box
            onClick={togglePlay}
            sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Box
              sx={{
                width: 64, height: 64,
                borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isPlaying ? 0 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {isPlaying
                ? <PauseIcon sx={{ fontSize: 32, color: '#fff' }} />
                : <PlayIcon  sx={{ fontSize: 32, color: '#fff' }} />
              }
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            px: 2, pb: 2, pt: 1,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
          }}
        >
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4, borderRadius: 2, mb: 1.5,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': { bgcolor: '#667eea', borderRadius: 2 },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton onClick={togglePlay} sx={{ color: '#fff' }}>
              {isPlaying
                ? <PauseIcon sx={{ fontSize: 28 }} />
                : <PlayIcon  sx={{ fontSize: 28 }} />
              }
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function HelpPageVideoSection() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // CHANGE 1: collapsed by default (was true)
  const [expanded,    setExpanded]    = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  return (
    <>
      <Box sx={{ mt: 1 }}>

        {/* ── Header row — always visible ─────────────────────────────────── */}
        <Box
          sx={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            mb:             expanded ? 1.5 : 0,
          }}
        >
          {/* CHANGE 2: brick red, bold, noticeable heading */}
          <Typography
            variant="overline"
            sx={{
              fontWeight:    900,
              letterSpacing: 1.4,
              fontSize:      '0.72rem',
              color:         '#B91C1C',
              textShadow:    isDark ? '0 0 10px rgba(185,28,28,0.55)' : 'none',
            }}
          >
            🎥 Permission Setup Videos
          </Typography>

          {/* CHANGE 3: prominent Hide / Show button */}
          <Button
            size="small"
            startIcon={
              expanded
                ? <CloseIcon  sx={{ fontSize: '15px !important', fontWeight: 900 }} />
                : <ExpandIcon sx={{ fontSize: '15px !important' }} />
            }
            onClick={() => setExpanded((v) => !v)}
            sx={{
              textTransform: 'none',
              fontWeight:    800,
              fontSize:      12,
              color:         expanded ? '#fff' : '#B91C1C',
              minWidth:      0,
              px:            1.75,
              py:            0.6,
              borderRadius:  2.5,
              border:        `1.5px solid ${expanded ? '#B91C1C' : alpha('#B91C1C', 0.45)}`,
              bgcolor:       expanded ? '#B91C1C' : alpha('#B91C1C', 0.07),
              boxShadow:     expanded ? '0 3px 10px rgba(185,28,28,0.38)' : 'none',
              transition:    'all 0.2s ease',
              '&:hover': {
                bgcolor:   expanded ? '#991B1B' : alpha('#B91C1C', 0.14),
                boxShadow: '0 4px 14px rgba(185,28,28,0.35)',
              },
            }}
          >
            {expanded ? 'Hide' : 'Show'}
          </Button>
        </Box>

        {/* ── Collapsible video cards — all shown at once, exactly as original ── */}
        <Collapse in={expanded} timeout={280}>
          <Box>
            {VIDEOS.map((v) => (
              <Paper
                key={v.id}
                elevation={0}
                sx={{
                  mb:           1.25,
                  borderRadius: 3,
                  border:       `1px solid ${alpha(v.color, isDark ? 0.22 : 0.14)}`,
                  background:   isDark
                    ? alpha(v.color, 0.08)
                    : alpha(v.color, 0.04),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.75 }}>
                  <Box
                    sx={{
                      width:          44,
                      height:         44,
                      borderRadius:   2.5,
                      bgcolor:        alpha(v.color, isDark ? 0.2 : 0.1),
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      flexShrink:     0,
                      fontSize:       20,
                    }}
                  >
                    {v.emoji}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {v.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {v.sublabel}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayIcon />}
                    onClick={() => setActiveVideo(v)}
                    sx={{
                      borderRadius:  2.5,
                      fontWeight:    700,
                      textTransform: 'none',
                      flexShrink:    0,
                      px:            1.5,
                      background:    `linear-gradient(135deg, ${v.color} 0%, ${alpha(v.color, 0.75)} 100%)`,
                      boxShadow:     `0 3px 10px ${alpha(v.color, 0.35)}`,
                      '&:hover': { boxShadow: `0 4px 14px ${alpha(v.color, 0.45)}` },
                    }}
                  >
                    Watch
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </Collapse>

        {/* ── Collapsed pill — stays visible so user knows videos are here ── */}
        {!expanded && (
          <Box
            onClick={() => setExpanded(true)}
            sx={{
              display:    'flex',
              alignItems: 'center',
              gap:        0.75,
              px:         1.5,
              py:         0.85,
              mt:         0.5,
              borderRadius: 2.5,
              border:     `1px dashed ${alpha(isDark ? '#fff' : '#000', 0.12)}`,
              cursor:     'pointer',
              width:      'fit-content',
              transition: 'background 0.15s',
              '&:hover': {
                bgcolor: alpha(isDark ? '#fff' : '#000', 0.04),
              },
            }}
          >
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
              🎥 2 setup videos available
            </Typography>
            <ExpandIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </Box>
        )}

      </Box>

      <VideoModal
        open={!!activeVideo}
        src={activeVideo?.src || ''}
        title={activeVideo?.label || ''}
        onClose={() => setActiveVideo(null)}
      />
    </>
  );
}