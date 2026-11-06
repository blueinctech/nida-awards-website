// The "Website content" screens: which settings each tab edits, and how.
// Headings marked "accent" accept [[words]] to show those words in the NIDA accent colour.

type Base = { path: string; label: string; hint?: string; required?: boolean };
export type SubField = { key: string; label: string; type: 'text' | 'textarea' | 'image'; max?: number; kind?: 'url' | 'email'; required?: boolean };
export type FieldDef =
  | (Base & { type: 'text'; max?: number; kind?: 'url' | 'email'; accent?: boolean })
  | (Base & { type: 'textarea'; rows?: number; max?: number; accent?: boolean })
  | (Base & { type: 'lines' | 'paras'; rows?: number; maxItems?: number })
  | (Base & { type: 'number'; min: number; max: number })
  | (Base & { type: 'bool' })
  | (Base & { type: 'select'; options: [string, string][] })
  | (Base & { type: 'image' })
  | (Base & { type: 'images'; maxItems?: number })
  | (Base & { type: 'group'; fields: SubField[]; itemLabel: string; maxItems?: number });

export type Section = { title: string; description?: string; preview?: string; fields: FieldDef[] };
export type Tab = { id: string; label: string; sections: Section[] };

const ACCENT = 'Put [[double brackets]] around words to show them in the accent colour.';

const hero = (page: string, label: string, path: string): Section => ({
  title: `${label} page header`,
  preview: path,
  fields: [
    { path: `pages.${page}.title`, label: 'Title', type: 'text', max: 120, required: true },
    { path: `pages.${page}.lead`, label: 'Introduction', type: 'textarea', rows: 3, max: 400, ...(page === 'awardees' ? { hint: '{people} is replaced by the number of honourees (people, not organisations).' } : {}) },
    { path: `pages.${page}.photo`, label: 'Background photo', type: 'image' },
  ],
});

