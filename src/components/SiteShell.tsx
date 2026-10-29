import Header from './Header';
import Footer from './Footer';

// Header, main content and footer for every page. `current` marks the active menu item.
// `jsonld` adds schema.org structured data.
export default function SiteShell({ current, jsonld, children }: { current?: string; jsonld?: object; children: React.ReactNode }) {
  return (
    <>
      {jsonld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld).replace(/</g, '\\u003c') }} /> : null}
      <Header current={current} />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
    </>
  );
}
