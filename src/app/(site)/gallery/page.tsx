import SiteShell from '@/components/SiteShell';
import PageHero from '@/components/PageHero';
import { MediaImg, largest } from '@/components/images';
import { ArrowUpRight } from '@/components/icons';
import { getSite } from '@/lib/server/content';
import { pageMetadata } from '@/lib/meta';

export const metadata = pageMetadata({
  slug: 'gallery',
  title: 'Gallery',
  description: 'Photographs from the Nigerians in Diaspora Awards (NIDA) galas in Paris, 2023 to 2025.',
  ogImage: 'og-gallery.jpg',
});

// Year filter, "Show more" batches and the lightbox are handled by main.js.
export default async function GalleryPage() {
  const { site, gallery } = await getSite();
  const hero = site.pages.gallery;
  // Photos marked "Show in gallery" in the media library, newest edition first
  const items = gallery.map((m) => ({ id: m.id, year: String(m.galleryYear || ''), alt: m.alt, m }));
  const photos = items;
  const years = [...new Set(items.map((p) => p.year).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  return (
    <SiteShell current="gallery">
      <PageHero title={hero.title} crumbs="Gallery" lead={hero.lead} photo={hero.photo} />
      <section className="section section--light on-light" style={{ paddingTop: '3rem' }}>
        <div className="container">
          <div className="filters" role="group" aria-label="Filter photographs by edition">
            <button className="chip" type="button" aria-pressed="true" data-gallery-filter="all">All <span className="count">{photos.length}</span></button>
            {years.map((y) => (
              <button key={y} className="chip" type="button" aria-pressed="false" data-gallery-filter={y}>NIDA {y} <span className="count">{photos.filter((p) => p.year === y).length}</span></button>
            ))}
          </div>
          <ul className="gallery-grid" role="list" data-lightbox-group="" data-gallery="">
            {items.map((p) => (
              <li key={p.id} className="gallery-item" data-year={p.year} data-reveal="fade">
                <button className="gallery-item__btn" type="button" data-lightbox={largest(p.m)} data-caption={p.year ? `${p.alt} · NIDA ${p.year}` : p.alt}>
                  <MediaImg media={p.m} sizes="(max-width: 640px) 92vw, (max-width: 1000px) 46vw, 31vw" />
                  <span className="visually-hidden">Enlarge photo</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="gallery-more"><button className="btn btn--outline-dark" type="button" data-gallery-more="" hidden>Show more photos <span className="count" data-gallery-left=""></span></button></p>
          <p style={{ marginTop: '3rem' }} data-reveal=""><a className="link-arrow green" href="https://www.flickr.com/photos/157014038@N02/albums/72177720330804368/" target="_blank" rel="noopener">More NIDA 2025 gala pictures on Flickr <ArrowUpRight /><span className="visually-hidden"> (opens in a new tab)</span></a></p>
        </div>
      </section>
    </SiteShell>
  );
}
