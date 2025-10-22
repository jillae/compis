
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1',
}

export const metadata: Metadata = {
  title: "Klinik Flow Control - AI Revenue Intelligence",
  description: "AI-driven revenue intelligence and resource optimization for beauty & health clinics. Maximize bookings, reduce no-shows, optimize pricing.",
  keywords: "clinic management, revenue optimization, booking system, AI analytics, healthcare software, beauty clinic software",
  authors: [{ name: "Klinik Flow" }],
  creator: "Klinik Flow",
  publisher: "Klinik Flow",
  applicationName: "Klinik Flow Control",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Flow',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'sv_SE',
    url: 'https://goto.klinikflow.app',
    siteName: 'Klinik Flow Control',
    title: 'Klinik Flow Control - AI Revenue Intelligence',
    description: 'AI-driven revenue intelligence and resource optimization for beauty & health clinics.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Klinik Flow Control',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Klinik Flow Control - AI Revenue Intelligence',
    description: 'AI-driven revenue intelligence and resource optimization for clinics.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Flow" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Register Service Worker for PWA
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('[PWA] Service Worker registered:', registration.scope);
                  },
                  function(err) {
                    console.log('[PWA] Service Worker registration failed:', err);
                  }
                );
              });
            }
          `
        }} />
      </body>
    </html>
  )
}
