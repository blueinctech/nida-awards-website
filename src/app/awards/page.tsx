import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import Steps from '@/components/Steps';
import { PhotoImg } from '@/components/images';
import { Arrow } from '@/components/icons';
import { awardeeUrl, awardees, d, page, site } from '@/lib/data';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'awards',
  title: 'Awards & categories',
  description: 'The NIDA award categories: Business, Diaspora Impact, Professional, and Sports & Creative Industries awards, and how winners are selected.',
  ogImage: 'og-awards.jpg',
});

export default function AwardsPage() {
  const other = awardees.filter((a) => a.group === 'other');
  return (
    <SiteShell current="awards">
      <PageHero title="Awards & categories" crumbs="Awards" lead="Four award categories recognising Nigerians abroad in business, diaspora impact, professional life, sport and the creative industries." photo="2024-28" />
      <section className="section section--ivory on-light">
        <div className="container">
          {site.categories.map((c) => {
            const winners = awardees.filter((a) => a.group === c.id);
            return (
              <article className="award-group" id={c.id} aria-labelledby={`${c.id}-t`} key={c.id}>
                <div className="award-group__media" data-reveal="mask"><PhotoImg id={c.photo} sizes="(max-width: 860px) 92vw, 40vw" /></div>
                <div>
                  <h2 className="h2" id={`${c.id}-t`} data-reveal="">{c.name}</h2>
                  <p className="lead" style={{ marginTop: '1.25rem' }} data-reveal="">{c.text}</p>
                  <ol className="award-list" data-reveal="">{c.awards.map((a) => <li key={a}>{a}</li>)}</ol>
                  {winners.length ? (
                    <p style={{ marginTop: '1.5rem' }} data-reveal=""><a className="link-arrow green" href={`${page('awardees')}?category=${c.id}`}>Past winners ({winners.length}) <Arrow /></a></p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section section--light on-light" aria-labelledby="other-t">
        <div className="container split">
          <h2 className="h2" id="other-t" data-reveal="">{site.otherHonours.name}</h2>
          <div>
            <p className="lead" data-reveal="">{site.otherHonours.text}</p>
            <ul className="honourees-chips honourees-chips--detail" role="list" data-reveal="">
              {other.map((a) => <li key={a.slug}><a href={awardeeUrl(a.slug)}><b>{a.name}</b><span>{a.award} · {a.year}</span></a></li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--forest" aria-labelledby="process-t">
        <div className="container">
          <div className="section-head">
            <h2 className="h2" id="process-t" data-reveal="">The awards process</h2>
            <p className="lead muted" data-reveal="" style={d('.1s')}>A panel of judges assesses every nomination against four criteria: impact &amp; distinction, leadership, innovation and character.</p>
          </div>
          <Steps />
          <p className="section-cta" data-reveal=""><a className="btn" href={page('nomination')}>Nomination details <Arrow className="arrow" /></a></p>
        </div>
      </section>
    </SiteShell>
  );
}
