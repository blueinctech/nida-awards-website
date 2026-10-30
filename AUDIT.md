# NIDA Awards website: audit and redesign notes

Audit date: 28 October 2026. Source: https://nida-awards.org (home, /about-nida/, /nomination/, /gallery/, /contact/), its stylesheets, page HTML, form markup and image library.

## 1. Verified brand colours

Taken from the site's own Elementor global colour kit (`post-7.css`), the per-page Elementor styles, and the pixel colours of the official logo files. These are the only colours used in the new design (plus tints of them and one functional error red for form messages).

| Token | Hex | Where it comes from on the live site |
|---|---|---|
| `--color-primary` | `#01913C` | Elementor global **primary**; green of the NIDA logo (`logo.png`) |
| `--color-secondary` | `#F5C566` | Elementor global **secondary**; gold of the logo star and trophy (`footer.png`) |
| `--color-accent` | `#DDBA5C` | Elementor global **accent**; active awardee tab |
| `--color-gold-deep` | `#C6982F` | Most-used colour in page styles (185 uses): award titles, buttons, icons |
| `--color-forest` | `#083B1E` | Header background and borders |
| `--color-pine` | `#184F22` | Section background (18 uses) |
| `--color-black` | `#000000` | Awardees section background |
| `--color-ink` | `#03180C` | Dark text and darkest surfaces: `--color-forest` at 40 % brightness. Replaces `#04171A`, the Oment theme's default black (`--thm-black`), which reads teal-blue |
| `--color-white` | `#FFFFFF` | Text on dark, light backgrounds |
| `--color-ivory` | `#F8F7F3` | Light section background |
| `--color-mist` | `#ECECEC` | Light grey surfaces |
| `--color-text-muted` | `#7A7A7A` | Elementor global **text** |

Colours seen on the live site that were **not** carried over, because they are leftovers from the purchased "Oment" event theme rather than NIDA branding: `#04171A` (theme black, a dark teal), `#5D78FF` (Elementor default blue), `#FF3639` (theme red, shows on the mobile menu icon and the footer credit link) and `#302B52` (theme purple, off-canvas panel).

Accessibility note: `#01913C` and the golds do not meet WCAG AA contrast for small text on white. The new site uses them for large text, rules, markers and on dark backgrounds, and uses `#083B1E` for small text on light backgrounds. The palette itself is unchanged.

## 2. Typography found

Verified on 30 October 2026 from the site's "Use Any Font" stylesheet (`/wp-content/uploads/useanyfont/uaf.css`) and the computed styles of the rendered pages (Home, About, Nomination, Contact, Gallery) at 1440px:

- **ITC Avant Garde Gothic Medium** (`itc-avant-garde-me`) for every heading (`h1` to `h6`). Home hero "Celebrating Nigerians in Diaspora": 48px, line height 48px, weight 600 (synthesised from the Medium file). Section titles: 45px / 55px, 700. Inner page titles (ABOUT, CONTACT, NIDA GALLERY): 62px / 62px, 800, typed in capitals. Card titles: 24px / 34px, 600. Footer headings: 34px and 30px.
- **Montserrat Medium** (`montserrat-medium`) for body, paragraphs and buttons. Paragraphs 18px / 28px, card text 16px / 26px. Buttons 16px / 28px, uppercase, 1.2px tracking. Navigation 16px / 30px, uppercase, 0.8px tracking. Form labels 14px, submit buttons 14px.
- **Nord** only in the footer quick links (16px). An all-caps design with no accented letters.
- There is no News, Awardees or Categories page on the original site: awards and honourees are sections of Home and About, `/awardees/` returns 404, and `/news/` is an unfinished theme template (placeholder Latin text).

New system (section 13): an open-licence Avant Garde revival for headings, Montserrat for everything else.

## 3. Page inventory

