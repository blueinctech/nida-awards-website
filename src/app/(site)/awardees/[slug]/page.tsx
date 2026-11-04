import { notFound } from 'next/navigation';
import SiteShell from '@/components/SiteShell';
import ShareBar from '@/components/ShareBar';
import { PortraitImg } from '@/components/images';
import { Arrow, Prev, Star } from '@/components/icons';
import { SITE_URL, absolute, awardeeUrl, d, page } from '@/lib/data';
import { getPublishedData, getSite, withHelpers } from '@/lib/server/content';
import type { Awardee } from '@/lib/types';
import { pageMetadata } from '@/lib/meta';

// One page per honouree: /awardees/<slug>/. Pages of honourees added in the admin are built on
// their first visit; unpublished honourees answer 404 (except in an administrator's preview).
export const dynamicParams = true;
export async function generateStaticParams() {
  return (await getPublishedData()).awardees.map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

function details(a: Awardee) {
  const p0 = a.bio[0] || '';
  const firstSentence = (p0.match(/^.*?[.!?](\s|$)/) || [p0])[0].trim();
  let description = `${a.name}, ${a.award} at NIDA ${a.year}, the Nigerians in Diaspora Awards. ${firstSentence}`.trim();
  if (description.length > 200) description = description.slice(0, 197).replace(/\s+\S*$/, '') + '…';
  return { firstSentence, description, pageUrl: `${SITE_URL}/awardees/${a.slug}/`, isOrg: a.isOrg };
}

export async function generateMetadata({ params }: Props) {
  const s = withHelpers(await getPublishedData());
  const a = s.bySlug[(await params).slug];
  if (!a) return {};
  const { description, isOrg } = details(a);
  const photo = s.portrait(a);
  return pageMetadata({
    slug: `awardees/${a.slug}`,
    title: `${a.name}, ${a.award} ${a.year}`,
    ogTitle: `${a.name}, ${a.award} · NIDA ${a.year}`,
    description,
    ogImage: photo?.extra.og || 'og-awardees.jpg', // share image made on upload (or by `npm run share-images`)
    ogImageAlt: `${a.name}, ${a.award}, NIDA ${a.year}`,
    ogType: isOrg ? 'website' : 'profile',
  });
}


export default async function AwardeePage({ params }: Props) {
  const s = await getSite();
  const { site, awardees, byYear } = s;
  const a = s.bySlug[(await params).slug];
  if (!a) notFound();
  const { firstSentence, pageUrl, isOrg } = details(a);
  const ed = s.edition(a.year);
  const group = s.category(a.group);
  const photo = s.portrait(a);
  const shareText = `${a.name}, ${a.award}, NIDA ${a.year} (Nigerians in Diaspora Awards)`;

  // Neighbours in archive order, and more honourees from the same edition
  const i = awardees.indexOf(a);
  const prev = awardees[(i - 1 + awardees.length) % awardees.length];
  const next = awardees[(i + 1) % awardees.length];
  const more = byYear(a.year).filter((x) => x !== a).slice(0, 4);

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: pageUrl,
    name: `${a.name}, NIDA ${a.year}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: 'Awardees', item: SITE_URL + '/awardees/' },
        { '@type': 'ListItem', position: 3, name: a.name, item: pageUrl },
      ],
    },
    mainEntity: {
      '@type': isOrg ? 'Organization' : 'Person',
      name: a.name,
      image: photo ? absolute((photo.extra.portrait || photo.variants).slice(-1)[0].url) : undefined,
      description: firstSentence,
      award: `${a.award}, Nigerians in Diaspora Awards (NIDA) ${a.year}`,
    },
  };

  return (
    <SiteShell current="awardees" jsonld={jsonld}>
      <article className="honouree" aria-labelledby="honouree-name">
        <header className="honouree__hero">
          <div className="container honouree__hero-grid">
            <div className={'honouree__portrait' + (isOrg ? ' honouree__portrait--logo' : '')} data-hero-fade="" style={d('.1s')}>
              <PortraitImg slug={a.slug} sizes="(max-width: 760px) 80vw, 420px" eager alt={isOrg ? `${a.name} logo` : `Portrait of ${a.name}`} />
            </div>
            <div className="honouree__intro">
              <nav className="breadcrumb" aria-label="Breadcrumb"><ol><li><a href={page('')}>Home</a></li><li><a href={page('awardees')}>Awardees</a></li><li aria-current="page">{a.name}</li></ol></nav>
              <h1 className="honouree__name" id="honouree-name" data-hero-fade="" style={d('.2s')}>{a.name}</h1>
              <p className="honouree__award" data-hero-fade="" style={d('.28s')}><Star /><span>{a.award}<span className="honouree__edition">NIDA {a.year}{ed ? `, ${ed.ordinal.toLowerCase()}` : ''}</span></span></p>
              <div data-hero-fade="" style={d('.36s')}><ShareBar url={pageUrl} title={`${a.name}, NIDA ${a.year}`} text={shareText} theme="dark" /></div>
            </div>
          </div>
        </header>

        <div className="section section--light on-light honouree__body">
          <div className="container honouree__layout">
            <div className="honouree__bio">
              <h2 className="h3 honouree__h2">{isOrg ? `About ${a.name}` : 'Biography'}</h2>
              <div className="prose prose--bio">{a.bio.map((p, k) => <p key={k}>{p}</p>)}</div>
              {a.achievements.length ? (
                <>
                  <h2 className="h3 honouree__h2" style={{ marginTop: '2.5rem' }}>Achievements</h2>
                  <ul className="rule-list" role="list" style={{ marginTop: '1.25rem' }}>{a.achievements.map((x, k) => <li key={k}><Star /><span>{x}</span></li>)}</ul>
                </>
              ) : null}
              {a.note ? <p className="profile__note"><b>Editorial note:</b> {a.note}</p> : null}
              <p className="honouree__source">Biography as published by NIDA for the {a.year} awards.</p>
            </div>
            <aside className="honouree__facts" aria-label="Award details">
              <dl>
                <div><dt>Award</dt><dd>{a.award}</dd></div>
                <div><dt>Category</dt><dd>{group ? <a className="text-link" href={page('awards', group.id)}>{group.name}</a> : site.otherHonours.name}</dd></div>
                <div><dt>Edition</dt><dd><a className="text-link" href={page('editions', 'nida-' + a.year)}>NIDA {a.year}</a>{ed ? <><br /><span>{ed.date}</span></> : null}</dd></div>
                {ed ? <div><dt>Ceremony</dt><dd>{ed.venue}<br /><span>{ed.city}</span></dd></div> : null}
                {a.country ? <div><dt>Country</dt><dd>{a.country}</dd></div> : null}
              </dl>
              <a className="btn btn--outline-dark honouree__back" href={page('awardees')}><Prev /><span>All awardees</span></a>
            </aside>
          </div>
        </div>

        {more.length ? (
          <section className="section section--ivory on-light honouree__more" aria-labelledby="more-t">
            <div className="container">
              <div className="honouree__more-head">
                <h2 className="h3" id="more-t">More honourees from NIDA {a.year}</h2>
                <a className="link-arrow green" href={`${page('awardees')}?year=${a.year}`}>All {byYear(a.year).length} from {a.year} <Arrow /></a>
              </div>
              <ul className="awardee-grid awardee-grid--compact" role="list">
                {more.map((m) => (
                  <li className="awardee-card" key={m.slug}>
                    <a className="awardee-card__btn" href={awardeeUrl(m.slug)}>
                      <span className={'awardee-card__media' + (m.isOrg ? ' awardee-card__media--logo' : '')}><PortraitImg slug={m.slug} sizes="(max-width: 560px) 46vw, 22vw" alt={m.isOrg ? `${m.name} logo` : ''} /></span>
                      <span className="awardee-card__name">{m.name}</span>
                      <span className="awardee-card__award">{m.award}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <nav className="honouree__pager" aria-label="Other honourees">
          <div className="container honouree__pager-grid">
            <a href={awardeeUrl(prev.slug)} rel="prev"><small><Prev /> Previous</small><b>{prev.name}</b><span>{prev.award} · {prev.year}</span></a>
            <a href={awardeeUrl(next.slug)} rel="next"><small>Next <Arrow /></small><b>{next.name}</b><span>{next.award} · {next.year}</span></a>
          </div>
        </nav>
      </article>
    </SiteShell>
  );
}
