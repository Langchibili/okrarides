'use client'

import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import '@/styles/google-maps-fix.css';
import ContextProviders from '@/lib/contexts/ContextProviders';

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



export default function RootLayout({ children }) {
alert('part of me')
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
         <ContextProviders> 
            {children}            {/* ← loads immediately in the background */}
          </ContextProviders> 
      </body>
    </html>
  );
}