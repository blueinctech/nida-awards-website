// Responsive <img> helpers. Images come from the media library (/admin/media): the photos the
// site launched with (made by tools/optimize_images.py) and anything uploaded since.
import { asset } from '@/lib/data';
import { getSite } from '@/lib/server/content';
import type { Img, Media } from '@/lib/types';
import wallSizesJson from '@/data/hero-wall-sizes.json';

const wallSizes = wallSizesJson as Record<string, number[]>;

const srcSetOf = (v: Img[]) => v.map((x) => `${x.url} ${x.w}w`).join(', ');

type PhotoProps = { id: string; sizes?: string; className?: string; eager?: boolean; alt?: string };

export async function PhotoImg({ id, sizes = '100vw', className, eager = false, alt }: PhotoProps) {
  const s = await getSite();
  const p = s.photo(id);
  if (!p || !p.variants.length) return null; // a deleted image simply disappears
  return <MediaImg media={p} sizes={sizes} className={className} eager={eager} alt={alt ?? p.alt} />;
}

export function MediaImg({ media, sizes = '100vw', className, eager = false, alt }: { media: Media; sizes?: string; className?: string; eager?: boolean; alt?: string }) {
  const first = media.variants[0];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={first.url}
      srcSet={srcSetOf(media.variants)}
      sizes={sizes}
      width={first.w}
      height={first.h}
      alt={alt ?? media.alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
    />
  );
}

// Largest available size of a photo, used by the lightbox
export function largest(m: Media | undefined) {
  return m ? m.variants[m.variants.length - 1]?.url || m.url : '';
}

type PortraitProps = { slug: string; sizes?: string; className?: string; eager?: boolean; alt?: string; [data: `data-${string}`]: string };

export async function PortraitImg({ slug, sizes = '(max-width: 760px) 50vw, 300px', className, eager = false, alt = '', ...rest }: PortraitProps) {
  const s = await getSite();
  const a = s.bySlug[slug];
  const m = a ? s.portrait(a) : undefined;
  const v = m ? m.extra.portrait || m.variants : [];
  if (!v.length) {
    // No photograph yet: keep the card's shape with the NIDA trophy mark
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img {...rest} src={asset('img/brand/trophy-gold.png')} width={594} height={754} alt={alt} className={className} loading="lazy" decoding="async" style={{ objectFit: 'contain', padding: '18%', background: 'var(--color-forest)' }} />
    );
  }
  const l = v[v.length - 1];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={l.url}
      srcSet={srcSetOf(v)}
      sizes={sizes}
      width={l.w}
      height={l.h}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}

// Award-night crop for the home hero wall (made by tools/make_hero_wall.py, always 3:4)
export function WallImg({ id, sizes, eager = false }: { id: string; sizes: string; eager?: boolean }) {
  const widths = wallSizes[id];
  if (!widths) return null;
  const top = widths[widths.length - 1];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(`img/hero/wall/${id}-${top}.webp`)}
      srcSet={widths.map((w) => `${asset(`img/hero/wall/${id}-${w}.webp`)} ${w}w`).join(', ')}
      sizes={sizes}
      width={top}
      height={Math.round((top * 4) / 3)}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
