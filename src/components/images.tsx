// Responsive <img> helpers. The WebP files are made by tools/optimize_images.py.
import { asset, manifest, photoById } from '@/lib/data';
import wallSizesJson from '@/data/hero-wall-sizes.json';

const wallSizes = wallSizesJson as Record<string, number[]>;

type PhotoProps = { id: string; sizes?: string; className?: string; eager?: boolean; alt?: string };

export function PhotoImg({ id, sizes = '100vw', className, eager = false, alt }: PhotoProps) {
  const p = photoById[id];
  if (!p) throw new Error('Unknown photo ' + id);
  const variants = [640, 1280, 1920].map((w) => `photos/${id}-${w}.webp`).filter((k) => manifest[k]);
  const first = manifest[variants[0]];
  const srcSet = variants.map((k) => `${asset('img/' + k)} ${manifest[k].w}w`).join(', ');
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset('img/' + variants[0])}
      srcSet={srcSet}
      sizes={sizes}
      width={first.w}
      height={first.h}
      alt={alt ?? p.alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
    />
  );
}

// Largest available size of a photo, used by the lightbox
export function photoLargest(id: string) {
  const keys = [1920, 1280, 640].map((w) => `photos/${id}-${w}.webp`).filter((k) => manifest[k]);
  return asset('img/' + keys[0]);
}

type PortraitProps = { slug: string; sizes?: string; className?: string; eager?: boolean; alt?: string; [data: `data-${string}`]: string };

export function PortraitImg({ slug, sizes = '(max-width: 760px) 50vw, 300px', className, eager = false, alt = '', ...rest }: PortraitProps) {
  const s = asset(`img/awardees/${slug}-360.webp`);
  const l = asset(`img/awardees/${slug}-594.webp`);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={l}
      srcSet={`${s} 360w, ${l} 594w`}
      sizes={sizes}
      width={594}
      height={754}
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
  if (!widths) throw new Error('Unknown hero wall photo ' + id);
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
