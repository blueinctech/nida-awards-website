import { notFound } from 'next/navigation';
import SiteShell from '@/components/SiteShell';
import ShareBar from '@/components/ShareBar';
import { PortraitImg } from '@/components/images';
import { Arrow, Prev, Star } from '@/components/icons';
import { awardeeUrl, awardees, byYear, bySlug, d, page, site, type Awardee } from '@/lib/data';
import { pageMetadata } from '@/lib/meta';

// One page per honouree: /awardees/<slug>/, generated from src/data/awardees.json
export const dynamicParams = false;
export function generateStaticParams() {
  return awardees.map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

function details(a: Awardee) {
  const firstSentence = (a.bio[0].match(/^.*?[.!?](\s|$)/) || [a.bio[0]])[0].trim();
  let description = `${a.name}, ${a.award} at NIDA ${a.year}, the Nigerians in Diaspora Awards. ${firstSentence}`;
  if (description.length > 200) description = description.slice(0, 197).replace(/\s+\S*$/, '') + '…';
  return { firstSentence, description, pageUrl: `${site.url}/awardees/${a.slug}/`, isOrg: a.slug === 'propel' };
}

export async function generateMetadata({ params }: Props) {
  const a = bySlug[(await params).slug];
  if (!a) return {};
  const { description, isOrg } = details(a);
  return pageMetadata({
    slug: `awardees/${a.slug}`,
    title: `${a.name}, ${a.award} ${a.year}`,
    ogTitle: `${a.name}, ${a.award} · NIDA ${a.year}`,
    description,
    ogImage: `awardees/${a.slug}.jpg`, // made by `npm run share-images`
    ogImageAlt: `${a.name}, ${a.award}, NIDA ${a.year}`,
    ogType: isOrg ? 'website' : 'profile',
  });
}


export default async function AwardeePage({ params }: Props) {
  const a = bySlug[(await params).slug];
  if (!a) notFound();
  const { firstSentence, pageUrl, isOrg } = details(a);
  const ed = site.editions.find((e) => e.year === a.year);
  const group = site.categories.find((c) => c.id === a.group);
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
        { '@type': 'ListItem', position: 1, name: 'Home', item: site.url + '/' },
        { '@type': 'ListItem', position: 2, name: 'Awardees', item: site.url + '/awardees/' },
        { '@type': 'ListItem', position: 3, name: a.name, item: pageUrl },
      ],
    },
    mainEntity: {
      '@type': isOrg ? 'Organization' : 'Person',
      name: a.name,
      image: `${site.url}/assets/img/awardees/${a.slug}-594.webp`,
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
              <PortraitImg slug={a.slug} sizes="(max-width: 760px) 80vw, 420px" eager alt={isOrg ? 'Propel logo' : `Portrait of ${a.name}`} />
            </div>
            <div className="honouree__intro">
              <nav className="breadcrumb" aria-label="Breadcrumb"><ol><li><a href={page('')}>Home</a></li><li><a href={page('awardees')}>Awardees</a></li><li aria-current="page">{a.name}</li></ol></nav>
              <p className="honouree__edition" data-hero-fade="" style={d('.15s')}><span>NIDA {a.year}</span>{ed ? ` · ${ed.ordinal}` : ''}</p>
              <h1 className="honouree__name" id="honouree-name" data-hero-fade="" style={d('.2s')}>{a.name}</h1>
              <p className="honouree__award" data-hero-fade="" style={d('.28s')}><Star /><span>{a.award}</span></p>
              <div data-hero-fade="" style={d('.36s')}><ShareBar url={pageUrl} title={`${a.name}, NIDA ${a.year}`} text={shareText} theme="dark" /></div>
            </div>
          </div>
        </header>

        <div className="section section--light on-light honouree__body">
          <div className="container honouree__layout">
            <div className="honouree__bio">
              <h2 className="honouree__h2">{isOrg ? 'About' : 'Biography'}</h2>
              <div className="prose prose--bio">{a.bio.map((p, k) => <p key={k}>{p}</p>)}</div>
              {a.note ? <p className="profile__note"><b>Editorial note:</b> {a.note}</p> : null}
              <p className="honouree__source">Biography as published by NIDA for the {a.year} awards.</p>
            </div>
            <aside className="honouree__facts" aria-label="Award details">
              <dl>
                <div><dt>Award</dt><dd>{a.award}</dd></div>
                <div><dt>Category</dt><dd>{group ? <a className="text-link" href={page('awards', group.id)}>{group.name}</a> : site.otherHonours.name}</dd></div>
                <div><dt>Edition</dt><dd><a className="text-link" href={page('editions', 'nida-' + a.year)}>NIDA {a.year}</a>{ed ? <><br /><span>{ed.date}</span></> : null}</dd></div>
                {ed ? <div><dt>Ceremony</dt><dd>{ed.venue}<br /><span>{ed.city}</span></dd></div> : null}
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
                      <span className={'awardee-card__media' + (m.slug === 'propel' ? ' awardee-card__media--logo' : '')}><PortraitImg slug={m.slug} sizes="(max-width: 560px) 46vw, 22vw" alt={m.slug === 'propel' ? 'Propel logo' : ''} /></span>
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
