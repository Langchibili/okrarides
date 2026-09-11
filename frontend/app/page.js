'use client'
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CARD_RIDE_B64,
    CARD_PACKAGE_B64,
    CARD_AFFILIATES_B64,
    CARD_DRIVING_B64,
    CARD_DELIVERING_B64,
} from './cardImages';

const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body, .okra-root { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .font-sora { font-family: 'Sora', system-ui, sans-serif; }
    :root {
      --g-hero: linear-gradient(140deg, #7c2d12 0%, #c2410c 30%, #ea580c 60%, #f59e0b 100%);
      --shadow-card: 0 2px 8px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.30);
      --shadow-btn:  0 2px 6px rgba(0,0,0,0.30), 0 6px 18px rgba(0,0,0,0.25);
      --shadow-md:   0 12px 40px rgba(0,0,0,0.35), 0 3px 10px rgba(0,0,0,0.25);
    }

    .okra-bg { background: #0b0b0b; }

    .glass {
      background: rgba(24,24,24,0.92);
      backdrop-filter: blur(24px) saturate(150%);
      -webkit-backdrop-filter: blur(24px) saturate(150%);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .glass-header {
      background: rgba(10,10,10,0.92);
      backdrop-filter: blur(40px) saturate(180%);
      -webkit-backdrop-filter: blur(40px) saturate(180%);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 2px 20px rgba(0,0,0,0.4);
    }
    .text-hero {
      background: var(--g-hero);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .icon-skel {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.14);
      position: relative;
      overflow: hidden;
    }
    .icon-skel::after {
      content: '';
      position: absolute; top: 0; left: -60%;
      width: 60%; height: 100%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.22), transparent);
      animation: skel-shimmer 1.6s ease-in-out infinite;
    }
    @keyframes skel-shimmer {
      0%   { left: -60%; }
      100% { left: 140%; }
    }
    .card-placeholder {
      animation: placeholder-fade-in 0.2s ease;
    }
    @keyframes placeholder-fade-in {
      from { opacity: 0; } to { opacity: 1; }
    }

    .qbtn {
      position: relative;
      cursor: pointer;
      overflow: hidden;
      border: none;
      outline: none;
      text-align: left;
      width: 100%;
      height: var(--qbtn-height, 112px);
      aspect-ratio: var(--qbtn-ratio, auto);
      border-radius: 20px;
      display: block;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .qbtn-ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      background: rgba(255,255,255,0.35);
      animation: ripple-burst 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
      pointer-events: none;
    }
    @keyframes ripple-burst { to { transform: scale(4); opacity: 0; } }
    .qbtn::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0));
      opacity: 0; transition: opacity 0.22s; pointer-events: none;
    }
    .qbtn:hover::after { opacity: 1; }

    .card3d {
      transition: transform 0.28s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.28s ease;
      transform-style: preserve-3d;
      will-change: transform;
      cursor: pointer;
      border-radius: 24px;
      overflow: hidden;
    }
    .shimmer-cta { position: relative; overflow: hidden; }
    .shimmer-cta::before {
      content: '';
      position: absolute; top: -50%; left: -75%;
      width: 50%; height: 200%;
      background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
      transform: skewX(-18deg);
    }
    .shimmer-cta:hover::before { animation: shimmer-run 0.6s ease forwards; }
    @keyframes shimmer-run { 0% { left: -75%; } 100% { left: 125%; } }

    .feat-card {
      transition: transform 0.26s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.26s ease;
    }
    .feat-card:hover {
      transform: translateY(-6px) scale(1.015);
      box-shadow: 0 24px 48px rgba(0,0,0,0.45), 0 6px 16px rgba(0,0,0,0.3) !important;
    }
    .stats-banner {
      background: linear-gradient(140deg, #7c2d12 0%, #c2410c 25%, #ea580c 50%, #f97316 75%, #f59e0b 100%);
      box-shadow: 0 32px 64px rgba(234,88,12,0.30), 0 8px 24px rgba(234,88,12,0.18);
    }
    .footer-glass {
      background: rgba(20,20,20,0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .stat-item { transition: transform 0.28s cubic-bezier(0.34,1.3,0.64,1); }
    .stat-item:hover { transform: scale(1.06) translateY(-3px); }

    .more-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 0;
      border-radius: 0;
      border: none;
      background: transparent;
      color: #d1d5db;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: color 0.18s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
      outline: none;
      -webkit-tap-highlight-color: transparent;
      box-shadow: none;
    }
    .more-btn:hover { color: #f97316; }
    .more-btn:active { opacity: 0.75; }

    /* ── App Download Modal ── */
    .app-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    @media (min-width: 480px) {
      .app-modal-overlay {
        align-items: center;
        padding: 24px;
      }
    }
    .app-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .app-modal-sheet {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      background: #141414;
      border-radius: 28px 28px 0 0;
      padding: 32px 28px 36px;
      box-shadow: 0 -8px 60px rgba(0,0,0,0.5), 0 -2px 20px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.06);
    }
    @media (min-width: 480px) {
      .app-modal-sheet {
        border-radius: 28px;
      }
    }
    .app-store-btn {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 16px 20px;
      border-radius: 18px;
      border: none;
      cursor: pointer;
      text-align: left;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      overflow: hidden;
      transition: transform 0.18s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.18s ease;
      text-decoration: none;
    }
    .app-store-btn:hover {
      transform: translateY(-2px) scale(1.015);
    }
    .app-store-btn:active {
      transform: scale(0.97) translateY(1px);
    }
    .app-store-btn-android {
      background: linear-gradient(135deg, #431407 0%, #7c2d12 50%, #c2410c 100%);
      box-shadow: 0 6px 24px rgba(194,65,12,0.35), 0 2px 8px rgba(0,0,0,0.25);
    }
    .app-store-btn-ios {
      background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 50%, #3a3a3c 100%);
      box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25);
    }
    .app-store-btn-shimmer::before {
      content: '';
      position: absolute; top: 0; left: -100%;
      width: 60%; height: 100%;
      background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent);
      transform: skewX(-15deg);
      animation: store-shimmer 3s ease infinite;
    }
    @keyframes store-shimmer {
      0%   { left: -100%; }
      40%  { left: 140%; }
      100% { left: 140%; }
    }
    .modal-drag-handle {
      width: 36px;
      height: 4px;
      border-radius: 99px;
      background: rgba(255,255,255,0.18);
      margin: 0 auto 24px;
    }
    @media (min-width: 480px) {
      .modal-drag-handle { display: none; }
    }
    .web-proceed-link {
      display: block;
      text-align: center;
      margin-top: 20px;
      color: rgba(255,255,255,0.25);
      font-size: 11px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s;
      letter-spacing: 0.01em;
      background: none;
      border: none;
      width: 100%;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .web-proceed-link:hover {
      color: rgba(255,255,255,0.5);
    }
  `}</style>
);

// ─── Hero subtitle rotator ────────────────────────────────────────────────────
const HERO_LINES = [
    { text: 'Reliable rides', icon: '🚗' },
    { text: 'Fast deliveries', icon: '🛵' },
    { text: 'Real earning opportunities', icon: '💰' },
    { text: 'Built for Zambia', icon: '🌍' },
];

const HeroSubtitle = () => {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const iv = setInterval(() => setIndex(i => (i + 1) % HERO_LINES.length), 10000);
        return () => clearInterval(iv);
    }, []);
    const current = HERO_LINES[index];
    return (
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ x: -60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                    <span style={{
                        fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
                        color: '#e5e7eb',
                        fontWeight: 700,
                        letterSpacing: '-0.015em',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    }}>
                        {current.text}
                    </span>
                    <motion.span
                        initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 480, damping: 22, delay: 0.1 }}
                        style={{
                            fontSize: 22, lineHeight: 1,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 38, height: 38, borderRadius: 11,
                            background: 'rgba(234,88,12,0.14)',
                            border: '1px solid rgba(234,88,12,0.25)',
                            flexShrink: 0,
                        }}
                    >
                        {current.icon}
                    </motion.span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// ─── Android SVG Icon ─────────────────────────────────────────────────────────
const AndroidIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.5 11.5C5.12 11.5 4 12.62 4 14v6c0 1.38 1.12 2.5 2.5 2.5S9 21.38 9 20v-6c0-1.38-1.12-2.5-2.5-2.5z" fill="#fb923c" />
        <path d="M25.5 11.5c-1.38 0-2.5 1.12-2.5 2.5v6c0 1.38 1.12 2.5 2.5 2.5S28 21.38 28 20v-6c0-1.38-1.12-2.5-2.5-2.5z" fill="#fb923c" />
        <rect x="10" y="11" width="12" height="16" rx="2" fill="#fb923c" />
        <path d="M10 15h12v2H10z" fill="#ea580c" />
        <circle cx="13" cy="25.5" r="1.5" fill="#c2410c" />
        <circle cx="19" cy="25.5" r="1.5" fill="#c2410c" />
        <path d="M11.5 5.5L9.5 9M20.5 5.5L22.5 9" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="14" r="1" fill="white" />
        <circle cx="19" cy="14" r="1" fill="white" />
        <path d="M10 11C10 8.79 12.69 7 16 7s6 1.79 6 4" fill="#fb923c" />
    </svg>
);

// ─── Apple SVG Icon ───────────────────────────────────────────────────────────
const AppleIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.5 14.8c-.03-3.1 2.53-4.6 2.65-4.67-1.44-2.1-3.68-2.39-4.48-2.42-1.9-.19-3.72 1.13-4.69 1.13-.97 0-2.45-1.1-4.04-1.07-2.07.03-3.99 1.21-5.05 3.05-2.17 3.76-.56 9.31 1.54 12.35 1.04 1.49 2.27 3.16 3.88 3.1 1.56-.06 2.15-1 4.03-1s2.43 1 4.07.97c1.68-.03 2.74-1.51 3.76-3.01 1.19-1.72 1.68-3.4 1.7-3.49-.04-.01-3.34-1.28-3.37-5.04z" fill="white" />
        <path d="M17.52 5.55c.86-1.05 1.44-2.5 1.28-3.95-1.24.05-2.74.83-3.63 1.87-.8.93-1.5 2.41-1.31 3.83 1.38.11 2.8-.71 3.66-1.75z" fill="white" />
    </svg>
);

// ─── App Download Modal ───────────────────────────────────────────────────────
const AppDownloadModal = ({ isOpen, onClose, webUrl, appLinks }) => {
    const overlayRef = useRef(null);

    const handleBackdropClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="app-modal-overlay" ref={overlayRef}>
                    {/* Backdrop — clicking anywhere outside the sheet closes modal */}
                    <motion.div
                        className="app-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        className="app-modal-sheet"
                        initial={{ y: '100%', opacity: 0.6, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: '100%', opacity: 0, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 36, mass: 0.9 }}
                    >
                        {/* Drag handle (mobile only) */}
                        <div className="modal-drag-handle" />

                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            {/* App icon placeholder */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.08 }}
                                style={{
                                    width: 72, height: 72,
                                    borderRadius: 20,
                                    background: 'var(--g-hero)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 8px 32px rgba(234,88,12,0.35), 0 2px 8px rgba(0,0,0,0.25)',
                                }}
                            >
                                <img
                                    src="/icon.png"
                                    alt="Okra"
                                    style={{ width: 72, height: 72, objectFit: 'fit', display: 'block' }}
                                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentNode.innerHTML += '<span style="font-size:36px;line-height:1">🥬</span>'; }}
                                />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12 }}
                                className="font-sora"
                                style={{ fontSize: 22, fontWeight: 800, color: '#f9fafb', marginBottom: 6, letterSpacing: '-0.025em' }}
                            >
                                Get the Okra App
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.16 }}
                                style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, lineHeight: 1.5 }}
                            >
                                The full experience lives in our app — faster, smoother, better.
                            </motion.p>
                        </div>

                        {/* Store buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 28 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                            {/* Android */}
                            <a
                                href={appLinks.android || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="app-store-btn app-store-btn-android app-store-btn-shimmer"
                            >
                                <div style={{
                                    width: 48, height: 48,
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    border: '1px solid rgba(255,255,255,0.12)',
                                }}>
                                    <AndroidIcon />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                                        Get it on
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }} className="font-sora">
                                        Google Play
                                    </div>
                                </div>
                                <div style={{
                                    width: 28, height: 28,
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: 14,
                                }}>
                                    →
                                </div>
                            </a>

                            {/* iOS */}
                            <a
                                href={appLinks.ios || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="app-store-btn app-store-btn-ios app-store-btn-shimmer"
                                style={{ animationDelay: '1.5s' }}
                            >
                                <div style={{
                                    width: 48, height: 48,
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    <AppleIcon />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                                        Download on the
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }} className="font-sora">
                                        App Store
                                    </div>
                                </div>
                                <div style={{
                                    width: 28, height: 28,
                                    borderRadius: 8,
                                    background: 'rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    color: 'rgba(255,255,255,0.4)',
                                    fontSize: 14,
                                }}>
                                    →
                                </div>
                            </a>
                        </motion.div>

                        {/* Divider */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 0',
                            }}
                        >
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>or</span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                        </motion.div>

                        {/* Web fallback — very faint */}
                        <motion.a
                            href={webUrl}
                            className="web-proceed-link"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.36 }}
                        >
                            proceed on the web
                        </motion.a>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ─── Ripple Button ─────────────────────────────────────────────────────────────
const RippleBtn = ({ action, onClick }) => {
    const btnRef = useRef(null);
    const [ripples, setRipples] = useState([]);
    const [pressed, setPressed] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);

    const handlePointerDown = (e) => {
        const btn = btnRef.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;
        const id = Date.now();
        setRipples(r => [...r, { id, x, y, size }]);
        setPressed(true);
        setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
        setTimeout(() => setPressed(false), 180);
    };

    return (
        <button
            ref={btnRef}
            className="qbtn"
            style={{
                background: action.bg,
                boxShadow: pressed
                    ? `0 1px 4px rgba(0,0,0,0.3), 0 3px 10px ${action.shadow}`
                    : `0 2px 6px rgba(0,0,0,0.25), 0 8px 22px ${action.shadow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
                border: action.bg.startsWith('rgba') ? '1px solid rgba(255,255,255,0.08)' : 'none',
                transform: pressed ? 'scale(0.94) translateY(1px)' : 'scale(1) translateY(0)',
                transition: 'transform 0.14s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.14s ease',
                '--qbtn-height': action.tall ? 'auto' : '112px',
                '--qbtn-ratio': action.tall ? '2.832' : 'auto',
            }}
            onPointerDown={handlePointerDown}
            onClick={onClick}
        >
            {ripples.map(rp => (
                <span
                    key={rp.id}
                    className="qbtn-ripple"
                    style={{ left: rp.x - rp.size / 2, top: rp.y - rp.size / 2, width: rp.size, height: rp.size }}
                />
            ))}

            {action.cardImg ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Placeholder: shown until the image finishes loading, and stays if it ever fails.
              Mirrors the wording and icon shape the real image will show, so a slow or
              broken load never looks like a blank box or a broken-image glyph. */}
                    {(!imgLoaded || imgFailed) && (
                        <div
                            className="card-placeholder"
                            style={{
                                position: 'absolute', inset: 0, borderRadius: 20,
                                padding: '16px', display: 'flex', flexDirection: 'column',
                                justifyContent: action.tall ? 'center' : 'flex-start', gap: 10,
                                background: action.tall
                                    ? 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)'
                                    : 'rgba(30,30,30,0.98)',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="icon-skel" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                                        <circle cx="8.5" cy="10" r="1.6" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
                                        <path d="M3 16l5-4 4 3 3-2 6 5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                {action.tall && (
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="font-sora" style={{ fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                                            {action.imgTitle}
                                        </div>
                                        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.68)', marginTop: 2 }}>
                                            {action.imgSubtitle}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!action.tall && (
                                <div style={{ minWidth: 0 }}>
                                    <div className="font-sora" style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
                                        {action.imgTitle}
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                                        {action.imgSubtitle}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Real image — embedded as a base64 data URI so it never depends on a network
              request or a public/ file path; onLoad/onError only drive the crossfade above. */}
                    <img
                        src={action.cardImg}
                        alt={action.imgTitle || action.label}
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgFailed(true)}
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: 20,
                            opacity: imgLoaded && !imgFailed ? 1 : 0,
                            transition: 'opacity 0.35s ease',
                        }}
                    />
                </div>
            ) : (
                <div style={{
                    position: 'relative', zIndex: 1,
                    padding: '16px', height: '100%',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: action.iconBg,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.25)',
                        fontSize: 22,
                        overflow: 'hidden',
                        transform: pressed ? 'scale(0.88)' : 'scale(1)',
                        transition: 'transform 0.14s cubic-bezier(0.34,1.5,0.64,1)',
                    }}>
                        {action.iconImg ? (
                            <img src={action.iconImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                        ) : action.icon}
                    </div>

                    <span style={{
                        color: action.forceTextColor ?? action.textColor,
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1.35,
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        textShadow: action.bg.startsWith('rgba')
                            ? '0 1px 2px rgba(0,0,0,0.35)'
                            : '0 1px 3px rgba(0,0,0,0.35)',
                        letterSpacing: '-0.01em',
                    }}>
                        {action.label}
                    </span>
                </div>
            )}

            {pressed && (
                <span style={{
                    position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
                    boxShadow: `inset 0 0 0 2px ${action.accent || 'rgba(255,255,255,0.35)'}`,
                }} />
            )}
        </button>
    );
};

