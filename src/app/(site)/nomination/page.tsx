import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import Steps from '@/components/Steps';
import NewsletterForm from '@/components/NewsletterForm';
import NominationForm from '@/components/NominationForm';
import { Arrow, Info, Star } from '@/components/icons';
import { d, page } from '@/lib/data';
import { getSite } from '@/lib/server/content';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'nomination',
  title: 'Nominations',
  description: 'How NIDA nominations work: the 2026 deadline, who can be nominated, the selection criteria, the award categories and how to be told when the NIDA 2027 call opens.',
  ogImage: 'og-nomination.jpg',
});

export default async function NominationPage() {
  const { site, cms } = await getSite();
  const n = site.nominations;
  const hero = site.pages.nomination;
  // The form is shown while nominations are open; entries are stored in /admin/nominations
  const showForm = n.open && cms;
  return (
    <SiteShell current="nomination">
      <PageHero title={hero.title} crumbs="Nomination" lead={hero.lead} photo={hero.photo} />
      <section className="section section--ivory on-light nom-status" aria-labelledby="nom-status-t">
        <div className="container nom-status__grid">
          <div className="notice" role="status">
            <Info />
            <div>
              <p className="h3" id="nom-status-t">{n.open ? `Nominations for NIDA ${n.edition} are open.` : n.statusTitle}</p>
              <p style={{ marginTop: '.75rem', color: 'var(--color-on-dark-soft)' }}>{n.open ? `Complete the form below to nominate a candidate${n.deadline ? ` by ${n.deadline}` : ''}.` : n.statusText}</p>
              <dl className="notice__facts">
                <div><dt>{n.edition} deadline</dt><dd>{n.deadline}</dd></div>
                {n.deadlineSource ? <div><dt>Source</dt><dd>{n.deadlineSource}</dd></div> : null}
                {n.open ? null : <div><dt>NIDA {site.newsletter.edition}</dt><dd>Call for nominations not yet announced</dd></div>}
              </dl>
            </div>
          </div>
          <div className="nom-status__alert">
            <h2 className="h4">Be told when nominations open</h2>
            <p>Join the NIDA mailing list to hear when the NIDA {site.newsletter.edition} call for nominations is published.</p>
            <NewsletterForm id="nom-nl" theme="light" button="Notify me" />
          </div>
        </div>
      </section>

      <section className="section section--light on-light" aria-labelledby="rules-t">
        <div className="container split">
          <div><h2 className="h2" id="rules-t" data-reveal="">Who can be nominated</h2><p className="lead" style={{ marginTop: '1.25rem' }} data-reveal="">These rules are taken from NIDA’s official 2026 nomination form and category list. The 2027 rules will be confirmed when the call opens.</p></div>
          <ul className="rule-list" role="list" data-reveal="">{n.rules.map((r) => <li key={r}><Star /><span>{r}</span></li>)}</ul>
        </div>
      </section>

      <section className="section section--forest" aria-labelledby="process-t">
        <div className="container">
          <div className="section-head"><h2 className="h2" id="process-t" data-reveal="">How it works</h2></div>
          <Steps />
        </div>
      </section>

      <section className="section section--ivory on-light" aria-labelledby="criteria-t">
        <div className="container">
          <div className="section-head"><h2 className="h2" id="criteria-t" data-reveal="">What the judges look for</h2></div>
          <ul className="criteria" role="list">
            {site.criteria.map((c, i) => <li key={c.title} data-reveal="" style={d(`${i * 0.06}s`)}><h3>{c.title}</h3><p>{c.text}</p></li>)}
          </ul>
        </div>
      </section>

      <section className="section section--light on-light" aria-labelledby="cats-t">
        <div className="container split">
          <div><h2 className="h2" id="cats-t" data-reveal="">The {n.edition} nomination categories</h2><p style={{ marginTop: '1.5rem' }} data-reveal=""><a className="link-arrow green" href={page('awards')}>About each category <Arrow /></a></p></div>
          <ol className="award-list" style={{ marginTop: 0 }} data-reveal="">{n.categories.map((c) => <li key={c}>{c}</li>)}</ol>
        </div>
      </section>

      <section className="section section--ivory on-light" aria-labelledby="form-t" id="form">
        {showForm ? (
          <div className="container--narrow">
            <h2 className="h2" id="form-t" data-reveal="">Nominate a candidate</h2>
            <NominationForm />
          </div>
        ) : (
          <div className="container split">
            <div>
              <h2 className="h2" id="form-t" data-reveal="">What you will need</h2>
              <p className="lead" style={{ marginTop: '1.25rem' }} data-reveal="">The 2026 nomination form asked for the following. Have it ready when the next call opens.</p>
            </div>
              <ul className="award-list" style={{ marginTop: 0 }} data-reveal="">
                <li>Your email, full name, country of residence and WhatsApp number</li>
                <li>The award category</li>
                <li>The nominee’s name, email address, phone number and country of residence</li>
                <li>What is special about the nominee’s work</li>
                <li>Their accomplishments and impact: how their work makes a difference</li>
                <li>Links to articles, websites, LinkedIn or social media profiles</li>
              </ul>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
