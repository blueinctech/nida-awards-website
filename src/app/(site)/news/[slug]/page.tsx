import { notFound } from 'next/navigation';
import SiteShell from '@/components/SiteShell';
import ShareBar from '@/components/ShareBar';
import { MediaImg } from '@/components/images';
import { Prev } from '@/components/icons';
import { SITE_URL, absolute, fmtDate, page, postUrl } from '@/lib/data';
import { renderMarkdown } from '@/lib/markdown';
import { getPublishedData, getSite } from '@/lib/server/content';
import { pageMetadata } from '@/lib/meta';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = true;
export async function generateStaticParams() {
  return (await getPublishedData()).posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const data = await getPublishedData();
  const { slug } = await params;
  const p = data.posts.find((x) => x.slug === slug);
  if (!p) return {};
  const img = p.imageId ? data.media[p.imageId] : undefined;
  return pageMetadata({
    slug: `news/${p.slug}`,
    title: p.title,
    description: p.excerpt || p.title,
    ogImage: img ? img.variants[Math.min(1, img.variants.length - 1)].url : undefined,
  });
}

export default async function ArticlePage({ params }: Props) {
  const s = await getSite();
  const { slug } = await params;
  const p = s.posts.find((x) => x.slug === slug);
  if (!p) notFound();
  const img = s.photo(p.imageId);
  const url = SITE_URL + postUrl(p.slug);
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: p.title,
    description: p.excerpt || undefined,
    datePublished: p.publishedAt || undefined,
    dateModified: p.updatedAt,
    image: img ? absolute(img.variants[img.variants.length - 1].url) : undefined,
    publisher: { '@type': 'Organization', name: 'NIDA, Nigerians in Diaspora Awards', url: SITE_URL },
    mainEntityOfPage: url,
  };
  return (
    <SiteShell current="news" jsonld={jsonld}>
      <article className="article">
        <header className="page-hero article__hero">
          <div className="container--narrow">
            <nav className="breadcrumb" aria-label="Breadcrumb"><ol><li><a href={page('')}>Home</a></li><li><a href={page('news')}>News</a></li><li aria-current="page">{p.title}</li></ol></nav>
            <h1 className="page-hero__title" data-reveal="">{p.title}</h1>
            <p className="article__meta" data-reveal="">{fmtDate(p.publishedAt)}{p.category ? ` · ${p.category}` : ''}</p>
          </div>
        </header>
        <div className="section section--light on-light article__body">
          <div className="container--narrow">
            {img ? <figure className="article__image"><MediaImg media={img} sizes="(max-width: 960px) 92vw, 920px" eager /></figure> : null}
            {p.excerpt ? <p className="lead article__lead">{p.excerpt}</p> : null}
            <div className="prose article__prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
            {p.tags.length ? (
              <ul className="honourees-chips article__tags" role="list" aria-label="Tags">{p.tags.map((t) => <li key={t}><span>{t}</span></li>)}</ul>
            ) : null}
            <div className="article__share"><ShareBar url={url} title={p.title} text={p.title} theme="light" label="Share this article" /></div>
            <p style={{ marginTop: '2.5rem' }}><a className="btn btn--outline-dark" href={page('news')}><Prev /><span>All news</span></a></p>
          </div>
        </div>
      </article>
    </SiteShell>
  );
}
