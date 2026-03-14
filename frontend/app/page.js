// // // 'use client'
// // // import React, { useState, useEffect } from 'react';
// // // import { motion, AnimatePresence } from 'framer-motion';

// // // const OkraLandingPage = () => {
// // //   const [frontendUrls, setFrontendUrls] = useState({});
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState(null);
// // //   const [activeService, setActiveService] = useState(null);

// // //   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343';

// // //   useEffect(() => {
// // //     fetchFrontendUrls();
// // //   }, []);

// // //   const fetchFrontendUrls = async () => {
// // //     try {
// // //       setLoading(true);
// // //       const response = await fetch(`${API_URL}/frontend-url`);
// // //       if (!response.ok) throw new Error('Failed to fetch URLs');
// // //       const res = await response.json();
// // //       const urls = res?.data?.paths;
// // //       setFrontendUrls({
// // //         riderApp: urls['okra-rider-app'] || 'http://10.27.147.23:3001/home',
// // //         driverApp: urls['okra-driver-app'] || 'http://10.27.147.23:3002/home',
// // //         deliveryApp: urls['okra-delivery-app'] || 'https://delivery.okra.tech',
// // //         conductorApp: urls['okra-conductor-app'] || 'https://conductor.okra.tech'
// // //       });
// // //       setLoading(false);
// // //     } catch (err) {
// // //       console.error('Error fetching frontend URLs:', err);
// // //       setFrontendUrls({
// // //         riderApp: 'http://10.27.147.23:3001/home',
// // //         driverApp: 'http://10.27.147.23:3002/home',
// // //         deliveryApp: 'https://delivery.okra.tech',
// // //         conductorApp: 'https://conductor.okra.tech'
// // //       });
// // //       setError(err.message);
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const handleNavigation = (url, serviceName) => {
// // //     setActiveService(serviceName);
// // //     setTimeout(() => {
// // //       window.location.href = url;
// // //     }, 200);
// // //   };

// // //   const quickActions = [
// // //     { id: 'book-ride', label: 'Book A Ride', icon: '🚗', color: '#4A7C4E', url: frontendUrls.riderApp, animation: 'bounce-horizontal' },
// // //     { id: 'drive', label: 'Earn Money Driving', icon: '🚕', color: '#D4AF37', url: frontendUrls.driverApp, animation: 'pulse-grow' },
// // //     { id: 'deliver', label: 'Deliver A Package', icon: '📦', color: '#4A7C4E', url: frontendUrls.deliveryApp, animation: 'shake' },
// // //     { id: 'bus', label: 'Book A Bus', icon: '🚌', color: '#4A7C4E', url: frontendUrls.conductorApp, animation: 'bounce-vertical' },
// // //     { id: 'okrapay', label: 'Earn With OkraPay', icon: '💰', color: '#4A7C4E', url: frontendUrls.driverApp, animation: 'rotate-shake' },
// // //     { id: 'track', label: 'Track Order', icon: '📍', color: '#4A7C4E', url: frontendUrls.riderApp, animation: 'ping' }
// // //   ];

// // //   const services = [
// // //     {
// // //       id: 'rider',
// // //       name: 'Book a Ride',
// // //       description: 'Quick, reliable rides at your fingertips',
// // //       icon: '🚗',
// // //       color: '#4A7C4E',
// // //       gradient: 'linear-gradient(135deg, #4A7C4E 0%, #5C9860 100%)',
// // //       url: frontendUrls.riderApp,
// // //       features: ['Instant Booking', 'Real-time Tracking', 'Multiple Payment Options']
// // //     },
// // //     {
// // //       id: 'driver',
// // //       name: 'Drive with Us',
// // //       description: 'Earn money on your schedule',
// // //       icon: '👨‍✈️',
// // //       color: '#D4AF37',
// // //       gradient: 'linear-gradient(135deg, #D4AF37 0%, #E6C45C 100%)',
// // //       url: frontendUrls.driverApp,
// // //       features: ['Flexible Hours', 'Good Earnings', 'Weekly Payouts']
// // //     },
// // //     {
// // //       id: 'delivery',
// // //       name: 'Delivery',
// // //       description: 'Fast and secure package delivery',
// // //       icon: '📦',
// // //       color: '#4A7C4E',
// // //       gradient: 'linear-gradient(135deg, #4A7C4E 0%, #5C9860 100%)',
// // //       url: frontendUrls.deliveryApp,
// // //       features: ['Same Day Delivery', 'Package Tracking', 'Safe Handling']
// // //     },
// // //     {
// // //       id: 'conductor',
// // //       name: 'Conductor',
// // //       description: 'Manage bus routes efficiently',
// // //       icon: '🎫',
// // //       color: '#4A7C4E',
// // //       gradient: 'linear-gradient(135deg, #4A7C4E 0%, #5C9860 100%)',
// // //       url: frontendUrls.conductorApp,
// // //       features: ['Route Management', 'Passenger Tracking', 'Digital Ticketing']
// // //     }
// // //   ];

// // //   // Floating particles in background
// // //   const particles = Array.from({ length: 20 }, (_, i) => ({
// // //     id: i,
// // //     left: Math.random() * 100,
// // //     delay: Math.random() * 5,
// // //     duration: 10 + Math.random() * 20
// // //   }));

// // //   const pageVariants = {
// // //     initial: { opacity: 0 },
// // //     animate: {
// // //       opacity: 1,
// // //       transition: { duration: 0.3, staggerChildren: 0.05 }
// // //     }
// // //   };

// // //   const headerVariants = {
// // //     initial: { y: -30, opacity: 0 },
// // //     animate: {
// // //       y: 0,
// // //       opacity: 1,
// // //       transition: {
// // //         type: "spring",
// // //         damping: 15,
// // //         stiffness: 120,
// // //         duration: 0.4
// // //       }
// // //     }
// // //   };

// // //   const quickActionVariants = {
// // //     hidden: { scale: 0, opacity: 0 },
// // //     visible: (i) => ({
// // //       scale: 1,
// // //       opacity: 1,
// // //       transition: {
// // //         type: "spring",
// // //         damping: 8,
// // //         stiffness: 400,
// // //         delay: i * 0.02
// // //       }
// // //     }),
// // //     hover: { scale: 1.08, y: -4, transition: { duration: 0.15 } },
// // //     tap: { scale: 0.96 }
// // //   };

// // //   const cardVariants = {
// // //     hidden: { opacity: 0, y: 40, rotateX: -10 },
// // //     visible: (i) => ({
// // //       opacity: 1,
// // //       y: 0,
// // //       rotateX: 0,
// // //       transition: {
// // //         type: "spring",
// // //         damping: 20,
// // //         stiffness: 120,
// // //         delay: i * 0.08
// // //       }
// // //     }),
// // //     hover: {
// // //       y: -10,
// // //       rotateX: 3,
// // //       scale: 1.02,
// // //       transition: { duration: 0.25 }
// // //     }
// // //   };

// // //   const featureVariants = {
// // //     hidden: { opacity: 0, scale: 0.9 },
// // //     visible: (i) => ({
// // //       opacity: 1,
// // //       scale: 1,
// // //       transition: {
// // //         delay: 0.5 + i * 0.06,
// // //         duration: 0.4,
// // //         type: "spring",
// // //         stiffness: 120
// // //       }
// // //     })
// // //   };

// // //   if (loading) {
// // //     return (
// // //       <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
// // //         {/* Background */}
// // //         <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(74,124,78,0.05),transparent_50%)]" />
        
// // //         {/* Header Skeleton */}
// // //         <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-emerald-100 z-50 px-6 py-4">
// // //           <div className="flex items-center gap-3">
// // //             <div className="w-10 h-10 bg-emerald-100 rounded-full animate-pulse" />
// // //             <div className="w-32 h-6 bg-emerald-100 rounded animate-pulse" />
// // //           </div>
// // //         </div>

// // //         {/* Hero Skeleton */}
// // //         <div className="text-center space-y-4 mt-20">
// // //           <div className="w-64 h-8 bg-emerald-100 rounded mx-auto animate-pulse" />
// // //           <div className="w-96 h-4 bg-emerald-100 rounded mx-auto animate-pulse" />
// // //         </div>

// // //         {/* Quick Actions Skeleton */}
// // //         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 px-6 max-w-5xl mx-auto">
// // //           {[...Array(6)].map((_, i) => (
// // //             <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
// // //           ))}
// // //         </div>

// // //         {/* Service Cards Skeleton */}
// // //         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 max-w-7xl mx-auto mt-16">
// // //           {[...Array(4)].map((_, i) => (
// // //             <div key={i} className="bg-white rounded-2xl p-6 space-y-3">
// // //               <div className="w-12 h-12 bg-emerald-100 rounded-full animate-pulse" />
// // //               <div className="w-32 h-6 bg-emerald-100 rounded animate-pulse" />
// // //               <div className="w-full h-4 bg-emerald-100 rounded animate-pulse" />
// // //               {[...Array(3)].map((_, j) => (
// // //                 <div key={j} className="w-full h-3 bg-emerald-100 rounded animate-pulse" />
// // //               ))}
// // //             </div>
// // //           ))}
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <motion.div
// // //       variants={pageVariants}
// // //       initial="initial"
// // //       animate="animate"
// // //       className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden"
// // //     >
// // //       {/* Animated Background */}
// // //       <div className="fixed inset-0 overflow-hidden pointer-events-none">
// // //         <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(74,124,78,0.05),transparent_50%)]" />
// // //         {particles.map((particle) => (
// // //           <motion.div
// // //             key={particle.id}
// // //             className="absolute w-2 h-2 bg-emerald-200/30 rounded-full"
// // //             style={{ left: `${particle.left}%`, top: '-10px' }}
// // //             animate={{
// // //               y: ['0vh', '110vh'],
// // //               opacity: [0, 1, 1, 0]
// // //             }}
// // //             transition={{
// // //               duration: particle.duration,
// // //               repeat: Infinity,
// // //               delay: particle.delay,
// // //               ease: "linear"
// // //             }}
// // //           />
// // //         ))}
// // //       </div>

// // //       {/* Header */}
// // //       <motion.header
// // //         variants={headerVariants}
// // //         className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-emerald-100 z-50 px-6 py-4"
// // //       >
// // //         <div className="max-w-7xl mx-auto flex items-center justify-between">
// // //           <div className="flex items-center gap-3">
// // //             <div className="text-4xl">🥬</div>
// // //             <div>
// // //               <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
// // //                 Okra
// // //               </div>
// // //               <div className="text-xs text-gray-600">Technologies</div>
// // //             </div>
// // //           </div>
// // //           <div className="text-sm text-gray-600 hidden md:block">
// // //             Your Journey, Your Way
// // //           </div>
// // //         </div>
// // //       </motion.header>

// // //       {/* Main Content */}
// // //       <main className="pt-24 pb-16 px-6">
// // //         {/* Hero Section */}
// // //         <motion.div
// // //           initial={{ opacity: 0, y: 20 }}
// // //           animate={{ opacity: 1, y: 0 }}
// // //           transition={{ delay: 0.2 }}
// // //           className="text-center mb-12 max-w-3xl mx-auto"
// // //         >
// // //           <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 bg-clip-text text-transparent">
// // //             Choose Your Service
// // //           </h1>
// // //           <p className="text-lg text-gray-600">
// // //             Reliable transport and delivery solutions across Zambia
// // //           </p>
// // //         </motion.div>

// // //         {/* Quick Actions Grid */}
// // //         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-16">
// // //           {quickActions.map((action, index) => (
// // //             <motion.button
// // //               key={action.id}
// // //               custom={index}
// // //               variants={quickActionVariants}
// // //               initial="hidden"
// // //               animate="visible"
// // //               whileHover="hover"
// // //               whileTap="tap"
// // //               onClick={() => handleNavigation(action.url, action.id)}
// // //               className="relative group"
// // //             >
// // //               <div
// // //                 className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-emerald-200"
// // //                 style={{ borderColor: activeService === action.id ? action.color : 'transparent' }}
// // //               >
// // //                 <div className="text-5xl mb-3" style={{ filter: `drop-shadow(0 0 8px ${action.color}40)` }}>
// // //                   {action.icon}
// // //                 </div>
// // //                 <div className="font-semibold text-gray-800 text-sm">
// // //                   {action.label}
// // //                 </div>
// // //               </div>
// // //               <motion.div
// // //                 className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
// // //                 style={{
// // //                   background: `radial-gradient(circle at center, ${action.color}15, transparent 70%)`
// // //                 }}
// // //               />
// // //             </motion.button>
// // //           ))}
// // //         </div>

// // //         {/* Services Grid */}
// // //         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
// // //           {services.map((service, index) => (
// // //             <motion.div
// // //               key={service.id}
// // //               custom={index}
// // //               variants={cardVariants}
// // //               initial="hidden"
// // //               animate="visible"
// // //               whileHover="hover"
// // //               className="group cursor-pointer"
// // //               onClick={() => handleNavigation(service.url, service.id)}
// // //             >
// // //               <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-full">
// // //                 <div
// // //                   className="p-6 text-white relative overflow-hidden"
// // //                   style={{ background: service.gradient }}
// // //                 >
// // //                   <motion.div
// // //                     className="absolute inset-0 bg-white/10"
// // //                     initial={{ x: '-100%' }}
// // //                     whileHover={{ x: '100%' }}
// // //                     transition={{ duration: 0.6 }}
// // //                   />
// // //                   <div className="text-5xl mb-3 relative z-10">{service.icon}</div>
// // //                   <h3 className="text-2xl font-bold mb-2 relative z-10">{service.name}</h3>
// // //                   <p className="text-white/90 text-sm relative z-10">{service.description}</p>
// // //                 </div>
// // //                 <div className="p-6">
// // //                   <ul className="space-y-2 mb-4">
// // //                     {service.features.map((feature, idx) => (
// // //                       <motion.li
// // //                         key={idx}
// // //                         custom={idx}
// // //                         variants={featureVariants}
// // //                         initial="hidden"
// // //                         animate="visible"
// // //                         className="flex items-center gap-2 text-sm text-gray-700"
// // //                       >
// // //                         <span className="text-emerald-500">✓</span>
// // //                         {feature}
// // //                       </motion.li>
// // //                     ))}
// // //                   </ul>
// // //                   <motion.button
// // //                     whileHover={{ scale: 1.05 }}
// // //                     whileTap={{ scale: 0.95 }}
// // //                     className="w-full py-3 rounded-lg font-semibold text-white transition-all"
// // //                     style={{ background: service.gradient }}
// // //                   >
// // //                     Get Started →
// // //                   </motion.button>
// // //                 </div>
// // //               </div>
// // //             </motion.div>
// // //           ))}
// // //         </div>

// // //         {/* Features Section */}
// // //         <motion.div
// // //           initial={{ opacity: 0 }}
// // //           whileInView={{ opacity: 1 }}
// // //           viewport={{ once: true }}
// // //           className="max-w-6xl mx-auto mb-16"
// // //         >
// // //           <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
// // //             Why Choose Okra?
// // //           </h2>
// // //           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
// // //             {[
// // //               { icon: '⚡', title: 'Fast & Reliable', desc: 'Quick response times and dependable service' },
// // //               { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden fees, see costs upfront' },
// // //               { icon: '🛡️', title: 'Safe & Secure', desc: 'Verified drivers and secure payments' },
// // //               { icon: '📱', title: 'Easy to Use', desc: 'Simple, intuitive interface' }
// // //             ].map((feature, i) => (
// // //               <motion.div
// // //                 key={i}
// // //                 initial={{ opacity: 0, y: 20 }}
// // //                 whileInView={{ opacity: 1, y: 0 }}
// // //                 viewport={{ once: true }}
// // //                 transition={{ delay: i * 0.1 }}
// // //                 className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow"
// // //               >
// // //                 <div className="text-4xl mb-3">{feature.icon}</div>
// // //                 <h3 className="font-bold text-lg mb-2 text-gray-800">{feature.title}</h3>
// // //                 <p className="text-gray-600 text-sm">{feature.desc}</p>
// // //               </motion.div>
// // //             ))}
// // //           </div>
// // //         </motion.div>

// // //         {/* Stats Section */}
// // //         <motion.div
// // //           initial={{ opacity: 0 }}
// // //           whileInView={{ opacity: 1 }}
// // //           viewport={{ once: true }}
// // //           className="max-w-5xl mx-auto mb-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-12 text-white"
// // //         >
// // //           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
// // //             {[
// // //               { number: '10K+', label: 'Active Drivers' },
// // //               { number: '50K+', label: 'Happy Riders' },
// // //               { number: '24/7', label: 'Support' },
// // //               { number: '100%', label: 'Reliable' }
// // //             ].map((stat, i) => (
// // //               <motion.div
// // //                 key={i}
// // //                 initial={{ scale: 0 }}
// // //                 whileInView={{ scale: 1 }}
// // //                 viewport={{ once: true }}
// // //                 transition={{ delay: i * 0.1, type: "spring" }}
// // //               >
// // //                 <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
// // //                 <div className="text-emerald-100">{stat.label}</div>
// // //               </motion.div>
// // //             ))}
// // //           </div>
// // //         </motion.div>

// // //         {/* Footer */}
// // //         <footer className="text-center text-gray-600 text-sm border-t border-emerald-100 pt-8">
// // //           <p className="mb-2">© 2025 Okra Technologies. All rights reserved.</p>
// // //           <div className="flex gap-6 justify-center">
// // //             <a href="#" className="hover:text-emerald-600 transition-colors">Terms</a>
// // //             <a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a>
// // //             <a href="#" className="hover:text-emerald-600 transition-colors">Support</a>
// // //           </div>
// // //         </footer>
// // //       </main>
// // //     </motion.div>
// // //   );
// // // };

// // // export default OkraLandingPage;
// // 'use client'
// // import React, { useState, useEffect, useRef, useCallback } from 'react';
// // import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// // // ─── Global Styles ────────────────────────────────────────────────────────────
// // const GlobalStyles = () => (
// //   <style>{`
// //     @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

// //     *, *::before, *::after { box-sizing: border-box; }
// //     html { scroll-behavior: smooth; }
// //     body, .okra-root { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
// //     .font-sora { font-family: 'Sora', system-ui, sans-serif; }

// //     :root {
// //       --g-hero: linear-gradient(140deg, #14532d 0%, #15803d 30%, #16a34a 60%, #0d9488 100%);
// //       --g-emerald: linear-gradient(135deg, #15803d, #16a34a);
// //       --g-amber: linear-gradient(135deg, #d97706, #fbbf24);
// //       --g-teal: linear-gradient(135deg, #0e7490, #22d3ee);
// //       --g-violet: linear-gradient(135deg, #5b21b6, #8b5cf6);
// //       --shadow-xs: 0 2px 8px rgba(0,0,0,0.06);
// //       --shadow-sm: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
// //       --shadow-md: 0 12px 40px rgba(0,0,0,0.10), 0 3px 10px rgba(0,0,0,0.06);
// //       --shadow-lg: 0 24px 64px rgba(0,0,0,0.13), 0 6px 20px rgba(0,0,0,0.07);
// //       --shadow-xl: 0 40px 96px rgba(0,0,0,0.16), 0 10px 28px rgba(0,0,0,0.09);
// //     }

// //     /* ── Mesh background ── */
// //     .okra-bg {
// //       background:
// //         radial-gradient(ellipse 80% 60% at 10% 15%, rgba(22,163,74,0.09) 0%, transparent 55%),
// //         radial-gradient(ellipse 60% 50% at 90% 8%, rgba(20,184,166,0.07) 0%, transparent 50%),
// //         radial-gradient(ellipse 50% 40% at 55% 85%, rgba(245,158,11,0.05) 0%, transparent 50%),
// //         radial-gradient(ellipse 70% 50% at 0% 65%, rgba(22,163,74,0.06) 0%, transparent 45%),
// //         radial-gradient(ellipse 55% 40% at 98% 55%, rgba(13,148,136,0.06) 0%, transparent 40%),
// //         linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 40%, #f0fdfa 80%, #f5fffe 100%);
// //     }

// //     /* ── Glass ── */
// //     .glass {
// //       background: rgba(255,255,255,0.82);
// //       backdrop-filter: blur(28px) saturate(160%);
// //       -webkit-backdrop-filter: blur(28px) saturate(160%);
// //       border: 1px solid rgba(255,255,255,0.95);
// //     }
// //     .glass-header {
// //       background: rgba(255,255,255,0.88);
// //       backdrop-filter: blur(40px) saturate(180%);
// //       -webkit-backdrop-filter: blur(40px) saturate(180%);
// //       border-bottom: 1px solid rgba(255,255,255,0.98);
// //       box-shadow: 0 4px 32px rgba(0,0,0,0.05), 0 1px 8px rgba(22,163,74,0.06);
// //     }

// //     /* ── Gradient text ── */
// //     .text-hero {
// //       background: var(--g-hero);
// //       -webkit-background-clip: text;
// //       -webkit-text-fill-color: transparent;
// //       background-clip: text;
// //     }
// //     .text-emerald-grad {
// //       background: var(--g-emerald);
// //       -webkit-background-clip: text;
// //       -webkit-text-fill-color: transparent;
// //       background-clip: text;
// //     }

// //     /* ── Quick action buttons ── */
// //     .qbtn {
// //       position: relative;
// //       cursor: pointer;
// //       overflow: hidden;
// //       transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
// //                   box-shadow 0.22s ease;
// //       border: none;
// //       outline: none;
// //       text-align: left;
// //       min-height: 112px;
// //       height: 112px;
// //     }
// //     .qbtn:hover  { transform: translateY(-7px) scale(1.045); }
// //     .qbtn:active { transform: scale(0.97); }
// //     .qbtn::after {
// //       content: '';
// //       position: absolute;
// //       inset: 0;
// //       background: linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0));
// //       opacity: 0;
// //       transition: opacity 0.22s;
// //     }
// //     .qbtn:hover::after { opacity: 1; }

// //     /* ── 3D service cards ── */
// //     .card3d {
// //       transition: transform 0.32s cubic-bezier(0.34,1.2,0.64,1),
// //                   box-shadow 0.32s ease;
// //       transform-style: preserve-3d;
// //       will-change: transform;
// //       cursor: pointer;
// //     }
// //     .card3d:hover {
// //       transform: translateY(-14px) rotateX(4deg) rotateY(-1.5deg) scale(1.015);
// //       box-shadow: 0 44px 88px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.08) !important;
// //     }

// //     /* ── Shimmer on CTA buttons ── */
// //     .shimmer-cta {
// //       position: relative;
// //       overflow: hidden;
// //     }
// //     .shimmer-cta::before {
// //       content: '';
// //       position: absolute;
// //       top: -50%; left: -75%;
// //       width: 50%; height: 200%;
// //       background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
// //       transform: skewX(-18deg);
// //     }
// //     .shimmer-cta:hover::before {
// //       animation: shimmer-run 0.6s ease forwards;
// //     }
// //     @keyframes shimmer-run {
// //       0%   { left: -75%; }
// //       100% { left: 125%; }
// //     }

// //     /* ── Floating orbs ── */
// //     @keyframes orb-float {
// //       0%,100% { transform: translate(0,0) scale(1); }
// //       33%      { transform: translate(20px,-30px) scale(1.05); }
// //       66%      { transform: translate(-15px,-15px) scale(0.97); }
// //     }
// //     .orb { animation: orb-float 18s ease-in-out infinite; }
// //     .orb-2 { animation: orb-float 22s ease-in-out infinite reverse; animation-delay: -6s; }
// //     .orb-3 { animation: orb-float 16s ease-in-out infinite; animation-delay: -11s; }

// //     /* ── Stat items ── */
// //     .stat-item {
// //       transition: transform 0.28s cubic-bezier(0.34,1.3,0.64,1);
// //     }
// //     .stat-item:hover { transform: scale(1.07) translateY(-4px); }

// //     /* ── Noise texture overlay ── */
// //     .noise {
// //       position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.018;
// //       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E");
// //       background-size: 200px;
// //     }

// //     /* ── Feature card hover ── */
// //     .feat-card {
// //       transition: transform 0.26s cubic-bezier(0.34,1.3,0.64,1),
// //                   box-shadow 0.26s ease;
// //     }
// //     .feat-card:hover {
// //       transform: translateY(-8px) scale(1.02);
// //       box-shadow: 0 28px 56px rgba(0,0,0,0.11), 0 6px 16px rgba(0,0,0,0.07) !important;
// //     }

// //     /* ── Dot grid pattern ── */
// //     .dot-grid {
// //       background-image: radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px);
// //       background-size: 26px 26px;
// //     }

// //     /* ── Stats banner ── */
// //     .stats-banner {
// //       background: linear-gradient(140deg, #14532d 0%, #15803d 25%, #166534 50%, #0f766e 75%, #0d9488 100%);
// //       box-shadow: 0 40px 80px rgba(22,163,74,0.28), 0 12px 32px rgba(22,163,74,0.18);
// //     }

// //     /* ── Footer glass ── */
// //     .footer-glass {
// //       background: rgba(255,255,255,0.72);
// //       backdrop-filter: blur(24px);
// //       -webkit-backdrop-filter: blur(24px);
// //       border: 1px solid rgba(255,255,255,0.92);
// //     }

// //     /* ── Pulse dot ── */
// //     @keyframes pulse-dot {
// //       0%,100% { opacity: 1; transform: scale(1); }
// //       50%      { opacity: 0.5; transform: scale(1.3); }
// //     }
// //     .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

// //     /* ── Badge pill ── */
// //     .badge {
// //       display: inline-flex; align-items: center; gap: 6px;
// //       padding: 5px 14px; border-radius: 999px;
// //       background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);
// //       color: #15803d; font-size: 11.5px; font-weight: 600; letter-spacing: 0.01em;
// //     }

// //     /* ── Car animation motion blur speed lines ── */
// //     @keyframes speed-line {
// //       0%   { opacity: 0; transform: scaleX(0); }
// //       30%  { opacity: 0.6; transform: scaleX(1); }
// //       100% { opacity: 0; transform: scaleX(1); transform: translateX(80px); }
// //     }
// //   `}</style>
// // );

// // // ─── SVG: Stick Figure ────────────────────────────────────────────────────────
// // const StickFigureSVG = ({ showPhone }) => (
// //   <svg width="28" height="50" viewBox="0 0 28 50" fill="none" xmlns="http://www.w3.org/2000/svg">
// //     {/* Head */}
// //     <circle cx="14" cy="7" r="5.5" fill="#ffcba4" stroke="#2d3748" strokeWidth="1.5"/>
// //     {/* Eye dots */}
// //     <circle cx="12" cy="6.5" r="0.8" fill="#2d3748"/>
// //     <circle cx="16" cy="6.5" r="0.8" fill="#2d3748"/>
// //     {/* Body */}
// //     <line x1="14" y1="13" x2="14" y2="31" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
// //     {/* Left arm - hanging naturally */}
// //     <line x1="14" y1="18" x2="6"  y2="26" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
// //     {/* Right arm - raised up holding phone */}
// //     <line x1="14" y1="18" x2="22" y2="10" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
// //     {/* Left leg */}
// //     <line x1="14" y1="31" x2="8"  y2="47" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
// //     {/* Right leg */}
// //     <line x1="14" y1="31" x2="20" y2="47" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
// //     {/* Phone icon - above right hand end */}
// //     {showPhone && (
// //       <g>
// //         {/* Phone body */}
// //         <rect x="22.5" y="1.5" width="7" height="11" rx="1.8" fill="white" stroke="#16a34a" strokeWidth="1.2"/>
// //         {/* Screen */}
// //         <rect x="23.8" y="3.2" width="4.4" height="6.2" rx="0.6" fill="#bbf7d0"/>
// //         {/* Screen glare */}
// //         <rect x="24.2" y="3.5" width="1.5" height="2" rx="0.3" fill="rgba(255,255,255,0.7)"/>
// //         {/* Home button */}
// //         <circle cx="26" cy="11.5" r="0.8" fill="#16a34a"/>
// //         {/* Tiny signal arc */}
// //         <path d="M27.5 3.8 Q29 4.8 27.5 5.8" stroke="#16a34a" strokeWidth="0.6" fill="none"/>
// //       </g>
// //     )}
// //   </svg>
// // );

// // // ─── SVG: Car – Front View (headlights facing us) ─────────────────────────────
// // const CarFrontSVG = () => (
// //   <svg width="68" height="42" viewBox="0 0 68 42" fill="none" xmlns="http://www.w3.org/2000/svg">
// //     {/* Drop shadow */}
// //     <ellipse cx="34" cy="41" rx="26" ry="3" fill="rgba(0,0,0,0.13)"/>
// //     {/* Lower body */}
// //     <rect x="2" y="20" width="64" height="19" rx="5" fill="#15803d"/>
// //     {/* Upper body shading */}
// //     <rect x="2" y="20" width="64" height="10" rx="5" fill="#166534"/>
// //     {/* Cabin / A-pillars */}
// //     <path d="M16 20 L22 6 L46 6 L52 20 Z" fill="#16a34a"/>
// //     {/* Windshield glass */}
// //     <path d="M18.5 20 L23.5 8 L44.5 8 L49.5 20 Z" fill="rgba(187,247,208,0.88)"/>
// //     {/* Windshield center divider */}
// //     <line x1="34" y1="8" x2="34" y2="20" stroke="rgba(21,128,61,0.3)" strokeWidth="1.5"/>
// //     {/* Roof shine */}
// //     <path d="M23 9 L27 8 L38 8 L42 9.5 L39 11.5 L26 11.5 Z" fill="rgba(255,255,255,0.22)"/>
// //     {/* Left headlight – outer glow */}
// //     <ellipse cx="11" cy="32" rx="8" ry="5" fill="#fef3c7"/>
// //     {/* Left headlight – mid */}
// //     <ellipse cx="11" cy="32" rx="5.5" ry="3.5" fill="#fef08a"/>
// //     {/* Left headlight – inner bright */}
// //     <ellipse cx="11" cy="32" rx="3" ry="2" fill="white"/>
// //     {/* Right headlight – outer glow */}
// //     <ellipse cx="57" cy="32" rx="8" ry="5" fill="#fef3c7"/>
// //     <ellipse cx="57" cy="32" rx="5.5" ry="3.5" fill="#fef08a"/>
// //     <ellipse cx="57" cy="32" rx="3" ry="2" fill="white"/>
// //     {/* Front grille bar */}
// //     <rect x="23" y="35" width="22" height="3.5" rx="1.5" fill="#0f4c25"/>
// //     {/* Grille slots */}
// //     {[27,30.5,34,37.5,41].map(x => (
// //       <rect key={x} x={x} y="35.5" width="2" height="2.5" rx="0.5" fill="#22c55e"/>
// //     ))}
// //     {/* Front bumper */}
// //     <rect x="4" y="37" width="60" height="3.5" rx="2" fill="#14532d"/>
// //     {/* Hood center crease */}
// //     <line x1="34" y1="20" x2="34" y2="36" stroke="rgba(21,128,61,0.25)" strokeWidth="1"/>
// //     {/* Wheels (ellipses from front view) */}
// //     <ellipse cx="15" cy="39" rx="9" ry="3.5" fill="#1e293b"/>
// //     <ellipse cx="15" cy="39" rx="5.5" ry="2" fill="#334155"/>
// //     <ellipse cx="53" cy="39" rx="9" ry="3.5" fill="#1e293b"/>
// //     <ellipse cx="53" cy="39" rx="5.5" ry="2" fill="#334155"/>
// //     {/* Okra logo dot on grille */}
// //     <circle cx="34" cy="37.25" r="1.5" fill="#22c55e"/>
// //   </svg>
// // );

// // // ─── SVG: Car – Back View (taillights facing us) ──────────────────────────────
// // const CarBackSVG = () => (
// //   <svg width="68" height="42" viewBox="0 0 68 42" fill="none" xmlns="http://www.w3.org/2000/svg">
// //     <ellipse cx="34" cy="41" rx="26" ry="3" fill="rgba(0,0,0,0.13)"/>
// //     <rect x="2" y="20" width="64" height="19" rx="5" fill="#15803d"/>
// //     <rect x="2" y="20" width="64" height="10" rx="5" fill="#166534"/>
// //     {/* Cabin back shape */}
// //     <path d="M16 20 L22 6 L46 6 L52 20 Z" fill="#16a34a"/>
// //     {/* Rear window glass */}
// //     <path d="M19 20 L24 9 L44 9 L49 20 Z" fill="rgba(187,247,208,0.75)"/>
// //     <line x1="34" y1="9" x2="34" y2="20" stroke="rgba(21,128,61,0.3)" strokeWidth="1.5"/>
// //     {/* Trunk lid highlight */}
// //     <path d="M22 10 L46 10 L47 13 L21 13 Z" fill="rgba(255,255,255,0.16)"/>
// //     {/* Left taillight – glow */}
// //     <ellipse cx="11" cy="32" rx="8" ry="5" fill="#fee2e2"/>
// //     {/* Left taillight – mid */}
// //     <ellipse cx="11" cy="32" rx="5.5" ry="3.5" fill="#fca5a5"/>
// //     {/* Left taillight – hot core */}
// //     <ellipse cx="11" cy="32" rx="3" ry="2" fill="#ef4444"/>
// //     {/* Right taillight */}
// //     <ellipse cx="57" cy="32" rx="8" ry="5" fill="#fee2e2"/>
// //     <ellipse cx="57" cy="32" rx="5.5" ry="3.5" fill="#fca5a5"/>
// //     <ellipse cx="57" cy="32" rx="3" ry="2" fill="#ef4444"/>
// //     {/* Rear bumper */}
// //     <rect x="4" y="37" width="60" height="3.5" rx="2" fill="#14532d"/>
// //     {/* License plate */}
// //     <rect x="22" y="34.5" width="24" height="4.5" rx="1.2" fill="#f8fafc"/>
// //     <text x="34" y="38" textAnchor="middle" fontSize="3.4" fill="#1e293b" fontFamily="monospace" fontWeight="700">
// //       OKR · 001
// //     </text>
// //     {/* Trunk crease */}
// //     <line x1="34" y1="20" x2="34" y2="36" stroke="rgba(21,128,61,0.2)" strokeWidth="1"/>
// //     {/* Wheels */}
// //     <ellipse cx="15" cy="39" rx="9" ry="3.5" fill="#1e293b"/>
// //     <ellipse cx="15" cy="39" rx="5.5" ry="2" fill="#334155"/>
// //     <ellipse cx="53" cy="39" rx="9" ry="3.5" fill="#1e293b"/>
// //     <ellipse cx="53" cy="39" rx="5.5" ry="2" fill="#334155"/>
// //   </svg>
// // );

// // // ─── Header Car Animation ─────────────────────────────────────────────────────
// // const HeaderCarAnimation = ({ isActive }) => {
// //   const [showPhone, setShowPhone]   = useState(true);
// //   const [carFace, setCarFace]       = useState('front');
// //   const [carVisible, setCarVisible] = useState(false);
// //   const [figureOn, setFigureOn]     = useState(false);

// //   const carMoveCtrl  = useAnimation();
// //   const carFlipCtrl  = useAnimation();
// //   const figureCtrl   = useAnimation();
// //   const playingRef   = useRef(false);
// //   const mountedRef   = useRef(true);

// //   useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

// //   const ms = (n) => new Promise(r => setTimeout(r, n));

// //   const guard = () => mountedRef.current && playingRef.current;

// //   const resetAll = useCallback(() => {
// //     carMoveCtrl.stop(); carFlipCtrl.stop(); figureCtrl.stop();
// //     setCarVisible(false); setFigureOn(false);
// //     setShowPhone(true); setCarFace('front');
// //     figureCtrl.set({ y: 0, opacity: 0, scale: 1 });
// //     carMoveCtrl.set({ x: 185 }); carFlipCtrl.set({ scaleX: 1 });
// //     playingRef.current = false;
// //   }, [carMoveCtrl, carFlipCtrl, figureCtrl]);

// //   const play = useCallback(async () => {
// //     if (playingRef.current) return;
// //     playingRef.current = true;

// //     // ─ Reset positions ─
// //     setShowPhone(true); setCarFace('front');
// //     figureCtrl.set({ y: 0, opacity: 0, scale: 1 });
// //     carMoveCtrl.set({ x: 185 }); carFlipCtrl.set({ scaleX: 1 });

// //     // ─ 1. Fade in stick figure ─
// //     setFigureOn(true);
// //     await figureCtrl.start({ opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } });
// //     if (!guard()) return;

// //     await ms(350);
// //     if (!guard()) return;

// //     // ─ 2. Car appears, starts moving ─
// //     setCarVisible(true);
// //     // Move from x=185 → x=38 over 2.6s (non-awaited so flip can run concurrently)
// //     carMoveCtrl.start({ x: 38, transition: { duration: 2.6, ease: [0.2, 0.05, 0.45, 1] } });

// //     // ─ 3. At ~1.1s into movement → 3D flip ─
// //     await ms(1100);
// //     if (!guard()) return;
// //     // Half-flip out
// //     await carFlipCtrl.start({ scaleX: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } });
// //     if (!guard()) return;
// //     setCarFace('back');
// //     // Half-flip in
// //     await carFlipCtrl.start({ scaleX: 1, transition: { duration: 0.2, ease: [0, 0, 0.6, 1] } });

// //     // ─ 4. Wait for car to arrive ─
// //     await ms(950);
// //     if (!guard()) return;

// //     // ─ 5. Phone disappears ─
// //     setShowPhone(false);
// //     await ms(480);
// //     if (!guard()) return;

// //     // ─ 6. Stick figure hops in ─
// //     await figureCtrl.start({
// //       y: -22, opacity: 0, scale: 0.3,
// //       transition: { duration: 0.48, ease: [0.4, 0, 0.9, 0.6] }
// //     });
// //     if (!guard()) return;
// //     setFigureOn(false);

// //     await ms(160);
// //     if (!guard()) return;

// //     // ─ 7. Car speeds off ─
// //     await carMoveCtrl.start({ x: 260, transition: { duration: 0.5, ease: [0.55, 0, 1, 1] } });
// //     if (!guard()) return;

// //     setCarVisible(false);
// //     await ms(250);
// //     if (!guard()) return;

// //     // ─ 8. Reset for next cycle ─
// //     setShowPhone(true); setCarFace('front');
// //     figureCtrl.set({ y: 0, opacity: 0, scale: 1 });
// //     carMoveCtrl.set({ x: 185 }); carFlipCtrl.set({ scaleX: 1 });
// //     playingRef.current = false;
// //   }, [carMoveCtrl, carFlipCtrl, figureCtrl]);

// //   useEffect(() => {
// //     if (isActive) play();
// //     else resetAll();
// //   }, [isActive]);

// //   return (
// //     /* Container — overflow hidden so car clips at edges */
// //     <div className="relative" style={{ width: 248, height: 56, overflow: 'hidden' }}>
// //       {/* Stick figure */}
// //       <AnimatePresence>
// //         {figureOn && (
// //           <motion.div
// //             initial={{ opacity: 0 }}
// //             exit={{ opacity: 0 }}
// //             animate={figureCtrl}
// //             style={{ position: 'absolute', left: 4, bottom: 2 }}
// //           >
// //             <StickFigureSVG showPhone={showPhone} />
// //           </motion.div>
// //         )}
// //       </AnimatePresence>

// //       {/* Car: position wrapper → flip wrapper */}
// //       <AnimatePresence>
// //         {carVisible && (
// //           <motion.div
// //             initial={{ opacity: 0 }}
// //             animate={{ opacity: 1 }}
// //             exit={{ opacity: 0, transition: { duration: 0.12 } }}
// //             style={{ position: 'absolute', bottom: 2, left: 0, pointerEvents: 'none' }}
// //           >
// //             <motion.div animate={carMoveCtrl} style={{ position: 'relative' }}>
// //               <motion.div
// //                 animate={carFlipCtrl}
// //                 style={{ transformOrigin: 'center center', display: 'inline-block' }}
// //               >
// //                 {carFace === 'front' ? <CarFrontSVG /> : <CarBackSVG />}
// //               </motion.div>
// //             </motion.div>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //     </div>
// //   );
// // };

// // // ─── Floating Particle ───────────────────────────────────────────────────────
// // const Particle = ({ left, delay, duration, size, color }) => (
// //   <motion.div
// //     className="absolute rounded-full pointer-events-none"
// //     style={{ left: `${left}%`, top: -8, width: size, height: size, background: color }}
// //     animate={{ y: ['0vh', '105vh'], opacity: [0, 0.6, 0.6, 0] }}
// //     transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
// //   />
// // );

// // // ─── Main Landing Page ────────────────────────────────────────────────────────
// // const OkraLandingPage = () => {
// //   const [frontendUrls, setFrontendUrls] = useState({
// //     riderApp: 'http://10.27.147.23:3001/home',
// //     driverApp: 'http://10.27.147.23:3002/home',
// //     deliveryApp: 'https://delivery.okra.tech',
// //     conductorApp: 'https://conductor.okra.tech',
// //   });
// //   const [loading,       setLoading]       = useState(true);
// //   const [headerPhase,   setHeaderPhase]   = useState('brand');
// //   const [activeService, setActiveService] = useState(null);
// //   const [mousePos,      setMousePos]      = useState({ x: 0, y: 0 });

// //   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343';

// //   // ── Fetch URLs ──
// //   useEffect(() => {
// //     const go = async () => {
// //       try {
// //         const r = await fetch(`${API_URL}/frontend-url`);
// //         if (!r.ok) throw new Error();
// //         const j = await r.json();
// //         const p = j?.data?.paths || {};
// //         setFrontendUrls({
// //           riderApp:    p['okra-rider-app']    || 'http://10.27.147.23:3001/home',
// //           driverApp:   p['okra-driver-app']   || 'http://10.27.147.23:3002/home',
// //           deliveryApp: p['okra-delivery-app'] || 'https://delivery.okra.tech',
// //           conductorApp:p['okra-conductor-app']|| 'https://conductor.okra.tech',
// //         });
// //       } catch (_) {}
// //       setLoading(false);
// //     };
// //     go();
// //   }, []);

// //   // ── Header text cycle: switch to "slide" every 60s, hold for 8s ──
// //   useEffect(() => {
// //     const cycle = () => {
// //       setHeaderPhase('slide');
// //       setTimeout(() => setHeaderPhase('brand'), 8000);
// //     };
// //     const t0 = setTimeout(cycle, 3200);
// //     const iv = setInterval(cycle, 60000);
// //     return () => { clearTimeout(t0); clearInterval(iv); };
// //   }, []);

// //   // ── Subtle parallax mouse ──
// //   useEffect(() => {
// //     const h = (e) => setMousePos({
// //       x: (e.clientX / window.innerWidth  - 0.5) * 28,
// //       y: (e.clientY / window.innerHeight - 0.5) * 28,
// //     });
// //     window.addEventListener('mousemove', h, { passive: true });
// //     return () => window.removeEventListener('mousemove', h);
// //   }, []);

// //   const nav = (url, id) => {
// //     setActiveService(id);
// //     setTimeout(() => { window.location.href = url; }, 180);
// //   };

// //   // ── Quick Actions Data ──
// //   //  Row 1: Book A Ride | Deliver A Package
// //   //  Row 2: Earn Money Driving | Earn Money Delivering
// //   //  Row 3: Earn With Okra Affiliates | Track Order
// //   const quickActions = [
// //     {
// //       id: 'book-ride',
// //       label: 'Book A Ride',
// //       icon: '🚗',
// //       bg: '#ffc107',
// //       iconBg: 'rgba(255,255,255,0.28)',
// //       textColor: '#3d1f00',
// //       shadow: 'rgba(255,193,7,0.38)',
// //       url: frontendUrls.riderApp,
// //     },
// //     {
// //       id: 'deliver',
// //       label: 'Deliver A Package',
// //       icon: '📦',
// //       bg: 'rgba(255,255,255,0.92)',
// //       iconBg: 'rgba(22,163,74,0.1)',
// //       textColor: '#14532d',
// //       accent: '#16a34a',
// //       shadow: 'rgba(22,163,74,0.18)',
// //       url: frontendUrls.deliveryApp,
// //     },
// //     {
// //       id: 'drive',
// //       label: 'Earn Money Driving',
// //       icon: '🚕',
// //       bg: 'linear-gradient(135deg, #14532d 0%, #15803d 45%, #16a34a 100%)',
// //       iconBg: 'rgba(255,255,255,0.2)',
// //       textColor: 'white',
// //       shadow: 'rgba(22,163,74,0.38)',
// //       url: frontendUrls.driverApp,
// //     },
// //     {
// //       id: 'deliver-earn',
// //       label: 'Earn Money Delivering',
// //       icon: '🛵',
// //       bg: 'rgba(255,255,255,0.92)',
// //       iconBg: 'rgba(22,163,74,0.1)',
// //       textColor: '#14532d',
// //       accent: '#16a34a',
// //       shadow: 'rgba(22,163,74,0.18)',
// //       url: frontendUrls.deliveryApp,
// //     },
// //     {
// //       id: 'affiliates',
// //       label: 'Earn With Okra Affiliates',
// //       icon: '💸',
// //       bg: 'rgba(255,255,255,0.92)',
// //       iconBg: 'rgba(109,40,217,0.08)',
// //       textColor: '#4c1d95',
// //       accent: '#7c3aed',
// //       shadow: 'rgba(124,58,237,0.18)',
// //       url: '#',
// //     },
// //     {
// //       id: 'track',
// //       label: 'Track Order',
// //       icon: '📍',
// //       bg: 'rgba(255,255,255,0.92)',
// //       iconBg: 'rgba(8,145,178,0.1)',
// //       textColor: '#164e63',
// //       accent: '#0891b2',
// //       shadow: 'rgba(8,145,178,0.18)',
// //       url: frontendUrls.riderApp,
// //     },
// //   ];

// //   // ── Service Cards ──
// //   const services = [
// //     {
// //       id: 'rider',
// //       name: 'Book a Ride',
// //       desc: 'Quick, reliable rides across Zambia',
// //       icon: '🚗',
// //       gradient: 'linear-gradient(145deg, #14532d 0%, #15803d 45%, #22c55e 100%)',
// //       glowColor: 'rgba(22,163,74,0.25)',
// //       accentDot: '#86efac',
// //       url: frontendUrls.riderApp,
// //       features: ['Instant Booking', 'Live GPS Tracking', 'Multiple Payment Methods'],
// //     },
// //     {
// //       id: 'driver',
// //       name: 'Drive with Us',
// //       desc: 'Your schedule, your earnings',
// //       icon: '🚕',
// //       gradient: 'linear-gradient(145deg, #78350f 0%, #b45309 45%, #fbbf24 100%)',
// //       glowColor: 'rgba(217,119,6,0.25)',
// //       accentDot: '#fde68a',
// //       url: frontendUrls.driverApp,
// //       features: ['Flexible Hours', 'Top Market Earnings', 'Weekly Payouts'],
// //     },
// //     {
// //       id: 'delivery',
// //       name: 'Package Delivery',
// //       desc: 'Fast, city-wide delivery service',
// //       icon: '📦',
// //       gradient: 'linear-gradient(145deg, #0c4a6e 0%, #0891b2 50%, #22d3ee 100%)',
// //       glowColor: 'rgba(8,145,178,0.25)',
// //       accentDot: '#a5f3fc',
// //       url: frontendUrls.deliveryApp,
// //       features: ['Same-Day Delivery', 'Real-Time Tracking', 'Safe Handling Guarantee'],
// //     },
// //     {
// //       id: 'affiliates',
// //       name: 'Okra Affiliates',
// //       desc: 'Build your network, grow your income',
// //       icon: '💸',
// //       gradient: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)',
// //       glowColor: 'rgba(124,58,237,0.25)',
// //       accentDot: '#ddd6fe',
// //       url: '#',
// //       features: [
// //         'Refer a driver, earn commissions',
// //         'Refer a customer, earn per trip',
// //         'Withdraw via mobile money & OkraPay',
// //       ],
// //     },
// //   ];

// //   const whyItems = [
// //     { icon: '⚡', title: 'Instant & Reliable',    desc: 'Sub-minute matching with verified, on-call drivers',   color: '#f59e0b' },
// //     { icon: '💳', title: 'Transparent Pricing',   desc: 'Clear upfront fares — zero hidden charges, ever',      color: '#10b981' },
// //     { icon: '🛡️', title: 'Verified & Safe',       desc: 'Background-checked drivers with built-in safety tools', color: '#3b82f6' },
// //     { icon: '📱', title: 'Ridiculously Easy',     desc: 'Book in under 20 seconds from anywhere in Zambia',     color: '#ec4899' },
// //   ];

// //   const stats = [
// //     { num: '10K+',  label: 'Active Drivers', icon: '🚗' },
// //     { num: '50K+',  label: 'Happy Riders',   icon: '😊' },
// //     { num: '24/7',  label: 'Live Support',   icon: '💬' },
// //     { num: '4.9★',  label: 'Avg. Rating',    icon: '⭐' },
// //   ];

// //   // Random particles
// //   const particles = Array.from({ length: 18 }, (_, i) => ({
// //     id: i,
// //     left: Math.random() * 100,
// //     delay: Math.random() * 8,
// //     duration: 14 + Math.random() * 18,
// //     size: 3 + Math.random() * 4,
// //     color: i % 3 === 0 ? 'rgba(22,163,74,0.18)' : i % 3 === 1 ? 'rgba(20,184,166,0.15)' : 'rgba(245,158,11,0.12)',
// //   }));

// //   // ── Loading state ──
// //   if (loading) {
// //     return (
// //       <div className="okra-root okra-bg min-h-screen">
// //         <GlobalStyles />
// //         <div className="glass-header fixed top-0 inset-x-0 h-16 z-50" />
// //         <div className="pt-24 px-5 space-y-8 max-w-xl mx-auto">
// //           <div className="space-y-3 text-center pt-8">
// //             <div className="h-10 w-64 bg-emerald-100/70 rounded-2xl mx-auto animate-pulse" />
// //             <div className="h-5 w-48 bg-emerald-100/50 rounded-xl mx-auto animate-pulse" />
// //           </div>
// //           <div className="grid grid-cols-2 gap-3.5">
// //             {Array.from({ length: 6 }).map((_, i) => (
// //               <div key={i} className="h-28 bg-white/65 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
// //             ))}
// //           </div>
// //           <div className="grid grid-cols-2 gap-4">
// //             {Array.from({ length: 4 }).map((_, i) => (
// //               <div key={i} className="h-56 bg-white/65 rounded-3xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // ── Main render ──
// //   return (
// //     <div className="okra-root okra-bg min-h-screen overflow-x-hidden relative">
// //       <GlobalStyles />

// //       {/* ── Noise overlay ── */}
// //       <div className="noise" />

// //       {/* ── Parallax background orbs ── */}
// //       <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
// //         <div className="orb absolute" style={{
// //           top: '-10%', right: '-8%', width: 480, height: 480, borderRadius: '50%',
// //           background: 'radial-gradient(circle, rgba(22,163,74,0.11) 0%, transparent 68%)',
// //           filter: 'blur(44px)',
// //           transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px)`,
// //           transition: 'transform 0.55s ease',
// //         }} />
// //         <div className="orb-2 absolute" style={{
// //           bottom: '-8%', left: '-6%', width: 420, height: 420, borderRadius: '50%',
// //           background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 65%)',
// //           filter: 'blur(50px)',
// //           transform: `translate(${mousePos.x * -0.25}px, ${mousePos.y * -0.25}px)`,
// //           transition: 'transform 0.7s ease',
// //         }} />
// //         <div className="orb-3 absolute" style={{
// //           top: '40%', left: '35%', width: 560, height: 560, borderRadius: '50%',
// //           background: 'radial-gradient(circle, rgba(22,163,74,0.05) 0%, transparent 60%)',
// //           filter: 'blur(70px)',
// //         }} />
// //         {/* Floating particles */}
// //         {particles.map(p => (
// //           <Particle key={p.id} left={p.left} delay={p.delay} duration={p.duration} size={p.size} color={p.color} />
// //         ))}
// //       </div>

// //       {/* ════════════════════════ HEADER ════════════════════════ */}
// //       <motion.header
// //         initial={{ y: -72, opacity: 0 }}
// //         animate={{ y: 0, opacity: 1 }}
// //         transition={{ type: 'spring', damping: 22, stiffness: 180 }}
// //         className="glass-header fixed top-0 inset-x-0 z-50"
// //         style={{ height: 64 }}
// //       >
// //         <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">

// //           {/* Logo group */}
// //           <div className="flex items-center gap-2.5 shrink-0">
// //             {/* Icon from /public - user adds icon.png there */}
// //             <div className="relative w-10 h-10 flex items-center justify-center">
// //               <img
// //                 src="/icon.png"
// //                 alt="Okra"
// //                 style={{ width: 40, height: 40, objectFit: 'contain' }}
// //                 onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }}
// //               />
// //               {/* Fallback shown if icon.png missing */}
// //               <span style={{ fontSize: 32, display: 'none', lineHeight: 1 }}>🥬</span>
// //             </div>

// //             <div>
// //               <div className="font-sora text-hero leading-none tracking-tight" style={{ fontSize: 20, fontWeight: 800 }}>
// //                 Okra
// //               </div>
// //               {/* Animating subtitle */}
// //               <div className="relative overflow-hidden" style={{ height: 16 }}>
// //                 <AnimatePresence mode="wait">
// //                   {headerPhase === 'brand' ? (
// //                     <motion.span
// //                       key="brand"
// //                       initial={{ y: 16, opacity: 0 }}
// //                       animate={{ y: 0, opacity: 1 }}
// //                       exit={{ y: -16, opacity: 0 }}
// //                       transition={{ duration: 0.28 }}
// //                       className="absolute inset-0 flex items-center text-gray-400"
// //                       style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
// //                     >
// //                       Technologies
// //                     </motion.span>
// //                   ) : (
// //                     <motion.span
// //                       key="slide"
// //                       initial={{ y: 16, opacity: 0 }}
// //                       animate={{ y: 0, opacity: 1 }}
// //                       exit={{ y: -16, opacity: 0 }}
// //                       transition={{ duration: 0.28 }}
// //                       className="absolute inset-0 flex items-center font-sora font-semibold"
// //                       style={{
// //                         fontSize: 10, whiteSpace: 'nowrap',
// //                         background: 'linear-gradient(90deg, #15803d, #22c55e, #0d9488)',
// //                         WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
// //                       }}
// //                     >
// //                       slide into your ride →→
// //                     </motion.span>
// //                   )}
// //                 </AnimatePresence>
// //               </div>
// //             </div>
// //           </div>

// //           {/* ── Car animation (center, large screens only) ── */}
// //           <div className="hidden lg:flex flex-1 justify-center items-end overflow-hidden" style={{ maxHeight: 56 }}>
// //             <HeaderCarAnimation isActive={headerPhase === 'slide'} />
// //           </div>

// //           {/* Right nav hint */}
// //           <div className="hidden md:flex items-center gap-1.5 shrink-0">
// //             <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
// //             <span className="text-gray-500" style={{ fontSize: 12, fontWeight: 500 }}>Your Journey, Your Way</span>
// //           </div>
// //         </div>
// //       </motion.header>

// //       {/* ════════════════════════ MAIN CONTENT ════════════════════════ */}
// //       <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">

// //         {/* ── HERO ── */}
// //         <motion.section
// //           initial={{ opacity: 0, y: 36 }}
// //           animate={{ opacity: 1, y: 0 }}
// //           transition={{ delay: 0.22, type: 'spring', damping: 22, stiffness: 140 }}
// //           className="text-center mb-14 max-w-3xl mx-auto"
// //         >
// //           <motion.div
// //             initial={{ scale: 0.85, opacity: 0 }}
// //             animate={{ scale: 1, opacity: 1 }}
// //             transition={{ delay: 0.08, type: 'spring', stiffness: 200 }}
// //             className="badge mx-auto mb-5"
// //           >
// //             <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
// //             Zambia's #1 Ride & Delivery Platform
// //           </motion.div>

// //           <h1
// //             className="font-sora text-hero leading-[1.08] tracking-tight mb-4"
// //             style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: 900 }}
// //           >
// //             Choose Your<br />Service
// //           </h1>
// //           <p className="text-gray-500 max-w-lg mx-auto leading-relaxed" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
// //             Reliable rides, fast deliveries, and real earning opportunities — all from one platform built for Zambia.
// //           </p>
// //         </motion.section>

// //         {/* ── QUICK ACTIONS 2-COLUMN GRID ── */}
// //         <div
// //           className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-20"
// //           style={{ gridAutoRows: '112px' }}
// //         >
// //           {quickActions.map((a, i) => (
// //             <motion.button
// //               key={a.id}
// //               initial={{ scale: 0.82, opacity: 0, y: 18 }}
// //               animate={{ scale: 1, opacity: 1, y: 0 }}
// //               transition={{ type: 'spring', damping: 14, stiffness: 280, delay: i * 0.055 }}
// //               className="qbtn rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
// //               style={{
// //                 background: a.bg,
// //                 boxShadow: `var(--shadow-sm), 0 8px 28px ${a.shadow}`,
// //                 border: a.bg.startsWith('rgba') ? '1px solid rgba(255,255,255,0.92)' : 'none',
// //               }}
// //               onClick={() => nav(a.url, a.id)}
// //             >
// //               <div className="p-4 h-full flex flex-col justify-between">
// //                 {/* Icon box */}
// //                 <div
// //                   className="w-11 h-11 rounded-xl flex items-center justify-center"
// //                   style={{
// //                     background: a.iconBg,
// //                     boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.08)',
// //                     fontSize: 22,
// //                   }}
// //                 >
// //                   {a.icon}
// //                 </div>
// //                 {/* Label */}
// //                 <span
// //                   style={{
// //                     color: a.textColor,
// //                     fontSize: 11.5,
// //                     fontWeight: 700,
// //                     lineHeight: 1.3,
// //                     fontFamily: '"Plus Jakarta Sans", sans-serif',
// //                   }}
// //                 >
// //                   {a.label}
// //                 </span>
// //               </div>
// //               {/* Active ring */}
// //               {activeService === a.id && (
// //                 <span
// //                   className="absolute inset-0 rounded-2xl pointer-events-none"
// //                   style={{ boxShadow: `0 0 0 2.5px ${a.accent || '#16a34a'}`, borderRadius: 16 }}
// //                 />
// //               )}
// //             </motion.button>
// //           ))}
// //         </div>

// //         {/* ── SERVICE CARDS ── */}
// //         <section className="max-w-6xl mx-auto mb-24">
// //           <motion.div
// //             initial={{ opacity: 0, y: 22 }}
// //             whileInView={{ opacity: 1, y: 0 }}
// //             viewport={{ once: true, margin: '-60px' }}
// //             transition={{ type: 'spring', stiffness: 140, damping: 22 }}
// //             className="text-center mb-10"
// //           >
// //             <h2
// //               className="font-sora font-bold text-gray-800 mb-2"
// //               style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)' }}
// //             >
// //               Explore Our Services
// //             </h2>
// //             <p className="text-gray-400 text-sm">Everything you need, all in one place</p>
// //           </motion.div>

// //           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
// //             {services.map((svc, i) => (
// //               <motion.div
// //                 key={svc.id}
// //                 initial={{ opacity: 0, y: 52, rotateX: -10 }}
// //                 whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
// //                 viewport={{ once: true, margin: '-40px' }}
// //                 transition={{ type: 'spring', damping: 20, stiffness: 110, delay: i * 0.09 }}
// //                 onClick={() => nav(svc.url, svc.id)}
// //                 className="card3d rounded-3xl overflow-hidden bg-white"
// //                 style={{ boxShadow: `var(--shadow-md), 0 8px 32px ${svc.glowColor}` }}
// //               >
// //                 {/* Card header */}
// //                 <div className="relative overflow-hidden p-6 pb-10" style={{ background: svc.gradient }}>
// //                   {/* Gloss overlay */}
// //                   <div className="absolute inset-0 bg-gradient-to-br from-white/18 to-transparent" />
// //                   {/* Background radial glow */}
// //                   <div className="absolute inset-0"
// //                     style={{
// //                       backgroundImage: `radial-gradient(ellipse at 85% 15%, ${svc.accentDot} 0%, transparent 55%),
// //                                         radial-gradient(ellipse at 15% 85%, rgba(255,255,255,0.25) 0%, transparent 40%)`,
// //                       opacity: 0.55
// //                     }}
// //                   />
// //                   {/* Icon */}
// //                   <div className="relative z-10 mb-3" style={{ fontSize: 44, lineHeight: 1, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.22))' }}>
// //                     {svc.icon}
// //                   </div>
// //                   <h3 className="font-sora relative z-10 text-white font-bold leading-tight mb-1"
// //                     style={{ fontSize: 18, textShadow: '0 1px 6px rgba(0,0,0,0.2)' }}>
// //                     {svc.name}
// //                   </h3>
// //                   <p className="relative z-10 text-white/82 leading-relaxed" style={{ fontSize: 12 }}>{svc.desc}</p>
// //                   {/* Bottom curve */}
// //                   <div className="absolute -bottom-6 inset-x-0 bg-white"
// //                     style={{ height: 28, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
// //                 </div>

// //                 {/* Card body */}
// //                 <div className="p-5 pt-2">
// //                   <ul className="space-y-2 mb-5">
// //                     {svc.features.map((feat, fi) => (
// //                       <motion.li
// //                         key={fi}
// //                         initial={{ opacity: 0, x: -12 }}
// //                         whileInView={{ opacity: 1, x: 0 }}
// //                         viewport={{ once: true }}
// //                         transition={{ delay: 0.35 + fi * 0.08 }}
// //                         className="flex items-start gap-2"
// //                         style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}
// //                       >
// //                         <span
// //                           className="flex-shrink-0 flex items-center justify-center text-white"
// //                           style={{
// //                             width: 16, height: 16, borderRadius: 999, marginTop: 1,
// //                             background: svc.gradient, fontSize: 8, fontWeight: 900,
// //                           }}
// //                         >✓</span>
// //                         {feat}
// //                       </motion.li>
// //                     ))}
// //                   </ul>

// //                   <button
// //                     className="shimmer-cta w-full text-white font-semibold rounded-xl"
// //                     style={{
// //                       background: svc.gradient,
// //                       padding: '10px 0',
// //                       fontSize: 13,
// //                       boxShadow: `0 4px 18px ${svc.glowColor}, inset 0 1px 0 rgba(255,255,255,0.22)`,
// //                       border: 'none',
// //                       cursor: 'pointer',
// //                       transition: 'opacity 0.18s, transform 0.18s',
// //                     }}
// //                     onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
// //                     onMouseLeave={e => e.currentTarget.style.opacity = '1'}
// //                   >
// //                     Get Started →
// //                   </button>
// //                 </div>
// //               </motion.div>
// //             ))}
// //           </div>
// //         </section>

// //         {/* ── WHY OKRA ── */}
// //         <section className="max-w-5xl mx-auto mb-24">
// //           <motion.div
// //             initial={{ opacity: 0, y: 20 }}
// //             whileInView={{ opacity: 1, y: 0 }}
// //             viewport={{ once: true, margin: '-50px' }}
// //             className="text-center mb-10"
// //           >
// //             <h2 className="font-sora font-bold text-gray-800 mb-2" style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)' }}>
// //               Why Choose Okra?
// //             </h2>
// //             <p className="text-gray-400 text-sm">Built for Zambia, trusted by thousands every day</p>
// //           </motion.div>

// //           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
// //             {whyItems.map((w, i) => (
// //               <motion.div
// //                 key={i}
// //                 initial={{ opacity: 0, y: 28 }}
// //                 whileInView={{ opacity: 1, y: 0 }}
// //                 viewport={{ once: true, margin: '-30px' }}
// //                 transition={{ delay: i * 0.09, type: 'spring', stiffness: 140, damping: 20 }}
// //                 className="glass feat-card rounded-2xl p-5"
// //                 style={{ boxShadow: 'var(--shadow-sm)' }}
// //               >
// //                 <div
// //                   className="rounded-2xl flex items-center justify-center mb-4"
// //                   style={{
// //                     width: 48, height: 48, fontSize: 22,
// //                     background: `${w.color}18`,
// //                     boxShadow: `0 4px 18px ${w.color}28`,
// //                     transition: 'transform 0.28s cubic-bezier(0.34,1.3,0.64,1)',
// //                   }}
// //                   onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.18)'}
// //                   onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
// //                 >
// //                   {w.icon}
// //                 </div>
// //                 <h3 className="font-semibold text-gray-800 mb-1.5" style={{ fontSize: 13 }}>{w.title}</h3>
// //                 <p className="text-gray-500 leading-relaxed" style={{ fontSize: 12 }}>{w.desc}</p>
// //               </motion.div>
// //             ))}
// //           </div>
// //         </section>

// //         {/* ── STATS BANNER ── */}
// //         <section className="max-w-5xl mx-auto mb-20">
// //           <motion.div
// //             initial={{ opacity: 0, scale: 0.95 }}
// //             whileInView={{ opacity: 1, scale: 1 }}
// //             viewport={{ once: true, margin: '-60px' }}
// //             transition={{ type: 'spring', stiffness: 120, damping: 20 }}
// //             className="stats-banner rounded-3xl p-10 sm:p-14 relative overflow-hidden"
// //           >
// //             {/* Dot grid pattern */}
// //             <div className="dot-grid absolute inset-0 opacity-100" />
// //             {/* Inner glow circles */}
// //             <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full"
// //               style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%)' }} />
// //             <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full"
// //               style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)' }} />

// //             <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
// //               {stats.map((s, i) => (
// //                 <motion.div
// //                   key={i}
// //                   initial={{ scale: 0, opacity: 0 }}
// //                   whileInView={{ scale: 1, opacity: 1 }}
// //                   viewport={{ once: true }}
// //                   transition={{ type: 'spring', delay: i * 0.09, stiffness: 220, damping: 16 }}
// //                   className="stat-item"
// //                 >
// //                   <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
// //                   <div
// //                     className="font-sora font-black text-white leading-none mb-1.5"
// //                     style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', textShadow: '0 2px 14px rgba(0,0,0,0.18)' }}
// //                   >
// //                     {s.num}
// //                   </div>
// //                   <div className="text-emerald-100 font-medium tracking-wide" style={{ fontSize: 11 }}>{s.label}</div>
// //                 </motion.div>
// //               ))}
// //             </div>
// //           </motion.div>
// //         </section>

// //         {/* ── FOOTER ── */}
// //         <footer className="max-w-5xl mx-auto">
// //           <div className="footer-glass rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
// //             {/* Brand row */}
// //             <div className="flex items-center justify-center gap-2 mb-3">
// //               <img
// //                 src="/icon.png"
// //                 alt=""
// //                 style={{ width: 22, height: 22, objectFit: 'contain', opacity: 0.55 }}
// //                 onError={e => { e.currentTarget.style.display = 'none'; }}
// //               />
// //               <span className="font-sora font-bold text-hero" style={{ fontSize: 18 }}>Okra</span>
// //               <span className="text-gray-400" style={{ fontSize: 13 }}>Technologies</span>
// //             </div>
// //             <p className="text-gray-400 mb-5" style={{ fontSize: 12 }}>
// //               © 2025 Okra Technologies. All rights reserved. Zambia's premier ride & delivery platform.
// //             </p>
// //             <div className="flex gap-6 justify-center flex-wrap">
// //               {['Terms', 'Privacy', 'Support', 'Careers'].map(l => (
// //                 <a
// //                   key={l}
// //                   href="#"
// //                   style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textDecoration: 'none', transition: 'color 0.18s' }}
// //                   onMouseEnter={e => e.currentTarget.style.color = '#16a34a'}
// //                   onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
// //                 >
// //                   {l}
// //                 </a>
// //               ))}
// //             </div>
// //           </div>
// //         </footer>
// //       </main>
// //     </div>
// //   );
// // };

// // export default OkraLandingPage;
// 'use client'
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// // ─── Global Styles ────────────────────────────────────────────────────────────
// const GlobalStyles = () => (
//   <style>{`
//     @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
//     *, *::before, *::after { box-sizing: border-box; }
//     html { scroll-behavior: smooth; }
//     body, .okra-root { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
//     .font-sora { font-family: 'Sora', system-ui, sans-serif; }
//     :root {
//       --g-hero: linear-gradient(140deg, #14532d 0%, #15803d 30%, #16a34a 60%, #0d9488 100%);
//       --g-emerald: linear-gradient(135deg, #15803d, #16a34a);
//       --g-amber: linear-gradient(135deg, #d97706, #fbbf24);
//       --g-teal: linear-gradient(135deg, #0e7490, #22d3ee);
//       --g-violet: linear-gradient(135deg, #5b21b6, #8b5cf6);
//       --shadow-xs: 0 2px 8px rgba(0,0,0,0.06);
//       --shadow-sm: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
//       --shadow-md: 0 12px 40px rgba(0,0,0,0.10), 0 3px 10px rgba(0,0,0,0.06);
//       --shadow-lg: 0 24px 64px rgba(0,0,0,0.13), 0 6px 20px rgba(0,0,0,0.07);
//       --shadow-xl: 0 40px 96px rgba(0,0,0,0.16), 0 10px 28px rgba(0,0,0,0.09);
//       --glow-emerald: 0 0 32px rgba(22,163,74,0.45);
//       --glow-teal: 0 0 32px rgba(13,148,136,0.45);
//     }
//     /* ── Mesh background ── */
//     .okra-bg {
//       background:
//         radial-gradient(ellipse 80% 60% at 10% 15%, rgba(22,163,74,0.09) 0%, transparent 55%),
//         radial-gradient(ellipse 60% 50% at 90% 8%, rgba(20,184,166,0.07) 0%, transparent 50%),
//         radial-gradient(ellipse 50% 40% at 55% 85%, rgba(245,158,11,0.05) 0%, transparent 50%),
//         radial-gradient(ellipse 70% 50% at 0% 65%, rgba(22,163,74,0.06) 0%, transparent 45%),
//         radial-gradient(ellipse 55% 40% at 98% 55%, rgba(13,148,136,0.06) 0%, transparent 40%),
//         linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 40%, #f0fdfa 80%, #f5fffe 100%);
//     }
//     /* ── Ultra-glass ── */
//     .glass {
//       background: rgba(255,255,255,0.82);
//       backdrop-filter: blur(28px) saturate(160%);
//       -webkit-backdrop-filter: blur(28px) saturate(160%);
//       border: 1px solid rgba(255,255,255,0.95);
//       box-shadow: var(--shadow-sm);
//     }
//     .glass-header {
//       background: rgba(255,255,255,0.88);
//       backdrop-filter: blur(40px) saturate(180%);
//       -webkit-backdrop-filter: blur(40px) saturate(180%);
//       border-bottom: 1px solid rgba(255,255,255,0.98);
//       box-shadow: 0 4px 32px rgba(0,0,0,0.05), 0 1px 8px rgba(22,163,74,0.06);
//     }
//     /* ── Gradient text ── */
//     .text-hero {
//       background: var(--g-hero);
//       -webkit-background-clip: text;
//       -webkit-text-fill-color: transparent;
//       background-clip: text;
//     }
//     .text-emerald-grad {
//       background: var(--g-emerald);
//       -webkit-background-clip: text;
//       -webkit-text-fill-color: transparent;
//       background-clip: text;
//     }
//     /* ── Quick action buttons ── */
//     .qbtn {
//       position: relative;
//       cursor: pointer;
//       overflow: hidden;
//       transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
//                   box-shadow 0.22s ease;
//       border: none;
//       outline: none;
//       text-align: left;
//       min-height: 112px;
//       height: 112px;
//       border-radius: 20px;
//     }
//     .qbtn:hover { 
//       transform: translateY(-8px) scale(1.05); 
//       box-shadow: var(--shadow-xl);
//     }
//     .qbtn:active { transform: scale(0.96); }
//     .qbtn::after {
//       content: '';
//       position: absolute;
//       inset: 0;
//       background: linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0));
//       opacity: 0;
//       transition: opacity 0.22s;
//     }
//     .qbtn:hover::after { opacity: 1; }
//     /* ── 3D service cards ── */
//     .card3d {
//       transition: transform 0.32s cubic-bezier(0.34,1.2,0.64,1),
//                   box-shadow 0.32s ease;
//       transform-style: preserve-3d;
//       will-change: transform;
//       cursor: pointer;
//       border-radius: 24px;
//       overflow: hidden;
//     }
//     /* ── Shimmer on CTA buttons ── */
//     .shimmer-cta {
//       position: relative;
//       overflow: hidden;
//     }
//     .shimmer-cta::before {
//       content: '';
//       position: absolute;
//       top: -50%; left: -75%;
//       width: 50%; height: 200%;
//       background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%);
//       transform: skewX(-18deg);
//     }
//     .shimmer-cta:hover::before {
//       animation: shimmer-run 0.6s ease forwards;
//     }
//     @keyframes shimmer-run {
//       0% { left: -75%; }
//       100% { left: 125%; }
//     }
//     /* ── Floating orbs ── */
//     @keyframes orb-float {
//       0%,100% { transform: translate(0,0) scale(1); }
//       33% { transform: translate(20px,-30px) scale(1.05); }
//       66% { transform: translate(-15px,-15px) scale(0.97); }
//     }
//     .orb { animation: orb-float 18s ease-in-out infinite; }
//     .orb-2 { animation: orb-float 22s ease-in-out infinite reverse; animation-delay: -6s; }
//     .orb-3 { animation: orb-float 16s ease-in-out infinite; animation-delay: -11s; }
//     /* ── Stat items ── */
//     .stat-item {
//       transition: transform 0.28s cubic-bezier(0.34,1.3,0.64,1);
//     }
//     .stat-item:hover { transform: scale(1.07) translateY(-4px); }
//     /* ── Noise texture overlay ── */
//     .noise {
//       position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.018;
//       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E");
//       background-size: 200px;
//     }
//     /* ── Feature card hover ── */
//     .feat-card {
//       transition: transform 0.26s cubic-bezier(0.34,1.3,0.64,1),
//                   box-shadow 0.26s ease;
//     }
//     .feat-card:hover {
//       transform: translateY(-8px) scale(1.02);
//       box-shadow: 0 28px 56px rgba(0,0,0,0.11), 0 6px 16px rgba(0,0,0,0.07) !important;
//     }
//     /* ── Dot grid pattern ── */
//     .dot-grid {
//       background-image: radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px);
//       background-size: 26px 26px;
//     }
//     /* ── Stats banner ── */
//     .stats-banner {
//       background: linear-gradient(140deg, #14532d 0%, #15803d 25%, #166534 50%, #0f766e 75%, #0d9488 100%);
//       box-shadow: 0 40px 80px rgba(22,163,74,0.28), 0 12px 32px rgba(22,163,74,0.18);
//     }
//     /* ── Footer glass ── */
//     .footer-glass {
//       background: rgba(255,255,255,0.72);
//       backdrop-filter: blur(24px);
//       -webkit-backdrop-filter: blur(24px);
//       border: 1px solid rgba(255,255,255,0.92);
//     }
//     /* ── Pulse dot ── */
//     @keyframes pulse-dot {
//       0%,100% { opacity: 1; transform: scale(1); }
//       50% { opacity: 0.5; transform: scale(1.3); }
//     }
//     .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
//     /* ── Badge pill ── */
//     .badge {
//       display: inline-flex; align-items: center; gap: 6px;
//       padding: 5px 14px; border-radius: 999px;
//       background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);
//       color: #15803d; font-size: 11.5px; font-weight: 600; letter-spacing: 0.01em;
//     }
//   `}</style>
// );

// // ─── SVG: Stick Figure ────────────────────────────────────────────────────────
// const StickFigureSVG = ({ showPhone }) => (
//   <svg width="28" height="50" viewBox="0 0 28 50" fill="none" xmlns="http://www.w3.org/2000/svg">
//     {/* Head */}
//     <circle cx="14" cy="7" r="5.5" fill="#ffcba4" stroke="#2d3748" strokeWidth="1.5"/>
//     {/* Eye dots */}
//     <circle cx="12" cy="6.5" r="0.8" fill="#2d3748"/>
//     <circle cx="16" cy="6.5" r="0.8" fill="#2d3748"/>
//     {/* Body */}
//     <line x1="14" y1="13" x2="14" y2="31" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
//     {/* Left arm - hanging naturally */}
//     <line x1="14" y1="18" x2="6" y2="26" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
//     {/* Right arm - raised up holding phone */}
//     <line x1="14" y1="18" x2="22" y2="10" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
//     {/* Left leg */}
//     <line x1="14" y1="31" x2="8" y2="47" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
//     {/* Right leg */}
//     <line x1="14" y1="31" x2="20" y2="47" stroke="#2d3748" strokeWidth="2" strokeLinecap="round"/>
//     {/* Phone icon - above right hand end */}
//     {showPhone && (
//       <g>
//         {/* Phone body */}
//         <rect x="22.5" y="1.5" width="7" height="11" rx="1.8" fill="white" stroke="#16a34a" strokeWidth="1.2"/>
//         {/* Screen */}
//         <rect x="23.8" y="3.2" width="4.4" height="6.2" rx="0.6" fill="#bbf7d0"/>
//         {/* Screen glare */}
//         <rect x="24.2" y="3.5" width="1.5" height="2" rx="0.3" fill="rgba(255,255,255,0.7)"/>
//         {/* Home button */}
//         <circle cx="26" cy="11.5" r="0.8" fill="#16a34a"/>
//         {/* Tiny signal arc */}
//         <path d="M27.5 3.8 Q29 4.8 27.5 5.8" stroke="#16a34a" strokeWidth="0.6" fill="none"/>
//       </g>
//     )}
//   </svg>
// );

// // ─── SVG: Car – Front View ────────────────────────────────────────────────────
// const CarFrontSVG = () => (
//   <svg width="68" height="42" viewBox="0 0 68 42" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <ellipse cx="34" cy="41" rx="26" ry="3" fill="rgba(0,0,0,0.13)"/>
//     <rect x="2" y="20" width="64" height="19" rx="5" fill="#15803d"/>
//     <rect x="2" y="20" width="64" height="10" rx="5" fill="#166534"/>
//     <path d="M16 20 L22 6 L46 6 L52 20 Z" fill="#16a34a"/>
//     <path d="M18.5 20 L23.5 8 L44.5 8 L49.5 20 Z" fill="rgba(187,247,208,0.88)"/>
//     <line x1="34" y1="8" x2="34" y2="20" stroke="rgba(21,128,61,0.3)" strokeWidth="1.5"/>
//     <path d="M23 9 L27 8 L38 8 L42 9.5 L39 11.5 L26 11.5 Z" fill="rgba(255,255,255,0.22)"/>
//     <ellipse cx="11" cy="32" rx="8" ry="5" fill="#fef3c7"/>
//     <ellipse cx="11" cy="32" rx="5.5" ry="3.5" fill="#fef08a"/>
//     <ellipse cx="11" cy="32" rx="3" ry="2" fill="white"/>
//     <ellipse cx="57" cy="32" rx="8" ry="5" fill="#fef3c7"/>
//     <ellipse cx="57" cy="32" rx="5.5" ry="3.5" fill="#fef08a"/>
//     <ellipse cx="57" cy="32" rx="3" ry="2" fill="white"/>
//     <rect x="23" y="35" width="22" height="3.5" rx="1.5" fill="#0f4c25"/>
//     {[27,30.5,34,37.5,41].map(x => (
//       <rect key={x} x={x} y="35.5" width="2" height="2.5" rx="0.5" fill="#22c55e"/>
//     ))}
//     <rect x="4" y="37" width="60" height="3.5" rx="2" fill="#14532d"/>
//     <line x1="34" y1="20" x2="34" y2="36" stroke="rgba(21,128,61,0.25)" strokeWidth="1"/>
//     <ellipse cx="15" cy="39" rx="9" ry="3.5" fill="#1e293b"/>
//     <ellipse cx="15" cy="39" rx="5.5" ry="2" fill="#334155"/>
//     <ellipse cx="53" cy="39" rx="9" ry="3.5" fill="#1e293b"/>
//     <ellipse cx="53" cy="39" rx="5.5" ry="2" fill="#334155"/>
//     <circle cx="34" cy="37.25" r="1.5" fill="#22c55e"/>
//   </svg>
// );

// // ─── SVG: Car – Back View ─────────────────────────────────────────────────────
// const CarBackSVG = () => (
//   <svg width="68" height="42" viewBox="0 0 68 42" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <ellipse cx="34" cy="41" rx="26" ry="3" fill="rgba(0,0,0,0.13)"/>
//     <rect x="2" y="20" width="64" height="19" rx="5" fill="#15803d"/>
//     <rect x="2" y="20" width="64" height="10" rx="5" fill="#166534"/>
//     <path d="M16 20 L22 6 L46 6 L52 20 Z" fill="#16a34a"/>
//     <path d="M19 20 L24 9 L44 9 L49 20 Z" fill="rgba(187,247,208,0.75)"/>
//     <line x1="34" y1="9" x2="34" y2="20" stroke="rgba(21,128,61,0.3)" strokeWidth="1.5"/>
//     <path d="M22 10 L46 10 L47 13 L21 13 Z" fill="rgba(255,255,255,0.16)"/>
//     <ellipse cx="11" cy="32" rx="8" ry="5" fill="#fee2e2"/>
//     <ellipse cx="11" cy="32" rx="5.5" ry="3.5" fill="#fca5a5"/>
//     <ellipse cx="11" cy="32" rx="3" ry="2" fill="#ef4444"/>
//     <ellipse cx="57" cy="32" rx="8" ry="5" fill="#fee2e2"/>
//     <ellipse cx="57" cy="32" rx="5.5" ry="3.5" fill="#fca5a5"/>
//     <ellipse cx="57" cy="32" rx="3" ry="2" fill="#ef4444"/>
//     <rect x="4" y="37" width="60" height="3.5" rx="2" fill="#14532d"/>
//     <rect x="22" y="34.5" width="24" height="4.5" rx="1.2" fill="#f8fafc"/>
//     <text x="34" y="38" textAnchor="middle" fontSize="3.4" fill="#1e293b" fontFamily="monospace" fontWeight="700">OKR · 001</text>
//     <line x1="34" y1="20" x2="34" y2="36" stroke="rgba(21,128,61,0.2)" strokeWidth="1"/>
//     <ellipse cx="15" cy="39" rx="9" ry="3.5" fill="#1e293b"/>
//     <ellipse cx="15" cy="39" rx="5.5" ry="2" fill="#334155"/>
//     <ellipse cx="53" cy="39" rx="9" ry="3.5" fill="#1e293b"/>
//     <ellipse cx="53" cy="39" rx="5.5" ry="2" fill="#334155"/>
//   </svg>
// );

// // ─── Header Car Animation (ultra-refined 3D flip + timing) ───────────────────
// const HeaderCarAnimation = ({ isActive }) => {
//   const [showPhone, setShowPhone] = useState(true);
//   const [carFace, setCarFace] = useState('front');
//   const [carVisible, setCarVisible] = useState(false);
//   const [figureOn, setFigureOn] = useState(false);
//   const carMoveCtrl = useAnimation();
//   const carFlipCtrl = useAnimation();
//   const figureCtrl = useAnimation();
//   const playingRef = useRef(false);
//   const mountedRef = useRef(true);

//   useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

//   const ms = (n) => new Promise(r => setTimeout(r, n));
//   const guard = () => mountedRef.current && playingRef.current;

//   const resetAll = useCallback(() => {
//     carMoveCtrl.stop(); carFlipCtrl.stop(); figureCtrl.stop();
//     setCarVisible(false); setFigureOn(false);
//     setShowPhone(true); setCarFace('front');
//     figureCtrl.set({ y: 0, opacity: 0, scale: 1 });
//     carMoveCtrl.set({ x: 185 }); carFlipCtrl.set({ scaleX: 1 });
//     playingRef.current = false;
//   }, [carMoveCtrl, carFlipCtrl, figureCtrl]);

//   const play = useCallback(async () => {
//     if (playingRef.current) return;
//     playingRef.current = true;

//     setShowPhone(true); setCarFace('front');
//     figureCtrl.set({ y: 0, opacity: 0, scale: 1 });
//     carMoveCtrl.set({ x: 185 }); carFlipCtrl.set({ scaleX: 1 });

//     // 1. Stick figure appears (phone in hand)
//     setFigureOn(true);
//     await figureCtrl.start({ opacity: 1, transition: { duration: 0.45, ease: 'easeOut' } });
//     if (!guard()) return;
//     await ms(350);

//     // 2. Car enters from right
//     setCarVisible(true);
//     carMoveCtrl.start({ x: 38, transition: { duration: 2.6, ease: [0.2, 0.05, 0.45, 1] } });

//     // 3. Mid-move 180° 3D flip (front → back)
//     await ms(1100);
//     if (!guard()) return;
//     await carFlipCtrl.start({ scaleX: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } });
//     setCarFace('back');
//     await carFlipCtrl.start({ scaleX: 1, transition: { duration: 0.22, ease: [0, 0, 0.6, 1] } });

//     // 4. Car arrives at figure
//     await ms(950);
//     if (!guard()) return;

//     // 5. Phone vanishes
//     setShowPhone(false);
//     await ms(480);

//     // 6. Figure hops into car
//     await figureCtrl.start({
//       y: -22, opacity: 0, scale: 0.3,
//       transition: { duration: 0.48, ease: [0.4, 0, 0.9, 0.6] }
//     });
//     setFigureOn(false);
//     await ms(160);

//     // 7. Car speeds off right with motion-blur feel
//     await carMoveCtrl.start({ x: 260, transition: { duration: 0.52, ease: [0.55, 0, 1, 1] } });
//     setCarVisible(false);
//     await ms(250);

//     // 8. Reset for next cycle (every 60s)
//     resetAll();
//   }, [carMoveCtrl, carFlipCtrl, figureCtrl]);

//   useEffect(() => {
//     if (isActive) play();
//     else resetAll();
//   }, [isActive]);

//   return (
//     <div className="relative" style={{ width: 248, height: 56, overflow: 'hidden' }}>
//       <AnimatePresence>
//         {figureOn && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             exit={{ opacity: 0 }}
//             animate={figureCtrl}
//             style={{ position: 'absolute', left: 4, bottom: 2 }}
//           >
//             <StickFigureSVG showPhone={showPhone} />
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {carVisible && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0, transition: { duration: 0.12 } }}
//             style={{ position: 'absolute', bottom: 2, left: 0, pointerEvents: 'none' }}
//           >
//             <motion.div animate={carMoveCtrl} style={{ position: 'relative' }}>
//               <motion.div
//                 animate={carFlipCtrl}
//                 style={{ transformOrigin: 'center center', display: 'inline-block' }}
//               >
//                 {carFace === 'front' ? <CarFrontSVG /> : <CarBackSVG />}
//               </motion.div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// // ─── Floating Particle ───────────────────────────────────────────────────────
// const Particle = ({ left, delay, duration, size, color }) => (
//   <motion.div
//     className="absolute rounded-full pointer-events-none"
//     style={{ left: `${left}%`, top: -8, width: size, height: size, background: color }}
//     animate={{ y: ['0vh', '105vh'], opacity: [0, 0.65, 0.65, 0] }}
//     transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
//   />
// );

