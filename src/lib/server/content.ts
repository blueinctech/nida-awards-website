import 'server-only';
import { cache } from 'react';
import { draftMode } from 'next/headers';
import { hasDatabase } from './db';
import { loadAll } from './repo';
import { legacyAwardees, legacyCategories, legacyEditions, legacyMedia, legacySettings } from '../legacy';
import type { Awardee, Media, SiteData } from '../types';
import { currentAdmin } from './auth';

// Everything a public page needs, read once per request (or once per static render).
// Published content only, unless an signed-in administrator has turned on preview.
async function load(preview: boolean): Promise<SiteData> {
  if (!hasDatabase()) {
    // No database configured: show the content the site launched with. Forms fall back to email.
    const settings = legacySettings();
    settings.contact.formMode = 'mailto';
    settings.newsletter.mode = 'mailto';
    const media = legacyMedia();
    return {
      preview: false,
      cms: false,
      settings,
      categories: legacyCategories(),
      awardees: legacyAwardees(),
      editions: legacyEditions(),
      media: Object.fromEntries(media.map((m) => [m.id, m])),
      gallery: media.filter((m) => m.gallery).sort((a, b) => (b.galleryYear || 0) - (a.galleryYear || 0) || a.sortOrder - b.sortOrder),
      posts: [],
    };
  }
  const all = await loadAll(preview);
  return {
    preview,
    cms: true,
    settings: all.settings,
    categories: all.categories,
    awardees: all.awardees,
    editions: all.editions,
    media: Object.fromEntries(all.media.map((m) => [m.id, m])),
    gallery: all.media.filter((m) => m.gallery).sort((a, b) => (b.galleryYear || 0) - (a.galleryYear || 0) || a.sortOrder - b.sortOrder),
    posts: all.posts,
  };
}

const isPreview = cache(async () => {
  let enabled = false;
  try {
    enabled = (await draftMode()).isEnabled;
  } catch {
    return false; // outside a request (static params)
  }
  if (!enabled) return false;
  // Preview shows unpublished work, so it also needs a signed-in administrator
  return Boolean(await currentAdmin());
});

export const getSiteData = cache(async (): Promise<SiteData> => load(await isPreview()));

// Published content without touching the request (for generateStaticParams, sitemap)
export const getPublishedData = cache(async (): Promise<SiteData> => load(false));

export type Site = Awaited<ReturnType<typeof getSite>>;

// Site data plus the lookups the page templates use
export const getSite = cache(async () => {
  const data = await getSiteData();
  return withHelpers(data);
});

export function withHelpers(data: SiteData) {
  const { awardees, media, settings } = data;
  const bySlug: Record<string, Awardee> = Object.fromEntries(awardees.map((a) => [a.slug, a]));
  const editions = data.editions;
  return {
    ...data,
    site: settings,
    bySlug,
    byYear: (y: number) => awardees.filter((a) => a.year === y),
    photo: (id: string | null | undefined): Media | undefined => (id ? media[id] : undefined),
    portrait: (a: Awardee): Media | undefined => (a.photoId ? media[a.photoId] : undefined),
    edition: (y: number) => editions.find((e) => e.year === y),
    category: (id: string) => data.categories.find((c) => c.id === id),
    people: awardees.filter((a) => !a.isOrg).length,
  };
}
