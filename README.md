# NIDA – Nigerians in Diaspora Awards website

The nida-awards.org website, built with [Next.js](https://nextjs.org) (App Router) and exported as a static site. See `AUDIT.md` for the audit, the verified brand colours and the content NIDA needs to confirm.

## Quick start

```bash
npm install
npm run dev     # local preview with live reload at http://localhost:3000
npm run build   # writes the production site to out/
npm start       # preview the built site at http://localhost:8080
```

Node 20.9+ is required. `npm run build` produces plain HTML, CSS, JavaScript and images in `out/`, so the site needs no Node server: upload the contents of `out/` to any web host, or deploy the repository to Vercel, Netlify, Cloudflare Pages or GitHub Pages. On Apache the build includes an `.htaccess` (from `public/.htaccess`) with compression, caching, the 404 page and redirects for two old WordPress URLs.

## Editing content

All text lives in `src/data/`:

- `site.ts` – organiser details, contacts, social links, sponsors, mission and vision, categories, criteria, editions, and the nomination switch
- `awardees.json` – every award recipient (year, award, category group, biography paragraphs)
- `photos.json` – event photographs with their edition year and alt text
- `portraits.json` – which original image file is each awardee's portrait
- `manifest.json` – image sizes, written by `npm run images`

Then run `npm run build` (or keep `npm run dev` open to see changes immediately).

### Adding a new edition or new awardees

1. Add the edition to `editions` in `src/data/site.ts`.
2. Add each awardee to `awardees.json`, put the original portrait (ideally 594 × 754 or larger) in `raw/` and list it in `portraits.json`.
3. Add new photos to `raw/` and `photos.json` (id format `YYYY-NN`).
4. `npm run images` (needs Python 3 with Pillow), then `npm run build`.

### Honouree pages and share images

Every entry in `awardees.json` gets its own page at `/awardees/<slug>/` (`src/app/awardees/[slug]/page.tsx`), with Open Graph and X/Twitter tags, structured data and share links. Each page uses a 1200 × 630 share image from `public/assets/img/og/awardees/<slug>.jpg`. After adding or changing an honouree, regenerate the images:

```bash
npm run share-images   # needs Playwright + Chromium: npm i -D playwright && npx playwright install chromium
npm run build
```

Old links of the form `/awardees/#<slug>` redirect to the new page.

### Home page globe

The section under the hero shows ten honourees around a dotted globe centred on Nigeria (`src/scripts/globe.js`, drawn on a canvas with the brand colours only). To change who appears, edit the `ORBIT` list in `src/app/page.tsx` (slug, x, y and size as percentages of the square stage; `'wide'` hides that portrait on phones), add a crop for any new person in `tools/make_faces.py` and run `python3 tools/make_faces.py`. The map data in `public/assets/js/globe-data.js` comes from Natural Earth (public domain) and is rebuilt with `python3 tools/make_globe.py raw/geo`. Without JavaScript, or with reduced motion turned on, the section shows a still globe and every portrait link still works.

### "Save the date" mailing list

The home page (and the nomination page) has a sign-up form for news about the next edition. Configure it in `src/data/site.ts` under `newsletter`:

- `provider: ''` (current): the address is validated, then the visitor's email app opens with a ready-made subscription request to `nida@friendsofnigeria.net`. Someone at NIDA must add those addresses to a list by hand.
- `provider: 'mailchimp'`: set `endpoint` to the `action` URL of a Mailchimp embedded form (`https://<dc>.list-manage.com/subscribe/post?u=…&id=…`). Subscriptions go straight into the audience, with success, error and "already subscribed" messages.
- `provider: 'post'`: set `endpoint` to any service that accepts a POST with an `email` field and answers 2xx (Formspree, Basin, Netlify Forms, or a small endpoint on NIDA's server).

Change `edition` when the next year is announced.

### Opening nominations

In `src/data/site.ts` set `nominations.open: true`, `nominations.edition` and `nominations.deadline`, update `statusTitle` / `statusText`, and set `nominations.endpoint` to a form backend that accepts a normal POST (for example Formspree, Basin, Netlify Forms, or a small endpoint on NIDA's WordPress server). The form uses the same fields and categories as the old Gravity Forms nomination form. Without an endpoint the form is never shown, so the site never shows a form that cannot submit. The status text only states verified facts (currently: the 2026 deadline of 7 July 2026 published on NIDA's official form).

### Contact form

With `contact.endpoint` empty, the form opens the visitor's email app addressed to the NIDA email. Set an endpoint to receive messages directly.

## Structure

```
src/app/                 one folder per page (App Router); layout.tsx holds the <html> shell
  page.tsx               home page
  awardees/[slug]/       one page per honouree, generated from awardees.json
  not-found.tsx          404 page (exported as out/404.html)
  sitemap.ts, robots.ts  sitemap.xml and robots.txt
src/components/          header, footer, page hero, images, forms, share bar, icons
src/lib/data.ts          content helpers and URL helpers
src/lib/meta.ts          titles, descriptions, canonical URLs and social share tags
src/styles/main.css      design tokens (verified brand colours) and all styles
src/scripts/main.js      menu, reveals, tabs, filters, dialogs, lightbox, forms, share buttons
src/scripts/globe.js     home page globe animation
public/assets/           fonts, optimised WebP images, logos, share images, globe map data
tools/                   image optimisation, face crops, globe data, share images
raw/                     original images downloaded from nida-awards.org
```

Pages are React Server Components rendered to static HTML at build time. The interactive parts (`src/scripts/`) are small plain-JavaScript enhancements that run once the page has loaded; every page is fully readable without them. Pages link to each other with normal links, so each visit loads a complete, pre-rendered page.

## Fonts

Nord is the display font used on the current site (by Fontastica). Confirm the web licence before launch. Montserrat is under the SIL Open Font License (`public/assets/fonts/MONTSERRAT-OFL.txt`).