// // ─── Main Landing Page (ultra-polished) ───────────────────────────────────────
// const OkraLandingPage = () => {
//   const [frontendUrls, setFrontendUrls] = useState({
//     riderApp: 'http://10.27.147.23:3001/home',
//     driverApp: 'http://10.27.147.23:3002/home',
//     deliveryApp: 'https://delivery.okra.tech',
//   });
//   const [loading, setLoading] = useState(true);
//   const [headerPhase, setHeaderPhase] = useState('brand');
//   const [activeService, setActiveService] = useState(null);
//   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
//   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343';

//   // ── Fetch URLs ──
//   useEffect(() => {
//     const go = async () => {
//       try {
//         const r = await fetch(`${API_URL}/frontend-url`);
//         if (!r.ok) throw new Error();
//         const j = await r.json();
//         const p = j?.data?.paths || {};
//         setFrontendUrls({
//           riderApp: p['okra-rider-app'] || 'http://10.27.147.23:3001/home',
//           driverApp: p['okra-driver-app'] || 'http://10.27.147.23:3002/home',
//           deliveryApp: p['okra-delivery-app'] || 'https://delivery.okra.tech',
//         });
//       } catch (_) {}
//       setLoading(false);
//     };
//     go();
//   }, []);

//   // ── Header text cycle + car trigger ──
//   useEffect(() => {
//     const cycle = () => {
//       setHeaderPhase('slide');
//       setTimeout(() => setHeaderPhase('brand'), 8000);
//     };
//     const t0 = setTimeout(cycle, 3200);
//     const iv = setInterval(cycle, 60000);
//     return () => { clearTimeout(t0); clearInterval(iv); };
//   }, []);

