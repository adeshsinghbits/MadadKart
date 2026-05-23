import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Navigation } from '@/components/Navigation';
import { Providers } from '@/context/Providers';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata: Metadata = {
  title: { default: 'MadadKart', template: '%s | MadadKart' },
  description: 'A social impact ecosystem connecting NGOs, donors, and volunteers.',
  keywords: ['NGO', 'donation', 'volunteer', 'social impact', 'India', 'MadadKart'],
  metadataBase: new URL('https://madadkart.vercel.app'),
  openGraph: {
    title: 'MadadKart',
    description: 'Create and support social impact projects helping communities in need.',
    url: 'https://madad-kart.vercel.app',
    siteName: 'MadadKart',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="bg-background min-h-screen">
        <Providers>
          <Navigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}