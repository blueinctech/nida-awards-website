import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/data';
import { getPublishedData } from '@/lib/server/content';

const PAGES = ['', 'about-nida', 'awards', 'awardees', 'editions', 'gallery', 'nomination', 'contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getPublishedData();
  const lastModified = new Date().toISOString().slice(0, 10);
  return [
    ...PAGES.map((slug) => ({ url: `${SITE_URL}/${slug ? slug + '/' : ''}`, lastModified })),
    ...(data.posts.length ? [{ url: `${SITE_URL}/news/`, lastModified }] : []),
    ...data.awardees.map((a) => ({ url: `${SITE_URL}/awardees/${a.slug}/`, lastModified })),
    ...data.posts.map((p) => ({ url: `${SITE_URL}/news/${p.slug}/`, lastModified: (p.updatedAt || lastModified).slice(0, 10) })),
  ];
}
