// app/layout.js
import './globals.css';

export const metadata = {
  title: 'OkraRides Admin',
  description: 'OkraRides administration panel',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}