//   // ── Parallax mouse ──
//   useEffect(() => {
//     const h = (e) => setMousePos({
//       x: (e.clientX / window.innerWidth - 0.5) * 28,
//       y: (e.clientY / window.innerHeight - 0.5) * 28,
//     });
//     window.addEventListener('mousemove', h, { passive: true });
//     return () => window.removeEventListener('mousemove', h);
//   }, []);

//   const nav = (url, id) => {
//     setActiveService(id);
//     setTimeout(() => { window.location.href = url; }, 180);
//   };

//   // ── Quick Actions (uniform 112px cards + requested colors) ──
//   const quickActions = [
//     {
//       id: 'book-ride',
//       label: 'Book A Ride',
//       icon: '🚗',
//       bg: '#ffc107',
//       iconBg: 'rgba(255,255,255,0.28)',
//       textColor: '#3d1f00',
//       shadow: 'rgba(255,193,7,0.38)',
//       url: frontendUrls.riderApp,
//     },
//     {
//       id: 'deliver',
//       label: 'Deliver A Package',
//       icon: '📦',
//       bg: 'rgba(255,255,255,0.92)',
//       iconBg: 'rgba(22,163,74,0.1)',
//       textColor: '#14532d',
//       accent: '#16a34a',
//       shadow: 'rgba(22,163,74,0.18)',
//       url: frontendUrls.deliveryApp,
//     },
//     {
//       id: 'drive',
//       label: 'Earn Money Driving',
//       icon: '🚕',
//       bg: 'var(--g-hero)',                    // exact match to hero text
//       iconBg: 'rgba(255,255,255,0.22)',
//       textColor: 'white',
//       shadow: 'rgba(13,148,136,0.42)',
//       url: frontendUrls.driverApp,
//     },
//     {
//       id: 'deliver-earn',
//       label: 'Earn Money Delivering',
//       icon: '🛵',
//       bg: 'rgba(255,255,255,0.92)',
//       iconBg: 'rgba(22,163,74,0.1)',
//       textColor: '#14532d',
//       accent: '#16a34a',
//       shadow: 'rgba(22,163,74,0.18)',
//       url: frontendUrls.deliveryApp,
//     },
//     {
//       id: 'affiliates',
//       label: 'Earn With Okra Affiliates',
//       icon: '💸',
//       bg: 'rgba(255,255,255,0.92)',
//       iconBg: 'rgba(109,40,217,0.08)',
//       textColor: '#4c1d95',
//       accent: '#7c3aed',
//       shadow: 'rgba(124,58,237,0.18)',
//       url: '#',
//     },
//     {
//       id: 'track',
//       label: 'Track Order',
//       icon: '📍',
//       bg: 'rgba(255,255,255,0.92)',
//       iconBg: 'rgba(8,145,178,0.1)',
//       textColor: '#164e63',
//       accent: '#0891b2',
//       shadow: 'rgba(8,145,178,0.18)',
//       url: frontendUrls.riderApp,
//     },
//   ];

