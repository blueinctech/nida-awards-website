import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import { Phones } from '@/components/Organizer';
import { SocialLinks } from '@/components/Header';
import { Arrow } from '@/components/icons';
import { d } from '@/lib/data';
import { getSite } from '@/lib/server/content';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'contact',
  title: 'Contact',
  description: 'Contact the Nigerians in Diaspora Awards (NIDA) and its organiser, Friends of Nigeria (FON) Europe, in Paris.',
  ogImage: 'og-default.jpg',
});

// Messages are stored in /admin/messages. If the admin switches the form to "email app", or no
// database is configured, the form opens the visitor's email app instead (main.js).
export default async function ContactPage() {
  const { site } = await getSite();
  const c = site.contact;
  const o = site.organizer;
  const hero = site.pages.contact;
  const endpoint = c.formMode === 'cms' ? '/api/contact/' : '';
  const formAttrs = endpoint ? { action: endpoint, method: 'post', 'data-ajax-form': '' } : { 'data-mailto-form': c.email };
  return (
    <SiteShell current="contact">
      <PageHero title={hero.title} crumbs="Contact" lead={hero.lead} photo={hero.photo} />
      <section className="section section--light on-light">
        <div className="container contact-grid">
          <div>
            <div className="contact-card" data-reveal="">
              <h2>NIDA</h2>
              <dl>
                <div><dt>Email</dt><dd><a className="text-link" href={`mailto:${c.email}`}>{c.email}</a></dd></div>
                <div><dt>Telephone</dt><dd><Phones list={c.phones} /></dd></div>
              </dl>
            </div>
            <div className="contact-card" data-reveal="" style={d('.08s')}>
              <h2>{o.name}</h2>
              <dl>
                <div><dt>Head office</dt><dd>{o.address}</dd></div>
                <div><dt>Email</dt><dd><a className="text-link" href={`mailto:${o.email}`}>{o.email}</a></dd></div>
                <div><dt>Telephone</dt><dd><Phones list={o.phones} /></dd></div>
                <div><dt>Website</dt><dd><a className="text-link" href={o.url} target="_blank" rel="noopener">{o.urlLabel}</a></dd></div>
              </dl>
            </div>
            <div className="contact-card" data-reveal="" style={d('.16s')}>
              <h2>Follow NIDA</h2>
              <div className="social" style={{ '--x': 0 } as React.CSSProperties}>
                <SocialLinks style={{ color: 'var(--color-forest)', borderColor: 'rgb(var(--rgb-ink) / .2)' }} />
              </div>
            </div>
          </div>
          <div data-reveal="">
            <h2 className="h2">Send us a message</h2>
            <form className="form" style={{ marginTop: '2rem' }} {...formAttrs} noValidate data-success="Thank you. Your message has been sent.">
              <p className="field__hint">
                Fields marked <span className="req">*</span> are required.{endpoint ? null : ` Sending opens your email app with your message addressed to ${c.email}.`}
              </p>
              <div className="form__row">
                <div className="field"><label htmlFor="c-name">Full name</label><input id="c-name" name="name" autoComplete="name" /></div>
                <div className="field"><label htmlFor="c-email">Email <span className="req">*</span></label><input id="c-email" name="email" type="email" required autoComplete="email" aria-describedby="c-email-err" /><p className="field__error" id="c-email-err" data-error=""></p></div>
              </div>
              <div className="field"><label htmlFor="c-msg">Message <span className="req">*</span></label><textarea id="c-msg" name="message" required aria-describedby="c-msg-err"></textarea><p className="field__error" id="c-msg-err" data-error=""></p></div>
              <div className="hp" aria-hidden="true"><label htmlFor="c-hp">Leave empty</label><input id="c-hp" name="_gotcha" tabIndex={-1} autoComplete="off" /></div>
              <p className="form-status" role="status" data-form-status=""></p>
              <p><button className="btn btn--dark" type="submit">{endpoint ? 'Send message' : 'Write email'} <Arrow className="arrow" /></button></p>
            </form>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