export const TABS: Tab[] = [
  {
    id: 'home',
    label: 'Home page',
    sections: [
      {
        title: 'Hero',
        preview: '/',
        fields: [
          { path: 'home.heroLine1', label: 'Headline, first line', type: 'text', max: 80, required: true },
          { path: 'home.heroLine2', label: 'Headline, second line', type: 'text', max: 80, hint: 'Words in [[double brackets]] are shown in gold italics.' },
          { path: 'home.heroLead', label: 'Introduction', type: 'textarea', rows: 3, max: 300 },
          { path: 'home.heroPrimary', label: 'Main button label (links to the awardees)', type: 'text', max: 40 },
          { path: 'home.heroSecondary', label: 'Second button label (links to Save the date)', type: 'text', max: 40 },
          { path: 'home.heroImage', label: 'Background banner', type: 'image', hint: 'Shown behind the headline under green overlays. Use a wide photo (at least 1600 pixels).' },
        ],
      },
      {
        title: 'Introduction and key figures',
        fields: [
          { path: 'home.introTitle', label: 'Heading', type: 'text', max: 100 },
          { path: 'home.introTitleSub', label: 'Heading, second part (lighter)', type: 'text', max: 100 },
          { path: 'home.introLead', label: 'Lead sentence', type: 'textarea', rows: 2, max: 300, accent: true, hint: 'Words in [[double brackets]] are shown in gold.' },
          { path: 'home.facts', label: 'Key figures', type: 'group', itemLabel: 'Figure', maxItems: 6, hint: '{awardees} and {editions} are replaced by the live counts.', fields: [{ key: 'value', label: 'Figure', type: 'text', max: 20, required: true }, { key: 'label', label: 'Description', type: 'text', max: 160 }] },
        ],
      },
      {
        title: 'Mission and guests',
        fields: [
          { path: 'home.missionTitle', label: 'Heading', type: 'text', max: 100, accent: true, hint: ACCENT },
          { path: 'home.missionLead', label: 'Paragraph', type: 'textarea', rows: 3, max: 500 },
          { path: 'home.attendeesTitle', label: 'Guests heading', type: 'text', max: 80 },
          { path: 'home.attendeesIntro', label: 'Guests introduction', type: 'text', max: 200 },
          { path: 'home.attendees', label: 'Guests (one per line)', type: 'lines', rows: 6, maxItems: 12, hint: 'Leave empty to hide the guests list.' },
        ],
      },
      {
        title: 'Award categories section',
        fields: [
          { path: 'home.categoriesTitle', label: 'Heading', type: 'textarea', rows: 2, max: 120, accent: true, hint: ACCENT + ' A new line starts a new line.' },
          { path: 'home.categoriesLead', label: 'Paragraph', type: 'textarea', rows: 3, max: 400 },
        ],
      },
      {
        title: 'Featured honourees',
        fields: [
          { path: 'home.featuredYear', label: 'Edition to feature', type: 'number', min: 2023, max: 2100, hint: 'The honourees of this year are shown, with tabs.' },
          { path: 'home.featuredTitle', label: 'Heading', type: 'text', max: 100, accent: true, hint: 'Words in [[double brackets]] are shown in gold.' },
          { path: 'home.featuredLead', label: 'Paragraph', type: 'textarea', rows: 3, max: 400 },
        ],
      },
      {
        title: 'Photo mosaic',
        fields: [
          { path: 'home.galleryTitle', label: 'Heading', type: 'text', max: 120, accent: true, hint: 'Words in [[double brackets]] are shown in gold.' },
          { path: 'home.galleryLead', label: 'Paragraph', type: 'textarea', rows: 3, max: 400 },
          { path: 'home.mosaic', label: 'Photos (8 look best)', type: 'images', maxItems: 12 },
          { path: 'home.galleryFoot', label: 'Caption under the photos', type: 'text', max: 160 },
        ],
      },
      {
        title: 'Editions and Save the date',
        fields: [
          { path: 'home.editionsTitle', label: 'Editions heading', type: 'text', max: 100, accent: true, hint: ACCENT },
          { path: 'home.editionsLead', label: 'Editions paragraph', type: 'textarea', rows: 3, max: 400 },
          { path: 'home.editionsOpenYear', label: 'Edition open by default', type: 'number', min: 2023, max: 2100 },
          { path: 'home.saveDateLead', label: 'Save the date paragraph', type: 'textarea', rows: 3, max: 400, hint: '{edition} is replaced by the next edition’s year (set under Forms).' },
        ],
      },
    ],
  },
  {
    id: 'about',
    label: 'About us',
    sections: [
      hero('about', 'About', '/about-nida/'),
      {
        title: 'Story',
        preview: '/about-nida/',
        fields: [
          { path: 'aboutStatement', label: 'Statement', type: 'textarea', rows: 3, max: 300, accent: true, hint: ACCENT },
          { path: 'about', label: 'Introduction (also shown on the home page)', type: 'paras', rows: 6, maxItems: 6, hint: 'Leave an empty line between paragraphs.' },
          { path: 'aboutPhotos', label: 'Photos beside the story (2)', type: 'images', maxItems: 2 },
          { path: 'mission', label: 'Our mission', type: 'textarea', rows: 3, max: 600, required: true },
          { path: 'vision', label: 'Our vision', type: 'textarea', rows: 3, max: 600, required: true },
          { path: 'journeyTitle', label: 'History heading (the first two editions’ summaries follow)', type: 'text', max: 120, accent: true },
        ],
      },
      {
        title: 'What an evening offers',
        fields: [
          { path: 'experienceTitle', label: 'Heading', type: 'text', max: 120, accent: true },
          { path: 'experience', label: 'Highlights', type: 'group', itemLabel: 'Highlight', maxItems: 10, fields: [{ key: 'title', label: 'Title', type: 'text', max: 80, required: true }, { key: 'text', label: 'Text', type: 'textarea', max: 500 }] },
        ],
      },
      {
        title: 'The organiser',
        fields: [
          { path: 'organizer.name', label: 'Name', type: 'text', max: 120, required: true },
          { path: 'organizer.summary', label: 'About the organiser', type: 'textarea', rows: 4, max: 1200 },
          { path: 'organizer.network', label: 'Second paragraph', type: 'textarea', rows: 3, max: 1200 },
        ],
      },
    ],
  },
  {
    id: 'awards',
    label: 'Awards & nominations',
    sections: [
      hero('awards', 'Awards', '/awards/'),
      {
        title: 'Selection process',
        preview: '/awards/',
        fields: [
          { path: 'processLead', label: 'Introduction', type: 'textarea', rows: 2, max: 400 },
          { path: 'process', label: 'Steps', type: 'group', itemLabel: 'Step', maxItems: 6, fields: [{ key: 'title', label: 'Title', type: 'text', max: 80, required: true }, { key: 'text', label: 'Text', type: 'textarea', max: 400 }] },
          { path: 'criteria', label: 'Judging criteria', type: 'group', itemLabel: 'Criterion', maxItems: 8, fields: [{ key: 'title', label: 'Title', type: 'text', max: 80, required: true }, { key: 'text', label: 'Text', type: 'textarea', max: 400 }] },
          { path: 'otherHonours.name', label: '“Other honours” heading', type: 'text', max: 80 },
          { path: 'otherHonours.text', label: '“Other honours” text', type: 'textarea', rows: 3, max: 500 },
        ],
      },
      {
        title: 'Nominations',
        description: 'While nominations are open, the nomination page shows the form and entries arrive in Nominations.',
        preview: '/nomination/',
        fields: [
          { path: 'nominations.open', label: 'Nominations are open (show the form)', type: 'bool' },
          { path: 'nominations.edition', label: 'Edition', type: 'number', min: 2023, max: 2100 },
          { path: 'nominations.deadline', label: 'Deadline (as shown)', type: 'text', max: 80, hint: 'For example: 7 July 2026 (CET)' },
          { path: 'nominations.deadlineSource', label: 'Source of the deadline', type: 'text', max: 160 },
          { path: 'nominations.statusTitle', label: 'Message while closed: title', type: 'text', max: 200 },
          { path: 'nominations.statusText', label: 'Message while closed: text', type: 'textarea', rows: 3, max: 600 },
          { path: 'nominations.categories', label: 'Categories in the form (one per line)', type: 'lines', rows: 8, maxItems: 40 },
          { path: 'nominations.rules', label: 'Who can be nominated (one rule per line)', type: 'lines', rows: 6, maxItems: 20 },
          { path: 'nominations.acceptFiles', label: 'Let nominators attach a photo and documents', type: 'bool' },
        ],
      },
      hero('nomination', 'Nomination', '/nomination/'),
    ],
  },
  {
    id: 'contact',
    label: 'Contact & forms',
    sections: [
      {
        title: 'NIDA contact details',
        description: 'Shown on the contact page and in the footer.',
        preview: '/contact/',
        fields: [
          { path: 'contact.email', label: 'Email', type: 'text', kind: 'email', max: 200, required: true },
          { path: 'contact.phones', label: 'Telephone numbers (one per line)', type: 'lines', rows: 3, maxItems: 5 },
          { path: 'social', label: 'Social media', type: 'group', itemLabel: 'Profile', maxItems: 6, hint: 'Icons exist for LinkedIn, Instagram, Facebook, X and WhatsApp; other networks get a link icon.', fields: [{ key: 'name', label: 'Network', type: 'text', max: 30, required: true }, { key: 'url', label: 'Address', type: 'text', kind: 'url', max: 300, required: true }] },
        ],
      },
      {
        title: 'Organiser contact details',
        fields: [
          { path: 'organizer.email', label: 'Email', type: 'text', kind: 'email', max: 200 },
          { path: 'organizer.phones', label: 'Telephone numbers (one per line)', type: 'lines', rows: 3, maxItems: 5 },
          { path: 'organizer.address', label: 'Head office address', type: 'text', max: 200 },
          { path: 'organizer.url', label: 'Website address', type: 'text', kind: 'url', max: 200 },
          { path: 'organizer.urlLabel', label: 'Website as shown', type: 'text', max: 100 },
        ],
      },
      {
        title: 'Forms',
        fields: [
          { path: 'contact.formMode', label: 'Contact form', type: 'select', options: [['cms', 'Store messages in the admin (Messages)'], ['mailto', 'Open the visitor’s email app']] },
          { path: 'newsletter.mode', label: '“Save the date” mailing list', type: 'select', options: [['cms', 'Store sign-ups in the admin (Messages → Mailing list)'], ['mailto', 'Open the visitor’s email app']] },
          { path: 'newsletter.edition', label: 'Next edition (year shown in “Save the date”)', type: 'number', min: 2023, max: 2100 },
          { path: 'newsletter.email', label: 'Email for mailing-list requests (email app mode)', type: 'text', kind: 'email', max: 200 },
          { path: 'notifyEmail', label: 'Send an alert to this address for each new nomination or message', type: 'text', kind: 'email', max: 200, hint: 'Needs email sending to be set up (see System). Leave empty for no alerts.' },
        ],
      },
      hero('contact', 'Contact', '/contact/'),
    ],
  },
  {
    id: 'footer',
    label: 'Footer & sponsors',
    sections: [
      {
        title: 'Footer',
        preview: '/',
        fields: [
          { path: 'footer.tagline', label: 'Text under the logo', type: 'textarea', rows: 2, max: 300, hint: '{organiser} is replaced by the organiser’s name.' },
          { path: 'footer.saveDateLabel', label: '“Save the date” link text', type: 'text', max: 80, hint: '{edition} is replaced by the next edition’s year.' },
          { path: 'footer.copyright', label: 'Copyright line', type: 'text', max: 200, hint: '{year} is replaced by the current year.' },
          { path: 'footer.creditLabel', label: 'Website credit (name)', type: 'text', max: 80, hint: 'Leave empty to hide the credit.' },
          { path: 'footer.creditUrl', label: 'Website credit (address)', type: 'text', kind: 'url', max: 200 },
        ],
      },
      {
        title: 'Sponsors',
        description: 'Logos shown with the organiser on the home page.',
        fields: [{ path: 'sponsors', label: 'Sponsors', type: 'group', itemLabel: 'Sponsor', maxItems: 12, fields: [{ key: 'name', label: 'Name', type: 'text', max: 80, required: true }, { key: 'logo', label: 'Logo', type: 'image' }] }],
      },
    ],
  },
  {
    id: 'announcement',
    label: 'Announcement',
    sections: [
      {
        title: 'Site-wide announcement',
        description: 'A gold bar under the menu on every page, for important news (for example: “Nominations for NIDA 2027 are open”).',
        preview: '/',
        fields: [
          { path: 'announcement.enabled', label: 'Show the announcement', type: 'bool' },
          { path: 'announcement.text', label: 'Text', type: 'text', max: 200 },
          { path: 'announcement.linkLabel', label: 'Link text', type: 'text', max: 40 },
          { path: 'announcement.linkUrl', label: 'Link address', type: 'text', kind: 'url', max: 300, hint: 'A page of this site (for example /nomination/) or a full web address.' },
        ],
      },
    ],
  },
  {
    id: 'pages',
    label: 'Page headers & SEO',
    sections: [
      hero('awardees', 'Awardees', '/awardees/'),
      hero('editions', 'Editions', '/editions/'),
      hero('gallery', 'Gallery', '/gallery/'),
      hero('news', 'News', '/news/'),
      {
        title: 'Search engines',
        fields: [{ path: 'description', label: 'Site description', type: 'textarea', rows: 3, max: 300, hint: 'Used where a page has no description of its own.' }],
      },
    ],
  },
];

// ---------- reading and writing settings by path ----------
/* eslint-disable @typescript-eslint/no-explicit-any */
export function getPath(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
export function setPath(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (o[k] == null || typeof o[k] !== 'object') o[k] = {};
    o = o[k];
  }
  o[keys[keys.length - 1]] = value;
}
