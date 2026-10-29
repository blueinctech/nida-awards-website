import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import { PhotoImg, PortraitImg, photoLargest } from '@/components/images';
import { Arrow } from '@/components/icons';
import { awardeeUrl, byYear, page, photoById, photos, site } from '@/lib/data';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'editions',
  title: 'Past editions',
  description: 'The NIDA award editions of 2023, 2024, 2025 and 2026: dates, venues, honourees and photographs from each gala in Paris.',
  ogImage: 'og-editions.jpg',
});

export default function EditionsPage() {
  const newestFirst = site.editions.slice().reverse();
  return (
    <SiteShell current="editions">
      <PageHero title="Past editions" crumbs="Editions" lead="Every NIDA gala since the inaugural ceremony in October 2023, with dates, venues, honourees and photographs." photo="2024-37" />
      <nav className="year-nav" aria-label="Editions">
        <div className="container">
          <ul>{newestFirst.map((e) => <li key={e.year}><a href={`#nida-${e.year}`} data-spy={`nida-${e.year}`}>{e.year}</a></li>)}</ul>
        </div>
      </nav>
      <section className="section section--ivory on-light">
        <div className="container">
          {newestFirst.map((e) => {
            const people = byYear(e.year);
            const yearPhotos = photos.filter((p) => p.year === String(e.year)).slice(0, 6).map((p) => p.id);
            const strip = e.photos.length ? [...new Set([...e.photos, ...yearPhotos])].slice(0, 6) : [];
            return (
              <article className="edition-block" id={`nida-${e.year}`} aria-labelledby={`t-${e.year}`} key={e.year}>
                <div className="edition-block__aside">
                  <h2 className="edition-block__year" id={`t-${e.year}`} data-reveal=""><span className="visually-hidden">NIDA </span>{e.year}</h2>
                  <p className="eyebrow green" data-reveal="">{e.ordinal}</p>
                  <div className="edition-meta" data-reveal="">
                    <dl>
                      <div><dt>Date</dt><dd>{e.date}</dd></div>
                      <div><dt>Venue</dt><dd>{e.venue}<br /><span style={{ color: 'var(--color-ink-soft)', fontWeight: 400 }}>{e.city}</span></dd></div>
                      {e.theme ? <div><dt>Theme</dt><dd>{e.theme}</dd></div> : null}
                    </dl>
                  </div>
                </div>
                <div>
                  <p className="lead" data-reveal="">{e.summary}</p>
                  {e.stat ? <p className="edition-stat" style={{ marginTop: '2rem' }} data-reveal=""><b>{e.stat.value}</b><span>{e.stat.label}</span></p> : null}
                  {e.pending ? <p className="edition-pending" style={{ marginTop: '2rem' }} data-reveal="">{e.pending}</p> : null}
                  {strip.length ? (
                    <div className="strip" data-lightbox-group="">
                      {strip.map((id) => (
                        <figure data-reveal="mask" key={id}>
                          <button className="mosaic__btn" type="button" data-lightbox={photoLargest(id)} data-caption={`${photoById[id].alt} · NIDA ${e.year}`}>
                            <PhotoImg id={id} sizes="(max-width: 900px) 33vw, 20vw" />
                            <span className="visually-hidden">Enlarge photo</span>
                          </button>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                  {people.length ? (
                    <>
                      <h3 className="eyebrow" style={{ marginTop: '3rem', color: 'var(--color-ink-soft)' }}>Honourees · {people.length}</h3>
                      <ul className="honouree-rows" role="list">
                        {people.map((a) => (
                          <li key={a.slug}><a href={awardeeUrl(a.slug)}><PortraitImg slug={a.slug} sizes="56px" /><span><b>{a.name}</b><small>{a.award}</small></span><Arrow /></a></li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {strip.length ? <p style={{ marginTop: '2rem' }}><a className="link-arrow green" href={`${page('gallery')}?year=${e.year}`}>All NIDA {e.year} photographs <Arrow /></a></p> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}
