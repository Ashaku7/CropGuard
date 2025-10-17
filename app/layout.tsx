import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CropGuard - AI-Powered Crop Disease Detection',
  description:
    'Detect crop diseases early using AI, get localized treatment recommendations, and receive weather-based pest alerts.',
  keywords: 'crop disease, agriculture, AI, farming, pest control, disease detection',
  authors: [{ name: 'CropGuard Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌾</text></svg>" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}