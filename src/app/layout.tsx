import type { Metadata, Viewport } from 'next';
import { preload } from 'react-dom';
import { site } from '@/lib/data';
import { MainScript } from '@/components/ClientScripts';
import '@/styles/main.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  icons: {
    icon: [
      { url: '/assets/img/brand/favicon-32.png', sizes: '32x32' },
      { url: '/assets/img/brand/favicon-192.png', sizes: '192x192' },
    ],
    apple: '/assets/img/brand/favicon-180.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#083B1E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Start loading the two main fonts straight away
  preload('/assets/fonts/adventor-bold.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' });
  preload('/assets/fonts/montserrat-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' });
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Lets the CSS hide scroll-reveal content only when JavaScript is running */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        {children}
        <MainScript />
      </body>
    </html>
  );
}
