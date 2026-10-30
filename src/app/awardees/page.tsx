import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import { PortraitImg } from '@/components/images';
import { awardeeUrl, awardees, byYear, site } from '@/lib/data';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'awardees',
  title: 'Awardees',
  description: 'Every NIDA award recipient from 2023, 2024 and 2025, with their award titles and full biographies.',
  ogImage: 'og-awardees.jpg',
});

// Filtering (year buttons, category, search, ?year= and ?category= links) is done by main.js.
export default function AwardeesPage() {
  const years = [...new Set(awardees.map((a) => a.year))].sort((a, b) => b - a);
  const groups = [...site.categories, site.otherHonours];
  return (
    <SiteShell current="awardees">
      <PageHero title="The awardees" crumbs="Awardees" lead={`${awardees.length - 1} Nigerians abroad and one start-up, honoured at NIDA from 2023 to 2025. Filter by year or category, or search by name.`} photo="2025-55" />
      <div className="archive-bar" data-archive-bar="">
        <div className="container archive-bar__inner">
          <div className="filters" role="group" aria-label="Filter by year">
            <button className="chip" type="button" aria-pressed="true" data-year-filter="all">All years <span className="count">{awardees.length}</span></button>
            {years.map((y) => (
              <button key={y} className="chip" type="button" aria-pressed="false" data-year-filter={y}>{y} <span className="count">{byYear(y).length}</span></button>
            ))}
          </div>
          <div className="filters">
            <div className="field-inline">
              <label htmlFor="cat-filter">Category</label>
              <select className="select" id="cat-filter" data-group-filter="">
                <option value="all">All categories</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="field-inline field-inline--search">
              <label htmlFor="q" className="visually-hidden">Search awardees</label>
              <input className="input input--search" id="q" type="search" placeholder="Search by name or award" autoComplete="off" data-search="" />
            </div>
          </div>
        </div>
      </div>
      <section className="section section--light on-light" style={{ paddingTop: '2rem' }}>
        <div className="container">
          <p className="archive-count" aria-live="polite" data-count="">Showing all {awardees.length} awardees</p>
          <ul className="awardee-grid" role="list" data-awardee-grid="">
            {awardees.map((a) => (
              <li key={a.slug} className="awardee-card" data-year={a.year} data-group={a.group} data-search={(a.name + ' ' + a.award + ' ' + a.year).toLowerCase()} id={a.slug}>
                <a className="awardee-card__btn" href={awardeeUrl(a.slug)}>
                  <span className={'awardee-card__media' + (a.slug === 'propel' ? ' awardee-card__media--logo' : '')}>
                    <PortraitImg slug={a.slug} sizes="(max-width: 560px) 46vw, (max-width: 900px) 30vw, 22vw" alt={a.slug === 'propel' ? 'Propel logo' : ''} />
                  </span>
                  <span className="awardee-card__name">{a.name}</span>
                  <span className="awardee-card__award">{a.award}<span className="awardee-card__year"> · {a.year}</span></span>
                </a>
              </li>
            ))}
          </ul>
          <div className="empty-state" hidden data-empty="">
            <p className="h3">No awardees match those filters.</p>
            <p style={{ marginTop: '.75rem', color: 'var(--color-ink-soft)' }}>Try another year or category, or clear the search.</p>
            <p style={{ marginTop: '1.5rem' }}><button className="btn btn--outline-dark" type="button" data-reset="">Clear filters</button></p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
