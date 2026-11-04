import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: { template: '%s · NIDA Admin', default: 'NIDA Admin' },
  robots: { index: false, follow: false },
};

// The admin dashboard has its own interface (admin.css), built on the official NIDA colours,
// logo and fonts. It never loads the public site's styles or scripts.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="adm-root">{children}</div>;
}
