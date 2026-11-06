import { asset } from '@/lib/data';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__card">
        <a href="/" className="auth__logo" aria-label="NIDA website">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('img/brand/nida-logo-green.png')} width={726} height={201} alt="NIDA, Nigerians in Diaspora Awards" />
        </a>
        {children}
      </div>
      <p className="auth__foot">NIDA administration · Authorised administrators only</p>
    </div>
  );
}
