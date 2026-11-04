// The content the site was launched with (src/data/*). It is used to fill a new, empty
// database the first time it is set up, and to render the site when no database is configured
// (for example a local preview without DATABASE_URL). After setup, the database is the only
// source of truth and everything is edited from /admin.
import legacySite from '../data/site';
import awardeesJson from '../data/awardees.json';
import photosJson from '../data/photos.json';
import manifestJson from '../data/manifest.json';
import type { Awardee, Category, Edition, Img, Media, SiteSettings } from './types';

const manifest = manifestJson as Record<string, { w: number; h: number }>;
const A = (p: string) => '/assets/img/' + p;

const FACES = ['adeola-adeleye-fasubaa', 'akinloye-bamigboye', 'chidiebere-ikejemba', 'cynthia-asije', 'hassan-aliyu', 'juliana-olayinka', 'kachi-nwanna', 'morin-oluwole', 'rasheedat-ajibade', 'tolulope-ayeni'];

const baseMedia = (m: Partial<Media> & Pick<Media, 'id' | 'url' | 'variants'>): Media => ({
  kind: 'image',
  title: '',
  alt: '',
  folder: 'general',
  tags: [],
  filename: m.url.split('/').pop() || '',
  mime: m.url.endsWith('.png') ? 'image/png' : 'image/webp',
  size: 0,
  width: m.variants[m.variants.length - 1]?.w ?? null,
  height: m.variants[m.variants.length - 1]?.h ?? null,
  extra: {},
  storage: 'static',
  gallery: false,
  galleryYear: null,
  sortOrder: 0,
  ...m,
});

export const portraitId = (slug: string) => 'portrait-' + slug;

export function legacyMedia(): Media[] {
  const out: Media[] = [];
  const photos = photosJson as { id: string; year: string; alt: string }[];
  photos.forEach((p, i) => {
    const variants: Img[] = [640, 1280, 1920]
      .map((w) => `photos/${p.id}-${w}.webp`)
      .filter((k) => manifest[k])
      .map((k) => ({ url: A(k), w: manifest[k].w, h: manifest[k].h }));
    out.push(baseMedia({ id: p.id, url: variants[variants.length - 1].url, variants, alt: p.alt, title: p.alt, folder: 'gallery', gallery: true, galleryYear: Number(p.year), sortOrder: i }));
  });
  for (const a of awardeesJson as { slug: string; name: string }[]) {
    const variants: Img[] = [360, 594].map((w) => ({ url: A(`awardees/${a.slug}-${w}.webp`), w, h: Math.round((w * 754) / 594) }));
    const faces = FACES.includes(a.slug) ? [120, 240].map((w) => ({ url: A(`awardees/face/${a.slug}-${w}.webp`), w, h: w })) : undefined;
    out.push(baseMedia({ id: portraitId(a.slug), url: variants[1].url, variants, title: a.name, alt: a.slug === 'propel' ? 'Propel logo' : `Portrait of ${a.name}`, folder: 'awardees', extra: { og: A(`og/awardees/${a.slug}.jpg`), portrait: variants, ...(faces ? { faces } : {}) } }));
  }
  out.push(baseMedia({ id: 'hero-trophies', url: A('hero/hero-trophies-1600.webp'), variants: [{ url: A('hero/hero-trophies-960.webp'), w: 960, h: 519 }, { url: A('hero/hero-trophies-1600.webp'), w: 1600, h: 865 }], title: 'Home hero background: NIDA 2024 trophy table', folder: 'banners' }));
  out.push(baseMedia({ id: 'sponsor-taptap-send', url: A('sponsors/taptap-send.png'), variants: [{ url: A('sponsors/taptap-send.png'), w: 399, h: 267 }], title: 'Taptap Send logo', alt: 'Taptap Send', folder: 'logos' }));
  out.push(baseMedia({ id: 'sponsor-cps-africa', url: A('sponsors/cps-africa.png'), variants: [{ url: A('sponsors/cps-africa.png'), w: 479, h: 137 }], title: 'CPS Africa logo', alt: 'CPS Africa', folder: 'logos' }));
  return out;
}