| Live page | What it contains | In the new site |
|---|---|---|
| `/` | Hero slider (still promotes **NIDA 2025, 6 Dec 2025** with a countdown), 2026 theme, About, highlights, sponsors, categories, awardee tabs for 2025/2024/2023, photo highlights, footer. Most sections are duplicated (one copy for desktop, one for mobile). | Rebuilt as `/` |
| `/about-nida/` | Mission, Vision ("Book Tickets" links point to `/service/mission/` and `/service/vision/`, which are template pages), overview, categories, organiser details with contacts, Google Form nomination link, template sponsor logos, a "Latest From Newsroom" heading with no news, and counters showing **0 Attendance / 0 Guests / 0 Speakers / 0 Workshop**. | `/about-nida/` (story, mission, vision, journey, experience, organiser) and `/awards/` (categories) |
| `/nomination/` | "NIDA 2026 NOMINATION" title, but the status line says "Nominations for 2024 NIDA is closed", while a live Gravity Forms nomination form (form 7) titled "2026" is shown underneath. Also template leftovers: "World Class Speakers" (empty), template sponsor logos, and an "Event Schedule" with lorem-ipsum events (New Hyde, "UX Design Trend Party 2021", Ultra Music Festival Miami, etc.). | `/nomination/` |
| `/gallery/` | Filterable gallery (All / 2023 / 2024 / 2025, 66 photos via "Load more") and a link to the 2025 Flickr album. | `/gallery/` (71 photos, filters, lightbox) |
| `/contact/` | Phone numbers, email, event location and time for the 2025 gala, and a Gravity Forms contact form (form 3). | `/contact/` |
| — | — | New: `/awardees/` (searchable archive with full biographies), `/editions/` (2023–2026 archive), `/awards/`, `404.html` |

## 4. Functionality and integrations found

| Item | Live behaviour | New site |
|---|---|---|
| Nomination form | Gravity Forms (WordPress), form ID 7, posts to `/nomination/`. Fields: email, full name, country, WhatsApp, category (11 options), nominee name/email/phone/country, three long answers, CAPTCHA. | Status shows **closed**. The same form (same fields and the same 11 categories) is built in and switches on with `nominations.open = true` plus an `endpoint` in `src/data/site.js`. Tested: validates, posts, shows success and error states. |
| Google Form | `/about-nida/` links "Nominate Someone for NIDA Awards 2026 – CLICK HERE" to a Google Form. | Not linked, since nominations are closed. URL kept here for reference: `https://docs.google.com/forms/d/e/1FAIpQLSfpUiAHJw5BfG8APhZEcooRBPI904FxzOIXV1f5q9fl0nj3ZA/viewform` |
| Contact form | Gravity Forms form 3 (WordPress backend). | Without a backend, the form validates and opens the visitor's email app addressed to `nida@friendsofnigeria.net` (works with no server). Set `contact.endpoint` to send directly. |
| Ticketing | "NIDA 2026 TICKET" nav link and "Register now" popup → Weezevent (`my.weezevent.com/nigerians-in-diaspora-awards-gala-2026`). | Removed: the 6 October 2026 gala has passed. Add a ticket link back when the next gala opens. |
| Social | LinkedIn showcase page, Instagram `nida_awards`. | Kept (header menu, footer, contact, nomination). |
| Flickr | Link to the NIDA 2025 album. | Kept on the gallery page. |
| Countdown | Counts down to the 2025 gala. | Removed (event passed). |

## 5. Content that needs confirmation from NIDA

