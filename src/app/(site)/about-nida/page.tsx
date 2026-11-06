import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import Organizer from '@/components/Organizer';
import { PhotoImg } from '@/components/images';
import { Arrow } from '@/components/icons';
import { d, page, rich } from '@/lib/data';
import { getSite } from '@/lib/server/content';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'about-nida',
  title: 'About NIDA',
  description: 'The story, mission and vision of the Nigerians in Diaspora Awards (NIDA), organised in Paris by Friends of Nigeria (FON) Europe since 2023.',
  ogImage: 'og-about.jpg',
});

export default async function AboutPage() {
  const { site, editions } = await getSite();
  const hero = site.pages.about;
  return (
    <SiteShell current="about-nida">
      <PageHero title={hero.title} crumbs="About NIDA" lead={hero.lead} photo={hero.photo} />
      <section className="section section--ivory on-light">
        <div className="container grid-12">
          <div className="intro__statement">
            <p className="statement" data-reveal="">{rich(site.aboutStatement)}</p>
          </div>
          <div className="intro__media">
            {site.aboutPhotos[0] ? <figure data-reveal="mask"><PhotoImg id={site.aboutPhotos[0]} sizes="(max-width: 900px) 90vw, 45vw" /></figure> : null}
            {site.aboutPhotos[1] ? <figure data-reveal="mask" style={d('.2s')}><PhotoImg id={site.aboutPhotos[1]} sizes="(max-width: 900px) 45vw, 22vw" /></figure> : null}
          </div>
          <div className="intro__body">
            {site.about.map((p, i) => (
              <p className="intro__text" data-reveal="" key={i} style={i ? { marginTop: '1em' } : undefined}>{p}</p>
            ))}
            <p data-reveal="" style={d('.1s')}><a className="link-arrow green" href={page('awards')}>The award categories <Arrow /></a></p>
          </div>
        </div>
      </section>

      <section className="section section--forest">
        <div className="container">
          <div className="mission__pair">
            <div className="mission__item" data-reveal=""><h2 className="mission__title">Our mission</h2><p>{site.mission}</p></div>
            <div className="mission__item" data-reveal="" style={d('.12s')}><h2 className="mission__title">Our vision</h2><p>{site.vision}</p></div>
          </div>
        </div>
      </section>

      <section className="section section--light on-light" aria-labelledby="journey">
        <div className="container">
          <div className="section-head">
            <h2 className="h2" id="journey" data-reveal="">{rich(site.journeyTitle)}</h2>
            <div className="prose" data-reveal="" style={d('.1s')}>
              {editions.slice(0, 2).map((e) => <p key={e.year}>{e.summary}</p>)}
            </div>
          </div>
          <ol className="timeline" role="list" data-reveal="">
            {editions.map((e) => (
              <li key={e.year}>
                <a className="timeline__link" href={page('editions', 'nida-' + e.year)}>
                  <span className="timeline__year">{e.year}</span>
                  <span><b>{e.ordinal} · {e.date}</b><span>{e.venue}, {e.city}</span></span>
                  <span className="timeline__go" aria-hidden="true"><Arrow /></span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--ivory on-light" aria-labelledby="experience">
        <div className="container">
          <div className="section-head"><h2 className="h2" id="experience" data-reveal="">{rich(site.experienceTitle)}</h2></div>
          <ol className="experience" role="list">
            {site.experience.map((x, i) => (
              <li key={x.title} data-reveal="" style={d(`${i * 0.06}s`)}><h3>{x.title}</h3><p>{x.text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <Organizer variant="about" />
    </SiteShell>
  );
}
