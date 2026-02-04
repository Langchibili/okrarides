import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import '@/styles/google-maps-fix.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { SocketProvider } from '@/lib/socket/SocketProvider';
import { ReactNativeWrapper } from '@/lib/contexts/ReactNativeWrapper';
// we are getting the native code wrapper here because we are using it as a hook inside the layout file for main pages or authenticated pages
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
  adjustFontFallback: true,
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['600', '700', '800'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
  adjustFontFallback: true,
})

export const metadata = {
  title: 'OkraRides - Your Journey, Your Way',
  description: 'Multi-modal transport ecosystem for Zambia',
  manifest: '/manifest.json',
  themeColor: '#FFC107',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OkraRides',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ThemeProvider>
          <ReactNativeWrapper>
            <AuthProvider>
              <SocketProvider>
                {children}
              </SocketProvider>
            </AuthProvider>
          </ReactNativeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}