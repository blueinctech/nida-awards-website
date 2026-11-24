# NIDA – Nigerians in Diaspora Awards website

The nida-awards.org website and its admin dashboard (CMS), built with [Next.js](https://nextjs.org) (App Router) and Postgres. See `AUDIT.md` for the audit, the verified brand colours and the content NIDA needs to confirm.

- **Public website**: the pages at `/`, `/awards/`, `/awardees/`, `/news/` and so on. Pages are pre-rendered and refreshed automatically when something is published in the admin.
- **Admin dashboard** at `/admin`: sign in to edit website content, awardees, events, news, media, and to review nominations and messages. There is no public sign-up.

## Admin CMS setup

The site needs a Node.js server (Node 20.9 or newer) and three services:

- **Neon Postgres** for all content, awardees, nominations and administrators (`DATABASE_URL`).
- **Amazon S3** for uploaded images and documents (`S3_BUCKET` and the AWS keys).
- **Amazon SES** for invitation, password-reset and new-submission emails (optional, `EMAIL_FROM`).

It is hosted on **Hostinger** (a plan with Node.js web apps, or a VPS). Nothing in the code depends on Vercel any more. The whole move from Vercel is described step by step in **[Moving to Hostinger](#moving-to-hostinger)** below.

### 1. Prepare the services

**Neon.** In the [Neon console](https://console.neon.tech) create a project (choose the region closest to the Hostinger server, for example AWS Europe London or Frankfurt). On the project dashboard click **Connect**, tick **Connection pooling**, and copy the connection string. It looks like `postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require`. That is `DATABASE_URL`.

**S3 bucket.** In the AWS console → S3 → **Create bucket**:
1. Name it (for example `nida-awards-media`) and pick a region (for example `eu-west-2`, London). Keep **ACLs disabled**.
2. Under **Block Public Access**, untick only the two "bucket policies" boxes (the two "ACLs" boxes can stay ticked). Public images are read straight from the bucket; nomination uploads are never public.
3. After creating it, open **Permissions → Bucket policy** and paste this (replace `BUCKET` with the bucket name):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicWebsiteFiles",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": ["arn:aws:s3:::BUCKET/media/*", "arn:aws:s3:::BUCKET/documents/*"]
     }]
   }
   ```
   Files under `private/` (nomination photos and documents) stay private and are only shown to signed-in administrators through the admin.
4. (Optional) To serve images from your own address or a CDN, put CloudFront in front of the bucket and set `S3_PUBLIC_URL` to that address.

**SES.** In the AWS console → Amazon SES (same region is simplest):
1. **Identities → Create identity → Domain** `nida-awards.org`. Add the three DKIM CNAME records it shows at your DNS provider and wait until the identity says *Verified*.
2. New SES accounts are in the *sandbox* and can only send to verified addresses. Open **Account dashboard → Request production access** (transactional email, a few messages a day) so invitations and alerts reach anyone.

**AWS access key.** In IAM create a user (for example `nida-website`) with no console access and attach this inline policy (replace `BUCKET`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::BUCKET/*" },
    { "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "*" }
  ]
}
```
Then **Security credentials → Create access key** (use case: application running outside AWS). That gives `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. The secret is shown once: put it straight into Hostinger's environment variables and your local `.env.local`, never in chat, email or the repository.

### 2. Deploy on Hostinger

**Hostinger web hosting with Node.js apps (Business or Cloud plans):**
1. hPanel → **Websites** → **Add website** → **Node.js Apps**. Choose **Import Git repository**, connect GitHub and pick `nida-awards-website`, branch `main`. (Or upload a ZIP of the repository without `node_modules`, `.next` and `.env*`.)
2. Build settings: framework **Next.js**, Node version **20.x or 22.x**, build command `npm run build`, start command `npm start`, output directory `.next`.
3. **Environment variables**: add every variable from the table below (at least `DATABASE_URL`, `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `ADMIN_URL`, `SITE_URL`, plus `EMAIL_FROM` for email). They are used both while building and while running.
4. **Deploy**. Every build first runs the database migrations (`npm run build` = migrations + `next build`). A brand-new empty database is filled with the launch content; a copied database is left as it is.
5. Connect the domain `nida-awards.org` to the app in hPanel and switch on the free SSL certificate. The admin sign-in cookie needs HTTPS.

**Hostinger VPS (any Linux VPS):**
```bash
# once: Node 22 and PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
git clone https://github.com/blueinctech/nida-awards-website.git && cd nida-awards-website
nano .env.local            # paste the variables from the table below (this file is never committed)
npm ci && npm run build
pm2 start npm --name nida -- start && pm2 save && pm2 startup
```
Then point Nginx at `http://127.0.0.1:3000` (`proxy_pass`, with `proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme;`) and add HTTPS with `sudo certbot --nginx -d nida-awards.org -d www.nida-awards.org`. To update later: `git pull && npm ci && npm run build && pm2 restart nida`.

### 3. Create the first Super Admin

Not needed if you copied the old database (your administrators and passwords come with it).

For a new database: open `https://<your-site>/admin/setup`, enter the setup code (`ADMIN_SETUP_TOKEN`), your name, email and a password (at least 8 characters, with letters and numbers or symbols). This page only works while no administrator exists; afterwards it is closed for good. You can then remove `ADMIN_SETUP_TOKEN` from the environment variables.

