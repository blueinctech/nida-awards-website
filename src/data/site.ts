// Site-wide content for the NIDA website.
// Every fact here comes from nida-awards.org as published on 28 Oct 2026.
// Items the organisation still needs to confirm are listed in AUDIT.md.

const site = {
  name: 'NIDA, Nigerians in Diaspora Awards',
  shortName: 'NIDA',
  url: 'https://nida-awards.org',
  description:
    'The Nigerians in Diaspora Awards (NIDA) recognise and celebrate the outstanding achievements of Nigerians living abroad across various fields.',
  theme2026: 'From Nigerian Roots to Global Heights',

  // Nominations. Only verified facts are published here (checked 28 Oct 2026):
  // - NIDA's official "NIDA 2026 NOMINATION FORM" (Google Form linked from the old
  //   About page) states a submission deadline of 7 July 2026 (CET).
  // - The old /nomination/ page still shows a Gravity Forms nomination form (form 7,
  //   "NIDA NOMINATION FORM 2026") and the Google Form still renders. Neither has been
  //   changed. NIDA must confirm whether either should still accept entries.
  // - No call for NIDA 2027 nominations has been published.
  // To publish the built-in form again: set `open: true`, `edition`, `deadline`
  // and an `endpoint` (see README). Without an endpoint the form is never shown.
  nominations: {
    open: false,
    edition: 2026,
    deadline: '7 July 2026 (CET)',
    deadlineSource: 'NIDA’s official 2026 nomination form',
    statusTitle: 'The NIDA 2026 nomination deadline was 7 July 2026.',
    statusText: 'This was the submission deadline published on NIDA’s official 2026 nomination form. The call for NIDA 2027 nominations has not been announced yet.',
    // Rules printed on the official 2026 nomination form and category list
    rules: [
      'One nominee per category per form. To nominate several people, or one person in several categories, submit one form for each.',
      'Young Professional of the Year is for nominees under 40, with separate male and female categories.',
      'Titan Professional of the Year is for nominees over 40 and is gender-neutral.',
      'NIDA recognises the achievements of Nigerians living abroad.',
      'You will need the nominee’s contact details and links to their work (articles, websites, LinkedIn or social media).',
    ],
    endpoint: '', // e.g. a form backend URL that accepts POST
  },

  // "Save the date" mailing list for the next edition.
  // No email-marketing service exists on the current site (checked: no Mailchimp,
  // Brevo, MailPoet or similar), so none is connected yet.
  //   provider: ''          -> the form validates the address, then opens the visitor's
  //                            email app with a ready-made subscription request to `email`.
  //                            NIDA must add these people to its list by hand.
  //   provider: 'mailchimp' -> endpoint = the "action" URL of a Mailchimp embedded form
  //                            (https://<dc>.list-manage.com/subscribe/post?u=…&id=…).
  //   provider: 'post'      -> endpoint = any service that accepts a POST with an `email`
  //                            field and returns 2xx (Formspree, Basin, Brevo via proxy,
  //                            Netlify Forms or a small endpoint on NIDA's server).
  newsletter: {
    provider: '',
    endpoint: '',
    email: 'nida@friendsofnigeria.net',
    edition: 2027,
  },

  // Contact form: with no endpoint, the form opens the visitor’s email app
  // addressed to the official NIDA email (a real, working fallback).
  contact: {
    endpoint: '',
    email: 'nida@friendsofnigeria.net',
    phones: ['+33 6 68 43 88 00', '+33 7 62 72 38 08'],
  },

  organizer: {
    name: 'Friends of Nigeria (FON) Europe',
    url: 'http://www.friendsofnigeria.net',
    urlLabel: 'www.friendsofnigeria.net',
    email: 'contact@friendsofnigeria.net',
    phones: ['+33 7 58 68 37 71', '+33 6 20 57 88 44'],
    address: '229 rue Saint-Honoré, 75001 Paris',
    summary:
      'Friends of Nigeria (FON) Europe is a non-profit organization registered in France which is actively involved in promoting investment in Nigeria to French and European companies and investors as well as facilitating partnerships between French and European businesses and organizations and their Nigerian counterparts.',
    network:
      'FON is also building the largest network of Nigerian professionals, entrepreneurs and high net worth individuals who are based in Europe, with members across France, Germany, The Netherlands, Switzerland, Belgium, Italy, and fast expanding to other countries.',
    countries: ['France', 'Germany', 'The Netherlands', 'Switzerland', 'Belgium', 'Italy'],
  },

  social: [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/showcase/nigerians-in-diaspora-awards-nida/' },
    { name: 'Instagram', url: 'https://www.instagram.com/nida_awards' },
  ],

  sponsors: [
    { name: 'Taptap Send', logo: 'sponsors/taptap-send.png', w: 399, h: 267 },
    { name: 'CPS Africa', logo: 'sponsors/cps-africa.png', w: 479, h: 137 },
  ],

  mission:
    'To inspire and motivate the upcoming generation within the global Nigerian community by showcasing the accomplishments of Nigerians in the diaspora.',
  vision:
    'Nigerians In Diaspora Awards celebrates the remarkable accomplishments of Nigerians living abroad in a variety of professional sectors.',

  about: [
    'The Nigerians in Diaspora Awards (NIDA) Gala is dedicated to recognizing and celebrating the outstanding achievements of Nigerians living abroad across various fields. The event brings together members of the African diaspora, friends of Africa, and professionals from diverse industries.',
    'It serves as a powerful platform to raise awareness and promote a positive narrative about the contributions of Nigerians abroad, ultimately inspiring future generations to pursue excellence and make global impact.',
  ],

  // What a NIDA evening offers (from the "Gala Highlights" section of the live site)
  experience: [
    { title: 'Recognition of Excellence', text: 'Celebrates achievements of Nigerians abroad in business, welfare, and diaspora support.' },
    { title: 'Networking Opportunities', text: 'Connect with high-profile Nigerians, business leaders, professionals, and influencers. Opportunities for partnerships, mentorship, and business collaborations.' },
    { title: 'Cultural Pride', text: 'Celebrates Nigerian culture, heritage, and accomplishments. Fosters unity and collaboration among Nigerians abroad.' },
    { title: 'Learning and Inspiration', text: 'Inspires through the success stories and innovative ideas of the awardees. Supports the Nigerian community and recognizes impactful contributions.' },
    { title: 'Entertainment and Celebration', text: 'Provides a festive experience with red carpet photo sessions, music, dance, and showcases. Features gourmet 3-course Nigerian dishes.' },
  ],

  categories: [
    {
      id: 'business',
      name: 'Business Awards',
      text: 'Celebrating excellence in business and recognizing outstanding achievements in entrepreneurship and innovative startups.',
      awards: ['Entrepreneur of the Year', 'Start-up of the Year'],
      photo: '2024-30',
    },
    {
      id: 'diaspora-impact',
      name: 'Diaspora Impact Awards',
      text: 'Celebrating global excellence and recognizing individuals and organizations making a profound impact on their communities, industries, and the world at large, while showcasing the achievements of the diaspora community.',
      awards: ['Diaspora Champion (Individual)', 'Corporate Diaspora Support Award', 'State Government Diaspora Support Award'],
      photo: '2024-27',
    },
    {
      id: 'professional',
      name: 'Professional Awards',
      text: 'Honoring professionals who have consistently demonstrated exceptional performance, dedication, and commitment to excellence.',
      awards: ['Young Professional of the Year – Under 40s (Male and Female Categories)', 'Titan Professional of the Year – Above 40s (gender-neutral)', 'Diaspora Award for Politics/Governance'],
      photo: '2025-59',
    },
    {
      id: 'sports-creative',
      name: 'Sports & Creative Industries Awards',
      text: 'Celebrating excellence in sports and creativity. Recognizing outstanding achievements in sports, arts, culture, and creative industries.',
      awards: ['Sportsperson of the Year', 'Curator of the Year (Art)', 'Fashion Designer of the Year', 'Journalist of the Year', 'Upcoming Artiste of the Year (Music)'],
      photo: '2025-60',
    },
  ],
  otherHonours: {
    id: 'other',
    name: 'Other honours',
    text: 'Awards conferred at past ceremonies that sit outside the four published categories, such as Academic of the Year, the Social Impact Award and the Honorary Posthumous Award.',
  },

  process: [
    { title: 'Nomination', text: 'Fill out a detailed online nomination form showcasing the nominee’s accomplishments and contributions.' },
    { title: 'Review & Selection', text: 'A panel of judges assesses nominations based on set criteria.' },
    { title: 'Finalists & Announcement', text: 'Finalists are notified, and winners announced at the Gala.' },
  ],
  criteria: [
    { title: 'Impact & Distinction', text: 'Impressive achievements and contributions to the Nigerian diaspora and beyond.' },
    { title: 'Leadership', text: 'Showing leadership qualities to inspire others and create positive change.' },
    { title: 'Innovation', text: 'Originality and impact of contributions.' },
    { title: 'Character', text: 'Integrity and ethics are vital.' },
  ],
  // Category options exactly as listed on the live 2026 nomination form
  nominationCategories: [
    'Entrepreneur of the Year Award',
    'Start Up of the Year',
    'Career Young Professional of the Year Award (Under 40 - Male Category)',
    'Career Young Professional of the Year Award (Under 40 - Female Category)',
    'Titan (Over 40) Professional of the Year Award',
    'Diaspora Award for Politics/Governance',
    'Sportsperson of the Year',
    'Curator of the Year (Art)',
    'Fashion Designer of the Year (Fashion)',
    'Journalist of the Year (Media)',
    'Upcoming Artiste of the Year (Music)',
  ],

  editions: [
    {
      year: 2023,
      ordinal: 'Inaugural edition',
      date: 'Monday 2 October 2023',
      venue: 'L’Hôtel de l’Industrie',
      city: 'Central Paris',
      summary:
        'The inaugural NIDA ceremony took place at the esteemed L’Hôtel de l’Industrie in central Paris. The event drew notable guests, including the Ambassador of the Permanent Delegation of Nigeria to UNESCO, officials from the Embassy of Nigeria in Paris, the CEO of the Nigerians in Diaspora Commission (NIDCOM), representatives from the Lagos State Government, a former member of the French Parliament, and over 150 distinguished Nigerians from across Europe.',
      stat: { value: '150+', label: 'distinguished Nigerians from across Europe' },
      photos: ['2023-05', '2023-16', '2023-17'],
    },
    {
      year: 2024,
      ordinal: 'Second edition',
      date: 'Saturday 30 November 2024',
      venue: 'Renaissance Paris Hotel La Défense Valmy',
      city: 'Paris La Défense',
      summary:
        'The second edition built on this success, attracting over 200 prominent Nigerians and friends of Nigeria from across Europe. It featured cultural showcases, live performances, and the recognition of exceptional Nigerians across multiple award categories.',
      stat: { value: '200+', label: 'prominent Nigerians and friends of Nigeria' },
      photos: ['2024-39', '2024-31', '2024-49'],
    },
    {
      year: 2025,
      ordinal: 'Third edition',
      date: 'Saturday 6 December 2025',
      venue: 'Renaissance Paris La Défense Hotel',
      city: '60 Cours Valmy, 92800 Puteaux',
      summary:
        'An extraordinary gala celebrating the third Nigerians in Diaspora Awards, honouring Nigerians abroad across professional life, academia, sport, the arts, media, music and public service.',
      stat: { value: '10', label: 'honourees recognised' },
      photos: ['2025-55', '2025-60', '2025-64'],
    },
    {
      year: 2026,
      ordinal: 'Fourth edition',
      date: 'Tuesday 6 October 2026',
      venue: 'L’Hôtel de l’Industrie',
      city: '4 Place Saint-Germain-des-Prés, 75006 Paris',
      theme: 'From Nigerian Roots to Global Heights',
      summary:
        'The fourth edition was announced for L’Hôtel de l’Industrie under the theme “From Nigerian Roots to Global Heights”, set to bring together professionals, entrepreneurs, policymakers, creatives, and high-net-worth individuals from more than 10 countries for an evening of celebration, networking, culture, and recognition.',
      pending: 'The 2026 honourees have not yet been published. They will appear here once NIDA announces them.',
      photos: [],
    },
  ],
};

export default site;
export type Site = typeof site;
