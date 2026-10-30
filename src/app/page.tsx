import SiteShell from '@/components/SiteShell';
import NewsletterForm from '@/components/NewsletterForm';
import Organizer from '@/components/Organizer';
import { GlobeScript } from '@/components/ClientScripts';
import { PhotoImg, PortraitImg, WallImg, photoLargest } from '@/components/images';
import heroWall from '@/data/hero-wall.json';
import { Arrow, Info, Pause } from '@/components/icons';
import { asset, awardeeUrl, awardees, byYear, bySlug, d, hasAccents, page, photoById, shortAward, site, type Awardee } from '@/lib/data';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: '',
  title: 'NIDA, Nigerians in Diaspora Awards | Celebrating Nigerians abroad',
  description: site.description + ' Organised in Paris by Friends of Nigeria (FON) Europe since 2023.',
});

// ---- Hero: wall of honour. Award-night photos from nida-awards.org mixed with verified honouree portraits (src/data/hero-wall.json) ----
type WallTile =
  | { type: 'awardee'; slug: string }
  | { type: 'moment'; id: string; src: string; crop: number[]; year: number; title?: string; slug?: string; alt: string };
const tileKey = (t: WallTile) => (t.type === 'awardee' ? t.slug : t.id);
const wallColumns = (heroWall as unknown as { columns: WallTile[][] }).columns;

