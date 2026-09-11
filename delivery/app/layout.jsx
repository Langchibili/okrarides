'use client'
// PATH: delivery/app/layout.jsx
// Server Component — no 'use client'.
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import '@/styles/google-maps-fix.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
  adjustFontFallback: true,
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['600', '700', '800'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
  adjustFontFallback: true,
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        {/* <ContextProviders>
          {children}
        </ContextProviders> */}
      </body>
    </html>
  );
}