//   // ── Service Cards (4 total, ultra 3D hover) ──
//   const services = [
//     {
//       id: 'rider',
//       name: 'Book a Ride',
//       desc: 'Quick, reliable rides across Zambia',
//       icon: '🚗',
//       gradient: 'linear-gradient(145deg, #14532d 0%, #15803d 45%, #22c55e 100%)',
//       glowColor: 'rgba(22,163,74,0.25)',
//       accentDot: '#86efac',
//       url: frontendUrls.riderApp,
//       features: ['Instant Booking', 'Live GPS Tracking', 'Multiple Payment Methods'],
//     },
//     {
//       id: 'driver',
//       name: 'Drive with Us',
//       desc: 'Your schedule, your earnings',
//       icon: '🚕',
//       gradient: 'linear-gradient(145deg, #78350f 0%, #b45309 45%, #fbbf24 100%)',
//       glowColor: 'rgba(217,119,6,0.25)',
//       accentDot: '#fde68a',
//       url: frontendUrls.driverApp,
//       features: ['Flexible Hours', 'Top Market Earnings', 'Weekly Payouts'],
//     },
//     {
//       id: 'delivery',
//       name: 'Package Delivery',
//       desc: 'Fast, city-wide delivery service',
//       icon: '📦',
//       gradient: 'linear-gradient(145deg, #0c4a6e 0%, #0891b2 50%, #22d3ee 100%)',
//       glowColor: 'rgba(8,145,178,0.25)',
//       accentDot: '#a5f3fc',
//       url: frontendUrls.deliveryApp,
//       features: ['Same-Day Delivery', 'Real-Time Tracking', 'Safe Handling Guarantee'],
//     },
//     {
//       id: 'affiliates',
//       name: 'Okra Affiliates',
//       desc: 'Build your network, grow your income',
//       icon: '💸',
//       gradient: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)',
//       glowColor: 'rgba(124,58,237,0.25)',
//       accentDot: '#ddd6fe',
//       url: '#',
//       features: [
//         'Refer a driver, earn',
//         'Refer a ride customer, earn',
//         'Withdraw your earnings via mobile money and card with OkraPay',
//       ],
//     },
//   ];

