import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import { MediaImg } from '@/components/images';
import { Arrow } from '@/components/icons';
import { d, fmtDate, postUrl } from '@/lib/data';
import { getSite } from '@/lib/server/content';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'news',
  title: 'News',
  description: 'News, announcements and stories from the Nigerians in Diaspora Awards (NIDA).',
});

// Articles published from /admin/posts, newest first
export default async function NewsPage() {
  const s = await getSite();
  const hero = s.site.pages.news;
  const posts = s.posts;
  return (
    <SiteShell current="news">
      <PageHero title={hero.title} crumbs="News" lead={hero.lead} photo={hero.photo} />
      <section className="section section--light on-light">
        <div className="container">
          {posts.length ? (
            <ul className="news-grid" role="list">
              {posts.map((p, i) => {
                const img = s.photo(p.imageId);
                return (
                  <li key={p.id} className="news-card" data-reveal="" style={d(`${(i % 3) * 0.06}s`)}>
                    <a href={postUrl(p.slug)} className="news-card__link">
                      <span className="news-card__media">{img ? <MediaImg media={img} sizes="(max-width: 760px) 92vw, 30vw" alt="" /> : null}</span>
                      <span className="news-card__meta">{fmtDate(p.publishedAt)}{p.category ? ` · ${p.category}` : ''}</span>
                      <span className="news-card__title">{p.title}</span>
                      {p.excerpt ? <span className="news-card__excerpt">{p.excerpt}</span> : null}
                      <span className="link-arrow green">Read the article <Arrow /></span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="lead">No articles have been published yet.</p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
