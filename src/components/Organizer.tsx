import { Fragment } from 'react';
import { asset, tel } from '@/lib/data';
import { getSite } from '@/lib/server/content';

// "The organiser" block. The home page shows it with sponsors and without telephone numbers.
export default async function Organizer({ variant }: { variant: 'home' | 'about' }) {
  const s = await getSite();
  const site = s.site;
  const o = site.organizer;
  const home = variant === 'home';
  return (
    <section className="section section--light on-light" aria-labelledby="org-title" id={home ? undefined : 'organiser'}>
      <div className="container organizer">
        <div className="organizer__mark" data-reveal="">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('img/brand/fon-logo.png')} width={301} height={304} alt="Friends of Nigeria (FON) Europe logo" loading="lazy" />
        </div>
        <div>
          <h2 className="h2" id="org-title" data-reveal="">Organised by {o.name}</h2>
          <div className="prose" style={{ marginTop: '1.5rem' }} data-reveal="">
            <p>{o.summary}</p>
            <p>{o.network}</p>
          </div>
          <dl className="contact-list" data-reveal="">
            <div><dt>Website</dt><dd><a className="text-link" href={o.url} target="_blank" rel="noopener">{o.urlLabel}</a></dd></div>
            <div><dt>Email</dt><dd><a className="text-link" href={`mailto:${o.email}`}>{o.email}</a></dd></div>
            {home ? null : <div><dt>Telephone</dt><dd><Phones list={o.phones} /></dd></div>}
            <div><dt>Head office</dt><dd>{o.address}</dd></div>
          </dl>
          {home && site.sponsors.length ? (
            <div className="sponsors" data-reveal="">
              <h3 className="sponsors__title">Our sponsors</h3>
              {site.sponsors.map((sp) => {
                const logo = s.photo(sp.logo)?.variants.slice(-1)[0];
                return logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <span className="sponsors__logo" key={sp.name}><img src={logo.url} alt={sp.name} loading="lazy" width={logo.w} height={logo.h} /></span>
                ) : null;
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// Phone numbers as links, one per line
export function Phones({ list }: { list: string[] }) {
  return (
    <>
      {list.map((p, i) => (
        <Fragment key={p}>{i ? <br /> : null}<a href={tel(p)}>{p}</a></Fragment>
      ))}
    </>
  );
}
