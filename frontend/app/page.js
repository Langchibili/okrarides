'use client'
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body, .okra-root { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .font-sora { font-family: 'Sora', system-ui, sans-serif; }
    :root {
      --g-hero: linear-gradient(140deg, #14532d 0%, #15803d 30%, #16a34a 60%, #0d9488 100%);
      --shadow-sm: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
      --shadow-md: 0 12px 40px rgba(0,0,0,0.10), 0 3px 10px rgba(0,0,0,0.06);
      --shadow-xl: 0 40px 96px rgba(0,0,0,0.16), 0 10px 28px rgba(0,0,0,0.09);
    }
    .okra-bg {
      background:
        radial-gradient(ellipse 80% 60% at 10% 15%, rgba(22,163,74,0.09) 0%, transparent 55%),
        radial-gradient(ellipse 60% 50% at 90% 8%,  rgba(20,184,166,0.07) 0%, transparent 50%),
        radial-gradient(ellipse 50% 40% at 55% 85%, rgba(245,158,11,0.05) 0%, transparent 50%),
        radial-gradient(ellipse 70% 50% at 0%  65%, rgba(22,163,74,0.06) 0%, transparent 45%),
        radial-gradient(ellipse 55% 40% at 98% 55%, rgba(13,148,136,0.06) 0%, transparent 40%),
        linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 40%, #f0fdfa 80%, #f5fffe 100%);
    }
    .glass {
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(28px) saturate(160%);
      -webkit-backdrop-filter: blur(28px) saturate(160%);
      border: 1px solid rgba(255,255,255,0.95);
    }
    .glass-header {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(40px) saturate(180%);
      -webkit-backdrop-filter: blur(40px) saturate(180%);
      border-bottom: 1px solid rgba(255,255,255,0.98);
      box-shadow: 0 4px 32px rgba(0,0,0,0.05), 0 1px 8px rgba(22,163,74,0.06);
    }
    .text-hero {
      background: var(--g-hero);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Quick action buttons — FIXED uniform size ── */
    .qbtn {
      position: relative;
      cursor: pointer;
      overflow: hidden;
      border: none;
      outline: none;
      text-align: left;
      width: 100%;
      height: 112px;
      border-radius: 20px;
      display: block;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .qbtn-ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      background: rgba(255,255,255,0.55);
      animation: ripple-burst 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
      pointer-events: none;
    }
    @keyframes ripple-burst {
      to { transform: scale(4); opacity: 0; }
    }
    .qbtn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.32), rgba(255,255,255,0));
      opacity: 0;
      transition: opacity 0.22s;
      pointer-events: none;
    }
    .qbtn:hover::after { opacity: 1; }

    .card3d {
      transition: transform 0.32s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.32s ease;
      transform-style: preserve-3d;
      will-change: transform;
      cursor: pointer;
      border-radius: 24px;
      overflow: hidden;
    }
    .shimmer-cta { position: relative; overflow: hidden; }
    .shimmer-cta::before {
      content: '';
      position: absolute;
      top: -50%; left: -75%;
      width: 50%; height: 200%;
      background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%);
      transform: skewX(-18deg);
    }
    .shimmer-cta:hover::before { animation: shimmer-run 0.6s ease forwards; }
    @keyframes shimmer-run { 0% { left: -75%; } 100% { left: 125%; } }

    .orb   { animation: orb-float 18s ease-in-out infinite; }
    .orb-2 { animation: orb-float 22s ease-in-out infinite reverse; animation-delay: -6s; }
    .orb-3 { animation: orb-float 16s ease-in-out infinite; animation-delay: -11s; }
    @keyframes orb-float {
      0%,100% { transform: translate(0,0) scale(1); }
      33%      { transform: translate(20px,-30px) scale(1.05); }
      66%      { transform: translate(-15px,-15px) scale(0.97); }
    }
    .noise {
      position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.018;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px;
    }
    .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
    @keyframes pulse-dot {
      0%,100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.5; transform: scale(1.3); }
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 14px; border-radius: 999px;
      background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);
      color: #15803d; font-size: 11.5px; font-weight: 600; letter-spacing: 0.01em;
    }
    .feat-card {
      transition: transform 0.26s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.26s ease;
    }
    .feat-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 28px 56px rgba(0,0,0,0.11), 0 6px 16px rgba(0,0,0,0.07) !important;
    }
    .stats-banner {
      background: linear-gradient(140deg, #14532d 0%, #15803d 25%, #166534 50%, #0f766e 75%, #0d9488 100%);
      box-shadow: 0 40px 80px rgba(22,163,74,0.28), 0 12px 32px rgba(22,163,74,0.18);
    }
    .footer-glass {
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.92);
    }
    .stat-item { transition: transform 0.28s cubic-bezier(0.34,1.3,0.64,1); }
    .stat-item:hover { transform: scale(1.07) translateY(-4px); }

    /* ── More About Us button ── */
    .more-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 32px;
      border-radius: 999px;
      border: 1.5px solid rgba(22,163,74,0.3);
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(16px);
      color: #15803d;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.22s cubic-bezier(0.34,1.3,0.64,1);
      box-shadow: 0 4px 20px rgba(22,163,74,0.14), 0 1px 4px rgba(0,0,0,0.05);
      font-family: 'Plus Jakarta Sans', sans-serif;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .more-btn:hover {
      background: rgba(22,163,74,0.06);
      border-color: rgba(22,163,74,0.55);
      box-shadow: 0 8px 32px rgba(22,163,74,0.22);
      transform: translateY(-2px);
    }
    .more-btn:active { transform: scale(0.96); }
    .more-btn-arrow {
      transition: transform 0.35s cubic-bezier(0.34,1.3,0.64,1);
    }
    .more-btn.open .more-btn-arrow { transform: rotate(180deg); }
  `}</style>
);

// ─── Looping Hero Subtitle — slides RIGHT TO LEFT, 10s interval ──────────────
const HERO_LINES = [
  { text: 'Reliable rides',             icon: '🚗' },
  { text: 'Fast deliveries',            icon: '🛵' },
  { text: 'Real earning opportunities', icon: '💰' },
  { text: 'Built for Zambia',           icon: '🌍' },
];

const HeroSubtitle = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setIndex(i => (i + 1) % HERO_LINES.length), 10000);
    return () => clearInterval(iv);
  }, []);

  const current = HERO_LINES[index];

  return (
    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          // slides in from right, exits to left
          initial={{ x: 80,  opacity: 0 }}
          animate={{ x: 0,   opacity: 1 }}
          exit={{   x: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            color: '#4b5563',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            {current.text}
          </span>

          <motion.span
            initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
            animate={{ scale: 1,   rotate: 0,   opacity: 1 }}
            transition={{ type: 'spring', stiffness: 440, damping: 20, delay: 0.12 }}
            style={{
              fontSize: 22, lineHeight: 1,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: 11,
              background: 'rgba(22,163,74,0.09)',
              border: '1px solid rgba(22,163,74,0.16)',
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

// ─── Ripple Button ────────────────────────────────────────────────────────────
const RippleBtn = ({ action, onClick }) => {
  const btnRef          = useRef(null);
  const [ripples,  setRipples]  = useState([]);
  const [pressed,  setPressed]  = useState(false);

  const handlePointerDown = (e) => {
    const btn  = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const id   = Date.now();
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
          ? `var(--shadow-sm), 0 2px 8px ${action.shadow}`
          : `var(--shadow-sm), 0 8px 28px ${action.shadow}`,
        border: action.bg.startsWith('rgba') ? '1px solid rgba(255,255,255,0.92)' : 'none',
        transform: pressed ? 'scale(0.93)' : 'scale(1)',
        transition: 'transform 0.15s cubic-bezier(0.34,1.5,0.64,1), box-shadow 0.15s ease',
      }}
      onPointerDown={handlePointerDown}
      onClick={onClick}
    >
      {/* Ripples */}
      {ripples.map(rp => (
        <span
          key={rp.id}
          className="qbtn-ripple"
          style={{
            left:   rp.x - rp.size / 2,
            top:    rp.y - rp.size / 2,
            width:  rp.size,
            height: rp.size,
          }}
        />
      ))}

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '16px', height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: action.iconBg,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.08)',
          fontSize: 22,
          transform: pressed ? 'scale(0.88)' : 'scale(1)',
          transition: 'transform 0.15s cubic-bezier(0.34,1.5,0.64,1)',
        }}>
          {action.icon}
        </div>

        <span style={{
          color: action.textColor,
          fontSize: 11.5,
          fontWeight: 700,
          lineHeight: 1.3,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}>
          {action.label}
        </span>
      </div>

      {/* Active ring flash */}
      {pressed && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
          boxShadow: `inset 0 0 0 2.5px ${action.accent || 'rgba(255,255,255,0.6)'}`,
        }} />
      )}
    </button>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const OkraLandingPage = () => {
  const [frontendUrls, setFrontendUrls] = useState({
    riderApp:    'http://10.27.147.23:3001',
    driverApp:   'http://10.27.147.23:3002',
    deliveryApp: 'http://10.27.147.23:3003',
  });
  const [loading,       setLoading]       = useState(true);
  const [headerPhase,   setHeaderPhase]   = useState('brand');
  const [activeService, setActiveService] = useState(null);
  const [mousePos,      setMousePos]      = useState({ x: 0, y: 0 });
  const [showMore,      setShowMore]      = useState(false);   // ← "More About Us"
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343';

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(`${API_URL}/frontend-url`);
        if (!r.ok) throw new Error();
        const j = await r.json();
        const p = j?.data?.paths || {};
        setFrontendUrls({
          riderApp:    p['okra-rider-app']    || 'http://10.27.147.23:3001/',
          driverApp:   p['okra-driver-app']   || 'http://10.27.147.23:3002/',
          deliveryApp: p['okra-delivery-app'] || 'http://10.27.147.23:3003/',
        });
      } catch (_) {}
      setLoading(false);
    };
    go();
  }, []);

  useEffect(() => {
    const cycle = () => {
      setHeaderPhase('slide');
      setTimeout(() => setHeaderPhase('brand'), 8000);
    };
    const t0 = setTimeout(cycle, 3200);
    const iv = setInterval(cycle, 60000);
    return () => { clearTimeout(t0); clearInterval(iv); };
  }, []);

  useEffect(() => {
    const h = (e) => setMousePos({
      x: (e.clientX / window.innerWidth  - 0.5) * 28,
      y: (e.clientY / window.innerHeight - 0.5) * 28,
    });
    window.addEventListener('mousemove', h, { passive: true });
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const nav = (url, id) => {
    setActiveService(id);
    setTimeout(() => { window.location.href = url; }, 200);
  };

  const quickActions = [
    { id: 'book-ride',    label: 'Book A Ride',               icon: '🚗', bg: '#ffc107',               iconBg: 'rgba(255,255,255,0.28)', textColor: '#3d1f00', shadow: 'rgba(255,193,7,0.38)',   url: frontendUrls.riderApp },
    { id: 'deliver',      label: 'Deliver A Package',         icon: '📦', bg: 'rgba(255,255,255,0.92)', iconBg: 'rgba(22,163,74,0.1)',    textColor: '#14532d', shadow: 'rgba(22,163,74,0.18)',  accent: '#16a34a', url: frontendUrls.deliveryApp },
    { id: 'drive',        label: 'Earn Money Driving',        icon: '🚕', bg: 'var(--g-hero)',          iconBg: 'rgba(255,255,255,0.22)', textColor: 'white',   shadow: 'rgba(13,148,136,0.42)', url: frontendUrls.driverApp },
    { id: 'deliver-earn', label: 'Earn Money Delivering',     icon: '🛵', bg: 'rgba(255,255,255,0.92)', iconBg: 'rgba(22,163,74,0.1)',    textColor: '#14532d', shadow: 'rgba(22,163,74,0.18)',  accent: '#16a34a', url: frontendUrls.deliveryApp },
    { id: 'affiliates',   label: 'Earn With Okra Affiliates', icon: '💸', bg: 'rgba(255,255,255,0.92)', iconBg: 'rgba(109,40,217,0.08)', textColor: '#4c1d95', shadow: 'rgba(124,58,237,0.18)', accent: '#7c3aed', url: '#' },
    { id: 'track',        label: 'Track Order',               icon: '📍', bg: 'rgba(255,255,255,0.92)', iconBg: 'rgba(8,145,178,0.1)',    textColor: '#164e63', shadow: 'rgba(8,145,178,0.18)',  accent: '#0891b2', url: frontendUrls.riderApp },
  ];

  const services = [
    { id: 'rider',      name: 'Book a Ride',      desc: 'Quick, reliable rides across Zambia',  icon: '🚗', gradient: 'linear-gradient(145deg,#14532d 0%,#15803d 45%,#22c55e 100%)', glowColor: 'rgba(22,163,74,0.25)',   accentDot: '#86efac', url: frontendUrls.riderApp,    features: ['Instant Booking', 'Live GPS Tracking', 'Multiple Payment Methods'] },
    { id: 'driver',     name: 'Drive with Us',    desc: 'Your schedule, your earnings',         icon: '🚕', gradient: 'linear-gradient(145deg,#78350f 0%,#b45309 45%,#fbbf24 100%)', glowColor: 'rgba(217,119,6,0.25)',   accentDot: '#fde68a', url: frontendUrls.driverApp,   features: ['Flexible Hours', 'Top Market Earnings', 'Weekly Payouts'] },
    { id: 'delivery',   name: 'Package Delivery', desc: 'Fast, city-wide delivery service',     icon: '📦', gradient: 'linear-gradient(145deg,#0c4a6e 0%,#0891b2 50%,#22d3ee 100%)', glowColor: 'rgba(8,145,178,0.25)',   accentDot: '#a5f3fc', url: frontendUrls.deliveryApp, features: ['Same-Day Delivery', 'Real-Time Tracking', 'Safe Handling Guarantee'] },
    { id: 'affiliates', name: 'Okra Affiliates',  desc: 'Build your network, grow your income', icon: '💸', gradient: 'linear-gradient(145deg,#4c1d95 0%,#7c3aed 55%,#a78bfa 100%)', glowColor: 'rgba(124,58,237,0.25)', accentDot: '#ddd6fe', url: '#',                      features: ['Refer a driver, earn', 'Refer a customer, earn per trip', 'Withdraw via mobile money and OkraPay'] },
  ];

  const whyItems = [
    { icon: '⚡', title: 'Instant & Reliable',  desc: 'Sub-minute matching with verified, on-call drivers',     color: '#f59e0b' },
    { icon: '💳', title: 'Transparent Pricing', desc: 'Clear upfront fares — zero hidden charges, ever',        color: '#10b981' },
    { icon: '🛡️', title: 'Verified & Safe',     desc: 'Background-checked drivers with built-in safety tools', color: '#3b82f6' },
    { icon: '📱', title: 'Ridiculously Easy',   desc: 'Book in under 20 seconds from anywhere in Zambia',      color: '#ec4899' },
  ];

  const stats = [
    { num: '10K+', label: 'Active Drivers', icon: '🚗' },
    { num: '50K+', label: 'Happy Riders',   icon: '😊' },
    { num: '24/7', label: 'Live Support',   icon: '💬' },
    { num: '4.9★', label: 'Avg. Rating',   icon: '⭐' },
  ];

  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 14 + Math.random() * 18,
    size: 3 + Math.random() * 4.5,
    color: i % 3 === 0 ? 'rgba(22,163,74,0.22)' : i % 3 === 1 ? 'rgba(20,184,166,0.18)' : 'rgba(245,158,11,0.14)',
  }));

  if (loading) {
    return (
      <div className="okra-root okra-bg min-h-screen">
        <GlobalStyles />
        <div className="glass-header fixed top-0 inset-x-0 h-16 z-50" />
        <div className="pt-24 px-5 space-y-8 max-w-xl mx-auto">
          <div className="space-y-3 text-center pt-8">
            <div className="h-10 w-64 rounded-2xl mx-auto animate-pulse" style={{ background: 'rgba(22,163,74,0.1)' }} />
            <div className="h-5 w-48 rounded-xl mx-auto animate-pulse" style={{ background: 'rgba(22,163,74,0.07)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.65)', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="okra-root okra-bg min-h-screen overflow-x-hidden relative">
      <GlobalStyles />
      <div className="noise" />

      {/* Parallax orbs + particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="orb absolute" style={{ top: '-10%', right: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.11) 0%, transparent 68%)', filter: 'blur(44px)', transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px)`, transition: 'transform 0.55s ease' }} />
        <div className="orb-2 absolute" style={{ bottom: '-8%', left: '-6%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 65%)', filter: 'blur(50px)', transform: `translate(${mousePos.x * -0.25}px, ${mousePos.y * -0.25}px)`, transition: 'transform 0.7s ease' }} />
        <div className="orb-3 absolute" style={{ top: '40%', left: '35%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.05) 0%, transparent 60%)', filter: 'blur(70px)' }} />
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{ left: `${p.left}%`, top: -8, width: p.size, height: p.size, background: p.color }}
            animate={{ y: ['0vh', '105vh'], opacity: [0, 0.65, 0.65, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
          />
        ))}
      </div>

      {/* ── HEADER — logo left, tagline right, NO animation div ── */}
     {/* ── HEADER ── */}
