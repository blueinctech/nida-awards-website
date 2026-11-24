// Checks that the move off Vercel is complete before the domain is switched:
//   npm run move:check
// Reads .env.local. Reports, without changing anything:
//   - missing settings
//   - row counts in the old database (SOURCE_DATABASE_URL, if set) against the new one
//   - any address in the new database that still points at Vercel
//   - every uploaded file the database uses really exists in S3, and public images open without signing in
//   - whether SES can send (domain verified, out of the sandbox)
import './env';
import postgres from 'postgres';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { SESv2Client, GetAccountCommand, GetEmailIdentityCommand } from '@aws-sdk/client-sesv2';

const TABLES = ['admin_users', 'activity_log', 'site_settings', 'media', 'award_categories', 'awardees', 'events', 'posts', 'nominations', 'nomination_files', 'nomination_notes', 'messages'];
let problems = 0;
const ok = (m: string) => console.log('  OK    ' + m);
const bad = (m: string) => { problems++; console.log('  FIX   ' + m); };
const note = (m: string) => console.log('  NOTE  ' + m);

async function main() {
  const env = process.env;
  const region = env.S3_REGION || env.AWS_REGION || '';
  console.log('\nSettings');
  for (const k of ['DATABASE_URL', 'S3_BUCKET', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'ADMIN_URL', 'SITE_URL', 'EMAIL_FROM']) (env[k] ? ok : bad)(`${k} ${env[k] ? 'is set' : 'is missing'}`);
  if (!env.DATABASE_URL) return;
  if (env.DATABASE_URL === env.SOURCE_DATABASE_URL) bad('DATABASE_URL is the old database. It must be the new Neon database.');
  if (/vercel/i.test(env.ADMIN_URL || '') || /vercel/i.test(env.SITE_URL || '')) bad('ADMIN_URL or SITE_URL still points at Vercel.');

  const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });
  try {
    console.log('\nDatabase');
    if (env.SOURCE_DATABASE_URL) {
      const old = postgres(env.SOURCE_DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });
      try {
        for (const t of TABLES) {
          const [[a], [b]] = await Promise.all([old`select count(*)::int as n from ${old(t)}`, sql`select count(*)::int as n from ${sql(t)}`]);
          (a.n === b.n ? ok : bad)(`${t}: ${b.n} rows in the new database, ${a.n} in the old one`);
        }
      } finally {
        await old.end();
      }
    } else note('SOURCE_DATABASE_URL not set, so row counts are not compared with the old database.');

    const tables = (await sql`select tablename from pg_tables where schemaname = 'public'`).map((r) => r.tablename as string);
    let blobRefs = 0, vercelLinks = 0;
    for (const t of tables) {
      for (const r of await sql`select to_jsonb(x)::text as j from ${sql(t)} x`) {
        blobRefs += ((r.j as string).match(/blob\.vercel-storage\.com/g) || []).length;
        vercelLinks += ((r.j as string).match(/[a-z0-9-]+\.vercel\.app/g) || []).length;
      }
    }
    (blobRefs ? bad : ok)(blobRefs ? `${blobRefs} addresses still point at Vercel Blob: run npm run media:move-to-s3` : 'No addresses point at Vercel Blob');
    if (vercelLinks) note(`${vercelLinks} links in the content mention a .vercel.app address. Edit them in the admin if they are meant for visitors.`);
    const [{ n: blobRows }] = await sql`select count(*)::int as n from media where storage = 'blob'`;
    if (blobRows) bad(`${blobRows} media items are still marked as stored in Vercel Blob`);

    console.log('\nFiles in S3');
    if (env.S3_BUCKET && region) {
      const s3 = new S3Client({ region });
      const keys = [
        ...(await sql`select unnest(storage_keys) as k from media where storage = 's3'`).map((r) => r.k as string),
        ...(await sql`select storage_key as k from nomination_files where storage = 's3'`).map((r) => r.k as string),
      ];
      let missing = 0;
      for (const Key of keys) {
        const found = await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key })).then(() => true, () => false);
        if (!found) { missing++; if (missing <= 10) console.log('        missing: ' + Key); }
      }
      (missing ? bad : ok)(`${keys.length - missing} of ${keys.length} uploaded files found in the bucket`);
      const [pub] = await sql`select url from media where storage = 's3' and kind = 'image' limit 1`;
      if (pub) {
        const res = await fetch(pub.url, { method: 'HEAD' }).catch(() => null);
        (res?.ok ? ok : bad)(res?.ok ? 'Public images open without signing in' : `Public image did not open (${res?.status ?? 'no answer'}). Check the bucket policy and Block Public Access settings.`);
      }
      const [priv] = await sql`select storage_key from nomination_files where storage = 's3' limit 1`;
      if (priv) {
        const base = (env.S3_PUBLIC_URL || `https://${env.S3_BUCKET}.s3.${region}.amazonaws.com`).replace(/\/$/, '');
        const res = await fetch(base + '/' + priv.storage_key, { method: 'HEAD' }).catch(() => null);
        (res?.ok ? bad : ok)(res?.ok ? 'Nomination files are PUBLIC. Limit the bucket policy to media/* and documents/*.' : 'Nomination files are private');
      }
    }

    console.log('\nEmail (SES)');
    if (env.EMAIL_FROM && (env.SES_REGION || region)) {
      const ses = new SESv2Client({ region: env.SES_REGION || region });
      const domain = (env.EMAIL_FROM.match(/@([^>\s]+)/) || [])[1];
      try {
        const acc = await ses.send(new GetAccountCommand({}));
        (acc.ProductionAccessEnabled ? ok : bad)(acc.ProductionAccessEnabled ? 'SES is out of the sandbox' : 'SES is still in the sandbox: it can only send to verified addresses. Request production access.');
        if (domain) {
          const id = await ses.send(new GetEmailIdentityCommand({ EmailIdentity: domain })).catch(() => null);
          (id?.VerifiedForSendingStatus ? ok : bad)(id?.VerifiedForSendingStatus ? `${domain} is verified for sending` : `${domain} is not verified in SES (${env.SES_REGION || region})`);
        }
      } catch (e) {
        note(`Could not read the SES account (${(e as Error).name}). Add ses:GetAccount and ses:GetEmailIdentity to the IAM policy to check it here.`);
      }
    } else note('EMAIL_FROM not set: emails are off and links are shown in the admin instead.');
  } finally {
    await sql.end();
  }
  console.log(problems ? `\n${problems} thing(s) to fix before switching the domain.\n` : '\nEverything is on the new services. You can switch the domain.\n');
  if (problems) process.exitCode = 1;
}

main().catch((e) => {
  console.error('[check] failed:', e.message);
  process.exit(1);
});
