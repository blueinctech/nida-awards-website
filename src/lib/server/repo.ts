import 'server-only';
import { db } from './db';
import type { Awardee, Category, Edition, Media, Post, SiteSettings } from '../types';
import { legacySettings } from '../legacy';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : d ? String(d) : null);
const dateOnly = (d: unknown) => {
  if (!d) return null;
  if (d instanceof Date) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return String(d).slice(0, 10);
};

export const toMedia = (r: Row): Media => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  alt: r.alt,
  folder: r.folder,
  tags: r.tags || [],
  filename: r.filename,
  mime: r.mime,
  size: r.size,
  width: r.width,
  height: r.height,
  url: r.url,
  variants: r.variants || [],
  extra: r.extra || {},
  storage: r.storage,
  gallery: r.gallery,
  galleryYear: r.gallery_year,
  sortOrder: r.sort_order,
  createdAt: iso(r.created_at) || undefined,
});

export const toAwardee = (r: Row): Awardee => ({
  id: r.id,
  year: r.year,
  slug: r.slug,
  name: r.name,
  award: r.award,
  group: r.category_id || 'other',
  listedAs: r.listed_as || undefined,
  country: r.country || '',
  bio: r.bio || [],
  achievements: r.achievements || [],
  note: r.note || undefined,
  photoId: r.photo_id,
  isOrg: r.is_organisation,
  published: r.published,
  sortOrder: r.sort_order,
});

export const toCategory = (r: Row): Category => ({
  id: r.id,
  name: r.name,
  text: r.text,
  awards: r.awards || [],
  photo: r.photo_id,
  sortOrder: r.sort_order,
  published: r.published,
});

export const toEdition = (r: Row): Edition => ({
  id: r.id,
  year: r.year,
  title: r.title,
  ordinal: r.ordinal,
  date: r.date_label,
  startsOn: dateOnly(r.starts_on),
  venue: r.venue,
  city: r.city,
  theme: r.theme || undefined,
  summary: r.summary,
  stat: r.stat_value ? { value: r.stat_value, label: r.stat_label || '' } : undefined,
  pending: r.pending || undefined,
  ticketUrl: r.ticket_url || undefined,
  banner: r.banner_id,
  photos: r.photo_ids || [],
  published: r.published,
});

export const toPost = (r: Row): Post => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  body: r.body,
  category: r.category,
  tags: r.tags || [],
  imageId: r.image_id,
  status: r.status,
  publishedAt: iso(r.published_at),
  authorName: r.author_name || undefined,
  updatedAt: iso(r.updated_at) || '',
});

// Settings documents are merged over the launch defaults, so a field added in a later
// version of the site always has a value even in an older saved document.
function mergeDefaults<T>(defaults: T, saved: unknown): T {
  if (Array.isArray(defaults)) return (Array.isArray(saved) ? saved : defaults) as T;
  if (defaults && typeof defaults === 'object') {
    const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    const s = (saved && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
    for (const k of Object.keys(out)) if (k in s) out[k] = mergeDefaults(out[k], s[k]);
    return out as T;
  }
  return (saved === undefined || saved === null ? defaults : saved) as T;
}

export async function readSettings(which: 'draft' | 'published'): Promise<SiteSettings> {
  const [row] = await db()`select draft, published from site_settings where key = 'site'`;
  return mergeDefaults(legacySettings(), row ? row[which] : null);
}

export async function settingsMeta() {
  const [row] = await db()`select updated_at, published_at, (draft = published) as in_sync from site_settings where key = 'site'`;
  return row ? { updatedAt: iso(row.updated_at), publishedAt: iso(row.published_at), inSync: row.in_sync as boolean } : null;
}

export async function loadAll(preview: boolean) {
  const sql = db();
  const [settings, cats, aws, eds, media, posts] = await Promise.all([
    readSettings(preview ? 'draft' : 'published'),
    sql`select * from award_categories ${preview ? sql`` : sql`where published`} order by sort_order, name`,
    sql`select * from awardees ${preview ? sql`` : sql`where published`} order by sort_order, year desc, name`,
    sql`select * from events ${preview ? sql`` : sql`where published`} order by year`,
    sql`select * from media where kind = 'image' order by sort_order, created_at`,
    sql`select p.*, u.name as author_name from posts p left join admin_users u on u.id = p.author_id
        ${preview ? sql`` : sql`where p.status = 'published' and p.published_at <= now()`}
        order by coalesce(p.published_at, p.updated_at) desc`,
  ]);
  return {
    settings,
    categories: cats.map(toCategory),
    awardees: aws.map(toAwardee),
    editions: eds.map(toEdition),
    media: media.map(toMedia),
    posts: posts.map(toPost),
  };
}
