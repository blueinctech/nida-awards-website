import { preload } from 'react-dom';
import { MainScript } from '@/components/ClientScripts';
import '@/styles/main.css';

// The public website: NIDA design system, fonts and the interactive scripts.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  // Start loading the two main fonts straight away
  preload('/assets/fonts/adventor-bold.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' });
  preload('/assets/fonts/montserrat-latin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' });
  return (
    <>
      {children}
      <MainScript />
    </>
  );
}