export function legacyAwardees(): Awardee[] {
  return (awardeesJson as { year: number; slug: string; name: string; award: string; group: string; listedAs?: string; bio: string[]; note?: string }[]).map((a, i) => ({
    year: a.year,
    slug: a.slug,
    name: a.name,
    award: a.award,
    group: a.group,
    listedAs: a.listedAs,
    country: '',
    bio: a.bio,
    achievements: [],
    note: a.note,
    photoId: portraitId(a.slug),
    isOrg: a.slug === 'propel',
    published: true,
    sortOrder: i,
  }));
}

export function legacyCategories(): Category[] {
  return legacySite.categories.map((c, i) => ({ id: c.id, name: c.name, text: c.text, awards: c.awards, photo: c.photo, sortOrder: i, published: true }));
}

const EVENT_DATES: Record<number, string> = { 2023: '2023-10-02', 2024: '2024-11-30', 2025: '2025-12-06', 2026: '2026-10-06' };

export function legacyEditions(): Edition[] {
  return legacySite.editions.map((e) => {
    const x = e as typeof e & { theme?: string; pending?: string; stat?: { value: string; label: string } };
    return {
      year: x.year,
      title: `NIDA ${x.year} Gala`,
      ordinal: x.ordinal,
      date: x.date,
      startsOn: EVENT_DATES[x.year] || null,
      venue: x.venue,
      city: x.city,
      theme: x.theme,
      summary: x.summary,
      stat: x.stat,
      pending: x.pending,
      ticketUrl: x.year === 2026 ? 'https://my.weezevent.com/nigerians-in-diaspora-awards-gala-2026' : undefined,
      banner: null,
      photos: x.photos,
      published: true,
    };
  });
}

