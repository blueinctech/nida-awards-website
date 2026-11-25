// The site runs as a Next.js server (Hostinger Node.js hosting, or any Node 20+ server), because the admin CMS needs sign-in, a database
// and file uploads. Public pages are still pre-rendered and cached; publishing in /admin refreshes them.
const security = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// Plain .mjs (not .ts): Hostinger's Cloud servers have an old glibc, so Next falls back to its
// WASM compiler, which cannot load a TypeScript config file.
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true, // /about-nida/ as before
  images: { unoptimized: true },
  poweredByHeader: false,
  serverExternalPackages: ['sharp'],
  // One build worker: Hostinger's build containers kill parallel workers
  experimental: { cpus: 1 },
  async headers() {
    return [
      { source: '/:path*', headers: [...security, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
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
      // www.nida-awards.org -> nida-awards.org
      { source: '/:path*', has: [{ type: 'host', value: 'www.nida-awards.org' }], destination: 'https://nida-awards.org/:path*', permanent: true },
      { source: '/service/mission/', destination: '/about-nida/', permanent: true },
      { source: '/service/vision/', destination: '/about-nida/', permanent: true },
    ];
  },
};

export default nextConfig;
