'use client'
// PATH: app/layout.js
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { partnerTheme } from '@/lib/theme';

// export const metadata = {
//   title: 'Okra — Fleet Partner',
//   description: 'Fleet partner management dashboard for Okra',
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <title>Okra — Fleet Partner</title>
        <meta name="description" content="Fleet partner management dashboard for Okra" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={partnerTheme}>
            <CssBaseline />
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
