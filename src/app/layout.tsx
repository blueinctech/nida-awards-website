import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/data';

// The <html> shell shared by the public site and the admin dashboard. The public design
// (styles, fonts and scripts) is loaded by app/(site)/layout.tsx; the admin has its own.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Lets the CSS hide scroll-reveal content only when JavaScript is running */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
