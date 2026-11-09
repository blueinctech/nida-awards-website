import type { NextConfig } from 'next';

// The site runs as a Next.js server (on Vercel), because the admin CMS needs sign-in, a database
// and file uploads. Public pages are still pre-rendered and cached; publishing in /admin refreshes them.
const security = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  trailingSlash: true, // /about-nida/ as before
  images: { unoptimized: true },
  poweredByHeader: false,
  serverExternalPackages: ['sharp'],
  async headers() {
    return [
      { source: '/:path*', headers: [...security, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
      // Keep the *.vercel.app copy of the site out of search results; only the real domain is indexed
      { source: '/:path*', has: [{ type: 'host', value: '.*\\.vercel\\.app' }], headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
      // Let browsers reuse static files between visits. Fonts never change; photos rarely do,
      // and stale-while-revalidate picks up a replaced file on the next visit.
      { source: '/assets/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/assets/img/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' }] },
      { source: '/assets/js/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }, { key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
  async redirects() {
    // Old WordPress addresses (previously handled by .htaccess)
    return [
      { source: '/service/mission/', destination: '/about-nida/', permanent: true },
      { source: '/service/vision/', destination: '/about-nida/', permanent: true },
    ];
  },
};

export default nextConfig;
