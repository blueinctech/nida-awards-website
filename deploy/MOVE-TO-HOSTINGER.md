# Moving the NIDA website from Vercel to Hostinger

A full move: the code goes to Hostinger, every database row goes to the new Neon database, and every file in the Vercel Blob store goes to the S3 bucket. Nothing stays on Vercel. The old site keeps working until step 7, so visitors never see a gap.

Tick each box as you go.

## 1. Create the new services (AWS and Neon)

Details for each are in the README, section "Prepare the services".

- [ ] **Neon**: new project, region close to the Hostinger server. Copy the *pooled* connection string.
- [ ] **S3**: new bucket (ACLs disabled), the two "bucket policy" Block Public Access boxes unticked, and the bucket policy that makes only `media/*` and `documents/*` public. Turn on **Versioning** (Properties tab) so deleted files can be recovered.
- [ ] **SES**: verify the domain `nida-awards.org` (add the 3 DKIM records in DNS) and request production access.
- [ ] **IAM**: a user `nida-website` with the policy from the README, and an access key. Keep the secret in a password manager.

## 2. Fill in the two settings files

Both are in the `deploy/` folder. Fill them in on your computer, never in chat or email.

- [ ] `deploy/hostinger.env`: the new services. This is what Hostinger uses.
- [ ] `deploy/move-from-vercel.env`: the same new values plus the **old** database address and the **old** Blob token from Vercel. Save it in the website folder as `.env.local`.
  - Old database: Vercel → project → **Storage** → the Neon database → **.env.local** tab → `DATABASE_URL`.
  - Old Blob token: Vercel → **Storage** → the Blob store → **.env.local** tab → `BLOB_READ_WRITE_TOKEN`.

## 3. Copy the data (on your computer)

In the website folder (Command Prompt or PowerShell, Node 20.9+ installed), with this version of the code:

```
npm install
npm run db:copy
npm run media:move-to-s3 -- --dry-run
npm run media:move-to-s3
npm run move:check
```

- [ ] `db:copy` printed a row count for every table and "done". It creates the tables in the new database and copies every row: content, awardees, events, articles, media records, nominations, messages, administrators (with their passwords) and the activity log. Admins just sign in again.
- [ ] `media:move-to-s3` printed "done" with 0 failed. It copies **every file in the Blob store** (also ones no page uses any more), keeps private nomination files private, rewrites every address in the database to S3, and saves a list of what moved to `backups/`. If some failed, run it again; finished files are skipped.
- [ ] `move:check` ends with "Everything is on the new services". It compares row counts with the old database, looks for any address still pointing at Vercel, checks every file exists in S3, that images are public and nomination files are not, and that SES can send. Fix anything marked FIX and run it again.

The site's built-in pictures (logo, fonts, awardee portraits from launch, gallery photos) are part of the code in `public/`, not Vercel Blob, so they move with the code automatically.

## 4. Put the site on Hostinger

Your plan must run Node.js apps: Business or Cloud web hosting, or a VPS.

**Business / Cloud (hPanel)**
- [ ] hPanel → Websites → Add website → **Node.js Apps** → import the GitHub repository `blueinctech/nida-awards-website`, branch `main`.
- [ ] Node 20 or 22, build command `npm run build`, start command `npm start`.
- [ ] Environment variables: add every filled-in line of `hostinger.env` (or, if you upload the code as a ZIP instead of GitHub, include the filled-in file renamed to `.env`).
- [ ] Deploy. The build log should show `[db] up to date` (and **not** "importing the launch content", which would mean it is pointed at an empty database).

**VPS**
- [ ] Follow "Hostinger VPS" in the README; upload the filled-in `hostinger.env` as `.env` into the website folder.

## 5. Test on the temporary Hostinger address

- [ ] Home page, an awardee page, the gallery and a news article show their pictures.
- [ ] Right-click an uploaded image → open in new tab: the address starts with your S3 bucket, not `vercel-storage.com`.
- [ ] Sign in at `/admin` with your usual email and password.
- [ ] System & backups: Database *Neon Postgres*, File storage *Amazon S3*, Email *OK*.
- [ ] Media: upload a test image, then delete it.
- [ ] Nominations: open an uploaded nomination file.
- [ ] Administrators → your account → **Create reset link** with "send by email": the email arrives.

## 6. Last sync just before switching

If anything happened on the old site after step 3 (a new nomination, message or edit):
- [ ] In Neon, delete and recreate the database (or create a fresh branch and use its address), then repeat step 3 and redeploy. `db:copy` only copies into an empty database, so it can never overwrite.

Avoid editing in the old admin from now on.

## 7. Switch the domain

- [ ] In hPanel connect `nida-awards.org` (and `www`) to the Node.js app, or point the domain's DNS A record at the Hostinger IP. Remove the domain from the Vercel project.
- [ ] Turn on SSL in hPanel and check `https://nida-awards.org/admin` signs in (the sign-in cookie needs HTTPS).

## 8. Close Vercel (after a week or two without problems)

- [ ] Download a backup: admin → System & backups → Download backup.
- [ ] Vercel → project → Settings → disconnect the GitHub repository (so pushes stop building there), then delete the Blob store, the Neon database and the project.
- [ ] Delete `.env.local` from your computer, or at least remove `SOURCE_DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` from it.
