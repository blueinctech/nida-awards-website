import SiteShell from '@/components/SiteShell';
import NewsletterForm from '@/components/NewsletterForm';
import Organizer from '@/components/Organizer';
import { GlobeScript } from '@/components/ClientScripts';
import { PhotoImg, PortraitImg, WallImg, largest } from '@/components/images';
import heroWall from '@/data/hero-wall.json';
import { Arrow, Info, Pause } from '@/components/icons';
import { asset, awardeeUrl, d, fill, page, rich, shortAward, SITE_URL } from '@/lib/data';
import { getSite, type Site } from '@/lib/server/content';
import { pageMetadata } from '@/lib/meta';
import type { Awardee } from '@/lib/types';

export const metadata = pageMetadata({
  slug: '',
  title: 'NIDA, Nigerians in Diaspora Awards | Celebrating Nigerians abroad',
  description: 'The Nigerians in Diaspora Awards (NIDA) recognise and celebrate the outstanding achievements of Nigerians living abroad across various fields. Organised in Paris by Friends of Nigeria (FON) Europe since 2023.',
});

// ---- Hero: wall of honour. Award-night photos from nida-awards.org mixed with verified honouree portraits (src/data/hero-wall.json) ----
type WallTile =
  | { type: 'awardee'; slug: string }
  | { type: 'moment'; id: string; src: string; crop: number[]; year: number; title?: string; slug?: string; alt: string };
const tileKey = (t: WallTile) => (t.type === 'awardee' ? t.slug : t.id);
const wallColumns = (heroWall as unknown as { columns: WallTile[][] }).columns;

function Hero({ s }: { s: Site }) {
  const h = s.site.home;
  // Portrait tiles of honourees that are unpublished or removed in the admin are left out
  const columns = wallColumns.map((col) => col.filter((t) => t.type === 'moment' || s.bySlug[t.slug]));
  const bg = s.photo(h.heroImage);
  const Tile = ({ t, hidden, eager }: { t: WallTile; hidden: boolean; eager: boolean }) => {
    const sizes = '(max-width: 980px) 160px, 13vw';
    const a = t.slug ? s.bySlug[t.slug] : undefined;
    // A moment credited to an honouree links to their profile; other moments link to the gallery
    const href = a ? awardeeUrl(a.slug) : page('gallery');
    const label = t.type === 'awardee' ? `${a!.name}, ${a!.award}, NIDA ${a!.year}` : `${t.alt}, NIDA ${t.year}${a ? '' : ', see the gallery'}`;
    const year = t.type === 'awardee' ? a!.year : t.year;
    return (
      <a
        className={t.type === 'moment' ? 'portrait-tile portrait-tile--moment' : 'portrait-tile'}
        href={href}
        {...(hidden ? { tabIndex: -1, 'aria-hidden': 'true' as const } : { 'aria-label': label })}
      >
        {t.type === 'awardee' ? <PortraitImg slug={t.slug} sizes={sizes} eager={eager} /> : <WallImg id={t.id} sizes={sizes} eager={eager} />}
        <span className="portrait-tile__cap" aria-hidden="true">
          <b>{a ? a.name : t.type === 'moment' ? t.title : ''}</b>
          <span>{a ? shortAward(a) : 'Gala Awards Night, Paris'}</span>
          <i>NIDA {year}</i>
        </span>
      </a>
    );
  };
  return (
    <section className="hero" data-hero="" aria-labelledby="hero-title">
      {/* Background only (Website content → Home → Hero background), under brand-colour overlays */}
      <div className="hero__bg" aria-hidden="true">
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg.variants[bg.variants.length - 1].url}
            srcSet={bg.variants.map((v) => `${v.url} ${v.w}w`).join(', ')}
            sizes="100vw"
            width={bg.variants[bg.variants.length - 1].w}
            height={bg.variants[bg.variants.length - 1].h}
            alt=""
            decoding="async"
            fetchPriority="low"
          />
        ) : null}
      </div>
      <div className="container hero__grid">
        <div className="hero__copy">
          <h1 className="hero__title" id="hero-title">
            <span className="line"><span style={d('.15s')}>{rich(h.heroLine1, '', 'em')}</span></span>{' '}
            <span className="line"><span style={d('.22s')}>{rich(h.heroLine2, '', 'em')}</span></span>
          </h1>
          <p className="hero__lead" data-hero-fade="" style={d('.3s')}>{h.heroLead}</p>
          <div className="hero__actions" data-hero-fade="" style={d('.4s')}>
            <a className="btn" href={page('awardees')}>{h.heroPrimary} <Arrow className="arrow" /></a>
            <a className="btn btn--ghost" href="#save-the-date">{h.heroSecondary}</a>
          </div>
        </div>
        <div className="hero__visual" data-hero-fade="" style={d('.15s')}>
          <div className="honour-wall" data-wall="" role="group" aria-label="NIDA honourees and award nights, 2023 to 2025">
            {columns.map((col, c) => (
              <div className="honour-wall__col" key={c}>
                {/* Each column is listed twice so the scroll animation loops seamlessly */}
                <div className="honour-wall__track">
                  {col.map((t, i) => <Tile key={tileKey(t)} t={t} hidden={false} eager={i < 3} />)}
                  {col.map((t) => <Tile key={tileKey(t) + '-copy'} t={t} hidden eager={false} />)}
                </div>
              </div>
            ))}
          </div>
          <button className="wall-toggle" type="button" data-wall-toggle="" aria-pressed="false"><span data-wall-icon=""><Pause /></span><span data-wall-label="">Pause motion</span></button>
        </div>
      </div>
    </section>
  );
}