<motion.header
  initial={{ y: -72, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ type: 'spring', damping: 22, stiffness: 180 }}
  className="glass-header fixed top-0 inset-x-0 z-50"
  style={{ height: 64, overflow: 'hidden' }}
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

    {/* Logo — left side, z-indexed above gif */}
    <div className="flex items-center gap-2.5" style={{ position: 'relative', zIndex: 10 }}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        <img
          src="/icon.png"
          alt="Okra"
          style={{ width: 40, height: 40, objectFit: 'contain' }}
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'block';
          }}
        />
        <span style={{ fontSize: 32, display: 'none', lineHeight: 1 }}>🥬</span>
      </div>
      <div>
        <div className="font-sora text-hero leading-none tracking-tight" style={{ fontSize: 20, fontWeight: 800 }}>
          Okra
        </div>
        <div className="relative" style={{ height: 16 }}>
          <AnimatePresence mode="wait">
            {headerPhase === 'brand' ? (
              <motion.span
                key="brand"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="absolute inset-0 flex items-center text-gray-400"
                style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'capitalize' }}
              >
                Technologies
              </motion.span>
            ) : (
              <motion.span
                key="slide"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="absolute inset-0 flex items-center font-sora font-semibold"
                style={{
                  zIndex:100,
                  fontSize: 10, whiteSpace: 'nowrap',
                  background: 'linear-gradient(90deg,#15803d,#22c55e,#0d9488)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                slide into your ride &gt;&gt;
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

    {/* GIF — top right, clipped to header height, pointer-events off so it never blocks clicks */}
    <div style={{
      position: 'absolute',
      top: 5,
      right: 20,
      height: 60,
      width: 130,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 1,          // ← behind the logo (z:10) so it never overlaps text
    }}>
      <img
        src="/okra-car-slide-animation.gif"
        alt=""
        style={{
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.92,
          display: 'block',
        }}
      />
    </div>

  </div>
</motion.header>

      {/* ── MAIN ── */}
      <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">

        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, type: 'spring', damping: 22, stiffness: 140 }}
          className="text-center mb-14 max-w-3xl mx-auto"
        >
          {/* <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 200 }}
            className="badge mx-auto mb-5">
            <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Zambia's #1 Ride &amp; Delivery Platform
          </motion.div> */}

          {/* <h1 className="font-sora text-hero tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.4rem,5.5vw,4rem)', fontWeight: 900, lineHeight: 1.08 }}>
            Choose Your<br />Service
          </h1> */}

          <HeroSubtitle />
        </motion.section>

        {/* QUICK ACTIONS — uniform 112px grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridAutoRows: '112px',
            gap: '12px',
            maxWidth: '384px',
            margin: '0 auto 48px',
          }}
        >
          {quickActions.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260, delay: i * 0.055 }}
              style={{ height: '112px' }}
            >
              <RippleBtn action={a} onClick={() => nav(a.url, a.id)} />
            </motion.div>
          ))}
        </div>

        {/* ── MORE ABOUT US button ── */}
        <div className="text-center mb-6">
          <motion.button
            className={`more-btn${showMore ? ' open' : ''}`}
            onClick={() => setShowMore(v => !v)}
            whileTap={{ scale: 0.96 }}
          >
            <span>{showMore ? 'Show Less' : 'About Us'}</span>
            <motion.span
              className="more-btn-arrow"
              animate={{ rotate: showMore ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{ display: 'inline-flex', alignItems: 'center', fontSize: 18, lineHeight: 1 }}
            >
              ↓
            </motion.span>
          </motion.button>
        </div>

        {/* ── Expandable lower content ── */}
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{   opacity: 0, height: 0,      y: -20 }}
              transition={{ type: 'spring', stiffness: 180, damping: 26 }}
              style={{ overflow: 'hidden' }}
            >

              {/* SERVICE CARDS */}
              <section className="max-w-6xl mx-auto mb-24 pt-4">
                <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="text-center mb-10">
                  <h2 className="font-sora font-bold text-gray-800 mb-2" style={{ fontSize: 'clamp(1.55rem,3vw,2.1rem)' }}>Explore Our Services</h2>
                  <p className="text-gray-400 text-sm">Everything you need, all in one place</p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {services.map((svc, i) => (
                    <motion.div
                      key={svc.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 120, delay: i * 0.07 }}
                      whileHover={{ y: -14, rotateX: 6, rotateY: -3, scale: 1.015 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => nav(svc.url, svc.id)}
                      className="card3d bg-white"
                      style={{ boxShadow: `var(--shadow-md), 0 8px 32px ${svc.glowColor}` }}
                    >
                      <div className="relative overflow-hidden p-6 pb-10" style={{ background: svc.gradient }}>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.22) 0%,transparent 60%)' }} />
                        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse at 85% 15%,${svc.accentDot} 0%,transparent 55%),radial-gradient(ellipse at 15% 85%,rgba(255,255,255,0.28) 0%,transparent 40%)`, opacity: 0.62 }} />
                        <div className="relative z-10 mb-3" style={{ fontSize: 46, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.28))' }}>{svc.icon}</div>
                        <h3 className="font-sora relative z-10 text-white font-bold leading-tight mb-1" style={{ fontSize: 18, textShadow: '0 1px 6px rgba(0,0,0,0.2)' }}>{svc.name}</h3>
                        <p className="relative z-10 text-white leading-relaxed" style={{ fontSize: 12, opacity: 0.85 }}>{svc.desc}</p>
                        <div className="absolute inset-x-0 bg-white" style={{ bottom: -6, height: 28, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
                      </div>
                      <div className="p-5 pt-2">
                        <ul className="space-y-2 mb-5">
                          {svc.features.map((feat, fi) => (
                            <li key={fi} className="flex items-start gap-2" style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                              <span className="flex-shrink-0 flex items-center justify-center text-white"
                                style={{ width: 16, height: 16, borderRadius: 999, marginTop: 1, background: svc.gradient, fontSize: 8, fontWeight: 900 }}>✓</span>
                              {feat}
                            </li>
                          ))}
                        </ul>
                        <button className="shimmer-cta w-full text-white font-semibold rounded-xl"
                          style={{ background: svc.gradient, padding: '10px 0', fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: `0 4px 18px ${svc.glowColor},inset 0 1px 0 rgba(255,255,255,0.22)` }}>
                          Get Started →
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* WHY OKRA */}
              <section className="max-w-5xl mx-auto mb-24">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="text-center mb-10">
                  <h2 className="font-sora font-bold text-gray-800 mb-2" style={{ fontSize: 'clamp(1.55rem,3vw,2.1rem)' }}>Why Choose Okra?</h2>
                  <p className="text-gray-400 text-sm">Built for Zambia, trusted by thousands every day</p>
                </motion.div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {whyItems.map((w, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14 + i * 0.06, type: 'spring', stiffness: 140, damping: 20 }}
                      whileHover={{ scale: 1.04, y: -6 }}
                      className="glass feat-card rounded-2xl p-5">
                      <div className="rounded-2xl flex items-center justify-center mb-4" style={{ width: 48, height: 48, fontSize: 22, background: `${w.color}18`, boxShadow: `0 4px 18px ${w.color}28` }}>{w.icon}</div>
                      <h3 className="font-semibold text-gray-800 mb-1.5" style={{ fontSize: 13 }}>{w.title}</h3>
                      <p className="text-gray-500 leading-relaxed" style={{ fontSize: 12 }}>{w.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* STATS BANNER */}
              <section className="max-w-5xl mx-auto mb-20">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 20 }}
                  className="stats-banner rounded-3xl p-10 sm:p-14 relative overflow-hidden">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
                  <div className="absolute rounded-full" style={{ top: '-6rem', right: '-6rem', width: 320, height: 320, background: 'radial-gradient(circle,rgba(255,255,255,0.12) 0%,transparent 65%)' }} />
                  <div className="absolute rounded-full" style={{ bottom: '-5rem', left: '-5rem', width: 288, height: 288, background: 'radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 65%)' }} />
                  <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {stats.map((s, i) => (
                      <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', delay: 0.1 + i * 0.09, stiffness: 220, damping: 16 }}
                        className="stat-item">
                        <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                        <div className="font-sora font-black text-white leading-none mb-1.5"
                          style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', textShadow: '0 2px 14px rgba(0,0,0,0.18)' }}>{s.num}</div>
                        <div className="text-emerald-100 font-medium tracking-wide" style={{ fontSize: 11 }}>{s.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* FOOTER */}
              <footer className="max-w-5xl mx-auto">
                <div className="footer-glass rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <img src="/icon.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain', opacity: 0.55 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <span className="font-sora font-bold text-hero" style={{ fontSize: 18 }}>Okra</span>
                    <span className="text-gray-400" style={{ fontSize: 13 }}>Technologies</span>
                  </div>
                  <p className="text-gray-400 mb-5" style={{ fontSize: 12 }}>
                    2025 Okra Technologies. All rights reserved. Zambia's premier ride &amp; delivery platform.
                  </p>
                  <div className="flex gap-6 justify-center flex-wrap">
                    {['Terms', 'Privacy', 'Support', 'Careers'].map(l => (
                      <a key={l} href="#"
                        style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textDecoration: 'none', transition: 'color 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#16a34a'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}>
                        {l}
                      </a>
                    ))}
                  </div>
                </div>
              </footer>

            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default OkraLandingPage;