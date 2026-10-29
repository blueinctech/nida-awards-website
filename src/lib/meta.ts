// Builds each page's <title>, description, canonical URL and social share tags
// (Open Graph for LinkedIn/Facebook/WhatsApp, and X/Twitter cards).
import type { Metadata } from 'next';
import { site } from './data';

type PageMeta = {
  slug: string; // '' for the home page, e.g. 'about-nida' or 'awardees/kehinde-salami'
  title: string;
  description: string;
  ogImage?: string; // file in public/assets/img/og/
  ogImageAlt?: string;
  ogType?: 'website' | 'profile';
  ogTitle?: string;
};

export function pageMetadata({ slug, title, description, ogImage, ogImageAlt, ogType = 'website', ogTitle }: PageMeta): Metadata {
  const pageUrl = site.url + '/' + (slug ? slug + '/' : '');
  const fullTitle = slug ? `${title} | NIDA, Nigerians in Diaspora Awards` : title;
  const og = site.url + '/assets/img/og/' + (ogImage || 'og-default.jpg');
  const shareTitle = ogTitle || fullTitle;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: ogType,
      siteName: 'NIDA, Nigerians in Diaspora Awards',
      title: shareTitle,
      description,
      url: pageUrl,
      images: [{ url: og, width: 1200, height: 630, type: 'image/jpeg', alt: ogImageAlt || 'NIDA, Nigerians in Diaspora Awards' }],
      locale: 'en_GB',
    },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [og] },
  };
}
