import { asset, fill, page, tel } from '@/lib/data';
import { getSite } from '@/lib/server/content';
import { SocialLinks, navItems } from './Header';
import { Arrow, Star } from './icons';

export default async function Footer() {
  const { site, editions } = await getSite();
  const nav = await navItems();
  const f = site.footer;
  const vars = { year: new Date().getFullYear(), organiser: site.organizer.name, edition: site.newsletter.edition };
  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <div className="site-footer__about">
          <a className="brand" href={page('')} aria-label="NIDA home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('img/brand/nida-logo-white-340.png')} width={340} height={94} alt="NIDA, Nigerians in Diaspora Awards" loading="lazy" />
          </a>
          <p style={{ maxWidth: '34ch' }}>{fill(f.tagline, vars)}</p>
          <div className="social"><SocialLinks /></div>
          <a className="site-footer__std" href={page('', 'save-the-date')}>
            <Star />
            <span><b>Save the date</b>{fill(f.saveDateLabel, vars)}</span>
            <Arrow />
          </a>
        </div>
        <div>
          <h2>Explore</h2>
          <ul>
            {nav.map((n) => (
              <li key={n.slug}><a href={page(n.slug)}>{n.label === 'About' ? 'About NIDA' : n.label}</a></li>
            ))}
            <li><a href={page('nomination')}>Nomination</a></li>
          </ul>
        </div>
        <div>
          <h2>Editions</h2>
          <ul>
            {editions.map((e) => (
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
        <p>{fill(f.copyright, vars)}</p>
        {f.creditLabel ? <p>Developed and maintained by <a href={f.creditUrl} target="_blank" rel="noopener">{f.creditLabel}</a></p> : null}
      </div>
    </footer>
  );
}
