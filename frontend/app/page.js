'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OkraLandingPage = () => {
  const [frontendUrls, setFrontendUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeService, setActiveService] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1343';

  useEffect(() => {
    fetchFrontendUrls();
  }, []);

  const fetchFrontendUrls = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/frontend-url`);
      if (!response.ok) throw new Error('Failed to fetch URLs');
      const res = await response.json();
      const urls = res?.data?.paths;
      setFrontendUrls({
        riderApp: urls['okra-rider-app'] || 'http://10.87.67.23:3001/home',
        driverApp: urls['okra-driver-app'] || 'http://10.87.67.23:3002/home',
        deliveryApp: urls['okra-delivery-app'] || 'https://delivery.okra.tech',
        conductorApp: urls['okra-conductor-app'] || 'https://conductor.okra.tech'
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching frontend URLs:', err);
      setFrontendUrls({
        riderApp: 'http://10.87.67.23:3001/home',
        driverApp: 'http://10.87.67.23:3002/home',
        deliveryApp: 'https://delivery.okra.tech',
        conductorApp: 'https://conductor.okra.tech'
      });
      setError(err.message);
      setLoading(false);
    }
  };

  const handleNavigation = (url, serviceName) => {
    setActiveService(serviceName);
    setTimeout(() => {
      window.location.href = url;
    }, 200);
  };

  const quickActions = [
    { id: 'book-ride', label: 'Book A Ride', icon: '🚗', color: '#4A7C4E', url: frontendUrls.riderApp, animation: 'bounce-horizontal' },
    { id: 'drive', label: 'Earn Money Driving', icon: '🚕', color: '#D4AF37', url: frontendUrls.driverApp, animation: 'pulse-grow' },
    { id: 'deliver', label: 'Deliver A Package', icon: '📦', color: '#4A7C4E', url: frontendUrls.deliveryApp, animation: 'shake' },
    { id: 'bus', label: 'Book A Bus', icon: '🚌', color: '#4A7C4E', url: frontendUrls.conductorApp, animation: 'bounce-vertical' },
    { id: 'okrapay', label: 'Earn With OkraPay', icon: '💰', color: '#4A7C4E', url: frontendUrls.driverApp, animation: 'rotate-shake' },
    { id: 'track', label: 'Track Order', icon: '📍', color: '#4A7C4E', url: frontendUrls.riderApp, animation: 'ping' }
  ];

  const services = [
    {
      id: 'rider',
      name: 'Book a Ride',
      description: 'Quick, reliable rides at your fingertips',
      icon: '🚗',
      color: '#4A7C4E',
      gradient: 'linear-gradient(135deg, #4A7C4E 0%, #5C9860 100%)',
      url: frontendUrls.riderApp,
      features: ['Instant Booking', 'Real-time Tracking', 'Multiple Payment Options']
    },
    {
      id: 'driver',
      name: 'Drive with Us',
      description: 'Earn money on your schedule',
      icon: '👨‍✈️',
      color: '#D4AF37',
      gradient: 'linear-gradient(135deg, #D4AF37 0%, #E6C45C 100%)',
      url: frontendUrls.driverApp,
      features: ['Flexible Hours', 'Good Earnings', 'Weekly Payouts']
    },
    {
      id: 'delivery',
      name: 'Delivery',
      description: 'Fast and secure package delivery',
      icon: '📦',
      color: '#4A7C4E',
      gradient: 'linear-gradient(135deg, #4A7C4E 0%, #5C9860 100%)',
      url: frontendUrls.deliveryApp,
      features: ['Same Day Delivery', 'Package Tracking', 'Safe Handling']
    },
    {
      id: 'conductor',
      name: 'Conductor',
      description: 'Manage bus routes efficiently',
      icon: '🎫',
      color: '#4A7C4E',
      gradient: 'linear-gradient(135deg, #4A7C4E 0%, #5C9860 100%)',
      url: frontendUrls.conductorApp,
      features: ['Route Management', 'Passenger Tracking', 'Digital Ticketing']
    }
  ];

  // Floating particles in background
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 20
  }));

  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 }
    }
  };

  const headerVariants = {
    initial: { y: -30, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 120,
        duration: 0.4
      }
    }
  };

  const quickActionVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 8,
        stiffness: 400,
        delay: i * 0.02
      }
    }),
    hover: { scale: 1.08, y: -4, transition: { duration: 0.15 } },
    tap: { scale: 0.96 }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, rotateX: -10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 120,
        delay: i * 0.08
      }
    }),
    hover: {
      y: -10,
      rotateX: 3,
      scale: 1.02,
      transition: { duration: 0.25 }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.5 + i * 0.06,
        duration: 0.4,
        type: "spring",
        stiffness: 120
      }
    })
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(74,124,78,0.05),transparent_50%)]" />
        
        {/* Header Skeleton */}
        <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-emerald-100 z-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full animate-pulse" />
            <div className="w-32 h-6 bg-emerald-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Hero Skeleton */}
        <div className="text-center space-y-4 mt-20">
          <div className="w-64 h-8 bg-emerald-100 rounded mx-auto animate-pulse" />
          <div className="w-96 h-4 bg-emerald-100 rounded mx-auto animate-pulse" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 px-6 max-w-5xl mx-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Service Cards Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 max-w-7xl mx-auto mt-16">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full animate-pulse" />
              <div className="w-32 h-6 bg-emerald-100 rounded animate-pulse" />
              <div className="w-full h-4 bg-emerald-100 rounded animate-pulse" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-full h-3 bg-emerald-100 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(74,124,78,0.05),transparent_50%)]" />
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-emerald-200/30 rounded-full"
            style={{ left: `${particle.left}%`, top: '-10px' }}
            animate={{
              y: ['0vh', '110vh'],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header
        variants={headerVariants}
        className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-emerald-100 z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🥬</div>
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Okra
              </div>
              <div className="text-xs text-gray-600">Technologies</div>
            </div>
          </div>
          <div className="text-sm text-gray-600 hidden md:block">
            Your Journey, Your Way
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 bg-clip-text text-transparent">
            Choose Your Service
          </h1>
          <p className="text-lg text-gray-600">
            Reliable transport and delivery solutions across Zambia
          </p>
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-16">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              custom={index}
              variants={quickActionVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleNavigation(action.url, action.id)}
              className="relative group"
            >
              <div
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-emerald-200"
                style={{ borderColor: activeService === action.id ? action.color : 'transparent' }}
              >
                <div className="text-5xl mb-3" style={{ filter: `drop-shadow(0 0 8px ${action.color}40)` }}>
                  {action.icon}
                </div>
                <div className="font-semibold text-gray-800 text-sm">
                  {action.label}
                </div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at center, ${action.color}15, transparent 70%)`
                }}
              />
            </motion.button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="group cursor-pointer"
              onClick={() => handleNavigation(service.url, service.id)}
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-full">
                <div
                  className="p-6 text-white relative overflow-hidden"
                  style={{ background: service.gradient }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="text-5xl mb-3 relative z-10">{service.icon}</div>
                  <h3 className="text-2xl font-bold mb-2 relative z-10">{service.name}</h3>
                  <p className="text-white/90 text-sm relative z-10">{service.description}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, idx) => (
                      <motion.li
                        key={idx}
                        custom={idx}
                        variants={featureVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <span className="text-emerald-500">✓</span>
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-3 rounded-lg font-semibold text-white transition-all"
                    style={{ background: service.gradient }}
                  >
                    Get Started →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto mb-16"
        >
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Why Choose Okra?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Fast & Reliable', desc: 'Quick response times and dependable service' },
              { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden fees, see costs upfront' },
              { icon: '🛡️', title: 'Safe & Secure', desc: 'Verified drivers and secure payments' },
              { icon: '📱', title: 'Easy to Use', desc: 'Simple, intuitive interface' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-12 text-white"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '10K+', label: 'Active Drivers' },
              { number: '50K+', label: 'Happy Riders' },
              { number: '24/7', label: 'Support' },
              { number: '100%', label: 'Reliable' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring" }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-emerald-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="text-center text-gray-600 text-sm border-t border-emerald-100 pt-8">
          <p className="mb-2">© 2025 Okra Technologies. All rights reserved.</p>
          <div className="flex gap-6 justify-center">
            <a href="#" className="hover:text-emerald-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Support</a>
          </div>
        </footer>
      </main>
    </motion.div>
  );
};

export default OkraLandingPage;