function Hero() {
  const Tile = ({ t, hidden, eager }: { t: WallTile; hidden: boolean; eager: boolean }) => {
    const sizes = '(max-width: 980px) 160px, 13vw';
    const a = t.slug ? bySlug[t.slug] : undefined;
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
      {/* Background only: a NIDA 2024 trophy table photo (nida-awards.org), cropped above the watermarks, under brand-colour overlays */}
      <div className="hero__bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset('img/hero/hero-trophies-1600.webp')}
          srcSet={`${asset('img/hero/hero-trophies-960.webp')} 960w, ${asset('img/hero/hero-trophies-1600.webp')} 1600w`}
          sizes="100vw"
          width={1600}
          height={865}
          alt=""
          decoding="async"
          fetchPriority="low"
        />
      </div>
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow" data-hero-fade="" style={d('.1s')}><span>Nigerians in Diaspora Awards<span className="hero__eyebrow-extra"> · 2026 theme</span></span></p>
          <h1 className="hero__title" id="hero-title">
            <span className="line"><span style={d('.15s')}>From Nigerian roots</span></span>{' '}
            <span className="line"><span style={d('.22s')}>to <em>global heights.</em></span></span>
          </h1>
          <p className="hero__lead" data-hero-fade="" style={d('.3s')}>NIDA celebrates the outstanding achievements of Nigerians living abroad and promotes a positive narrative about their contributions to the world.</p>
          <div className="hero__actions" data-hero-fade="" style={d('.4s')}>
            <a className="btn" href={page('awardees')}>Meet the awardees <Arrow className="arrow" /></a>
            <a className="btn btn--ghost" href="#save-the-date">Save the date</a>
          </div>
        </div>
        <div className="hero__visual" data-hero-fade="" style={d('.15s')}>
          <div className="honour-wall" data-wall="" role="group" aria-label="NIDA honourees and award nights, 2023 to 2025">
            {wallColumns.map((col, c) => (
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

function GlobeIntro() {
  const first = bySlug[ORBIT[0][0]];
  return (
    <section className="globe-intro" aria-labelledby="intro-title">
      <div className="container globe-intro__grid">
        <div className="globe-intro__head">
          <h2 className="globe-intro__title" id="intro-title" data-reveal="">Celebrating excellence. <span>Recognising global impact.</span></h2>
          <p className="globe-intro__lead" data-reveal="" style={d('.1s')}>Recognising Nigerians abroad who are <span className="gold">redefining excellence</span>, and inspiring the next generation to do the same.</p>
        </div>
        <div className="globe-stage" data-globe="" data-globe-src={asset('js/globe-data.js')}>
          <canvas className="globe-stage__canvas" aria-hidden="true"></canvas>
          <ul className="globe-stage__people" role="list" aria-label="A selection of NIDA honourees, 2023 to 2025">
            {ORBIT.map(([slug, x, y, s, only], i) => {
              const a = bySlug[slug];
              if (!a) throw new Error('Unknown awardee ' + slug);
              return (
                <li
                  key={slug}
                  className={'orbit-person' + (only ? ' orbit-person--wide' : '')}
                  style={{ '--x': x, '--y': y, '--s': s, '--i': i } as React.CSSProperties}
                  data-person=""
                  data-name={a.name}
                  data-award={shortAward(a)}
                  data-year={a.year}
                >
                  <a href={awardeeUrl(a.slug)} aria-label={`${a.name}, ${a.award}, NIDA ${a.year}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(`img/awardees/face/${slug}-240.webp`)}
                      srcSet={`${asset(`img/awardees/face/${slug}-120.webp`)} 120w, ${asset(`img/awardees/face/${slug}-240.webp`)} 240w`}
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
          <div className="globe-spot" aria-hidden="true" data-spot="">
            <p className="globe-spot__year" data-spot-year="">NIDA {first.year}</p>
            <p className="globe-spot__name" data-spot-name="">{first.name}</p>
            <p className="globe-spot__award" data-spot-award="">{shortAward(first)}</p>
          </div>
          <button className="wall-toggle globe-toggle" type="button" data-globe-toggle="" aria-pressed="false" hidden><span data-globe-icon=""><Pause /></span><span data-globe-label="">Pause motion</span></button>
        </div>
        <div className="globe-intro__more">
          <p className="globe-intro__body" data-reveal="">{site.about[0]}</p>
          <dl className="globe-facts" data-reveal="" style={d('.1s')}>
            <div><dt>{awardees.length}</dt><dd>honourees recognised from 2023 to 2025</dd></div>
            <div><dt>{site.editions.length}</dt><dd>editions in Paris, organised by FON Europe</dd></div>
            <div><dt>150+</dt><dd>distinguished Nigerians from across Europe at the inaugural ceremony in 2023</dd></div>
            <div><dt>200+</dt><dd>prominent Nigerians and friends of Nigeria at the second edition in 2024</dd></div>
          </dl>
          <p data-reveal="" style={d('.15s')}><a className="link-arrow gold" href={page('about-nida')}>Read the NIDA story <Arrow /></a></p>
        </div>
      </div>
      <GlobeScript />
    </section>
  );
}

// ---- Mission & impact ----
function Mission() {
  return (
    <section className="section section--ivory section--flush on-light mission" aria-labelledby="mission-title">
      <div className="container">
        <div className="section-head">
          <h2 className="h2" id="mission-title" data-reveal="">A platform for <span className="green">global impact</span></h2>
          <p className="lead" data-reveal="" style={d('.1s')}>Each NIDA gala brings together members of the African diaspora, friends of Africa and professionals from diverse industries for an evening of celebration, networking, culture and recognition.</p>
        </div>
        <div className="mission__pair">
          <div className="mission__item" data-reveal=""><p className="mission__label">Mission</p><p>{site.mission}</p></div>
          <div className="mission__item" data-reveal="" style={d('.12s')}><p className="mission__label">Vision</p><p>{site.vision}</p></div>
        </div>
        <div className="attendees">
          <div data-reveal="">
            <h3 className="attendees__title">In attendance, 2023</h3>
            <p className="attendees__intro">The inaugural ceremony at L’Hôtel de l’Industrie drew notable guests, including:</p>
          </div>
          <ul className="attendees__list" data-reveal="" style={d('.1s')}>
            <li>The Ambassador of the Permanent Delegation of Nigeria to UNESCO</li>
            <li>Officials from the Embassy of Nigeria in Paris</li>
            <li>The CEO of the Nigerians in Diaspora Commission (NIDCOM)</li>
            <li>Representatives from the Lagos State Government</li>
            <li>A former member of the French Parliament</li>
            <li>Over 150 distinguished Nigerians from across Europe</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ---- Award categories ----
function Categories() {
  return (
    <section className="section section--light on-light" aria-labelledby="cat-title">
      <div className="container">
        <div className="section-head">
          <h2 className="h2" id="cat-title" data-reveal="">Four categories.<br />One standard: <span className="green">excellence</span></h2>
          <p className="lead" data-reveal="" style={d('.1s')}>From boardrooms and laboratories to stadiums, studios and public office, NIDA honours Nigerians abroad whose work makes a difference.</p>
        </div>
        <ul className="cat-index" role="list">
          {site.categories.map((c, i) => (
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

// ---- Featured 2025 recipients (tabs driven by main.js) ----
function Featured() {
  const featured = byYear(2025);
  const excerpt = (a: Awardee) => a.bio[0].slice(0, 220) + '…';
  return (
    <section className="section section--black" aria-labelledby="feature-title">
      <div className="container">
        <div className="section-head">
          <p className="section-index" data-reveal="">The class of 2025</p>
          <h2 className="h2" id="feature-title" data-reveal="" style={d('.06s')}>Meet the <span className="gold">honourees</span></h2>
          <p className="lead muted" data-reveal="" style={d('.12s')}>Ten Nigerians abroad recognised at the third NIDA gala in Paris, from engineering and academia to football, fashion, journalism, music and diplomacy.</p>
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
            <div className="feature__list" role="tablist" aria-label="2025 honourees" aria-orientation="vertical">
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
                  <span className="nm" style={hasAccents(a.name) ? { fontFamily: 'var(--font-body)', fontWeight: 700 } : undefined}>{a.name}</span>
                  <span className="aw">{a.award}</span>
                </button>
              ))}
            </div>
            <p style={{ marginTop: '2.5rem' }} data-reveal=""><a className="btn" href={page('awardees')}>Meet the awardees <Arrow className="arrow" /></a></p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---- Editions (tabs driven by main.js; the 2025 edition is open by default) ----
function Editions() {
  const OPEN = 2;
  return (
    <section className="section section--ivory on-light" aria-labelledby="ed-title">
      <div className="container">
        <div className="section-head">
          <h2 className="h2" id="ed-title" data-reveal="">Four editions in Paris</h2>
          <p className="lead" data-reveal="" style={d('.1s')}>Since its inaugural ceremony in 2023, NIDA has gathered Nigerians and friends of Nigeria from across Europe each year.</p>
        </div>
        <div data-tabs="">
          <div className="editions__years" role="tablist" aria-label="NIDA editions">
            {site.editions.map((e, i) => (
              <button key={e.year} className="editions__year" role="tab" id={`ed-tab-${e.year}`} aria-controls={`ed-panel-${e.year}`} aria-selected={i === OPEN} tabIndex={i === OPEN ? 0 : -1}>
                {e.year}<small>{e.ordinal}</small>
              </button>
            ))}
          </div>
          {site.editions.map((e, i) => {
            const people = byYear(e.year);
            return (
              <div key={e.year} className="edition-panel" role="tabpanel" id={`ed-panel-${e.year}`} aria-labelledby={`ed-tab-${e.year}`} hidden={i !== OPEN} data-edition-panel="">
                <div className="edition-meta">
                  <dl>
                    <div><dt>Date</dt><dd>{e.date}</dd></div>
                    <div><dt>Venue</dt><dd>{e.venue}<br /><span style={{ color: 'var(--color-ink-soft)', fontWeight: 400 }}>{e.city}</span></dd></div>
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
                {e.photos.length ? (
                  <div className="edition-photos">
                    {e.photos.map((p, j) => (
                      <figure key={p}><PhotoImg id={p} sizes={j ? '(max-width: 900px) 33vw, 20vw' : '(max-width: 900px) 66vw, 38vw'} /></figure>
                    ))}
                  </div>
                ) : (
                  <div className="edition-photos edition-photos--theme">
                    <div>
                      <p className="eyebrow eyebrow--plain gold" style={{ justifyContent: 'center' }}>2026 theme</p>
                      <p className="edition-theme" style={{ marginTop: '1rem' }}>{e.theme}</p>
                    </div>
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
const MOSAIC = ['2024-37', '2025-58', '2023-03', '2024-24', '2023-09', '2025-57', '2024-49', '2023-17'];

function Mosaic() {
  return (
    <section className="section section--black section--flush" aria-labelledby="gal-title">
      <div className="container">
        <div className="section-head section-head--rule">
          <h2 className="h2" id="gal-title" data-reveal="">Red carpets, live performance and <span className="gold">Nigerian pride</span></h2>
          <p className="lead muted" data-reveal="" style={d('.1s')}>A festive experience with red carpet photo sessions, music, dance and showcases, served with gourmet three-course Nigerian dishes.</p>
        </div>
        <ul className="mosaic" role="list" data-lightbox-group="">
          {MOSAIC.map((id, i) => (
            <li key={id} className="mosaic__item" data-reveal="mask" style={d(`${(i % 4) * 0.08}s`)}>
              <button className="mosaic__btn" type="button" data-lightbox={photoLargest(id)} data-caption={`${photoById[id].alt} · NIDA ${id.slice(0, 4)}`}>
                <PhotoImg id={id} sizes="(max-width: 760px) 50vw, 40vw" />
                <span className="visually-hidden">Enlarge photo</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mosaic__foot" data-reveal="">
          <span className="muted" style={{ fontSize: '.875rem' }}>Photography from NIDA 2023, 2024 and 2025.</span>
          <a className="btn btn--ghost" href={page('gallery')}>View the gallery <Arrow className="arrow" /></a>
        </p>
      </div>
    </section>
  );
}

// ---- Save the date for the next edition (mailing list) + nomination status ----
function SaveTheDate() {
  const n = site.nominations;
  const nl = site.newsletter;
  return (
    <section className="section section--gold save-date on-light" id="save-the-date" aria-labelledby="std-title">
      <div className="container save-date__grid">
        <div className="save-date__copy">
          <h2 className="save-date__title" id="std-title" data-reveal=""><span>Save the Date</span> <span>for <em>NIDA {nl.edition}</em></span></h2>
          <p className="save-date__lead" data-reveal="" style={d('.14s')}>NIDA {nl.edition} is on the horizon. Its date, venue and call for nominations have not been announced yet. Join the mailing list and you will hear as soon as NIDA shares them.</p>
          <dl className="save-date__ticket" data-reveal="" style={d('.2s')}>
            <div><dt>Date</dt><dd>To be announced</dd></div>
            <div><dt>Venue</dt><dd>To be announced</dd></div>
            <div><dt>Nominations</dt><dd>To be announced</dd></div>
          </dl>
        </div>
        <div className="save-date__panel" data-reveal="" style={d('.12s')}>
          <p className="save-date__panel-title">Get NIDA {nl.edition} news by email</p>
          <p className="save-date__panel-text">The date, the call for nominations and ticket information, once each is published.</p>
          <NewsletterForm id="std" theme="dark" button="Keep me informed" />
          <p className="save-date__nom"><Info /><span>{n.statusTitle} <a className="text-link" href={page('nomination')}>How nominations work</a></span></p>
        </div>
      </div>
    </section>
  );
}

const EVENT_DATES: Record<number, string> = { 2023: '2023-10-02', 2024: '2024-11-30', 2025: '2025-12-06', 2026: '2026-10-06' };

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'NIDA, Nigerians in Diaspora Awards',
      url: site.url,
      logo: site.url + '/assets/img/brand/nida-logo-green.png',
      sameAs: site.social.map((s) => s.url),
      email: site.contact.email,
      parentOrganization: { '@type': 'NGO', name: site.organizer.name, url: site.organizer.url, address: { '@type': 'PostalAddress', streetAddress: '229 rue Saint-Honoré', postalCode: '75001', addressLocality: 'Paris', addressCountry: 'FR' } },
    },
    ...site.editions.map((e) => ({
      '@type': 'Event',
      name: `NIDA ${e.year}, Nigerians in Diaspora Awards Gala`,
      startDate: EVENT_DATES[e.year],
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: { '@type': 'Place', name: e.venue, address: e.city + ', France' },
      organizer: { '@type': 'Organization', name: site.organizer.name, url: site.organizer.url },
    })),
  ],
};

export default function HomePage() {
  return (
    <SiteShell current="" jsonld={jsonld}>
      <Hero />
      <GlobeIntro />
      <Mission />
      <Categories />
      <Featured />
      <Mosaic />
      <Editions />
      <Organizer variant="home" />
      <SaveTheDate />
    </SiteShell>
  );
}
