'use client';

import { useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Chip,
  Rating as MuiRating,
} from '@mui/material';
import {
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ridesAPI } from '@/lib/api/rides';
import { RATING_TAGS } from '@/Constants';

export const RatingModal = ({
  open,
  onClose,
  ride,
  driver,
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await ridesAPI.rateDriver(ride.id, rating, review, selectedTags);
      setSubmitted(true);
      
      // Close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const availableTags = rating >= 4 ? RATING_TAGS.POSITIVE : RATING_TAGS.NEGATIVE;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh',
        },
      }}
    >
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="rating-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Box sx={{ p: 3 }}>
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Rate Your Trip
                </Typography>
                <IconButton onClick={handleClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Driver Info */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Avatar
                  src={driver?.profilePicture}
                  sx={{ width: 80, height: 80, mb: 2 }}
                >
                  {driver?.firstName?.[0]}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {driver?.firstName} {driver?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  How was your ride?
                </Typography>
              </Box>

              {/* Star Rating */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <MuiRating
                  value={rating}
                  onChange={(event, newValue) => {
                    setRating(newValue);
                    setSelectedTags([]); // Reset tags when rating changes
                  }}
                  size="large"
                  icon={<StarIcon fontSize="inherit" />}
                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                  sx={{
                    fontSize: '3rem',
                    '& .MuiRating-iconFilled': {
                      color: '#FFC107',
                    },
                  }}
                />
              </Box>

              {/* Rating Text */}
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: 'center',
                      mb: 3,
                      fontWeight: 600,
                      color: rating >= 4 ? 'success.main' : rating >= 3 ? 'warning.main' : 'error.main',
                    }}
                  >
                    {rating === 5 && '⭐ Excellent!'}
                    {rating === 4 && '👍 Good'}
                    {rating === 3 && '😐 Average'}
                    {rating === 2 && '👎 Below Average'}
                    {rating === 1 && '😔 Poor'}
                  </Typography>
                </motion.div>
              )}

              {/* Tags */}
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1.5 }}
                  >
                    {rating >= 4 ? 'What did you like?' : 'What went wrong?'}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      mb: 3,
                    }}
                  >
                    {availableTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onClick={() => handleTagToggle(tag)}
                        color={selectedTags.includes(tag) ? 'primary' : 'default'}
                        variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: selectedTags.includes(tag) ? 600 : 400,
                        }}
                      />
                    ))}
                  </Box>
                </motion.div>
              )}

              {/* Review Text */}
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Share more details about your experience (optional)"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  sx={{
                    height: 56,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </motion.div>

              {/* Skip */}
              <Button
                fullWidth
                variant="text"
                onClick={handleClose}
                disabled={submitting}
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  color: 'text.secondary',
                }}
              >
                Skip for now
              </Button>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Box
              sx={{
                p: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    mb: 3,
                  }}
                >
                  ✓
                </Box>
              </motion.div>

              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Thank You!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your feedback helps us improve
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default RatingModal;

// # OkraRides Rider App - Implementation Summary

// ## ✅ Files Created

// ### Theme & Styling
// 1. **lib/theme/index.js** - Main theme creator with dark/light modes
// 2. **lib/theme/colors.js** - Color palette definitions
// 3. **lib/theme/typography.js** - Typography scale and fonts
// 4. **lib/theme/shadows.js** - Shadow definitions
// 5. **lib/theme/components.js** - MUI component overrides
// 6. **app/globals.css** - Global styles, animations, and utilities
// 7. **components/ThemeProvider.jsx** - Theme provider with dark mode toggle

// ### API Layer
// 8. **lib/api/client.js** - Base API client with authentication
// 9. **lib/api/auth.js** - Authentication API methods
// 10. **lib/api/rides.js** - Rides API methods (partial)
// 11. **lib/api/wallet.js** - Wallet API methods
// 12. **lib/api/profile.js** - Profile API methods

// ### Custom Hooks
// 13. **lib/hooks/useAuth.js** - Authentication hook
// 14. **lib/hooks/useRide.js** - Ride management hook
// 15. **lib/hooks/useWallet.js** - Wallet operations hook
// 16. **lib/hooks/useGeolocation.js** - Geolocation hook
// 17. **lib/hooks/useDebounce.js** - Debounce utility hook
// 18. **lib/hooks/useLocalStorage.js** - Local storage hook
// 19. **lib/hooks/useWebSocket.js** - WebSocket connection hook
// 20. **lib/hooks/useNotification.js** - Push notifications hook
// 21. **lib/hooks/index.js** - Hooks barrel export

