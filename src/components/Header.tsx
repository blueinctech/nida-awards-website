import { asset, page, site } from '@/lib/data';
import { SocialIcon } from './icons';

export const NAV = [
  { slug: 'about-nida', label: 'About' },
  { slug: 'awards', label: 'Awards' },
  { slug: 'awardees', label: 'Awardees' },
  { slug: 'editions', label: 'Editions' },
  { slug: 'gallery', label: 'Gallery' },
  { slug: 'contact', label: 'Contact' },
];

export function SocialLinks({ style }: { style?: React.CSSProperties }) {
  return (
    <>
      {site.social.map((s) => (
        <a key={s.name} href={s.url} target="_blank" rel="noopener" aria-label={`NIDA on ${s.name} (opens in a new tab)`} style={style}>
          <SocialIcon name={s.name} />
        </a>
      ))}
    </>
  );
}

// The menu, its toggle and focus handling are driven by public/assets/js/main.js.
export default function Header({ current }: { current?: string }) {
  const cur = (slug: string) => (current === slug ? ('page' as const) : undefined);
  const mobile = [{ slug: '', label: 'Home' }, ...NAV, { slug: 'nomination', label: 'Nominate' }];
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header" data-header="">
        <div className="container site-header__inner">
          <a className="brand" href={page('')} aria-label="NIDA, Nigerians in Diaspora Awards, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('img/brand/nida-logo-white.png')} width={726} height={201} alt="NIDA, Nigerians in Diaspora Awards" />
          </a>
          <nav className="nav" aria-label="Main">
            <ul className="nav__list">
              {NAV.map((n) => (
                <li key={n.slug}><a className="nav__link" href={page(n.slug)} aria-current={cur(n.slug)}>{n.label}</a></li>
              ))}
            </ul>
            <a className="btn" href={page('nomination')} aria-current={cur('nomination')}>Nominate</a>
          </nav>
          <button className="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-toggle="">
            <span className="visually-hidden" data-menu-label="">Open menu</span><span className="menu-toggle__bars" aria-hidden="true"></span>
          </button>
        </div>
      </header>
      <div className="mobile-menu" id="mobile-menu" data-mobile-menu="" aria-label="Menu" role="dialog" aria-modal="true" inert>
        <nav aria-label="Mobile">
          <ul className="mobile-menu__list">
            {mobile.map((n) => (
              <li key={n.slug}><a href={page(n.slug)} aria-current={cur(n.slug)}>{n.label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu__foot">
          <p>Celebrating the outstanding achievements of Nigerians living abroad.</p>
          <div className="social"><SocialLinks /></div>
        </div>
      </div>
    </>
  );
}