1. **2026 gala date.** The live site gives three versions: "Wednesday, October 6, 2026" and "Tuesday, October 6th, 2026" (home page) and "Wednesday, October 7, 2026" (About page). 6 October 2026 was a Tuesday. The new site uses **Tuesday 6 October 2026**.
2. **2026 status.** The live site still describes the 2026 gala as upcoming. The new site describes it as "announced" and says the 2026 honourees will appear once published. I did not find any 2026 results to publish.
3. **2025 Fashion Designer of the Year.** The card says "Hakeem Adesanya" (a 2024 honouree), but the biography and photo are **Cynthia Asije**'s. Shown as Cynthia Asije with an editorial note on her profile.
4. **2025 Journalist of the Year.** The card says "Adeola Adeleye-Fasubaa" (a 2024 honouree), but the biography and photo are **Jeremiah (Jerry) Fisayo-Bambi**'s. Shown as Jeremiah Fisayo-Bambi with an editorial note.
5. **Rasheedat Ajibade's biography** ends "a deserving nominee for Sportsperson of the Year at NIDA 2025" although she is listed as the recipient. Kept word for word.
6. **Juliana Olayinka's biography** is written in the first person. Kept word for word.
7. **Award names vs. the official category list.** Past winners include awards not in the four published categories: Academic of the Year (2023, 2024, 2025), Social Impact (2023), Honorary Posthumous (2023) and Female Titan Professional of the Year (2025, while the category list says Titan is gender-neutral). These are grouped as "Other honours" rather than being re-labelled.
8. **Phone numbers.** The contact page shows `+33 6 68 43 88 00` and `+33 7 62 72 38 08` (the second one's link actually dials `+111-222-333`), and also `+33 7 58 68 37 71`, `+33 6 20 57 88 44`, which the About page lists for FON Europe. The new site shows the first two for NIDA and the last two for FON Europe. Please confirm which are current.
9. **2025 gala time.** The contact page says "10:00 PM Saturday". Not used.
10. **Sponsors.** Taptap Send and CPS Africa appear under "Sponsors" on the home page without a year. Shown as "Sponsors" on the home page. The 8 other sponsor logos on About/Nomination are theme placeholders and were not used.
11. **Privacy / legal pages.** None exist on the live site, so none are linked. A privacy notice is advisable because both forms collect personal data.

## 6. What was weak on the live site

- Out-of-date event promotion: hero, countdown, contact page and popup still point at the 2025 gala; nav sells 2026 tickets after the event.
- Duplicated content: highlights, theme, About text, categories and the entire awardee list are each rendered twice (desktop and mobile copies), which doubles page weight and confuses screen readers.
- Template leftovers: lorem-ipsum schedule, empty speakers section, "0" counters, placeholder sponsor logos, red theme accents.
- Mislabelled awardees (see 5.3 and 5.4) and inconsistent award naming.
- Accessibility: images with `alt="Awesome Image"` or empty alt on content photos, broken `tel:` link, low-contrast grey text, red hamburger icon outside the brand.
- Performance (Lighthouse, mobile profile, measured 28 Oct 2026 over the network): **Performance 28, Accessibility 92, Best Practices 93, SEO 92**; LCP 10.8 s, Total Blocking Time 9.8 s, 2.8 MB. Over 100 stylesheets are loaded on every page.

## 7. The new site

- Static, dependency-free HTML/CSS/JS generated from one data source (`src/data/`), so content changes happen in one place. No framework, no tracking, no third-party requests.
- Pages: Home, About NIDA, Awards & categories, Awardees, Editions, Gallery, Nomination, Contact, 404.
- Motion: CSS and IntersectionObserver only (no animation library). Respects "reduce motion"; the moving portrait wall has a visible pause button.
- SEO: unique titles and descriptions, canonical URLs, Open Graph images made from NIDA photography, `schema.org` Organization and Event data, `sitemap.xml`, `robots.txt`.
- Images: 125 originals pulled; 71 event photos and 26 portraits converted to responsive WebP (up to 1920 px); the theme's stock photos were excluded. The 2025 photos only exist at 640 px on the site, and Flickr was not reachable from my environment, so higher-resolution 2025 photos would improve the gallery.

## 8. Testing

- Rendered and reviewed every page at 1440 px, 820 px and 390 px. No horizontal scrolling, no console errors, no missing images.
- 25 scripted interaction checks pass: mobile menu (focus, Escape), hero pause, featured-awardee tabs (mouse and arrow keys), edition tabs, lightbox (keys, counts only visible photos), awardee filters and URL state, search, empty state, biography dialog and deep links, gallery filter, contact validation and email fallback, nomination form submit (with the form switched on).
- axe-core (WCAG 2 A/AA + best practice): no violations on any page.
- Lighthouse (mobile profile, local server without compression): Home **89 / 100 / 100 / 100**, Gallery **98 / 100 / 100 / 100** (Performance / Accessibility / Best Practices / SEO). Production hosting with gzip and caching (see `public-htaccess`) should do better. The live-site and new-site numbers were measured in different conditions, so treat the comparison as indicative.


## 9. Second round of improvements (28 October 2026)

**Hero.** Headline sized to its column (three lines on every screen, about 30 % smaller on a 1440 px laptop), tighter spacing, shorter lead. The "Meet the awardees" button is on the first screen at 1280 × 720, 1366 × 657, 1440 × 900 and 1920 × 1080, and on phones from 360 px wide. On tablets and phones the honouree portraits now sit at the top of the hero, so faces are visible straight away. Portrait captions show the name and year; the award appears on hover or keyboard focus. Plain green background and brand colours unchanged.

**Save the Date for NIDA 2027.** New home-page section with an email sign-up (also on the nomination page and linked from the footer). No date, venue or other 2027 detail is stated: all three show "To be announced". No email-marketing service exists on the current site, so the form currently opens the visitor's email app with a subscription request to nida@friendsofnigeria.net. Mailchimp or any POST endpoint can be switched on in `site.js` (see README).

**Nominations (verified, nothing on the old site changed).**
- Old `/nomination/`: Gravity Forms form 7 "NIDA NOMINATION FORM 2026" still renders with reCAPTCHA and posts to `/nomination/`; the page also says "Nominations for 2024 NIDA is closed". No deadline is shown there. I did not submit a test entry, so I cannot say whether the server accepts or stores submissions.
- Google Form "NIDA 2026 NOMINATION FORM" (linked from the old About page): still displays and lists a submission deadline of **7 July 2026 (CET)** and a gala date of **7 October 2026** (a fourth date version, see 5.1). It also lists "Diaspora Champion (Individual)", which the Gravity Forms list does not.
- New site: the built-in form stays switched off. The page now states only the verified deadline and that the 2027 call has not been announced, plus the rules printed on the official form, and offers "Notify me" sign-up. It no longer says "closed".
- **Decision needed from NIDA:** should the Gravity Forms form and the Google Form keep accepting entries after the 7 July deadline? If not, NIDA should close them and export any late entries before the new site replaces the old one.

**Honouree pages.** 26 pages at `/awardees/<slug>/` using one template: portrait, name, award, category, edition, ceremony, the NIDA-published biography word for word (editorial notes kept), share links (LinkedIn, Facebook, X, WhatsApp, email, copy link, and the phone's share sheet where available), previous/next and more honourees from the same year. Each has its own 1200 × 630 share image and Open Graph / X tags. The archive cards now link to these pages.

**Other refinements.** Section numbering removed, sponsor logos on matching tiles, the category hover photo removed (it covered the titles), two-column honouree grid on phones, gallery shows 12 (phone) or 24 (desktop) photos at a time with "Show more photos", tidier mobile footer, fixes for two small overflow and contrast issues.

**Testing.** 35 pages × desktop, tablet and phone: no console errors, no failed requests, no broken images, no horizontal scrolling; 88 internal links all resolve; axe-core finds no violations (checked with motion reduced so animations do not interfere). 34 scripted checks pass, covering email validation, the email-app fallback, Mailchimp and POST modes against a local test server (success, server error, network failure, already subscribed), the nomination form when switched on, archive filters, old-link redirects, gallery paging and share links. Share metadata checked on all 26 pages (image exists, 1200 × 630 JPEG, under 5 MB, URLs match canonical). Lighthouse (mobile, local server without compression): Home 90, Awardees 94, honouree page 97, Nomination 97 for performance; 100 for accessibility, best practices and SEO.

**Not verifiable from here.** LinkedIn's preview can only be confirmed once the site is live, using LinkedIn Post Inspector (https://www.linkedin.com/post-inspector/). Real Mailchimp delivery needs NIDA's account.

## 10. Polish pass (28 October 2026, round 3)

A visual inspection of every page at 1440, 1366, 1280, 820, 390 and 360 px, followed by refinements to the existing code. Brand colours, logo, fonts, content and functionality are unchanged.

**Hero.** Removed the decorative globe lines and background glows, so the hero is the plain NIDA green. Gold words are now flat brand gold instead of a gradient. Headline slightly smaller with steadier line height. The three facts sit on one line with gold markers. Portrait captions are lighter; on phones and tablets the captions are hidden so faces show without truncated names. Call to action stays on the first screen at 1280 × 720 and 1366 × 657; on phones four faces are visible before scrolling.

**Typography and spacing.** One eyebrow style everywhere (short gold bar and small capitals; previously two different styles). Calmer heading scale (h1 and h2 about 13–15 % smaller at desktop), balanced line breaks, no full stops after section headings, lead paragraphs capped at a readable width and set in the right-hand column beside split headings. Mission and vision statements reduced from 1.95 rem to 1.55 rem.

**Sections.** Intro photos are now a clean, aligned pair instead of an overlapping collage with a frame. Category rows use a simple bulleted award list instead of pill chips, with full-width text on phones. Featured honourees: name first in the display font, award as a gold label, smaller list names without the sliding shift. Editions: honourees as a tidy two-column list instead of chips, duplicate “Third edition” label removed, pending note restyled. The gallery mosaic no longer repeats a photo shown in the editions panel. Save the Date panel without drop shadow and with solid dividers. Sponsor logos sit on matching tiles. Organiser countries shown as a list instead of pills. Finale headline smaller, links aligned.

**Inner pages.** Awardee cards show the name first and the year in the award line, so the yellow year badge no longer covers faces. Awards page: removed the large “01–04” numbers over the photos, equal columns, dividers between categories. Honouree pages: no decorative ring or drop shadow. Contact page: three boxed cards replaced by one column with dividers. All accent borders unified to a 2 px gold rule. Editions page year numbers smaller.

**Motion.** Reveals move 16 px instead of 28 px and run faster. The image curtain-wipe and 12 % zoom are replaced by a gentle fade. Hover zooms reduced to 2–3 %. With reduced motion, everything is visible and static.

**Fixes.** Editions page year navigation highlighted the wrong year at the top of the page (now correct on load and while scrolling). Sponsor logo overflowed its tile on phones. Two small-text colour-contrast issues (gold numbers on white, light edition tabs). Unused styles and script removed (old category hover preview, profile dialog, nomination banner). CSS and JS are minified in `dist/` (esbuild).

**Testing.** 35 pages crawled: 108 internal assets and every internal link return 200, no missing anchors. No console errors and no horizontal scrolling at 1440, 820, 390 or 360 px. axe-core (WCAG 2.1 A/AA and best practice): no violations on 12 representative pages at desktop and phone width. 11 scripted interaction checks pass (mobile menu and Escape, featured honouree tabs, edition tabs, wall pause, newsletter validation, archive filter and search, gallery filter, lightbox, contact validation). With motion on, every reveal completes.

## 11. Design pass with the design-taste skills (28 October 2026, round 4)

Design read: a prestige awards and gala site for the Nigerian diaspora and its partners. Editorial, calm and confident, with brand colours, logo, content and the plain green hero unchanged.

### Changes
- **Hierarchy.** Section heads now stack (headline, then a short lead) instead of splitting left and right. Section labels ("eyebrows") cut from about one per section to three on the home page (hero, class of 2025, organiser) and to the organiser label on inner pages.
- **Hero.** Four elements only: label, a two-line headline ("From Nigerian roots / to global heights."), the original 20-word lead and two actions. The secondary action is now "Save the date" so each button has its own purpose. The facts line moved into the intro as a 2 by 2 figure block (26 honourees, 4 editions, 150+, 200+). On phones the headline flows as one balanced sentence and both buttons now sit above the fold at 390 and 360 px.
- **Rhythm.** Fewer light/dark switches on the home page: green hero, ivory intro and mission, white categories, one black band for the 2025 honourees and the photographs, ivory editions, white organiser, gold Save the Date, footer. The decorative finale band was removed so the page ends on its call to action.
- **Template patterns removed.** No section or list numbering (categories, honouree tabs, About experience, award lists, process steps, mobile menu), no decorative dot bullets, no year tags on photos. Process steps are now rows (title, explanation); the four criteria are an open 2 by 2 grid instead of four equal cards; award lists use a single gold rule instead of per-row borders.
- **Copy.** Em and en dashes removed from interface copy and page titles (the brand separator is now "NIDA, Nigerians in Diaspora Awards"). Official category names and biographies are unchanged. One label per action: "Meet the awardees", "Save the date", "View the gallery", "More on NIDA 2025".
- **Shape system.** Arches for portraits, 2px corners for every rectangle (buttons, inputs, filters, panels), circles only for icon-only buttons.
- **Motion and scripts.** The header stays put (hide-on-scroll removed with its scroll listener); the editions year highlight now uses an IntersectionObserver. No window scroll listeners remain.

### Tests
- 34 pages crawled, all internal links and 108 assets return 200.
- axe: 0 violations on 12 pages at 1440 and 390.
- 11 interaction checks pass, no console errors.
- No horizontal overflow at 1440, 820, 390 and 360 on 9 key pages.
- Fold: laptop 1366x657 CTA bottom 534 px; phones 390x844 and 360x740 CTAs fully visible with 4 faces.

## 12. Colour correction (30 October 2026)

Re-checked against nida-awards.org (Elementor kit `post-7.css`: primary `#01913C`, secondary `#F5C566`, accent `#DDBA5C`, text `#7A7A7A`; page styles: `#C6982F` ×119, `#184F22` ×18, `#083B1E` ×12, `#000000` ×22, `#F8F7F3`, `#ECECEC`).

- **Globe section ("Celebrating excellence") looked blue.** Its background ran from `#04171A` (the Oment theme black, a teal) to black. Now black, like the original site's honourees band, with a soft pine (`#184F22`) light behind the globe. The globe canvas and the CSS fallback globe use the corrected ink.
- **Green tint on globe portraits removed.** Faces outside the spotlight are plain black and white instead of green-washed; the spotlighted honouree stays in full colour with the gold ring.
- **Ink colour across the site.** `--color-ink` (body text, form arrows, outline buttons, the honour-wall toggle and 35 border/shadow tints) changed from teal `#04171A` to `#03180C`, a shade of the brand forest green.
- **Shared tokens.** Added channel tokens `--rgb-ink`, `--rgb-forest`, `--rgb-pine`, `--rgb-primary`, `--rgb-gold`, `--rgb-gold-deep`; every translucent brand colour in `main.css` and the contact page now uses them (`rgb(var(--rgb-gold) / .16)`), and the hard-coded gallery placeholder `#0b1a10` uses `--color-ink`. Remaining literals are white/black transparencies and the form error red.
- **Checked rendered:** computed colours of every element on 10 pages show no blue or teal hue; full-page screenshots at 1440, 820 and 390 px; `next build` passes.

## 13. Typography system and hero copy (30 October 2026)

- **Display font.** Headings move from Nord (all capitals, no accents) to TeX Gyre Adventor, the GUST-licensed revival of ITC Avant Garde Gothic, the heading font nida-awards.org actually uses. Headings now show real upper and lower case, accented honouree names render in the display font (the Montserrat fallback for accented names is removed), and the Nord licence question no longer applies. Nord files removed.
- **One token set.** About 130 separate `font-size` values in `main.css` are replaced by shared tokens for families, weights, sizes, line heights, letter spacing, paragraph spacing and line length (see README, "Fonts and typography"). Every heading level uses one size, weight and spacing on every page; the globe-section title, organiser name and save-the-date title now follow the H2 level instead of their own sizes; two inline font sizes in the page code are removed.
- **Hero copy.** Headline "From Nigerian Roots / to Global Heights." (the official 2026 theme) on two lines at every width; supporting text cut from 21 to 14 words: "Celebrating Nigerians abroad whose achievements inspire communities and make a lasting global impact." Eyebrow, buttons, links, background and the moving photo wall unchanged.
- **Biographies.** 17 to 18px at 1.8 line height, lines capped at 66 characters, 1.25em between paragraphs.
- **Share images.** `tools/make_share.js` now uses the display font; the existing share images were not regenerated.
- **Checked rendered:** 10 pages at 1440, 820, 390 and 360px; no horizontal overflow or clipped text; hero wall timings unchanged (80s, 92s, 72s desktop; 70s tablet and phone); `next build` passes.
