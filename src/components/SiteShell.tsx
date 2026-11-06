import Header from './Header';
import Footer from './Footer';
import { getSite } from '@/lib/server/content';

// Header, main content and footer for every page. `current` marks the active menu item.
// `jsonld` adds schema.org structured data.
export default async function SiteShell({ current, jsonld, children }: { current?: string; jsonld?: object; children: React.ReactNode }) {
  const { site, preview } = await getSite();
  const a = site.announcement;
  return (
    <>
      {jsonld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld).replace(/</g, '\\u003c') }} /> : null}
      {preview ? (
        <div className="preview-bar" role="status">
          <span><b>Preview</b> You are seeing unpublished changes. Visitors do not see them yet.</span>
          <a href="/api/admin/preview/exit/">Exit preview</a>
          <a href="/admin/">Back to admin</a>
        </div>
      ) : null}
      <Header current={current} />
      {a.enabled && a.text ? (
        <div className="announce-bar" role="region" aria-label="Announcement">
          <p className="container announce-bar__inner">
            <span>{a.text}</span>
            {a.linkUrl ? <a href={a.linkUrl}>{a.linkLabel || 'Find out more'}</a> : null}
          </p>
        </div>
      ) : null}
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
    </>
  );
}
