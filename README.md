# NIDA – Nigerians in Diaspora Awards website

The nida-awards.org website and its admin dashboard (CMS), built with [Next.js](https://nextjs.org) (App Router) and Postgres. See `AUDIT.md` for the audit, the verified brand colours and the content NIDA needs to confirm.

- **Public website**: the pages at `/`, `/awards/`, `/awardees/`, `/news/` and so on. Pages are pre-rendered and refreshed automatically when something is published in the admin.
- **Admin dashboard** at `/admin`: sign in to edit website content, awardees, events, news, media, and to review nominations and messages. There is no public sign-up.

## Admin CMS setup

The site now needs a Node server and a database (it is no longer a static export, so uploading `out/` to a plain web host no longer works). The recommended setup is **Vercel** with a **Neon Postgres** database and a **Vercel Blob** store, all created from the Vercel dashboard. The free tiers are enough for NIDA.

### 1. Deploy and connect storage

1. In [Vercel](https://vercel.com/new), import the GitHub repository `nida-awards-website`. Keep the defaults (framework Next.js, build command `npm run build`).
2. In the project, open **Storage** → **Create Database** → **Neon (Postgres)**, and connect it to the project. This sets `DATABASE_URL` for you.
3. Still in **Storage**, create a **Blob** store and connect it. This sets `BLOB_STORE_ID` (or `BLOB_READ_WRITE_TOKEN` on older setups). Uploaded images and documents are stored there, not in the database.
4. In **Settings → Environment Variables**, add `ADMIN_SETUP_TOKEN` with a long random value (at least 16 characters, for example from a password manager). Keep it private: it is only needed once, to create the first administrator.
5. Redeploy (**Deployments** → ⋯ → **Redeploy**). Every build first runs the database migrations. On the very first build the database is filled with the current website content (texts, awardees, events, photos), so the site looks exactly as before.

### 2. Create the first Super Admin

Open `https://<your-site>/admin/setup`, enter the setup code (`ADMIN_SETUP_TOKEN`), your name, email and a password (at least 12 characters, with letters and numbers or symbols). This page only works while no administrator exists; afterwards it is closed for good. You can then delete `ADMIN_SETUP_TOKEN` from Vercel.

Alternative from a computer with the repository: `DATABASE_URL=… npm run admin:create` asks for the details in the terminal (the password is not shown or stored in any file).

### 3. Daily use

- **Sign in** at `/admin` (the sign-in page is `/admin/login`). Sessions end after 12 hours without activity. After 5 wrong passwords an account is locked for 15 minutes.
- **Change your password**: My account → Change password. Other devices are signed out.
- **Forgotten password**: "Forgot your password?" on the sign-in page sends a reset link if email is set up (below). Otherwise a Super Admin opens Administrators → the person → **Create reset link** and sends them the link.
- **Add administrators**: Administrators → **Invite administrator**. Choose a role:
  - **Super Admin**: everything, including administrators, the activity log and backups.
  - **Editor**: edits and publishes content, awardees, events, articles and media; manages nominations and messages.
  - **Viewer**: read-only.
  The invitation link (valid 7 days, usable once) lets the person choose their own password. Nobody ever sees another person's password.
- **Remove access**: set the status to **Deactivated** (signed out everywhere at once) or delete the account. There must always be at least one active Super Admin.
- **Website content**: edit texts and images, **Save draft**, use **Preview** to see the draft on the real site (only you see it), then **Publish**.
- **Opening nominations**: Website content → Awards & nominations → tick "Nominations are open". Entries, including uploaded photos and documents, then appear under Nominations. Uploaded nomination files are private: they only open for signed-in administrators.
- **Activity log**: every change is recorded with who made it and when.

### Locked out?

If every Super Admin has lost access, someone with the database address can run `DATABASE_URL=… npm run admin:create` with an existing email to set a new password and restore Super Admin access.

### Environment variables

| Name | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (set by the Neon integration). |
| `BLOB_STORE_ID` or `BLOB_READ_WRITE_TOKEN` | yes on Vercel | Vercel Blob store for uploads, set when the Blob store is connected (newer projects get `BLOB_STORE_ID` and sign in with OIDC; older ones a read-write token). Locally, files go to `.data/uploads` instead. |
| `ADMIN_SETUP_TOKEN` | first setup only | Secret code for `/admin/setup`. Remove it after creating the first Super Admin. |
| `RESEND_API_KEY`, `EMAIL_FROM` | optional | Sends invitations, password resets and new-submission alerts with [Resend](https://resend.com) (`EMAIL_FROM` like `NIDA <admin@nida-awards.org>`, on a domain verified in Resend). Without them, links are shown in the admin to copy. |
| `ADMIN_URL` | optional | Address used in emailed links, for example `https://nida-awards.org`. Defaults to the Vercel production address. |
| `SITE_URL` | optional | Canonical public address used in share tags and the sitemap. Defaults to `https://nida-awards.org`. |

None of these values are ever sent to the browser. Never commit them to the repository.

### Backups

1. **Automatic**: Neon keeps a history of the database and can restore it to an earlier moment (Neon console → Branches → Restore).
2. **Manual download**: a Super Admin can download the whole content as JSON from System & backups (passwords are never included). Do this regularly, for example monthly and before large changes.
3. **From a computer**: `DATABASE_URL=… npm run db:backup` writes the same JSON file to `backups/`.

Uploaded files stay in the Blob store, separate from the database; the backup lists the address of each file.

## Local development

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL to a local or Neon Postgres database
npm run db:migrate           # creates the tables and imports the launch content
npm run dev                  # http://localhost:3000, admin at http://localhost:3000/admin
npm run build && npm start   # production build
```

Node 20.9+ is required. Without `DATABASE_URL` the public site still builds from the launch content in `src/data/`, but the admin and the forms are unavailable.

## Content and images

Day-to-day content (texts, awardees, events, news, photos) is edited in the admin. The files in `src/data/` are only the launch content imported into a new, empty database. The hero wall and the globe below are still configured in code:

### Home page globe

The hero's moving wall mixes award-night photos from nida-awards.org (honourees holding NIDA trophies, presentations, acceptance speeches, 2023 to 2025) with verified honouree portraits. The tiles, their order per column and their captions live in `src/data/hero-wall.json`; after changing a photo or its crop, run `python3 tools/make_hero_wall.py` to rebuild the 3:4 crops in `public/assets/img/hero/wall/`. Only name a person on a photo tile when the photo is already credited to them (it then links to their profile; other photo tiles link to the gallery). Keep about nine tiles per column so the scroll speed stays the same.

The section under the hero shows ten honourees around a dotted globe centred on Nigeria (`src/scripts/globe.js`, drawn on a canvas with the brand colours only). To change who appears, edit the `ORBIT` list in `src/app/(site)/page.tsx` (slug, x, y and size as percentages of the square stage; `'wide'` hides that portrait on phones), add a crop for any new person in `tools/make_faces.py` and run `python3 tools/make_faces.py`. The map data in `public/assets/js/globe-data.js` comes from Natural Earth (public domain) and is rebuilt with `python3 tools/make_globe.py raw/geo`. Without JavaScript, or with reduced motion turned on, the section shows a still globe and every portrait link still works.

## Structure

```
src/app/(site)/          public pages (App Router); page.tsx is the home page
  awardees/[slug]/       one page per honouree
  news/                  news and blog
  sitemap.ts, robots.ts  sitemap.xml and robots.txt (in src/app/)
src/app/admin/           admin dashboard: (auth) sign-in pages, (panel) admin screens, actions/ server actions
src/app/api/             form endpoints, uploads, exports and backups
src/lib/server/          database, sessions and roles, storage, image processing (server only)
db/migrations/           database schema; scripts/ holds migrate, backup and admin:create
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

Public pages are React Server Components, pre-rendered and refreshed when the admin publishes a change. The interactive parts (`src/scripts/`) are small plain-JavaScript enhancements that run once the page has loaded; every page is fully readable without them. Pages link to each other with normal links, so each visit loads a complete, pre-rendered page.

## Fonts and typography

Two families, as on nida-awards.org, both self-hosted in `public/assets/fonts/`:

- **NIDA Display** for headings and key figures: TeX Gyre Adventor (GUST Font License, `ADVENTOR-GUST-FONT-LICENSE.txt`), the open-licence revival of ITC Avant Garde Gothic. nida-awards.org sets every heading in ITC Avant Garde Gothic Medium, so this keeps NIDA's heading voice without a commercial licence. The files are subsets (Latin, Latin Extended, Yoruba and Vietnamese accents), so every honouree name, including Péjú Oshin, renders in it.
- **Montserrat** (SIL Open Font License, `MONTSERRAT-OFL.txt`) for paragraphs, labels, buttons, navigation and forms.

All sizes, weights, line heights and letter spacing are tokens at the top of `src/styles/main.css` (`--fs-*`, `--fw-*`, `--lh-*`, `--ls-*`, `--para-gap`, `--measure`). Use the tokens or the `.display`, `.h1` to `.h4`, `.lead` and `.statement` classes rather than new values, so headings at the same level look the same on every page.

The site has no eyebrows: no small uppercase labels above headings. A section starts with its heading; if a label carries information (an edition, a year, "Mission"), make it part of the heading or put it below the heading in sentence case. Award titles on cards and lists are sentence case too. Uppercase is kept only for buttons, navigation, footer column titles and data labels (`dt`).

| Role | Font, weight | Size (360px to 1440px) | Line height | Tracking |
| --- | --- | --- | --- | --- |
| Display (home hero, closing headline) | Display bold | 40 to 72px | 1.04 | -0.025em |
| H1 (page titles, honouree name) | Display bold | 36 to 60px | 1.06 | -0.025em |
| H2 (section headings) | Display bold | 28 to 44px | 1.12 | -0.02em |
| H3 (sub-sections, featured names) | Display bold | 20 to 26px | 1.22 | -0.012em |
| H4 (card and panel titles) | Display bold | 17 to 19px | 1.3 | -0.005em |
| Key figures | Display bold | 30 to 44px | 1 | -0.02em |
| Statement | Montserrat 500 | 24 to 40px | 1.22 | -0.02em |
| Mission and vision | Montserrat 500 | 18 to 24px | 1.4 | -0.01em |
| Lead paragraph | Montserrat 400 | 17 to 20px | 1.6 | 0 |
| Biography | Montserrat 400 | 17 to 18px (first paragraph 18 to 20px, 500) | 1.8 | 0 |
| Body | Montserrat 400 | 16px (15px for supporting text) | 1.7 | 0 |
| Small, caption | Montserrat 400 | 14px, 13px | 1.55 | 0 |
| Award title on cards and lists | Montserrat 500–600 | 13–14px | 1.55 | 0 |
| Data label (`dt`), footer column title | Montserrat 600, uppercase | 12px | 1.5 | 0.2em |
| Breadcrumb | Montserrat 500 | 13px | 1.5 | 0 |
| Button | Montserrat 600, uppercase | 13px (12px in the header) | 1.2 | 0.14em |
| Navigation | Montserrat 600, uppercase | 12.5px | | 0.16em |

Paragraphs are capped at 68 characters (biographies 66), with 1em between paragraphs (1.25em in biographies).