Alternative from a computer with the repository: `DATABASE_URL=… npm run admin:create` asks for the details in the terminal (the password is not shown or stored in any file).

### 4. Daily use


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

If every Super Admin has lost access: set `ADMIN_SETUP_TOKEN` in the host's environment variables again, redeploy (or restart), open `/admin/recover`, and enter the setup code with your email and a new password (an unknown email becomes a new Super Admin). Remove the token afterwards. Alternatively, someone with the database address can run `DATABASE_URL=… npm run admin:create` with an existing email to set a new password and restore Super Admin access.

### Environment variables

Set these in Hostinger (hPanel → the Node.js app → **Environment variables**, or `.env.local` on a VPS). For the move scripts and local development, put them in `.env.local` in the repository folder (the file must be named exactly `.env.local`, not `.env.local.txt`).

| Name | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string (the pooled one, ending in `?sslmode=require`). |
| `S3_BUCKET` | yes | Name of the S3 bucket for uploads, for example `nida-awards-media`. Without it, uploads are saved to the server disk (`.data/uploads`), which is only for local development. |
| `AWS_REGION` | yes | Region of the bucket (and of SES unless `SES_REGION` is set), for example `eu-west-2`. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | yes | Access key of the IAM user above (S3 and SES permissions only). |
| `ADMIN_URL` | yes | Address used in emailed links, for example `https://nida-awards.org`. |
| `SITE_URL` | recommended | Canonical public address for share tags and the sitemap. Defaults to `https://nida-awards.org`. |
| `EMAIL_FROM` | for email | Sender, for example `NIDA <admin@nida-awards.org>`, on the domain verified in SES. Without it, invitation and reset links are shown in the admin to copy. |
| `EMAIL_REPLY_TO` | optional | Reply-to address for emails. |
| `SES_REGION` | optional | Only if SES is in a different region from the bucket. |
| `S3_PUBLIC_URL` | optional | CloudFront or custom address for public files. Defaults to `https://BUCKET.s3.REGION.amazonaws.com`. |
| `ADMIN_SETUP_TOKEN` | first setup only | Secret code for `/admin/setup` and `/admin/recover`, 16+ characters. Remove it when done. |
| `SOURCE_DATABASE_URL` | move only | The old (Vercel) database, read by `npm run db:copy`. Only in `.env.local` on your computer, never on the server. |
| `RESEND_API_KEY` | optional | Alternative to SES. SES is used when both are set. |

None of these values are ever sent to the browser. Never commit them to the repository.

### Backups

1. **Automatic**: Neon keeps a history of the database and can restore it to an earlier moment (Neon console → Branches → Restore).
2. **Manual download**: a Super Admin can download the whole content as JSON from System & backups (passwords are never included). Do this regularly, for example monthly and before large changes.
3. **From a computer**: `DATABASE_URL=… npm run db:backup` writes the same JSON file to `backups/`.

Uploaded files stay in the S3 bucket, separate from the database; the backup lists the address of each file. Turn on **Versioning** on the bucket to be able to recover deleted or replaced files.

## Moving to Hostinger

The site was first hosted on Vercel, with a Neon database and a Vercel Blob store that Vercel created and connected itself. This is how to move everything, without losing content, administrators or uploads. Keep the Vercel site running until the last step.

1. **Prepare the new services**: a new Neon project, the S3 bucket, SES and the IAM access key, as in [Prepare the services](#1-prepare-the-services).
2. **Get the old database address**: Vercel → the project → **Settings → Environment Variables** → reveal `DATABASE_URL` (or `POSTGRES_URL`). You only need it on your own computer, for the copy.
3. **On your computer**, in the repository folder (with this version of the code), create `.env.local` with:
   ```
   SOURCE_DATABASE_URL=
   DATABASE_URL=
   S3_BUCKET=
   AWS_REGION=
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   ```
   `SOURCE_DATABASE_URL` is the old database from Vercel and `DATABASE_URL` the new Neon one. Then run:
   ```bash
   npm install
   npm run db:copy                          # creates the tables in the new database and copies every row
   npm run media:move-to-s3 -- --dry-run    # lists the Blob files it will move
   npm run media:move-to-s3                 # copies them to S3 and updates every address in the database
   ```
   `db:copy` refuses to touch a database that already has content, and does everything in one transaction. `media:move-to-s3` leaves the Blob store untouched and can be run again safely. Administrators keep their passwords; everyone just signs in again.
4. **Deploy on Hostinger** as in [Deploy on Hostinger](#2-deploy-on-hostinger), with the new `DATABASE_URL` (not `SOURCE_DATABASE_URL`).
5. **Check** the temporary Hostinger address: home page images, an awardee page, sign in at `/admin`, upload a test image in Media, and open a nomination file. Under System & backups, File storage should say *Amazon S3* and Email should say *OK*.
6. **Switch the domain**: point `nida-awards.org` at Hostinger (in hPanel, or update the DNS A record), and enable SSL.
7. After a week or two without problems, delete the Vercel project, its Neon database and Blob store, and remove `SOURCE_DATABASE_URL` from your `.env.local`. If anything changed on the old site between step 3 and step 6 (for example a new nomination), run step 3 again into a fresh, empty Neon branch before switching.

## Local development

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL (and S3 settings, or leave S3_BUCKET empty to save uploads to .data/uploads)
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
