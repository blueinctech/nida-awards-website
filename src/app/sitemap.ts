import type { MetadataRoute } from 'next';
import { awardees, site } from '@/lib/data';

export const dynamic = 'force-static';

const PAGES = ['', 'about-nida', 'awards', 'awardees', 'editions', 'gallery', 'nomination', 'contact'];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString().slice(0, 10);
  return [
    ...PAGES.map((slug) => ({ url: `${site.url}/${slug ? slug + '/' : ''}`, lastModified })),
    ...awardees.map((a) => ({ url: `${site.url}/awardees/${a.slug}/`, lastModified })),
  ];
}