// ─── Spring variants ───────────────────────────────────────────────────────────
const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const OkraLandingPage = () => {
    const [frontendUrls, setFrontendUrls] = useState({
        riderApp: process.env.NEXT_PUBLIC_RIDER_APP_URL || 'http://localhost:3001',
        driverApp: process.env.NEXT_PUBLIC_DRIVER_APP_URL || 'http://localhost:3002',
        deliveryApp: process.env.NEXT_PUBLIC_DELIVERY_APP_URL || 'http://localhost:3003',
    });
    const [appLinks, setAppLinks] = useState({
        android: process.env.NEXT_PUBLIC_ANDROID_APP_LINK || '',
        ios: process.env.NEXT_PUBLIC_IOS_APP_LINK || '',
    });
    const [loading, setLoading] = useState(true);
    const [headerPhase, setHeaderPhase] = useState('brand');
    const [activeService, setActiveService] = useState(null);
    const [showMore, setShowMore] = useState(false);
    const [affiliateEnabled, setAffiliateEnabled] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalWebUrl, setModalWebUrl] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343/api';

    // Detect RN WebView
    const isRNWebView = typeof window !== 'undefined' && !!window.ReactNativeWebView;

    // ─────────────────────────────────────────────────────────────
    // Fire‑and‑forget helpers – only send the command if in a RN WebView
    // ─────────────────────────────────────────────────────────────

    const postToNative = (type, payload = {}) => {
        if (typeof window !== 'undefined' && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
        }
        else {
            console.log('cannot start location tracking in the web')
        }
    }

    const startLocationTracking = () => {
        postToNative('START_LOCATION_TRACKING', { interval: 30000 });
    }

    const stopLocationTracking = () => {
        postToNative('STOP_LOCATION_TRACKING');
    }

    useEffect(() => {
        startLocationTracking()
        return () => {
            stopLocationTracking()
        }
    }, [])

    useEffect(() => {
        const go = async () => {
            try {
                const r = await fetch(`${API_URL}/frontend-url`);
                if (!r.ok) throw new Error();
                const j = await r.json();
                const p = j?.data?.paths || {};
                setFrontendUrls({
                    riderApp: p['okra-rider-app'] || (process.env.NEXT_PUBLIC_RIDER_APP_URL || 'http://10.34.107.23:3001'),
                    driverApp: p['okra-driver-app'] || (process.env.NEXT_PUBLIC_DRIVER_APP_URL || 'http://localhost:3002'),
                    deliveryApp: p['okra-delivery-app'] || (process.env.NEXT_PUBLIC_DELIVERY_APP_URL || 'http://localhost:3003'),
                });
                // Pull app store links from the same API response if available
                if (j?.data?.appLinks) {
                    setAppLinks({
                        android: j.data.appLinks.android || process.env.NEXT_PUBLIC_ANDROID_APP_LINK || '',
                        ios: j.data.appLinks.ios || process.env.NEXT_PUBLIC_IOS_APP_LINK || '',
                    });
                }
            } catch (_) { }
            setLoading(false);
        };
        go();
    }, []);

    useEffect(() => {
        const cycle = () => {
            setHeaderPhase('slide');
            setTimeout(() => setHeaderPhase('brand'), 8000);
        };
        const t0 = setTimeout(cycle, 2000);
        const iv = setInterval(cycle, 60000);
        return () => { clearTimeout(t0); clearInterval(iv); };
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/admn-settings`)
            .then(r => r.json())
            .then(d => { setAffiliateEnabled(d?.data?.affiliateSystemEnabled ?? true); })
            .catch(() => { });
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode) {
            fetch(`${API_URL}/affiliate/track-impression`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ affiliateCode: refCode, userAgent: navigator.userAgent }),
            }).catch(() => { });
        }
    }, []);

    // Navigation handler — shows modal for browser users, navigates directly for RN WebView
    const nav = (url, id, isTrackOrder = false) => {
        setActiveService(id);
        if (isRNWebView || isTrackOrder) {
            // In-app WebView or track order: go directly
            setTimeout(() => { window.location.href = url; }, 200);
        } else {
            // Browser user: show app download modal
            setModalWebUrl(url);
            setModalOpen(true);
        }
    };

    const handleModalWebProceed = () => {
        setModalOpen(false);
        setTimeout(() => { window.location.href = modalWebUrl; }, 120);
    };

    const NEUTRAL_TEXT = '#f3f4f6';

    // Note: quick actions list — track order action removed per updated design
    const quickActions = [
        { id: 'book-ride', label: 'Book A Ride', cardImg: CARD_RIDE_B64, imgTitle: 'Book a ride', imgSubtitle: 'Get to your destination quickly', iconImg: '/icons/icon_ride.png', bg: 'var(--g-hero)', iconBg: 'rgba(255,255,255,0.18)', textColor: 'white', shadow: 'rgba(234,88,12,0.38)', url: frontendUrls.riderApp, isTrackOrder: false, fullWidth: true, tall: true },
        { id: 'deliver', label: 'Deliver A Package', cardImg: CARD_PACKAGE_B64, imgTitle: 'Deliver a package', imgSubtitle: 'Send a package easily', iconImg: '/icons/icon_package.png', bg: 'rgba(24,24,24,0.98)', iconBg: 'rgba(234,88,12,0.14)', textColor: NEUTRAL_TEXT, shadow: 'rgba(0,0,0,0.35)', accent: '#ea580c', url: frontendUrls.riderApp + '/deliveries/send', isTrackOrder: false },
        { id: 'drive', label: 'Earn Money Driving', cardImg: CARD_DRIVING_B64, imgTitle: 'Earn driving', imgSubtitle: 'Drive and earn money', iconImg: '/icons/icon_driving.png', bg: 'rgba(24,24,24,0.98)', iconBg: 'rgba(234,88,12,0.14)', textColor: NEUTRAL_TEXT, shadow: 'rgba(0,0,0,0.35)', accent: '#ea580c', url: frontendUrls.driverApp, isTrackOrder: false },
        { id: 'deliver-earn', label: 'Earn Delivering', cardImg: CARD_DELIVERING_B64, imgTitle: 'Earn delivering', imgSubtitle: 'Deliver packages for cash', iconImg: '/icons/icon_delivering.png', bg: 'rgba(24,24,24,0.98)', iconBg: 'rgba(234,88,12,0.14)', textColor: NEUTRAL_TEXT, shadow: 'rgba(0,0,0,0.35)', accent: '#ea580c', url: frontendUrls.deliveryApp, isTrackOrder: false },
        { id: 'affiliates', label: 'Earn With Affiliates', cardImg: CARD_AFFILIATES_B64, imgTitle: 'Earn with Affiliates', imgSubtitle: 'Refer friends and earn', iconImg: '/icons/icon_affiliates.png', bg: 'rgba(24,24,24,0.98)', iconBg: 'rgba(234,88,12,0.14)', textColor: NEUTRAL_TEXT, shadow: 'rgba(0,0,0,0.35)', accent: '#ea580c', url: affiliateEnabled ? (frontendUrls.riderApp + '/affiliate') : '#', isTrackOrder: false },
    ];

    const services = [
        { id: 'rider', name: 'Book a Ride', desc: 'Quick, reliable rides across Zambia', icon: '🚗', gradient: 'linear-gradient(145deg,#7c2d12 0%,#c2410c 45%,#f97316 100%)', glowColor: 'rgba(234,88,12,0.22)', accentDot: '#fdba74', url: frontendUrls.riderApp, features: ['Instant Booking', 'Live GPS Tracking', 'Multiple Payment Methods'], isTrackOrder: false },
        { id: 'driver', name: 'Drive with Us', desc: 'Your schedule, your earnings', icon: '🚕', gradient: 'linear-gradient(145deg,#78350f 0%,#b45309 45%,#f59e0b 100%)', glowColor: 'rgba(217,119,6,0.22)', accentDot: '#fde68a', url: frontendUrls.driverApp, features: ['Flexible Hours', 'Top Market Earnings', 'Weekly Payouts'], isTrackOrder: false },
        { id: 'delivery', name: 'Package Delivery', desc: 'Fast, city-wide delivery service', icon: '📦', gradient: 'linear-gradient(145deg,#7c2d12 0%,#ea580c 50%,#fb923c 100%)', glowColor: 'rgba(234,88,12,0.22)', accentDot: '#fed7aa', url: frontendUrls.riderApp + '/deliveries/send', features: ['Same-Day Delivery', 'Real-Time Tracking', 'Safe Handling Guarantee'], isTrackOrder: false },
        { id: 'affiliates', name: 'Okra Affiliates', desc: 'Build your network, grow your income', icon: '💸', gradient: 'linear-gradient(145deg,#7c2d12 0%,#c2410c 55%,#f97316 100%)', glowColor: 'rgba(234,88,12,0.22)', accentDot: '#fdba74', url: affiliateEnabled ? (frontendUrls.riderApp + '/affiliate') : "#", features: ['Refer a driver, earn', 'Earn per customer trip', 'Withdraw via mobile money'], isTrackOrder: false },
    ];

    const whyItems = [
        { icon: '⚡', title: 'Instant & Reliable', desc: 'Sub-minute matching with verified, on-call drivers', color: '#f59e0b' },
        { icon: '💳', title: 'Transparent Pricing', desc: 'Clear upfront fares — zero hidden charges, ever', color: '#ea580c' },
        { icon: '🛡️', title: 'Verified & Safe', desc: 'Background-checked drivers with built-in safety tools', color: '#fb923c' },
        { icon: '📱', title: 'Ridiculously Easy', desc: 'Book in under 20 seconds from anywhere in Zambia', color: '#f97316' },
    ];

    const stats = [
        { num: '10K+', label: 'Active Drivers', icon: '🚗' },
        { num: '50K+', label: 'Happy Riders', icon: '😊' },
        { num: '24/7', label: 'Live Support', icon: '💬' },
        { num: '4.9★', label: 'Avg. Rating', icon: '⭐' },
    ];

    const FOOTER_LINKS = {
        Terms: '/terms.html',
        Privacy: '/privacy-policy.html',
        Support: frontendUrls.riderApp + '/help',
        Data: '/data-deletion-policy.html',
    };

    if (loading) {
        return (
            <div className="okra-root okra-bg min-h-screen">
                <GlobalStyles />
                <div className="glass-header fixed top-0 inset-x-0 h-16 z-50" />
                <div className="pt-24 px-5 space-y-8 max-w-xl mx-auto">
                    <div className="space-y-3 text-center pt-8">
                        <div className="h-10 w-64 rounded-2xl mx-auto animate-pulse" style={{ background: 'rgba(234,88,12,0.14)' }} />
                        <div className="h-5 w-48 rounded-xl mx-auto animate-pulse" style={{ background: 'rgba(234,88,12,0.08)' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', animationDelay: `${i * 60}ms` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="okra-root okra-bg min-h-screen overflow-x-hidden relative">
            <GlobalStyles />

            {/* ── App Download Modal ── */}
            <AppDownloadModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                webUrl={modalWebUrl}
                appLinks={appLinks}
            />

            {/* ── MAIN ── */}
            <main className="relative z-10 pt-10 pb-20 px-4 sm:px-6">

                {/* Okra logo */}
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, type: 'spring', damping: 22, stiffness: 160 }}
                    className="text-center mb-8 max-w-3xl mx-auto"
                >
                    <img
                        src="/icon.png"
                        alt="Okra"
                        style={{ height: 72, width: 'auto', margin: '0 auto', display: 'block' }}
                    />
                </motion.section>

                {/* QUICK ACTIONS */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{ maxWidth: '384px', margin: '0 auto 40px' }}
                >
                    {/* Book a Ride — full width banner, sized to its own crop's aspect ratio */}
                    {quickActions.filter(a => a.fullWidth).map((a) => (
                        <motion.div key={a.id} variants={itemVariants} style={{ marginBottom: 12 }}>
                            <RippleBtn action={a} onClick={() => nav(a.url, a.id, a.isTrackOrder)} />
                        </motion.div>
                    ))}

                    {/* Remaining actions — clean 2x2 grid */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gridAutoRows: '112px',
                            gap: '12px',
                        }}
                    >
                        {quickActions.filter(a => !a.fullWidth).map((a) => (
                            <motion.div key={a.id} variants={itemVariants}>
                                <RippleBtn action={a} onClick={() => nav(a.url, a.id, a.isTrackOrder)} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ABOUT US */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="text-center mb-2"
                >
                    <button
                        className="more-btn"
                        onClick={() => setShowMore(v => !v)}
                    >
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                            {showMore ? 'Show Less' : 'About Us'}
                        </span>
                        <motion.span
                            animate={{ rotate: showMore ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                            style={{ display: 'inline-flex', alignItems: 'center', fontSize: 16, lineHeight: 1 }}
                        >
                            ↓
                        </motion.span>
                    </button>
                </motion.div>

                {/* Expandable lower content */}
                <AnimatePresence>
                    {showMore && (
                        <motion.div
                            key="more-content"
                            initial={{ opacity: 0, height: 0, y: -16 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 30, mass: 0.9 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <motion.div variants={containerVariants} initial="hidden" animate="show">

                                {/* SERVICE CARDS */}
                                <section className="max-w-6xl mx-auto mb-20 pt-6">
                                    <motion.div variants={itemVariants} className="text-center mb-10">
                                        <h2 className="font-sora font-bold text-gray-100 mb-2"
                                            style={{ fontSize: 'clamp(1.45rem,3vw,2rem)', letterSpacing: '-0.025em' }}>
                                            Explore Our Services
                                        </h2>
                                        <p className="text-gray-400" style={{ fontSize: 13, fontWeight: 500 }}>Everything you need, all in one place</p>
                                    </motion.div>

                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                        {services.map((svc, i) => (
                                            <motion.div
                                                key={svc.id}
                                                variants={itemVariants}
                                                whileHover={{ y: -12, rotateX: 5, rotateY: -3, scale: 1.01 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => nav(svc.url, svc.id, svc.isTrackOrder)}
                                                className="card3d"
                                                style={{ background: '#141414', boxShadow: `var(--shadow-md), 0 6px 24px ${svc.glowColor}` }}
                                            >
                                                <div className="relative overflow-hidden p-6 pb-10" style={{ background: svc.gradient }}>
                                                    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 60%)' }} />
                                                    <div className="relative z-10 mb-3" style={{ fontSize: 44, lineHeight: 1, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))' }}>{svc.icon}</div>
                                                    <h3 className="font-sora relative z-10 text-white font-bold leading-tight mb-1"
                                                        style={{ fontSize: 17, textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>{svc.name}</h3>
                                                    <p className="relative z-10 text-white leading-relaxed"
                                                        style={{ fontSize: 12, opacity: 0.88, textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{svc.desc}</p>
                                                    <div className="absolute inset-x-0" style={{ bottom: -6, height: 28, borderRadius: '50% 50% 0 0 / 100% 100% 0 0', background: '#141414' }} />
                                                </div>
                                                <div className="p-5 pt-2">
                                                    <ul className="space-y-2 mb-5">
                                                        {svc.features.map((feat, fi) => (
                                                            <li key={fi} className="flex items-start gap-2" style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.5, fontWeight: 500 }}>
                                                                <span className="flex-shrink-0 flex items-center justify-center text-white"
                                                                    style={{ width: 16, height: 16, borderRadius: 999, marginTop: 1, background: svc.gradient, fontSize: 8, fontWeight: 900 }}>✓</span>
                                                                {feat}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <button className="shimmer-cta w-full text-white font-semibold rounded-xl"
                                                        style={{ background: svc.gradient, padding: '10px 0', fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px ${svc.glowColor},inset 0 1px 0 rgba(255,255,255,0.15)`, letterSpacing: '-0.01em' }}>
                                                        Get Started →
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>

                                {/* WHY OKRA */}
                                <section className="max-w-5xl mx-auto mb-20">
                                    <motion.div variants={itemVariants} className="text-center mb-10">
                                        <h2 className="font-sora font-bold text-gray-100 mb-2"
                                            style={{ fontSize: 'clamp(1.45rem,3vw,2rem)', letterSpacing: '-0.025em' }}>Why Choose Okra?</h2>
                                        <p className="text-gray-400" style={{ fontSize: 13, fontWeight: 500 }}>Built for Zambia, trusted by thousands every day</p>
                                    </motion.div>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                        {whyItems.map((w, i) => (
                                            <motion.div key={i} variants={itemVariants}
                                                whileHover={{ scale: 1.03, y: -5 }}
                                                className="glass feat-card rounded-2xl p-5"
                                                style={{ boxShadow: 'var(--shadow-card)' }}>
                                                <div className="rounded-2xl flex items-center justify-center mb-4"
                                                    style={{ width: 46, height: 46, fontSize: 22, background: `${w.color}22`, boxShadow: `0 3px 14px ${w.color}33` }}>{w.icon}</div>
                                                <h3 className="font-semibold text-gray-100 mb-1.5" style={{ fontSize: 13, letterSpacing: '-0.01em' }}>{w.title}</h3>
                                                <p className="text-gray-400 leading-relaxed" style={{ fontSize: 12, fontWeight: 500 }}>{w.desc}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>

                                {/* STATS BANNER */}
                                <section className="max-w-5xl mx-auto mb-20">
                                    <motion.div variants={itemVariants}
                                        className="stats-banner rounded-3xl p-10 sm:p-14 relative overflow-hidden">
                                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.18) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
                                        <div className="absolute rounded-full" style={{ top: '-5rem', right: '-5rem', width: 300, height: 300, background: 'radial-gradient(circle,rgba(255,255,255,0.10) 0%,transparent 65%)' }} />
                                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                            {stats.map((s, i) => (
                                                <motion.div key={i} variants={itemVariants} className="stat-item">
                                                    <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                                                    <div className="font-sora font-black text-white leading-none mb-1.5"
                                                        style={{ fontSize: 'clamp(1.7rem,4vw,2.5rem)', textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>{s.num}</div>
                                                    <div className="text-orange-100 font-semibold tracking-wide" style={{ fontSize: 11 }}>{s.label}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </section>

                                {/* FOOTER */}
                                <footer className="max-w-5xl mx-auto">
                                    <motion.div variants={itemVariants}>
                                        <div className="footer-glass rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                <img src="/icon.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain', opacity: 0.5 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                                                <span className="font-sora font-bold text-hero" style={{ fontSize: 17 }}>Okra</span>
                                                <span className="text-gray-400" style={{ fontSize: 12 }}>Technologies</span>
                                            </div>
                                            <p className="text-gray-400 mb-5" style={{ fontSize: 12, fontWeight: 500 }}>
                                                2025 Okra Technologies. All rights reserved. Zambia's premier ride &amp; delivery platform.
                                            </p>
                                            <div className="flex gap-6 justify-center flex-wrap">
                                                {['Terms', 'Privacy', 'Support', 'Data Policy'].map(l => (
                                                    <a key={l} href={FOOTER_LINKS[l]}
                                                        style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textDecoration: 'none', transition: 'color 0.18s' }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = '#f97316'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}>
                                                        {l}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </footer>

                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Powered by OkraPay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    style={{ textAlign: 'center', paddingTop: 8, paddingBottom: 24 }}
                >
                    <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6b7280',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                    }}>
                        Powered by{' '}
                        <span style={{
                            background: 'linear-gradient(90deg, #c2410c, #f59e0b)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontWeight: 800,
                        }}>
                            OkraPay
                        </span>
                    </span>
                </motion.div>

            </main>
        </div>
    );
};

export default OkraLandingPage;