import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/data';
import { getPublishedData } from '@/lib/server/content';

const PAGES = ['', 'about-nida', 'awards', 'awardees', 'editions', 'gallery', 'nomination', 'contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getPublishedData();
  // Only real edit dates are given: search engines stop trusting lastmod when every page claims "today"
  const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);
  const latestPost = data.posts.map((p) => p.updatedAt || p.publishedAt || '').sort().pop();
  return [
    ...PAGES.map((slug) => ({ url: `${SITE_URL}/${slug ? slug + '/' : ''}` })),
    ...(data.posts.length ? [{ url: `${SITE_URL}/news/`, lastModified: day(latestPost) }] : []),
    ...data.awardees.map((a) => ({ url: `${SITE_URL}/awardees/${a.slug}/` })),
    ...data.posts.map((p) => ({ url: `${SITE_URL}/news/${p.slug}/`, lastModified: day(p.updatedAt || p.publishedAt) })),
  ];
}
