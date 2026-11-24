// Moves every uploaded file from the old Vercel Blob store to the S3 bucket and updates the
// database to point at the new addresses. Run it once, after `npm run db:copy`, from a computer
// with the repository and these values in .env.local (or the environment):
//   DATABASE_URL, S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (and S3_PUBLIC_URL if used)
//   npm run media:move-to-s3 -- --dry-run   # only lists what would move
//   npm run media:move-to-s3
// Safe to run again: files already moved are no longer Blob addresses and are skipped.
// The Blob store itself is left untouched, so nothing is lost if something goes wrong.
import './env';
import postgres from 'postgres';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const BLOB_URL = /https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>)\\]+/g;
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const { DATABASE_URL, S3_BUCKET } = process.env;
  const region = process.env.S3_REGION || process.env.AWS_REGION;
  if (!DATABASE_URL || !S3_BUCKET || !region) throw new Error('Set DATABASE_URL, S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY first.');
  const publicBase = (process.env.S3_PUBLIC_URL || `https://${S3_BUCKET}.s3.${region}.amazonaws.com`).replace(/\/$/, '');
  const publicUrl = (key: string) => publicBase + '/' + key.split('/').map(encodeURIComponent).join('/');
  const s3 = new S3Client({ region });
  const sql = postgres(DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });

  try {
    // 1. Find every Blob address anywhere in the database
    const tables = (await sql`select tablename from pg_tables where schemaname = 'public'`).map((r) => r.tablename as string);
    const urls = new Set<string>();
    for (const t of tables) {
      for (const r of await sql`select to_jsonb(x)::text as j from ${sql(t)} x`) for (const m of (r.j as string).match(BLOB_URL) || []) urls.add(m);
    }
    console.log(`[move] ${urls.size} Blob files found`);
    if (!urls.size) return;

    // 2. Copy each file to S3, keeping its path (private files stay under private/, never public)
    const keyOf = new Map<string, string>();
    let n = 0;
    for (const url of urls) {
      const key = decodeURIComponent(new URL(url).pathname.slice(1));
      keyOf.set(url, key);
      n++;
      if (dryRun) { console.log(`  ${url}\n    -> s3://${S3_BUCKET}/${key}`); continue; }
      const res = await fetch(url);
      if (!res.ok) { console.warn(`[move] could not download (${res.status}), left as is: ${url}`); keyOf.delete(url); continue; }
      const body = Buffer.from(await res.arrayBuffer());
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET, Key: key, Body: body,
        ContentType: res.headers.get('content-type') || 'application/octet-stream',
        CacheControl: key.startsWith('private/') ? 'private, no-store' : 'public, max-age=31536000, immutable',
      }));
      if (n % 25 === 0) console.log(`[move] ${n}/${urls.size} copied`);
    }
    if (dryRun) { console.log('[move] dry run: nothing was changed.'); return; }

    // 3. Point the database at S3, in one transaction
    await sql.begin(async (tx) => {
      // The "keys" columns hold the S3 object key (used to delete or privately read a file)
      for (const [url, key] of keyOf) {
        await tx`update media set storage_keys = array_replace(storage_keys, ${url}, ${key}) where ${url} = any(storage_keys)`;
        await tx`update nomination_files set storage_key = ${key}, storage = 's3' where storage_key = ${url}`;
      }
      // Every other place (image addresses, page content, articles) gets the public S3 address
      const cols = await tx`select table_name, column_name, data_type, udt_name from information_schema.columns
        where table_schema = 'public' and (data_type in ('text', 'character varying', 'jsonb', 'json') or udt_name = '_text')`;
      for (const c of cols) {
        if ((c.table_name === 'media' && c.column_name === 'storage_keys') || (c.table_name === 'nomination_files' && c.column_name === 'storage_key')) continue;
        const type = c.udt_name === '_text' ? 'text[]' : c.data_type === 'character varying' ? 'varchar' : c.data_type;
        for (const [url, key] of keyOf) {
          if (key.startsWith('private/')) continue;
          await tx.unsafe(`update "${c.table_name}" set "${c.column_name}" = replace("${c.column_name}"::text, $1, $2)::${type} where position($1 in "${c.column_name}"::text) > 0`, [url, publicUrl(key)]);
        }
      }
      // Media whose files have all moved is now stored in S3
      await tx`update media set storage = 's3' where storage = 'blob' and not exists (select 1 from unnest(storage_keys) k where k like 'https://%blob.vercel-storage.com/%')`;
    });
    const [{ left }] = await sql`select count(*)::int as left from media where storage = 'blob'`;
    console.log(`[move] done. ${keyOf.size} files moved to S3.${left ? ` ${left} media items still point at Blob (see warnings above); run again to retry.` : ''}`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('[move] failed:', e.message);
  process.exit(1);
});