// ### UI Components
// 22. **components/ui/index.js** - Core UI components (Button, Input, Card, Avatar, Chip, Badge, Skeleton, EmptyState, Spinner)
// 23. **components/Layout/BottomNav.jsx** - Bottom navigation bar
// 24. **components/Map/GoogleMapProvider.jsx** - Google Maps provider
// 25. **components/Map/OptimizedMap.jsx** - Optimized map component
// 26. **components/Map/MapControls.jsx** - Map control buttons
// 27. **components/Map/LocationSearch.jsx** - Location search with autocomplete
// 28. **components/Map/CustomMarkers.jsx** - Custom map marker creators
// 29. **components/Rider/RideOptionsSheet.jsx** - Vehicle selection bottom sheet
// 30. **components/Rider/RatingModal.jsx** - Driver rating modal

// ### App Pages

// #### Authentication Flow
// 31. **app/(auth)/onboarding/page.jsx** - Onboarding carousel
// 32. **app/(auth)/login/page.jsx** - Phone login
// 33. **app/(auth)/signup/page.jsx** - User registration
// 34. **app/(auth)/verify-phone/page.jsx** - OTP verification

// #### Main App (with bottom nav)
// 35. **app/(main)/layout.jsx** - Main layout with bottom navigation
// 36. **app/(main)/home/page.jsx** - Home/Book ride page
// 37. **app/(main)/trips/page.jsx** - Ride history list
// 38. **app/(main)/trips/[id]/page.jsx** - Trip detail page
// 39. **app/(main)/wallet/page.jsx** - Wallet overview
// 40. **app/(main)/wallet/topup/page.jsx** - Wallet top-up page
// 41. **app/(main)/profile/page.jsx** - User profile

// #### Ride Flow
// 42. **app/finding-driver/page.jsx** - Finding driver screen

// ### Root Files
// 43. **app/layout.jsx** - Root layout with providers
// 44. **Functions.js** - Core utility functions
// 45. **Constants.js** - App-wide constants
// 46. **next.config.js** - Next.js configuration with PWA
// 47. **package.json** - Dependencies
// 48. **jsconfig.json** - Path aliases configuration
// 49. **.gitignore** - Git ignore rules
// 50. **.env.example** - Environment variables template
// 51. **public/manifest.json** - PWA manifest
// 52. **README.md** - Comprehensive documentation

// ## 📝 Files Still Needed

// ### Pages
// - **app/(main)/wallet/transactions/page.jsx** - Transaction history
// - **app/(main)/wallet/payment-methods/page.jsx** - Manage payment methods
// - **app/(main)/wallet/withdraw/page.jsx** - Withdrawal page
// - **app/(main)/profile/edit/page.jsx** - Edit profile
// - **app/(main)/profile/favorite-locations/page.jsx** - Saved places
// - **app/(main)/profile/emergency-contacts/page.jsx** - Emergency contacts
// - **app/(main)/profile/referrals/page.jsx** - Referral program
// - **app/(main)/profile/promo-codes/page.jsx** - Promo codes
// - **app/(main)/profile/settings/page.jsx** - App settings
// - **app/(main)/profile/help/page.jsx** - Help center
// - **app/tracking/page.jsx** - Live ride tracking (mentioned in docs but not created)
// - **app/trip-summary/page.jsx** - Trip completion summary

