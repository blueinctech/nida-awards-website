// Shapes shared by the public site, the admin dashboard and the database layer.

export type Img = { url: string; w: number; h: number };

export interface Media {
  id: string;
  kind: 'image' | 'document';
  title: string;
  alt: string;
  folder: string;
  tags: string[];
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
  variants: Img[]; // smallest first
  extra: { og?: string; faces?: Img[]; portrait?: Img[]; keys?: string[] };
  storage: 'static' | 'blob' | 'local';
  gallery: boolean;
  galleryYear: number | null;
  sortOrder: number;
  createdAt?: string;
}

export interface Awardee {
  id?: string;
  year: number;
  slug: string;
  name: string;
  award: string;
  group: string; // category id, or 'other'
  listedAs?: string;
  country: string;
  bio: string[];
  achievements: string[];
  note?: string;
  photoId: string | null;
  isOrg: boolean;
  published: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  text: string;
  awards: string[];
  photo: string | null;
  sortOrder: number;
  published: boolean;
}

export interface Edition {
  id?: string;
  year: number;
  title: string;
  ordinal: string;
  date: string; // as shown, e.g. "Saturday 6 December 2025"
  startsOn: string | null; // ISO date
  venue: string;
  city: string;
  theme?: string;
  summary: string;
  stat?: { value: string; label: string };
  pending?: string;
  ticketUrl?: string;
  banner: string | null;
  photos: string[];
  published: boolean;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  imageId: string | null;
  status: 'draft' | 'published';
  publishedAt: string | null;
  authorName?: string;
  updatedAt: string;
}

export type TitleText = { title: string; text: string };
export type PageHeroSettings = { title: string; lead: string; photo: string };

// Everything an administrator edits on the "Website content" screens.
// Headings may contain [[highlighted words]], shown in the brand accent colour.
export interface SiteSettings {
  name: string;
  shortName: string;
  url: string;
  description: string;

  announcement: { enabled: boolean; text: string; linkLabel: string; linkUrl: string };

  home: {
    heroLine1: string;
    heroLine2: string;
    heroLead: string;
    heroPrimary: string;
    heroSecondary: string;
    heroImage: string;
    introTitle: string;
    introTitleSub: string;
    introLead: string;
    facts: { value: string; label: string }[];
    missionTitle: string;
    missionLead: string;
    attendeesTitle: string;
    attendeesIntro: string;
    attendees: string[];
    categoriesTitle: string;
    categoriesLead: string;
    featuredYear: number;
    featuredTitle: string;
    featuredLead: string;
    galleryTitle: string;
    galleryLead: string;
    galleryFoot: string;
    mosaic: string[];
    editionsTitle: string;
    editionsLead: string;
    editionsOpenYear: number;
    saveDateLead: string;
  };

  pages: Record<'about' | 'awards' | 'awardees' | 'editions' | 'gallery' | 'nomination' | 'contact' | 'news', PageHeroSettings>;

  about: string[];
  aboutStatement: string;
  aboutPhotos: string[];
  mission: string;
  vision: string;
  journeyTitle: string;
  experienceTitle: string;
  experience: TitleText[];

  otherHonours: { id: string; name: string; text: string };
  process: TitleText[];
  processLead: string;
  criteria: TitleText[];

  nominations: {
    open: boolean;
    edition: number;
    deadline: string;
    deadlineSource: string;
    statusTitle: string;
    statusText: string;
    rules: string[];
    categories: string[];
    acceptFiles: boolean;
  };

  newsletter: { mode: 'cms' | 'mailto'; email: string; edition: number };
  contact: { formMode: 'cms' | 'mailto'; email: string; phones: string[] };
  notifyEmail: string; // where new nominations and messages are announced, if email sending is set up

  organizer: {
    name: string;
    url: string;
    urlLabel: string;
    email: string;
    phones: string[];
    address: string;
    summary: string;
    network: string;
  };

  social: { name: string; url: string }[];
  sponsors: { name: string; logo: string }[]; // logo = media id

  footer: { tagline: string; copyright: string; creditLabel: string; creditUrl: string; saveDateLabel: string };
}

export interface SiteData {
  preview: boolean;
  cms: boolean; // false when no database is configured
  settings: SiteSettings;
  categories: Category[];
  awardees: Awardee[];
  editions: Edition[];
  media: Record<string, Media>;
  gallery: Media[];
  posts: Post[];
}
