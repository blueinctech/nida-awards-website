import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import Organizer from '@/components/Organizer';
import { PhotoImg } from '@/components/images';
import { Arrow } from '@/components/icons';
import { d, page, site } from '@/lib/data';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'about-nida',
  title: 'About NIDA',
  description: 'The story, mission and vision of the Nigerians in Diaspora Awards (NIDA), organised in Paris by Friends of Nigeria (FON) Europe since 2023.',
  ogImage: 'og-about.jpg',
});

export default function AboutPage() {
  return (
    <SiteShell current="about-nida">
      <PageHero title="About NIDA" crumbs="About NIDA" lead="Recognising and celebrating the outstanding achievements of Nigerians living abroad across various fields." photo="2023-17" />
      <section className="section section--ivory on-light">
        <div className="container grid-12">
          <div className="intro__statement">
            <p className="statement" data-reveal="">A powerful platform to raise awareness and promote a <span className="green">positive narrative</span> about the contributions of Nigerians abroad.</p>
          </div>
          <div className="intro__media">
            <figure data-reveal="mask"><PhotoImg id="2024-39" sizes="(max-width: 900px) 90vw, 45vw" /></figure>
            <figure data-reveal="mask" style={d('.2s')}><PhotoImg id="2025-55" sizes="(max-width: 900px) 45vw, 22vw" /></figure>
          </div>
          <div className="intro__body">
            <p className="intro__text" data-reveal="">{site.about[0]}</p>
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
            <h2 className="h2" id="journey" data-reveal="">From one evening in Paris to an annual institution</h2>
            <div className="prose" data-reveal="" style={d('.1s')}>
              <p>{site.editions[0].summary}</p>
              <p>{site.editions[1].summary}</p>
            </div>
          </div>
          <ol className="timeline" role="list" data-reveal="">
            {site.editions.map((e) => (
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
          <div className="section-head"><h2 className="h2" id="experience" data-reveal="">What an evening at NIDA offers</h2></div>
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
