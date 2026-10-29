// Content helpers shared by every page. All text lives in src/data/.
import site from '@/data/site';
import awardeesJson from '@/data/awardees.json';
import photosJson from '@/data/photos.json';
import manifestJson from '@/data/manifest.json';

export { site };

export interface Awardee {
  year: number;
  slug: string;
  name: string;
  award: string;
  group: string;
  listedAs?: string;
  bio: string[];
  note?: string;
}
export interface Photo {
  id: string;
  src: string;
  year: string;
  alt: string;
}

export const awardees = awardeesJson as Awardee[];
export const photos = photosJson as Photo[];
export const manifest = manifestJson as Record<string, { w: number; h: number }>;

export const photoById: Record<string, Photo> = Object.fromEntries(photos.map((p) => [p.id, p]));
export const bySlug: Record<string, Awardee> = Object.fromEntries(awardees.map((a) => [a.slug, a]));

export const byYear = (y: number) => awardees.filter((a) => a.year === y);

// Names with accented letters are set in the body font: the Nord display font has no accents.
export const hasAccents = (s: string) => /[^\u0000-ɏ]|[À-ÿ]/.test(s) && /[À-ÿ]/.test(s);

// Award title without the bracketed detail, e.g. "Male Professional of the Year"
export const shortAward = (a: Awardee) => a.award.replace(/ \(.*\)/, '');

// ---------- URLs (root-absolute, with trailing slashes like the published site) ----------
export const asset = (p: string) => '/assets/' + p;
export const page = (slug = '', hash = '') => (slug ? '/' + slug + '/' : '/') + (hash ? '#' + hash : '');
export const awardeeUrl = (slug: string) => '/awardees/' + slug + '/';
export const absolute = (path: string) => site.url + path;

// Phone numbers as tel: links
export const tel = (p: string) => 'tel:' + p.replace(/\s/g, '');

// Style helper for the reveal delay custom property: style={d('.1s')} -> style="--d:.1s"
export const d = (v: string) => ({ '--d': v }) as React.CSSProperties;