// ---- Honourees in orbit around a globe centred on Nigeria ----
// Positions are percentages of the square stage: [slug, x, y, diameter, 'wide' = hidden on phones].
// The globe sits at 50% / 46%.
const ORBIT: [string, number, number, number, ('wide' | undefined)?][] = [
  ['morin-oluwole', 81, 19, 17],
  ['rasheedat-ajibade', 15, 21, 13],
  ['chidiebere-ikejemba', 33, 6, 9.5, 'wide'],
  ['tolulope-ayeni', 57, 4, 9],
  ['kachi-nwanna', 93, 50, 11],
  ['adeola-adeleye-fasubaa', 82, 81, 12],
  ['juliana-olayinka', 58, 93, 10],
  ['hassan-aliyu', 6, 52, 10.5, 'wide'],
  ['cynthia-asije', 20, 75, 12],
  ['akinloye-bamigboye', 5, 36, 8.5, 'wide'],
];

function GlobeIntro({ s }: { s: Site }) {
  const h = s.site.home;
  // Honourees whose face crop exists in the media library (a removed or unpublished honouree is skipped)
  const orbit = ORBIT.map((o) => ({ o, a: s.bySlug[o[0]] })).filter(({ a }) => a && s.portrait(a)?.extra.faces?.length);
  const first = orbit[0]?.a;
  const vars = { awardees: s.awardees.length, editions: s.editions.length };
  return (
    <section className="globe-intro" aria-labelledby="intro-title">
      <div className="container globe-intro__grid">
        <div className="globe-intro__head">
          <h2 className="globe-intro__title" id="intro-title" data-reveal="">{h.introTitle} <span>{h.introTitleSub}</span></h2>
          <p className="globe-intro__lead" data-reveal="" style={d('.1s')}>{rich(h.introLead, 'gold')}</p>
        </div>
        <div className="globe-stage" data-globe="" data-globe-src={asset('js/globe-data.js')}>
          <canvas className="globe-stage__canvas" aria-hidden="true"></canvas>
          <ul className="globe-stage__people" role="list" aria-label="A selection of NIDA honourees, 2023 to 2025">
            {orbit.map(({ o: [slug, x, y, size, only], a }, i) => {
              const faces = s.portrait(a)!.extra.faces!;
              return (
                <li
                  key={slug}
                  className={'orbit-person' + (only ? ' orbit-person--wide' : '')}
                  style={{ '--x': x, '--y': y, '--s': size, '--i': i } as React.CSSProperties}
                  data-person=""
                  data-name={a.name}
                  data-award={shortAward(a)}
                  data-year={a.year}
                >
                  <a href={awardeeUrl(a.slug)} aria-label={`${a.name}, ${a.award}, NIDA ${a.year}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={faces[faces.length - 1].url}
                      srcSet={faces.map((f) => `${f.url} ${f.w}w`).join(', ')}
                      sizes="(max-width: 900px) 18vw, 9vw"
                      width={240}
                      height={240}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                </li>
              );
            })}
          </ul>
          {first ? (
            <div className="globe-spot" aria-hidden="true" data-spot="">
              <p className="globe-spot__name" data-spot-name="">{first.name}</p>
              <p className="globe-spot__award" data-spot-award="">{shortAward(first)}</p>
              <p className="globe-spot__year" data-spot-year="">NIDA {first.year}</p>
            </div>
          ) : null}
          <button className="wall-toggle globe-toggle" type="button" data-globe-toggle="" aria-pressed="false" hidden><span data-globe-icon=""><Pause /></span><span data-globe-label="">Pause motion</span></button>
        </div>
        <div className="globe-intro__more">
          <p className="globe-intro__body" data-reveal="">{s.site.about[0]}</p>
          <dl className="globe-facts" data-reveal="" style={d('.1s')}>
            {h.facts.map((f, i) => (
              <div key={i}><dt>{fill(f.value, vars)}</dt><dd>{fill(f.label, vars)}</dd></div>
            ))}
          </dl>
          <p data-reveal="" style={d('.15s')}><a className="link-arrow gold" href={page('about-nida')}>Read the NIDA story <Arrow /></a></p>
        </div>
      </div>
      <GlobeScript />
    </section>
  );
}

// ---- Mission & impact ----
function Mission({ s }: { s: Site }) {
  const h = s.site.home;
  return (
    <section className="section section--ivory section--flush on-light mission" aria-labelledby="mission-title">
      <div className="container">
        <div className="section-head">
          <h2 className="h2" id="mission-title" data-reveal="">{rich(h.missionTitle)}</h2>
          <p className="lead" data-reveal="" style={d('.1s')}>{h.missionLead}</p>
        </div>
        <div className="mission__pair">
          <div className="mission__item" data-reveal=""><h3 className="mission__title">Our mission</h3><p>{s.site.mission}</p></div>
          <div className="mission__item" data-reveal="" style={d('.12s')}><h3 className="mission__title">Our vision</h3><p>{s.site.vision}</p></div>
        </div>
        {h.attendees.length ? (
          <div className="attendees">
            <div data-reveal="">
              <h3 className="attendees__title">{h.attendeesTitle}</h3>
              <p className="attendees__intro">{h.attendeesIntro}</p>
            </div>
            <ul className="attendees__list" data-reveal="" style={d('.1s')}>
              {h.attendees.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ---- Award categories ----
function Categories({ s }: { s: Site }) {
  const h = s.site.home;
  return (
    <section className="section section--light on-light" aria-labelledby="cat-title">
      <div className="container">
        <div className="section-head">
          <h2 className="h2" id="cat-title" data-reveal="">{rich(h.categoriesTitle)}</h2>
          <p className="lead" data-reveal="" style={d('.1s')}>{h.categoriesLead}</p>
        </div>
        <ul className="cat-index" role="list">
          {s.categories.map((c, i) => (
            <li className="cat-row" data-reveal="" style={d(`${i * 0.06}s`)} key={c.id}>
              <a className="cat-row__link" href={page('awards', c.id)}>
                <span className="cat-row__body">
                  <span className="cat-row__title">{c.name}</span>
                </span>
                <span className="cat-row__detail">
                  <span className="cat-row__text">{c.text}</span>
                  <ul className="cat-row__awards">
                    {c.awards.map((a) => <li key={a}>{a.replace(/ – .*/, '').replace(/ \(.*\)/, '')}</li>)}
                  </ul>
                </span>
                <span className="cat-row__go" aria-hidden="true"><Arrow /></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---- Featured recipients of one edition (tabs driven by main.js) ----
function Featured({ s }: { s: Site }) {
  const h = s.site.home;
  const featured = s.byYear(h.featuredYear);
  if (!featured.length) return null;
  // First ~200 characters of the biography, cut at a word boundary
  const excerpt = (a: Awardee) => {
    const p = a.bio[0] || '';
    return p.length <= 210 ? p : p.slice(0, 210).replace(/[\s,;:–-]+\S*$/, '') + '…';
  };
  return (
    <section className="section section--black" aria-labelledby="feature-title">
      <div className="container">
        <div className="section-head">
          <h2 className="h2" id="feature-title" data-reveal="">{rich(h.featuredTitle, 'gold')}</h2>
          <p className="lead muted" data-reveal="" style={d('.12s')}>{h.featuredLead}</p>
        </div>
        <div className="feature" data-feature="">
          <div className="feature__stage" data-reveal="">
            <div className="feature__frame">
              {featured.map((a, i) => (
                <PortraitImg key={a.slug} data-feature-img={String(i)} slug={a.slug} sizes="(max-width: 900px) 42vw, 34vw" className={i === 0 ? 'is-active' : undefined} />
              ))}
            </div>
            <div className="feature__caption" aria-live="polite">
              <p className="feature__name" data-feature-name="">{featured[0].name}</p>
              <p className="feature__award" data-feature-award="">{featured[0].award}</p>
              <p className="feature__excerpt" data-feature-excerpt="">{excerpt(featured[0])}</p>
              <p><a className="link-arrow gold" href={awardeeUrl(featured[0].slug)} data-feature-link="">Read full profile <Arrow /></a></p>
            </div>
          </div>
          <div>
            <div className="feature__list" role="tablist" aria-label={`${h.featuredYear} honourees`} aria-orientation="vertical">
              {featured.map((a, i) => (
                <button
                  key={a.slug}
                  className="feature__tab"
                  role="tab"
                  id={`ft-${i}`}
                  aria-selected={i === 0}
                  tabIndex={i === 0 ? 0 : -1}
                  data-feature-tab={i}
                  data-award={a.award}
                  data-name={a.name}
                  data-excerpt={excerpt(a)}
                  data-href={awardeeUrl(a.slug)}
                >
                  <span className="nm">{a.name}</span>
                  <span className="aw">{a.award}</span>
                </button>
              ))}
            </div>
            <p className="feature__more" data-reveal=""><a className="btn" href={page('awardees')}>Meet the Awardees <Arrow className="arrow" /></a></p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- Editions (tabs driven by main.js; the edition chosen in the admin is open by default) ----
function Editions({ s }: { s: Site }) {
  const h = s.site.home;
  const editions = s.editions;
  if (!editions.length) return null;
  const found = editions.findIndex((e) => e.year === h.editionsOpenYear);
  const OPEN = found > -1 ? found : editions.length - 1;
  return (
    <section className="section section--ivory on-light" aria-labelledby="ed-title">
      <div className="container">
        <div className="section-head">
          <h2 className="h2" id="ed-title" data-reveal="">{rich(h.editionsTitle)}</h2>
          <p className="lead" data-reveal="" style={d('.1s')}>{h.editionsLead}</p>
        </div>
        <div data-tabs="">
          <div className="editions__years" role="tablist" aria-label="NIDA editions">
            {editions.map((e, i) => (
              <button key={e.year} className="editions__year" role="tab" id={`ed-tab-${e.year}`} aria-controls={`ed-panel-${e.year}`} aria-selected={i === OPEN} tabIndex={i === OPEN ? 0 : -1}>
                {e.year}<small>{e.ordinal}</small>
              </button>
            ))}
          </div>
          {editions.map((e, i) => {
            const people = s.byYear(e.year);
            const photos = e.photos.filter((p) => s.photo(p));
            return (
              <div key={e.year} className="edition-panel" role="tabpanel" id={`ed-panel-${e.year}`} aria-labelledby={`ed-tab-${e.year}`} hidden={i !== OPEN} data-edition-panel="">
                <div className="edition-meta">
                  <dl>
                    <div><dt>Date</dt><dd>{e.date}</dd></div>
                    <div><dt>Venue</dt><dd>{e.venue}<br /><span className="edition-meta__sub">{e.city}</span></dd></div>
                    {photos.length ? null : e.theme ? <div><dt>Theme</dt><dd>{e.theme}</dd></div> : null}
                  </dl>
                  {e.stat ? <p className="edition-stat"><b>{e.stat.value}</b><span>{e.stat.label}</span></p> : null}
                  {e.pending ? <p className="edition-pending">{e.pending}</p> : null}
                  {people.length ? (
                    <ul className="honourees-chips" role="list">
                      {people.map((a) => <li key={a.slug}><a href={awardeeUrl(a.slug)}>{a.name}</a></li>)}
                    </ul>
                  ) : null}
                  <p><a className="link-arrow green" href={page('editions', 'nida-' + e.year)}>More on NIDA {e.year} <Arrow /></a></p>
                </div>
                {photos.length ? (
                  <div className="edition-photos">
                    {photos.slice(0, 3).map((p, j) => (
                      <figure key={p}><PhotoImg id={p} sizes={j ? '(max-width: 900px) 33vw, 20vw' : '(max-width: 900px) 66vw, 38vw'} /></figure>
                    ))}
                  </div>
                ) : (
                  <div className="edition-photos edition-photos--theme">
                    <p className="edition-theme">“{e.theme || e.title}”</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---- Gallery mosaic (opens the lightbox from main.js) ----
function Mosaic({ s }: { s: Site }) {
  const h = s.site.home;
  const items = h.mosaic.map((id) => s.photo(id)).filter((m) => m && m.variants.length);
  return (
    <section className="section section--black section--flush" aria-labelledby="gal-title">
      <div className="container">
        <div className="section-head section-head--rule">
          <h2 className="h2" id="gal-title" data-reveal="">{rich(h.galleryTitle, 'gold')}</h2>
          <p className="lead muted" data-reveal="" style={d('.1s')}>{h.galleryLead}</p>
        </div>
        <ul className="mosaic" role="list" data-lightbox-group="">
          {items.map((m, i) => (
            <li key={m!.id} className="mosaic__item" data-reveal="mask" style={d(`${(i % 4) * 0.08}s`)}>
              <button className="mosaic__btn" type="button" data-lightbox={largest(m)} data-caption={`${m!.alt}${m!.galleryYear ? ` · NIDA ${m!.galleryYear}` : ''}`}>
                <PhotoImg id={m!.id} sizes="(max-width: 760px) 50vw, 40vw" />
                <span className="visually-hidden">Enlarge photo</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mosaic__foot" data-reveal="">
          <span className="muted">{h.galleryFoot}</span>
          <a className="btn btn--ghost" href={page('gallery')}>View the gallery <Arrow className="arrow" /></a>
        </p>
      </div>
    </section>
  );
}

// ---- Save the date for the next edition (mailing list) + nomination status ----
function SaveTheDate({ s }: { s: Site }) {
  const n = s.site.nominations;
  const nl = s.site.newsletter;
  // Once the next edition is added (and published) in Events, its date and venue appear here
  const next = s.edition(nl.edition);
  return (
    <section className="section section--gold save-date on-light" id="save-the-date" aria-labelledby="std-title">
      <div className="container save-date__grid">
        <div className="save-date__copy">
          <h2 className="save-date__title" id="std-title" data-reveal=""><span>Save the Date</span> <span>for <em>NIDA {nl.edition}</em></span></h2>
          <p className="save-date__lead" data-reveal="" style={d('.14s')}>{fill(s.site.home.saveDateLead, { edition: nl.edition })}</p>
          <dl className="save-date__ticket" data-reveal="" style={d('.2s')}>
            <div><dt>Date</dt><dd>{next?.date || 'To be announced'}</dd></div>
            <div><dt>Venue</dt><dd>{next?.venue || 'To be announced'}</dd></div>
            <div><dt>Nominations</dt><dd>{n.open && n.edition === nl.edition ? (n.deadline ? `Open until ${n.deadline}` : 'Open now') : 'To be announced'}</dd></div>
          </dl>
        </div>
        <div className="save-date__panel" data-reveal="" style={d('.12s')}>
          <p className="save-date__panel-title">Get NIDA {nl.edition} news by email</p>
          <p className="save-date__panel-text">The date, the call for nominations and ticket information, once each is published.</p>
          <NewsletterForm id="std" theme="dark" button="Keep me informed" />
          <p className="save-date__nom"><Info /><span>{n.open ? `Nominations for NIDA ${n.edition} are open.` : n.statusTitle} <a className="text-link" href={page('nomination')}>How nominations work</a></span></p>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const s = await getSite();
  const site = s.site;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'NIDA, Nigerians in Diaspora Awards',
        url: SITE_URL,
        logo: SITE_URL + '/assets/img/brand/nida-logo-green.png',
        sameAs: site.social.map((x) => x.url),
        email: site.contact.email,
        parentOrganization: { '@type': 'NGO', name: site.organizer.name, url: site.organizer.url, address: { '@type': 'PostalAddress', streetAddress: '229 rue Saint-Honoré', postalCode: '75001', addressLocality: 'Paris', addressCountry: 'FR' } },
      },
      ...s.editions.map((e) => ({
        '@type': 'Event',
        name: `NIDA ${e.year}, Nigerians in Diaspora Awards Gala`,
        startDate: e.startsOn || undefined,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: e.venue, address: e.city + ', France' },
        organizer: { '@type': 'Organization', name: site.organizer.name, url: site.organizer.url },
      })),
    ],
  };
  return (
    <SiteShell current="" jsonld={jsonld}>
      <Hero s={s} />
      <GlobeIntro s={s} />
      <Mission s={s} />
      <Categories s={s} />
      <Featured s={s} />
      <Mosaic s={s} />
      <Editions s={s} />
      <Organizer variant="home" />
      <SaveTheDate s={s} />
    </SiteShell>
  );
}
