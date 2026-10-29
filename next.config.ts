import type { NextConfig } from 'next';

// Static export: `npm run build` writes a plain HTML/CSS/JS site to out/,
// which can be uploaded to any web host (Apache, Netlify, Vercel, GitHub Pages…).
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true, // /about-nida/ -> out/about-nida/index.html, same URLs as before
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
