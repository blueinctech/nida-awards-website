import { asset, page, site, tel } from '@/lib/data';
import { NAV, SocialLinks } from './Header';
import { Arrow, Star } from './icons';

export default function Footer() {
  const year = new Date().getFullYear(); // year of the build
  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <div className="site-footer__about">
          <a className="brand" href={page('')} aria-label="NIDA home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('img/brand/nida-logo-white.png')} width={726} height={201} alt="NIDA, Nigerians in Diaspora Awards" loading="lazy" />
          </a>
          <p style={{ maxWidth: '34ch' }}>Celebrating the outstanding achievements of Nigerians living abroad. Organised by {site.organizer.name}.</p>
          <div className="social"><SocialLinks /></div>
          <a className="site-footer__std" href={page('', 'save-the-date')}>
            <Star />
            <span><b>Save the date</b>NIDA {site.newsletter.edition} news by email</span>
            <Arrow />
          </a>
        </div>
        <div>
          <h2>Explore</h2>
          <ul>
            {NAV.map((n) => (
              <li key={n.slug}><a href={page(n.slug)}>{n.label === 'About' ? 'About NIDA' : n.label}</a></li>
            ))}
            <li><a href={page('nomination')}>Nomination</a></li>
          </ul>
        </div>
        <div>
          <h2>Editions</h2>
          <ul>
            {site.editions.map((e) => (
              <li key={e.year}><a href={page('editions', 'nida-' + e.year)}>NIDA {e.year}</a></li>
            ))}
          </ul>
        </div>
        <div className="site-footer__contact">
          <h2>Contact</h2>
          <ul>
            <li><a href={`mailto:${site.contact.email}`}>{site.contact.email}</a></li>
            {site.contact.phones.map((p) => (
              <li key={p}><a href={tel(p)}>{p}</a></li>
            ))}
            <li><a href={site.organizer.url} target="_blank" rel="noopener">{site.organizer.urlLabel}</a></li>
          </ul>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <p>© {year} Nigerians in Diaspora Awards (NIDA). All rights reserved.</p>
        <p>Developed and maintained by <a href="https://blueinctech.com" target="_blank" rel="noopener">Blueinc Technologies</a></p>
      </div>
    </footer>
  );
}
