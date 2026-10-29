import SiteShell from '@/components/SiteShell';
import { Arrow, Star } from '@/components/icons';
import { page } from '@/lib/data';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({ slug: '404', title: 'Page not found', description: 'This page could not be found.' });

// Exported as out/404.html; .htaccess serves it for unknown addresses.
export default function NotFound() {
  return (
    <SiteShell>
      <section className="finale" style={{ minHeight: '70svh', display: 'grid', alignItems: 'center' }}>
        <div className="container">
          <div className="finale__star gold"><Star /></div>
          <h1 className="finale__title"><span>Page</span><span className="gold-text">not found</span></h1>
          <p className="lead muted" style={{ margin: '2rem auto 0', maxWidth: '36rem' }}>The page you were looking for has moved or no longer exists.</p>
          <p style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn" href={page('')}>Back to home <Arrow className="arrow" /></a>
            <a className="btn btn--ghost" href={page('awardees')}>Meet the awardees</a>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