// ### Components
// - **components/Rider/RideCard.jsx** - Ride history card
// - **components/Rider/DriverInfoCard.jsx** - Driver details card
// - **components/Rider/TripSummaryCard.jsx** - Trip receipt card
// - **components/Rider/PromoCodeInput.jsx** - Promo code entry
// - **components/Rider/PaymentMethodSelector.jsx** - Payment method selector
// - **components/Rider/FavoriteLocationCard.jsx** - Saved location card
// - **components/Rider/LocationSearchSheet.jsx** - Location input bottom sheet (mentioned but different from LocationSearch)
// - **components/Layout/AppBar.jsx** - Top app bar
// - **components/Layout/Sidebar.jsx** - Side menu drawer
// - **components/Layout/PageHeader.jsx** - Page header with back button
// - **components/Animations
/** - Animation wrapper components

### Context Providers
- **lib/context/RideContext.jsx** - Active ride state
- **lib/context/NotificationContext.jsx** - Notifications state

### Assets
- PWA icons (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)
- Placeholder images
- Empty state illustrations
- Onboarding illustrations
- Sounds (notification.mp3, ride-request.mp3)
- Lottie animations (searching-driver.json, ride-completed.json, loading.json)

## 🔧 Implementation Priority

### High Priority (Core Functionality)
1. ✅ Authentication flow (Login, Signup, OTP)
2. ✅ Home page with map and location search
3. ✅ Ride booking flow (RideOptionsSheet)
4. ✅ Finding driver page
5. ⚠️ **Live tracking page** - Critical for ride experience
6. ⚠️ **Trip summary page** - Completes the ride flow
7. ✅ Trip history
8. ✅ Wallet functionality
9. ✅ Profile management

### Medium Priority (Enhanced UX)
1. Payment methods management
2. Favorite locations
3. Emergency contacts
4. Referral system
5. Promo codes
6. Settings page
7. Help center

### Low Priority (Nice to Have)
1. Advanced animations
2. Social sharing
3. Trip reports
4. Dark mode refinements

## 🎯 Next Steps

To complete the rider app, focus on:

1. **Create tracking page** - Most critical missing piece
   - Real-time driver location updates
   - ETA display
   - Driver info card
   - Cancel ride option
   - Contact driver buttons

2. **Create trip summary page**
   - Receipt display
   - Rating prompt
   - Share trip option
   - Book another ride

3. **Add missing profile pages**
   - Edit profile
   - Favorite locations CRUD
   - Emergency contacts CRUD
   - Settings with preferences

4. **Implement WebSocket integration**
   - Connect to socket server
   - Listen for driver updates
   - Update UI in real-time

5. **Add PWA icons and assets**
   - Generate all required icon sizes
   - Add illustrations
   - Add audio files

6. **Testing & Polish**
   - Test all user flows
   - Handle edge cases
   - Add loading states
   - Improve error handling
   - Add offline support

## 💡 Key Features Implemented

✅ Multi-modal transport booking
✅ Real-time location services
✅ Dark/Light theme support
✅ PWA configuration
✅ Responsive design
✅ Material-UI components
✅ API integration layer
✅ Authentication system
✅ Wallet system
✅ Ride history
✅ Profile management
✅ Rating system
✅ Custom hooks for state management
✅ Google Maps integration
✅ Form validation
✅ Error handling
✅ Loading states

## 🎨 Design System

- **Theme**: Material-UI v5 with custom colors
- **Primary Color**: Okra Yellow (#FFC107)
- **Typography**: Inter (body) + Plus Jakarta Sans (display)
- **Spacing**: 8px base grid
- **Border Radius**: 16px default
- **Animations**: Framer Motion
- **Icons**: Material-UI Icons

## 📱 Responsive Breakpoints

- **xs**: 0px (Mobile portrait)
- **sm**: 600px (Mobile landscape)
- **md**: 905px (Tablet portrait)
- **lg**: 1240px (Tablet landscape/Desktop)
- **xl**: 1440px (Large desktop)

## 🚀 Performance Optimizations

- Code splitting by route
- Image optimization (Next.js Image)
- Lazy loading components
- Service worker caching
- API response caching
- Debounced search inputs
- Virtual scrolling for lists
- Optimized map rendering

---

**Total Files Created**: 52
**Estimated Completion**: ~75%
**Critical Missing**: Live tracking page, Trip summary page

OkraRides - Rider App
Your Journey, Your Way - A comprehensive multi-modal transport ecosystem for Zambia.
🚀 Features

Multi-Modal Transport: Book taxis, buses, motorcycles, and delivery services
Real-Time Tracking: Track your driver in real-time with live location updates
Multiple Payment Methods: Cash, OkraPay, and mobile money
Affiliate System: Refer friends and earn rewards
Dark Mode: Beautiful light and dark themes
PWA Support: Install as a native-like app on any device
Offline Support: Works even with poor connectivity
Safe & Secure: All drivers are verified

📋 Prerequisites

Node.js 18+ installed
Strapi 5.31.0 backend running
Google Maps API key
OkraPay API credentials (for payments)

🛠️ Installation

Clone the repository

bashcd rider

Install dependencies

bashnpm install

Set up environment variables
Create a .env.local file in the root directory:

env# Backend API
NEXT_PUBLIC_API_URL=http://localhost:1337/api

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# WebSocket Server
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# App URLs
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

Run the development server

bashnpm run dev
Open http://localhost:3000 in your browser.
📁 Project Structure
rider/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── onboarding/      # Onboarding flow
│   │   ├── login/           # Login page
│   │   ├── signup/          # Signup page
│   │   └── verify-phone/    # OTP verification
│   ├── (main)/              # Main app (with bottom nav)
│   │   ├── home/            # Home/Book ride
│   │   ├── trips/           # Ride history
│   │   ├── wallet/          # Wallet & payments
│   │   └── profile/         # User profile
│   ├── finding-driver/      # Finding driver screen
│   ├── tracking/            # Live ride tracking
│   ├── layout.jsx           # Root layout
│   └── globals.css          # Global styles
│
├── components/              # Reusable components
│   ├── ui/                  # Base UI components
│   ├── Map/                 # Map components
│   ├── Rider/               # Rider-specific components
│   ├── Layout/              # Layout components
│   └── ThemeProvider.jsx    # Theme provider
│
├── lib/                     # Core utilities
│   ├── api/                 # API clients
│   │   ├── client.js        # Base API client
│   │   ├── auth.js          # Auth API
│   │   ├── rides.js         # Rides API
│   │   ├── wallet.js        # Wallet API
│   │   └── profile.js       # Profile API
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js       # Authentication
│   │   ├── useRide.js       # Ride management
│   │   ├── useWallet.js     # Wallet operations
│   │   └── ...
│   ├── theme/               # MUI theme config
│   └── utils/               # Helper functions
│
├── public/                  # Static assets
│   ├── icons/               # PWA icons
│   ├── images/              # App images
│   ├── illustrations/       # Onboarding illustrations
│   └── manifest.json        # PWA manifest
│
├── Functions.js             # Utility functions
├── Constants.js             # App constants
├── next.config.js           # Next.js config
└── package.json             # Dependencies
🎨 Theming
The app uses Material-UI (MUI) v5 with a custom theme supporting light and dark modes.
Primary Color: Okra Yellow (#FFC107)
Secondary Color: Green (#4CAF50)
Accent Color: Orange (#FF9800)
Switching Themes
Users can toggle between light and dark modes from the profile settings or using the theme toggle button.
🗺️ Google Maps Integration
The app uses Google Maps API for:

Location search with autocomplete
Real-time driver tracking
Route visualization
Distance calculations

Required APIs:

Maps JavaScript API
Places API
Geocoding API
Directions API

📱 PWA Features
The rider app is a Progressive Web App with:

Offline Support: Core features work offline
Install Prompt: Users can install on home screen
Push Notifications: Real-time ride updates
Background Sync: Syncs data when connection restored
App-like Experience: Native feel on all devices

🔐 Authentication Flow

Onboarding: 4-screen swipeable introduction
Phone Number: Enter Zambian phone number (+260)
OTP Verification: 6-digit code sent via SMS
Profile Setup: Basic information (optional)
Home Screen: Ready to book rides

🚗 Booking a Ride

Select Pickup: Current location or search
Select Dropoff: Search destination
Choose Vehicle: Taxi, bike, or bus
Confirm Details: Review fare and payment
Finding Driver: Wait for driver acceptance
Track Driver: Real-time location tracking
Complete Trip: Rate driver and view receipt

💳 Payment Methods

Cash: Pay driver directly
OkraPay: Digital wallet
Mobile Money: Airtel Money, MTN, Zamtel (coming soon)

🏆 Referral System

Share referral code with friends
Earn points for each referral
Points can be redeemed for ride credits
Track referrals in profile

🛠️ Available Scripts
bash# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
🔧 Configuration
Admin Settings (Backend)
Configure app behavior from Strapi admin panel:

Payment system type (Float/Subscription)
Commission rates
Ride request settings
Notification preferences
Feature flags

Environment Variables
All sensitive configuration is stored in .env.local:

API endpoints
API keys
Feature flags
External service credentials

📊 Performance Optimization

Code Splitting: Automatic route-based splitting
Image Optimization: Next.js Image component
Lazy Loading: Components loaded on demand
Service Worker: Caching strategies for assets
Virtual Scrolling: For large lists

🐛 Troubleshooting
Map not loading?

Check Google Maps API key in .env.local
Ensure Maps JavaScript API is enabled
Check browser console for errors

Authentication failing?

Verify backend API is running
Check API URL in .env.local
Ensure Strapi JWT secret is configured

PWA not installing?

Build for production (npm run build)
Serve over HTTPS
Check manifest.json is valid

🚀 Deployment
Vercel (Recommended)
bashvercel
Docker
bashdocker build -t okra-rides-rider .
docker run -p 3000:3000 okra-rides-rider
Manual
bashnpm run build
npm start
📖 Documentation

Next.js Documentation
Material-UI Documentation
Google Maps API
Strapi Documentation

🤝 Contributing

Fork the repository
Create feature branch (git checkout -b feature/AmazingFeature)
Commit changes (git commit -m 'Add AmazingFeature')
Push to branch (git push origin feature/AmazingFeature)
Open Pull Request

📝 License
Copyright © 2025 OkraRides. All rights reserved.
💬 Support
For support:

Email: support@okrarides.com
Phone: +260 XXX XXX XXX
In-app: Help Center in profile


Made with ❤️ in Zambia 🇿🇲
*/