export function legacySettings(): SiteSettings {
  const s = legacySite;
  return {
    name: s.name,
    shortName: s.shortName,
    url: s.url,
    description: s.description,
    announcement: { enabled: false, text: '', linkLabel: '', linkUrl: '' },
    home: {
      heroLine1: 'From Nigerian Roots',
      heroLine2: 'to [[Global Heights.]]',
      heroLead: 'Celebrating Nigerians abroad whose achievements inspire communities and make a lasting global impact.',
      heroPrimary: 'Meet the Awardees',
      heroSecondary: 'Save the Date',
      heroImage: 'hero-trophies',
      introTitle: 'Celebrating excellence.',
      introTitleSub: 'Recognising global impact.',
      introLead: 'Recognising Nigerians abroad who are [[redefining excellence]], and inspiring the next generation to do the same.',
      facts: [
        { value: '{awardees}', label: 'honourees recognised from 2023 to 2025' },
        { value: '{editions}', label: 'editions in Paris, organised by FON Europe' },
        { value: '150+', label: 'distinguished Nigerians from across Europe at the inaugural ceremony in 2023' },
        { value: '200+', label: 'prominent Nigerians and friends of Nigeria at the second edition in 2024' },
      ],
      missionTitle: 'A platform for [[global impact]]',
      missionLead: 'Each NIDA gala brings together members of the African diaspora, friends of Africa and professionals from diverse industries for an evening of celebration, networking, culture and recognition.',
      attendeesTitle: 'In attendance, 2023',
      attendeesIntro: 'The inaugural ceremony at L’Hôtel de l’Industrie drew notable guests, including:',
      attendees: [
        'The Ambassador of the Permanent Delegation of Nigeria to UNESCO',
        'Officials from the Embassy of Nigeria in Paris',
        'The CEO of the Nigerians in Diaspora Commission (NIDCOM)',
        'Representatives from the Lagos State Government',
        'A former member of the French Parliament',
        'Over 150 distinguished Nigerians from across Europe',
      ],
      categoriesTitle: 'Four categories.\nOne standard: [[excellence]]',
      categoriesLead: 'From boardrooms and laboratories to stadiums, studios and public office, NIDA honours Nigerians abroad whose work makes a difference.',
      featuredYear: 2025,
      featuredTitle: 'Meet the [[class of 2025]]',
      featuredLead: 'Ten Nigerians abroad recognised at the third NIDA gala in Paris, from engineering and academia to football, fashion, journalism, music and diplomacy.',
      galleryTitle: 'Red carpets, live performance and [[Nigerian pride]]',
      galleryLead: 'A festive experience with red carpet photo sessions, music, dance and showcases, served with gourmet three-course Nigerian dishes.',
      galleryFoot: 'Photography from NIDA 2023, 2024 and 2025.',
      mosaic: ['2024-37', '2025-58', '2023-03', '2024-24', '2023-09', '2025-57', '2024-49', '2023-17'],
      editionsTitle: 'Four editions in Paris',
      editionsLead: 'Since its inaugural ceremony in 2023, NIDA has gathered Nigerians and friends of Nigeria from across Europe each year.',
      editionsOpenYear: 2025,
      saveDateLead: 'NIDA {edition} is on the horizon. Its date, venue and call for nominations have not been announced yet. Join the mailing list and you will hear as soon as NIDA shares them.',
    },
    pages: {
      about: { title: 'About NIDA', lead: 'Recognising and celebrating the outstanding achievements of Nigerians living abroad across various fields.', photo: '2023-17' },
      awards: { title: 'Awards & categories', lead: 'Four award categories recognising Nigerians abroad in business, diaspora impact, professional life, sport and the creative industries.', photo: '2024-28' },
      awardees: { title: 'The awardees', lead: '{people} Nigerians abroad and one start-up, honoured at NIDA from 2023 to 2025. Filter by year or category, or search by name.', photo: '2025-55' },
      editions: { title: 'Past editions', lead: 'Every NIDA gala since the inaugural ceremony in October 2023, with dates, venues, honourees and photographs.', photo: '2024-37' },
      gallery: { title: 'Gallery', lead: 'Moments from the NIDA galas in Paris: the red carpet, the ceremony, the performances and the people.', photo: '2023-03' },
      nomination: { title: 'Nominations', lead: 'How NIDA nominations work: who can be nominated, what the judges look for and how to hear when the next call opens.', photo: '2025-58' },
      contact: { title: 'Contact', lead: 'For partnerships, sponsorship, press and general enquiries about the Nigerians in Diaspora Awards.', photo: '2024-42' },
      news: { title: 'News', lead: 'News, announcements and stories from the Nigerians in Diaspora Awards.', photo: '2025-57' },
    },
    about: [s.about[0]], // the second paragraph in src/data/site.ts was never shown on the site
    aboutPhotos: ['2024-39', '2025-55'],
    aboutStatement: 'A powerful platform to raise awareness and promote a [[positive narrative]] about the contributions of Nigerians abroad.',
    mission: s.mission,
    vision: s.vision,
    journeyTitle: 'From one evening in Paris to an annual institution',
    experienceTitle: 'What an evening at NIDA offers',
    experience: s.experience,
    otherHonours: s.otherHonours,
    process: s.process,
    processLead: 'A panel of judges assesses every nomination against four criteria: impact & distinction, leadership, innovation and character.',
    criteria: s.criteria,
    nominations: {
      open: s.nominations.open,
      edition: s.nominations.edition,
      deadline: s.nominations.deadline,
      deadlineSource: s.nominations.deadlineSource,
      statusTitle: s.nominations.statusTitle,
      statusText: s.nominations.statusText,
      rules: s.nominations.rules,
      categories: s.nominationCategories,
      acceptFiles: true,
    },
    newsletter: { mode: 'cms', email: s.newsletter.email, edition: s.newsletter.edition },
    contact: { formMode: 'cms', email: s.contact.email, phones: s.contact.phones },
    notifyEmail: s.contact.email,
    organizer: {
      name: s.organizer.name,
      url: s.organizer.url,
      urlLabel: s.organizer.urlLabel,
      email: s.organizer.email,
      phones: s.organizer.phones,
      address: s.organizer.address,
      summary: s.organizer.summary,
      network: s.organizer.network,
    },
    social: s.social,
    sponsors: [
      { name: 'Taptap Send', logo: 'sponsor-taptap-send' },
      { name: 'CPS Africa', logo: 'sponsor-cps-africa' },
    ],
    footer: {
      tagline: 'Celebrating the outstanding achievements of Nigerians living abroad. Organised by {organiser}.',
      copyright: '© {year} Nigerians in Diaspora Awards (NIDA). All rights reserved.',
      creditLabel: 'Blueinc Technologies',
      creditUrl: 'https://blueinctech.com',
      saveDateLabel: 'NIDA {edition} news by email',
    },
  };
}