//   const whyItems = [
//     { icon: '⚡', title: 'Instant & Reliable', desc: 'Sub-minute matching with verified, on-call drivers', color: '#f59e0b' },
//     { icon: '💳', title: 'Transparent Pricing', desc: 'Clear upfront fares — zero hidden charges, ever', color: '#10b981' },
//     { icon: '🛡️', title: 'Verified & Safe', desc: 'Background-checked drivers with built-in safety tools', color: '#3b82f6' },
//     { icon: '📱', title: 'Ridiculously Easy', desc: 'Book in under 20 seconds from anywhere in Zambia', color: '#ec4899' },
//   ];

//   const stats = [
//     { num: '10K+', label: 'Active Drivers', icon: '🚗' },
//     { num: '50K+', label: 'Happy Riders', icon: '😊' },
//     { num: '24/7', label: 'Live Support', icon: '💬' },
//     { num: '4.9★', label: 'Avg. Rating', icon: '⭐' },
//   ];

//   const particles = Array.from({ length: 22 }, (_, i) => ({
//     id: i,
//     left: Math.random() * 100,
//     delay: Math.random() * 8,
//     duration: 14 + Math.random() * 18,
//     size: 3 + Math.random() * 4.5,
//     color: i % 3 === 0 ? 'rgba(22,163,74,0.22)' : i % 3 === 1 ? 'rgba(20,184,166,0.18)' : 'rgba(245,158,11,0.14)',
//   }));

