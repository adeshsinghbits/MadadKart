import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: 'MadadKart',
    template: '%s | MadadKart',
  },

  description:
    'MadadKart is a social impact platform connecting people, NGOs, and communities to create and support meaningful projects.',

  keywords: [
    'MadadKart',
    'donation platform',
    'NGO',
    'social impact',
    'community help',
    'charity',
    'crowdfunding',
    'volunteer',
    'support projects',
    'India NGO platform',
  ],

  authors: [
    {
      name: 'Adesh Singh',
    },
  ],

  creator: 'Adesh Singh',

  metadataBase: new URL('https://madadkart.vercel.app'),

  openGraph: {
    title: 'MadadKart',
    description:
      'Create and support social impact projects helping communities in need.',
    url: 'https://madadkart.vercel.app',
    siteName: 'MadadKart',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MadadKart Social Platform',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'MadadKart',
    description:
      'Helping communities through collaborative social impact projects.',
    images: ['/og-image.png'],
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  manifest: '/site.webmanifest',

  category: 'social impact',

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: 'https://madadkart.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="bg-gray-50">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
