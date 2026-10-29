import { page } from '@/lib/data';
import { PhotoImg } from './images';

const d = (v: string) => ({ '--d': v }) as React.CSSProperties;

export default function PageHero({ title, lead, photo, crumbs }: { title: string; lead?: string; photo?: string; crumbs?: string }) {
  return (
    <section className="page-hero">
      {photo ? <div className="page-hero__bg"><PhotoImg id={photo} eager alt="" /></div> : null}
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb"><ol><li><a href={page('')}>Home</a></li><li aria-current="page">{crumbs || title}</li></ol></nav>
        <h1 className="page-hero__title" data-reveal="">{title}</h1>
        {lead ? <p className="page-hero__lead" data-reveal="" style={d('.1s')}>{lead}</p> : null}
      </div>
    </section>
  );
}