//   if (loading) {
//     return (
//       <div className="okra-root okra-bg min-h-screen">
//         <GlobalStyles />
//         <div className="glass-header fixed top-0 inset-x-0 h-16 z-50" />
//         <div className="pt-24 px-5 space-y-8 max-w-xl mx-auto">
//           <div className="space-y-3 text-center pt-8">
//             <div className="h-10 w-64 bg-emerald-100/70 rounded-2xl mx-auto animate-pulse" />
//             <div className="h-5 w-48 bg-emerald-100/50 rounded-xl mx-auto animate-pulse" />
//           </div>
//           <div className="grid grid-cols-2 gap-3.5">
//             {Array.from({ length: 6 }).map((_, i) => (
//               <div key={i} className="h-28 bg-white/65 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
//             ))}
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             {Array.from({ length: 4 }).map((_, i) => (
//               <div key={i} className="h-56 bg-white/65 rounded-3xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="okra-root okra-bg min-h-screen overflow-x-hidden relative">
//       <GlobalStyles />
//       <div className="noise" />

//       {/* ── Parallax background orbs + particles ── */}
//       <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
//         <div className="orb absolute" style={{
//           top: '-10%', right: '-8%', width: 480, height: 480, borderRadius: '50%',
//           background: 'radial-gradient(circle, rgba(22,163,74,0.11) 0%, transparent 68%)',
//           filter: 'blur(44px)',
//           transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px)`,
//           transition: 'transform 0.55s ease',
//         }} />
//         <div className="orb-2 absolute" style={{
//           bottom: '-8%', left: '-6%', width: 420, height: 420, borderRadius: '50%',
//           background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 65%)',
//           filter: 'blur(50px)',
//           transform: `translate(${mousePos.x * -0.25}px, ${mousePos.y * -0.25}px)`,
//           transition: 'transform 0.7s ease',
//         }} />
//         <div className="orb-3 absolute" style={{
//           top: '40%', left: '35%', width: 560, height: 560, borderRadius: '50%',
//           background: 'radial-gradient(circle, rgba(22,163,74,0.05) 0%, transparent 60%)',
//           filter: 'blur(70px)',
//         }} />
//         {particles.map(p => (
//           <Particle key={p.id} left={p.left} delay={p.delay} duration={p.duration} size={p.size} color={p.color} />
//         ))}
//       </div>

//       {/* ════════════════════════ HEADER ════════════════════════ */}
//       <motion.header
//         initial={{ y: -72, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ type: 'spring', damping: 22, stiffness: 180 }}
//         className="glass-header fixed top-0 inset-x-0 z-50"
//         style={{ height: 64 }}
//       >
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
//           {/* Logo */}
//           <div className="flex items-center gap-2.5 shrink-0">
//             <div className="relative w-10 h-10 flex items-center justify-center">
//               <img
//                 src="/icon.png"
//                 alt="Okra"
//                 style={{ width: 40, height: 40, objectFit: 'contain' }}
//                 onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }}
//               />
//               <span style={{ fontSize: 32, display: 'none', lineHeight: 1 }}>🥬</span>
//             </div>
//             <div>
//               <div className="font-sora text-hero leading-none tracking-tight" style={{ fontSize: 20, fontWeight: 800 }}>
//                 Okra
//               </div>
//               <div className="relative overflow-hidden" style={{ height: 16 }}>
//                 <AnimatePresence mode="wait">
//                   {headerPhase === 'brand' ? (
//                     <motion.span
//                       key="brand"
//                       initial={{ y: 16, opacity: 0 }}
//                       animate={{ y: 0, opacity: 1 }}
//                       exit={{ y: -16, opacity: 0 }}
//                       transition={{ duration: 0.28 }}
//                       className="absolute inset-0 flex items-center text-gray-400"
//                       style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}
//                     >
//                       Technologies
//                     </motion.span>
//                   ) : (
//                     <motion.span
//                       key="slide"
//                       initial={{ y: 16, opacity: 0 }}
//                       animate={{ y: 0, opacity: 1 }}
//                       exit={{ y: -16, opacity: 0 }}
//                       transition={{ duration: 0.28 }}
//                       className="absolute inset-0 flex items-center font-sora font-semibold"
//                       style={{
//                         fontSize: 10, whiteSpace: 'nowrap',
//                         background: 'linear-gradient(90deg, #15803d, #22c55e, #0d9488)',
//                         WebkitBackgroundClip: 'text',
//                         WebkitTextFillColor: 'transparent',
//                       }}
//                     >
//                       slide into your ride &gt;&gt;
//                     </motion.span>
//                   )}
//                 </AnimatePresence>
//               </div>
//             </div>
//           </div>

//           {/* 3D Car Animation – middle-left of header (as requested) */}
//           <div className="hidden lg:flex flex-1 justify-start items-end pl-16 overflow-hidden" style={{ maxHeight: 56 }}>
//             <HeaderCarAnimation isActive={headerPhase === 'slide'} />
//           </div>

//           {/* Right hint */}
//           <div className="hidden md:flex items-center gap-1.5 shrink-0">
//             <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
//             <span className="text-gray-500" style={{ fontSize: 12, fontWeight: 500 }}>Your Journey, Your Way</span>
//           </div>
//         </div>
//       </motion.header>

//       {/* ════════════════════════ MAIN CONTENT ════════════════════════ */}
//       <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
//         {/* HERO */}
//         <motion.section
//           initial={{ opacity: 0, y: 36 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.22, type: 'spring', damping: 22, stiffness: 140 }}
//           className="text-center mb-14 max-w-3xl mx-auto"
//         >
//           <motion.div
//             initial={{ scale: 0.85, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             transition={{ delay: 0.08, type: 'spring', stiffness: 200 }}
//             className="badge mx-auto mb-5"
//           >
//             <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
//             Zambia's #1 Ride &amp; Delivery Platform
//           </motion.div>
//           <h1
//             className="font-sora text-hero leading-[1.08] tracking-tight mb-4"
//             style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: 900 }}
//           >
//             Choose Your<br />Service
//           </h1>
//           <p className="text-gray-500 max-w-lg mx-auto leading-relaxed" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
//             Reliable rides, fast deliveries, and real earning opportunities — all from one platform built for Zambia.
//           </p>
//         </motion.section>

//         {/* QUICK ACTIONS – uniform size, refined 3D hover */}
//         <div
//           className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-20"
//           style={{ gridAutoRows: '112px' }}
//         >
//           {quickActions.map((a, i) => (
//             <motion.button
//               key={a.id}
//               initial={{ scale: 0.82, opacity: 0, y: 18 }}
//               animate={{ scale: 1, opacity: 1, y: 0 }}
//               whileHover={{ scale: 1.05, y: -7 }}
//               transition={{ type: 'spring', damping: 14, stiffness: 280, delay: i * 0.055 }}
//               className="qbtn focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
//               style={{
//                 background: a.bg,
//                 boxShadow: `var(--shadow-sm), 0 8px 28px ${a.shadow}`,
//                 border: a.bg.startsWith('rgba') ? '1px solid rgba(255,255,255,0.92)' : 'none',
//               }}
//               onClick={() => nav(a.url, a.id)}
//             >
//               <div className="p-4 h-full flex flex-col justify-between">
//                 <div
//                   className="w-11 h-11 rounded-xl flex items-center justify-center"
//                   style={{
//                     background: a.iconBg,
//                     boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.08)',
//                     fontSize: 22,
//                   }}
//                 >
//                   {a.icon}
//                 </div>
//                 <span
//                   style={{
//                     color: a.textColor,
//                     fontSize: 11.5,
//                     fontWeight: 700,
//                     lineHeight: 1.3,
//                     fontFamily: '"Plus Jakarta Sans", sans-serif',
//                   }}
//                 >
//                   {a.label}
//                 </span>
//               </div>
//               {activeService === a.id && (
//                 <span
//                   className="absolute inset-0 rounded-2xl pointer-events-none"
//                   style={{ boxShadow: `0 0 0 2.5px ${a.accent || '#16a34a'}`, borderRadius: 16 }}
//                 />
//               )}
//             </motion.button>
//           ))}
//         </div>

//         {/* SERVICE CARDS – 3D tilt + enhanced glow */}
//         <section className="max-w-6xl mx-auto mb-24">
//           <motion.div
//             initial={{ opacity: 0, y: 22 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true, margin: '-60px' }}
//             className="text-center mb-10"
//           >
//             <h2 className="font-sora font-bold text-gray-800 mb-2" style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)' }}>
//               Explore Our Services
//             </h2>
//             <p className="text-gray-400 text-sm">Everything you need, all in one place</p>
//           </motion.div>

//           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
//             {services.map((svc, i) => (
//               <motion.div
//                 key={svc.id}
//                 initial={{ opacity: 0, y: 52, rotateX: -10 }}
//                 whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
//                 whileHover={{ 
//                   y: -14, 
//                   rotateX: 6, 
//                   rotateY: -3, 
//                   scale: 1.015,
//                   transition: { type: 'spring', stiffness: 280, damping: 18 }
//                 }}
//                 viewport={{ once: true, margin: '-40px' }}
//                 transition={{ type: 'spring', damping: 20, stiffness: 110, delay: i * 0.09 }}
//                 onClick={() => nav(svc.url, svc.id)}
//                 className="card3d bg-white"
//                 style={{ boxShadow: `var(--shadow-md), 0 8px 32px ${svc.glowColor}` }}
//               >
//                 <div className="relative overflow-hidden p-6 pb-10" style={{ background: svc.gradient }}>
//                   <div className="absolute inset-0 bg-gradient-to-br from-white/22 to-transparent" />
//                   <div className="absolute inset-0" style={{
//                     backgroundImage: `radial-gradient(ellipse at 85% 15%, ${svc.accentDot} 0%, transparent 55%),
//                                       radial-gradient(ellipse at 15% 85%, rgba(255,255,255,0.28) 0%, transparent 40%)`,
//                     opacity: 0.62
//                   }} />
//                   <div className="relative z-10 mb-3" style={{ fontSize: 46, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.28))' }}>
//                     {svc.icon}
//                   </div>
//                   <h3 className="font-sora relative z-10 text-white font-bold leading-tight mb-1" style={{ fontSize: 18, textShadow: '0 1px 6px rgba(0,0,0,0.2)' }}>
//                     {svc.name}
//                   </h3>
//                   <p className="relative z-10 text-white/85 leading-relaxed" style={{ fontSize: 12 }}>{svc.desc}</p>
//                   <div className="absolute -bottom-6 inset-x-0 bg-white" style={{ height: 28, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
//                 </div>

//                 <div className="p-5 pt-2">
//                   <ul className="space-y-2 mb-5">
//                     {svc.features.map((feat, fi) => (
//                       <motion.li
//                         key={fi}
//                         initial={{ opacity: 0, x: -12 }}
//                         whileInView={{ opacity: 1, x: 0 }}
//                         viewport={{ once: true }}
//                         transition={{ delay: 0.35 + fi * 0.08 }}
//                         className="flex items-start gap-2"
//                         style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}
//                       >
//                         <span className="flex-shrink-0 flex items-center justify-center text-white" style={{
//                           width: 16, height: 16, borderRadius: 999, marginTop: 1,
//                           background: svc.gradient, fontSize: 8, fontWeight: 900,
//                         }}>✓</span>
//                         {feat}
//                       </motion.li>
//                     ))}
//                   </ul>
//                   <button
//                     className="shimmer-cta w-full text-white font-semibold rounded-xl"
//                     style={{
//                       background: svc.gradient,
//                       padding: '10px 0',
//                       fontSize: 13,
//                       boxShadow: `0 4px 18px ${svc.glowColor}, inset 0 1px 0 rgba(255,255,255,0.22)`,
//                     }}
//                   >
//                     Get Started →
//                   </button>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </section>

//         {/* WHY OKRA – refined glass cards */}
//         <section className="max-w-5xl mx-auto mb-24">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true, margin: '-50px' }}
//             className="text-center mb-10"
//           >
//             <h2 className="font-sora font-bold text-gray-800 mb-2" style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)' }}>
//               Why Choose Okra?
//             </h2>
//             <p className="text-gray-400 text-sm">Built for Zambia, trusted by thousands every day</p>
//           </motion.div>
//           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
//             {whyItems.map((w, i) => (
//               <motion.div
//                 key={i}
//                 initial={{ opacity: 0, y: 28 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 whileHover={{ scale: 1.04, y: -6 }}
//                 viewport={{ once: true, margin: '-30px' }}
//                 transition={{ delay: i * 0.09, type: 'spring', stiffness: 140, damping: 20 }}
//                 className="glass feat-card rounded-2xl p-5"
//               >
//                 <div
//                   className="rounded-2xl flex items-center justify-center mb-4"
//                   style={{
//                     width: 48, height: 48, fontSize: 22,
//                     background: `${w.color}18`,
//                     boxShadow: `0 4px 18px ${w.color}28`,
//                   }}
//                 >
//                   {w.icon}
//                 </div>
//                 <h3 className="font-semibold text-gray-800 mb-1.5" style={{ fontSize: 13 }}>{w.title}</h3>
//                 <p className="text-gray-500 leading-relaxed" style={{ fontSize: 12 }}>{w.desc}</p>
//               </motion.div>
//             ))}
//           </div>
//         </section>

//         {/* STATS BANNER */}
//         <section className="max-w-5xl mx-auto mb-20">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             whileInView={{ opacity: 1, scale: 1 }}
//             viewport={{ once: true, margin: '-60px' }}
//             className="stats-banner rounded-3xl p-10 sm:p-14 relative overflow-hidden"
//           >
//             <div className="dot-grid absolute inset-0 opacity-100" />
//             <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%)' }} />
//             <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)' }} />
//             <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
//               {stats.map((s, i) => (
//                 <motion.div
//                   key={i}
//                   initial={{ scale: 0, opacity: 0 }}
//                   whileInView={{ scale: 1, opacity: 1 }}
//                   viewport={{ once: true }}
//                   transition={{ type: 'spring', delay: i * 0.09, stiffness: 220, damping: 16 }}
//                   className="stat-item"
//                 >
//                   <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
//                   <div className="font-sora font-black text-white leading-none mb-1.5" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', textShadow: '0 2px 14px rgba(0,0,0,0.18)' }}>
//                     {s.num}
//                   </div>
//                   <div className="text-emerald-100 font-medium tracking-wide" style={{ fontSize: 11 }}>{s.label}</div>
//                 </motion.div>
//               ))}
//             </div>
//           </motion.div>
//         </section>

//         {/* FOOTER */}
//         <footer className="max-w-5xl mx-auto">
//           <div className="footer-glass rounded-2xl p-8 text-center">
//             <div className="flex items-center justify-center gap-2 mb-3">
//               <img
//                 src="/icon.png"
//                 alt=""
//                 style={{ width: 22, height: 22, objectFit: 'contain', opacity: 0.55 }}
//                 onError={e => { e.currentTarget.style.display = 'none'; }}
//               />
//               <span className="font-sora font-bold text-hero" style={{ fontSize: 18 }}>Okra</span>
//               <span className="text-gray-400" style={{ fontSize: 13 }}>Technologies</span>
//             </div>
//             <p className="text-gray-400 mb-5" style={{ fontSize: 12 }}>
//               © 2025 Okra Technologies. All rights reserved. Zambia's premier ride &amp; delivery platform.
//             </p>
//             <div className="flex gap-6 justify-center flex-wrap">
//               {['Terms', 'Privacy', 'Support', 'Careers'].map(l => (
//                 <a
//                   key={l}
//                   href="#"
//                   style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textDecoration: 'none', transition: 'color 0.18s' }}
//                   onMouseEnter={e => e.currentTarget.style.color = '#16a34a'}
//                   onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
//                 >
//                   {l}
//                 </a>
//               ))}
//             </div>
//           </div>
//         </footer>
//       </main>
//     </div>
//   );
// };

// export default OkraLandingPage;
'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Global Styles (ultra-polished) ───────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body, .okra-root { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .font-sora { font-family: 'Sora', system-ui, sans-serif; }
    :root {
      --g-hero: linear-gradient(140deg, #14532d 0%, #15803d 30%, #16a34a 60%, #0d9488 100%);
      --shadow-xs: 0 2px 8px rgba(0,0,0,0.06);
      --shadow-sm: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
      --shadow-md: 0 12px 40px rgba(0,0,0,0.10), 0 3px 10px rgba(0,0,0,0.06);
      --shadow-lg: 0 24px 64px rgba(0,0,0,0.13), 0 6px 20px rgba(0,0,0,0.07);
      --shadow-xl: 0 40px 96px rgba(0,0,0,0.16), 0 10px 28px rgba(0,0,0,0.09);
      --glow-emerald: 0 0 32px rgba(22,163,74,0.45);
    }
    .okra-bg {
      background:
        radial-gradient(ellipse 80% 60% at 10% 15%, rgba(22,163,74,0.09) 0%, transparent 55%),
        radial-gradient(ellipse 60% 50% at 90% 8%, rgba(20,184,166,0.07) 0%, transparent 50%),
        radial-gradient(ellipse 50% 40% at 55% 85%, rgba(245,158,11,0.05) 0%, transparent 50%),
        radial-gradient(ellipse 70% 50% at 0% 65%, rgba(22,163,74,0.06) 0%, transparent 45%),
        radial-gradient(ellipse 55% 40% at 98% 55%, rgba(13,148,136,0.06) 0%, transparent 40%),
        linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 40%, #f0fdfa 80%, #f5fffe 100%);
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
    .qbtn {
      position: relative;
      cursor: pointer;
      overflow: hidden;
      transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.22s ease;
      border: none;
      outline: none;
      text-align: left;
      height: 112px;
      border-radius: 20px;
    }
    .qbtn:hover { 
      transform: translateY(-8px) scale(1.05); 
      box-shadow: var(--shadow-xl);
    }
    .qbtn:active { transform: scale(0.96); }
    .qbtn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0));
      opacity: 0;
      transition: opacity 0.22s;
    }
    .qbtn:hover::after { opacity: 1; }
    .card3d {
      transition: transform 0.32s cubic-bezier(0.34,1.2,0.64,1),
                  box-shadow 0.32s ease;
      transform-style: preserve-3d;
      will-change: transform;
      cursor: pointer;
      border-radius: 24px;
      overflow: hidden;
    }
    .shimmer-cta {
      position: relative;
      overflow: hidden;
    }
    .shimmer-cta::before {
      content: '';
      position: absolute;
      top: -50%; left: -75%;
      width: 50%; height: 200%;
      background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%);
      transform: skewX(-18deg);
    }
    .shimmer-cta:hover::before {
      animation: shimmer-run 0.6s ease forwards;
    }
    @keyframes shimmer-run {
      0% { left: -75%; }
      100% { left: 125%; }
    }
    .orb { animation: orb-float 18s ease-in-out infinite; }
    .orb-2 { animation: orb-float 22s ease-in-out infinite reverse; animation-delay: -6s; }
    .orb-3 { animation: orb-float 16s ease-in-out infinite; animation-delay: -11s; }
    @keyframes orb-float {
      0%,100% { transform: translate(0,0) scale(1); }
      33% { transform: translate(20px,-30px) scale(1.05); }
      66% { transform: translate(-15px,-15px) scale(0.97); }
    }
    .noise {
      position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.018;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px;
    }
    .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
    @keyframes pulse-dot {
      0%,100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 14px; border-radius: 999px;
      background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.2);
      color: #15803d; font-size: 11.5px; font-weight: 600; letter-spacing: 0.01em;
    }
  `}</style>
);

// ─── 3D HEADER ANIMATION (placed on TOP RIGHT) ───────────────────────────────
const HeaderThreeDAnimation = ({ isActive }) => {
  return (
    <div className="relative" style={{ width: 248, height: 56, overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 4.2, 14], fov: 46 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene isActive={isActive} />
      </Canvas>
    </div>
  );
};

const Scene = ({ isActive }) => {
  const carRef = useRef(null);
  const figureRef = useRef(null);
  const phoneRef = useRef(null);

  const targetCarX = useRef(8);
  const targetCarRotY = useRef(0);
  const targetFigureX = useRef(-5);
  const targetFigureY = useRef(-8);
  const targetFigureScale = useRef(1);

  const mountedRef = useRef(true);
  const playingRef = useRef(false);

  const ms = (n) => new Promise(r => setTimeout(r, n));
  const guard = () => mountedRef.current && playingRef.current;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const resetAll = useCallback(() => {
    if (carRef.current) {
      carRef.current.position.x = 8;
      carRef.current.rotation.y = 0;
    }
    if (figureRef.current) figureRef.current.visible = true;
    if (phoneRef.current) phoneRef.current.visible = true;
    targetCarX.current = 8;
    targetCarRotY.current = 0;
    targetFigureX.current = -5;
    targetFigureY.current = -8;
    targetFigureScale.current = 1;
    playingRef.current = false;
  }, []);

  const play = async () => {
    if (playingRef.current) return;
    playingRef.current = true;
    resetAll();

    // 1. Stick figure appears
    targetFigureY.current = 0;
    await ms(350);
    if (!guard()) return;

    // 2. Car swerves in from right
    targetCarX.current = -1.1;
    await ms(1100);
    if (!guard()) return;

    // 3. 180° 3D flip
    targetCarRotY.current = Math.PI;
    await ms(420);
    if (!guard()) return;

    // 4. Phone disappears
    if (phoneRef.current) phoneRef.current.visible = false;
    await ms(480);
    if (!guard()) return;

    // 5. Figure hops into car
    targetFigureX.current = -1.4;
    targetFigureY.current = 1.3;
    targetFigureScale.current = 0.34;
    await ms(480);
    if (!guard()) return;

    if (figureRef.current) figureRef.current.visible = false;
    await ms(160);
    if (!guard()) return;

    // 6. Car speeds off
    targetCarX.current = 12;
    await ms(520);
    if (!guard()) return;

    resetAll();
  };

  useEffect(() => {
    if (isActive) play();
    else resetAll();
  }, [isActive]);

  useFrame(() => {
    if (carRef.current) {
      carRef.current.position.x = THREE.MathUtils.lerp(carRef.current.position.x, targetCarX.current, 0.038);
      carRef.current.rotation.y = THREE.MathUtils.lerp(carRef.current.rotation.y, targetCarRotY.current, 0.092);
    }
    if (figureRef.current) {
      figureRef.current.position.x = THREE.MathUtils.lerp(figureRef.current.position.x, targetFigureX.current, 0.042);
      figureRef.current.position.y = THREE.MathUtils.lerp(figureRef.current.position.y, targetFigureY.current, 0.065);
      const s = THREE.MathUtils.lerp(figureRef.current.scale.x, targetFigureScale.current, 0.065);
      figureRef.current.scale.set(s, s, s);
    }
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[12, 18, 8]} intensity={1.4} castShadow />
      <pointLight position={[-8, 6, -5]} intensity={0.6} color="#86efac" />

      {/* Ground */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI * 0.5, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f0fdf4" />
      </mesh>

      {/* GREEN CAR */}
      <group ref={carRef} position={[8, 0.6, 0]}>
        <mesh><boxGeometry args={[5.2, 1.65, 2.45]} /><meshStandardMaterial color="#15803d" metalness={0.4} roughness={0.6} /></mesh>
        <mesh position={[0.65, 1.35, 0]}><boxGeometry args={[2.9, 1.35, 2.1]} /><meshStandardMaterial color="#166534" metalness={0.3} /></mesh>
        <mesh position={[1.1, 1.6, 0]} rotation={[0.3, 0, 0]}><planeGeometry args={[1.8, 1.1]} /><meshStandardMaterial color="#bbf7d0" transparent opacity={0.35} /></mesh>

        {/* Front headlights */}
        <mesh position={[-2.35, 0.85, 1.05]}><sphereGeometry args={[0.38]} /><meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} /></mesh>
        <mesh position={[-2.35, 0.85, -1.05]}><sphereGeometry args={[0.38]} /><meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} /></mesh>

        {/* Rear taillights */}
        <mesh position={[2.55, 0.85, 1.05]}><sphereGeometry args={[0.38]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.9} /></mesh>
        <mesh position={[2.55, 0.85, -1.05]}><sphereGeometry args={[0.38]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.9} /></mesh>

        {/* Wheels */}
        {[-1.7, 1.95].map((x) => (
          <group key={x}>
            <mesh position={[x, 0, 1.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.58, 0.58, 0.48]} /><meshStandardMaterial color="#1e293b" /></mesh>
            <mesh position={[x, 0, -1.22]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.58, 0.58, 0.48]} /><meshStandardMaterial color="#1e293b" /></mesh>
          </group>
        ))}
        <mesh position={[-1.8, 0.4, 0]}><sphereGeometry args={[0.22]} /><meshStandardMaterial color="#22c55e" emissive="#22c55e" /></mesh>
      </group>

      {/* STICK FIGURE */}
      <group ref={figureRef} position={[-5, 0, 0]}>
        <mesh position={[0, 3.65, 0]}><sphereGeometry args={[0.68]} /><meshStandardMaterial color="#ffcba4" /></mesh>
        <mesh position={[-0.25, 3.75, 0.6]}><sphereGeometry args={[0.12]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0.25, 3.75, 0.6]}><sphereGeometry args={[0.12]} /><meshStandardMaterial color="#1f2937" /></mesh>
        <mesh position={[0, 2.1, 0]}><cylinderGeometry args={[0.42, 0.42, 2.1]} /><meshStandardMaterial color="#2d3748" /></mesh>
        <mesh position={[-0.75, 2.65, 0]} rotation={[0, 0, -0.75]}><cylinderGeometry args={[0.19, 0.19, 1.85]} /><meshStandardMaterial color="#2d3748" /></mesh>
        <mesh position={[0.85, 2.95, 0]} rotation={[0, 0, 1.15]}><cylinderGeometry args={[0.19, 0.19, 1.85]} /><meshStandardMaterial color="#2d3748" /></mesh>
        <mesh position={[-0.45, 0.85, 0]} rotation={[0, 0, -0.45]}><cylinderGeometry args={[0.23, 0.23, 1.95]} /><meshStandardMaterial color="#2d3748" /></mesh>
        <mesh position={[0.45, 0.85, 0]} rotation={[0, 0, 0.45]}><cylinderGeometry args={[0.23, 0.23, 1.95]} /><meshStandardMaterial color="#2d3748" /></mesh>
      </group>

      {/* PHONE */}
      <group ref={phoneRef} position={[-3.65, 4.05, 0.1]}>
        <mesh><boxGeometry args={[0.68, 1.25, 0.12]} /><meshStandardMaterial color="#ffffff" metalness={0.6} /></mesh>
        <mesh position={[0, 0, 0.07]}><boxGeometry args={[0.55, 1.05, 0.03]} /><meshStandardMaterial color="#bbf7d0" /></mesh>
        <mesh position={[-0.22, 0.48, 0.08]}><sphereGeometry args={[0.06]} /><meshStandardMaterial color="#111827" /></mesh>
      </group>
    </>
  );
};

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
const OkraLandingPage = () => {
  const [frontendUrls, setFrontendUrls] = useState({
    riderApp: 'http://10.27.147.23:3001/home',
    driverApp: 'http://10.27.147.23:3002/home',
    deliveryApp: 'https://delivery.okra.tech',
  });
  const [loading, setLoading] = useState(true);
  const [headerPhase, setHeaderPhase] = useState('brand');
  const [activeService, setActiveService] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343';

  useEffect(() => {
    const go = async () => {
      try {
        const r = await fetch(`${API_URL}/frontend-url`);
        if (!r.ok) throw new Error();
        const j = await r.json();
        const p = j?.data?.paths || {};
        setFrontendUrls({
          riderApp: p['okra-rider-app'] || 'http://10.27.147.23:3001/home',
          driverApp: p['okra-driver-app'] || 'http://10.27.147.23:3002/home',
          deliveryApp: p['okra-delivery-app'] || 'https://delivery.okra.tech',
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
      x: (e.clientX / window.innerWidth - 0.5) * 28,
      y: (e.clientY / window.innerHeight - 0.5) * 28,
    });
    window.addEventListener('mousemove', h, { passive: true });
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const nav = (url, id) => {
    setActiveService(id);
    setTimeout(() => { window.location.href = url; }, 180);
  };

  const quickActions = [
    { id: 'book-ride', label: 'Book A Ride', icon: '🚗', bg: '#ffc107', iconBg: 'rgba(255,255,255,0.28)', textColor: '#3d1f00', shadow: 'rgba(255,193,7,0.38)', url: frontendUrls.riderApp },
    { id: 'deliver', label: 'Deliver A Package', icon: '📦', bg: 'rgba(255,255,255,0.92)', iconBg: 'rgba(22,163,74,0.1)', textColor: '#14532d', accent: '#16a34a', shadow: 'rgba(22,163,74,0.18)', url: frontendUrls.deliveryApp },
    { id: 'drive', label: 'Earn Money Driving', icon: '🚕', bg: 'var(--g-hero)', iconBg: 'rgba(255,255,255,0.22)', textColor: 'white', shadow: 'rgba(13,148,136,0.42)', url: frontendUrls.driverApp },
    { id: 'deliver-earn', label: 'Earn Money Delivering', icon: '🛵', bg: 'rgba(255,255,255,0.92)', iconBg: 'rgba(22,163,74,0.1)', textColor: '#14532d', accent: '#16a34a', shadow: 'rgba(22,163,74,0.18)', url: frontendUrls.deliveryApp },
    { id: 'affiliates', label: 'Earn With Okra Affiliates', icon: '💸', bg: 'rgba(255,255,255,0.92)', iconBg: 'rgba(109,40,217,0.08)', textColor: '#4c1d95', accent: '#7c3aed', shadow: 'rgba(124,58,237,0.18)', url: '#' },
    { id: 'track', label: 'Track Order', icon: '📍', bg: 'rgba(255,255,255,0.92)', iconBg: 'rgba(8,145,178,0.1)', textColor: '#164e63', accent: '#0891b2', shadow: 'rgba(8,145,178,0.18)', url: frontendUrls.riderApp },
  ];

  const services = [
    { id: 'rider', name: 'Book a Ride', desc: 'Quick, reliable rides across Zambia', icon: '🚗', gradient: 'linear-gradient(145deg, #14532d 0%, #15803d 45%, #22c55e 100%)', glowColor: 'rgba(22,163,74,0.25)', accentDot: '#86efac', url: frontendUrls.riderApp, features: ['Instant Booking', 'Live GPS Tracking', 'Multiple Payment Methods'] },
    { id: 'driver', name: 'Drive with Us', desc: 'Your schedule, your earnings', icon: '🚕', gradient: 'linear-gradient(145deg, #78350f 0%, #b45309 45%, #fbbf24 100%)', glowColor: 'rgba(217,119,6,0.25)', accentDot: '#fde68a', url: frontendUrls.driverApp, features: ['Flexible Hours', 'Top Market Earnings', 'Weekly Payouts'] },
    { id: 'delivery', name: 'Package Delivery', desc: 'Fast, city-wide delivery service', icon: '📦', gradient: 'linear-gradient(145deg, #0c4a6e 0%, #0891b2 50%, #22d3ee 100%)', glowColor: 'rgba(8,145,178,0.25)', accentDot: '#a5f3fc', url: frontendUrls.deliveryApp, features: ['Same-Day Delivery', 'Real-Time Tracking', 'Safe Handling Guarantee'] },
    { id: 'affiliates', name: 'Okra Affiliates', desc: 'Build your network, grow your income', icon: '💸', gradient: 'linear-gradient(145deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)', glowColor: 'rgba(124,58,237,0.25)', accentDot: '#ddd6fe', url: '#', features: ['Refer a driver, earn', 'Refer a ride customer, earn', 'Withdraw your earnings via mobile money and card with OkraPay'] },
  ];

  const whyItems = [
    { icon: '⚡', title: 'Instant & Reliable', desc: 'Sub-minute matching with verified, on-call drivers', color: '#f59e0b' },
    { icon: '💳', title: 'Transparent Pricing', desc: 'Clear upfront fares — zero hidden charges, ever', color: '#10b981' },
    { icon: '🛡️', title: 'Verified & Safe', desc: 'Background-checked drivers with built-in safety tools', color: '#3b82f6' },
    { icon: '📱', title: 'Ridiculously Easy', desc: 'Book in under 20 seconds from anywhere in Zambia', color: '#ec4899' },
  ];

  const stats = [
    { num: '10K+', label: 'Active Drivers', icon: '🚗' },
    { num: '50K+', label: 'Happy Riders', icon: '😊' },
    { num: '24/7', label: 'Live Support', icon: '💬' },
    { num: '4.9★', label: 'Avg. Rating', icon: '⭐' },
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
            <div className="h-10 w-64 bg-emerald-100/70 rounded-2xl mx-auto animate-pulse" />
            <div className="h-5 w-48 bg-emerald-100/50 rounded-xl mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-white/65 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 bg-white/65 rounded-3xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
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
        <div className="orb absolute" style={{ top: '-10%', right: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.11) 0%, transparent 68%)', filter: 'blur(44px)', transform: `translate(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px)` }} />
        <div className="orb-2 absolute" style={{ bottom: '-8%', left: '-6%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 65%)', filter: 'blur(50px)', transform: `translate(${mousePos.x * -0.25}px, ${mousePos.y * -0.25}px)` }} />
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

      {/* HEADER – 3D animation on TOP RIGHT corner */}
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 180 }}
        className="glass-header fixed top-0 inset-x-0 z-50"
        style={{ height: 64 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <img src="/icon.png" alt="Okra" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }} />
              <span style={{ fontSize: 32, display: 'none', lineHeight: 1 }}>🥬</span>
            </div>
            <div>
              <div className="font-sora text-hero leading-none tracking-tight" style={{ fontSize: 20, fontWeight: 800 }}>Okra</div>
              <div className="relative overflow-hidden" style={{ height: 16 }}>
                <AnimatePresence mode="wait">
                  {headerPhase === 'brand' ? (
                    <motion.span key="brand" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="absolute inset-0 flex items-center text-gray-400" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Technologies</motion.span>
                  ) : (
                    <motion.span key="slide" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="absolute inset-0 flex items-center font-sora font-semibold" style={{ fontSize: 10, whiteSpace: 'nowrap', background: 'linear-gradient(90deg, #15803d, #22c55e, #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>slide into your ride &gt;&gt;</motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 3D ANIMATION – TOP RIGHT */}
          <div className="hidden lg:flex flex-1 justify-end items-end pr-8 overflow-hidden" style={{ maxHeight: 56 }}>
            <HeaderThreeDAnimation isActive={headerPhase === 'slide'} />
          </div>

          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span className="text-gray-500" style={{ fontSize: 12, fontWeight: 500 }}>Your Journey, Your Way</span>
          </div>
        </div>
      </motion.header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
        {/* HERO */}
        <motion.section initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, type: 'spring', damping: 22, stiffness: 140 }} className="text-center mb-14 max-w-3xl mx-auto">
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.08, type: 'spring', stiffness: 200 }} className="badge mx-auto mb-5">
            <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
            Zambia's #1 Ride &amp; Delivery Platform
          </motion.div>
          <h1 className="font-sora text-hero leading-[1.08] tracking-tight mb-4" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: 900 }}>Choose Your<br />Service</h1>
          <p className="text-gray-500 max-w-lg mx-auto leading-relaxed" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>Reliable rides, fast deliveries, and real earning opportunities — all from one platform built for Zambia.</p>
        </motion.section>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-20" style={{ gridAutoRows: '112px' }}>
          {quickActions.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ scale: 0.82, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -7 }}
              transition={{ type: 'spring', damping: 14, stiffness: 280, delay: i * 0.055 }}
              className="qbtn focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              style={{ background: a.bg, boxShadow: `var(--shadow-sm), 0 8px 28px ${a.shadow}`, border: a.bg.startsWith('rgba') ? '1px solid rgba(255,255,255,0.92)' : 'none' }}
              onClick={() => nav(a.url, a.id)}
            >
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: a.iconBg, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.08)', fontSize: 22 }}>{a.icon}</div>
                <span style={{ color: a.textColor, fontSize: 11.5, fontWeight: 700, lineHeight: 1.3, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{a.label}</span>
              </div>
              {activeService === a.id && <span className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: `0 0 0 2.5px ${a.accent || '#16a34a'}`, borderRadius: 16 }} />}
            </motion.button>
          ))}
        </div>

        {/* SERVICE CARDS */}
        <section className="max-w-6xl mx-auto mb-24">
          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} className="text-center mb-10">
            <h2 className="font-sora font-bold text-gray-800 mb-2" style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)' }}>Explore Our Services</h2>
            <p className="text-gray-400 text-sm">Everything you need, all in one place</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((svc, i) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 52, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                whileHover={{ y: -14, rotateX: 6, rotateY: -3, scale: 1.015 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ type: 'spring', damping: 20, stiffness: 110, delay: i * 0.09 }}
                onClick={() => nav(svc.url, svc.id)}
                className="card3d bg-white"
                style={{ boxShadow: `var(--shadow-md), 0 8px 32px ${svc.glowColor}` }}
              >
                <div className="relative overflow-hidden p-6 pb-10" style={{ background: svc.gradient }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/22 to-transparent" />
                  <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse at 85% 15%, ${svc.accentDot} 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(255,255,255,0.28) 0%, transparent 40%)`, opacity: 0.62 }} />
                  <div className="relative z-10 mb-3" style={{ fontSize: 46, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.28))' }}>{svc.icon}</div>
                  <h3 className="font-sora relative z-10 text-white font-bold leading-tight mb-1" style={{ fontSize: 18, textShadow: '0 1px 6px rgba(0,0,0,0.2)' }}>{svc.name}</h3>
                  <p className="relative z-10 text-white/85 leading-relaxed" style={{ fontSize: 12 }}>{svc.desc}</p>
                  <div className="absolute -bottom-6 inset-x-0 bg-white" style={{ height: 28, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
                </div>
                <div className="p-5 pt-2">
                  <ul className="space-y-2 mb-5">
                    {svc.features.map((feat, fi) => (
                      <motion.li key={fi} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.35 + fi * 0.08 }} className="flex items-start gap-2" style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                        <span className="flex-shrink-0 flex items-center justify-center text-white" style={{ width: 16, height: 16, borderRadius: 999, marginTop: 1, background: svc.gradient, fontSize: 8, fontWeight: 900 }}>✓</span>
                        {feat}
                      </motion.li>
                    ))}
                  </ul>
                  <button className="shimmer-cta w-full text-white font-semibold rounded-xl" style={{ background: svc.gradient, padding: '10px 0', fontSize: 13, boxShadow: `0 4px 18px ${svc.glowColor}, inset 0 1px 0 rgba(255,255,255,0.22)` }}>Get Started →</button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* WHY OKRA */}
        <section className="max-w-5xl mx-auto mb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} className="text-center mb-10">
            <h2 className="font-sora font-bold text-gray-800 mb-2" style={{ fontSize: 'clamp(1.55rem, 3vw, 2.1rem)' }}>Why Choose Okra?</h2>
            <p className="text-gray-400 text-sm">Built for Zambia, trusted by thousands every day</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyItems.map((w, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.04, y: -6 }} viewport={{ once: true, margin: '-30px' }} transition={{ delay: i * 0.09, type: 'spring', stiffness: 140, damping: 20 }} className="glass feat-card rounded-2xl p-5">
                <div className="rounded-2xl flex items-center justify-center mb-4" style={{ width: 48, height: 48, fontSize: 22, background: `${w.color}18`, boxShadow: `0 4px 18px ${w.color}28` }}>{w.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1.5" style={{ fontSize: 13 }}>{w.title}</h3>
                <p className="text-gray-500 leading-relaxed" style={{ fontSize: 12 }}>{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* STATS BANNER */}
        <section className="max-w-5xl mx-auto mb-20">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-60px' }} className="stats-banner rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            <div className="dot-grid absolute inset-0 opacity-100" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%)' }} />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)' }} />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: 'spring', delay: i * 0.09, stiffness: 220, damping: 16 }} className="stat-item">
                  <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                  <div className="font-sora font-black text-white leading-none mb-1.5" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', textShadow: '0 2px 14px rgba(0,0,0,0.18)' }}>{s.num}</div>
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
            <p className="text-gray-400 mb-5" style={{ fontSize: 12 }}>© 2025 Okra Technologies. All rights reserved. Zambia's premier ride &amp; delivery platform.</p>
            <div className="flex gap-6 justify-center flex-wrap">
              {['Terms', 'Privacy', 'Support', 'Careers'].map(l => (
                <a key={l} href="#" style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textDecoration: 'none', transition: 'color 0.18s' }} onMouseEnter={e => e.currentTarget.style.color = '#16a34a'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>{l}</a>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default OkraLandingPage;