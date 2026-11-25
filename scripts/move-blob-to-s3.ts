// Moves every file out of the old Vercel Blob store into the S3 bucket and updates the database
// to point at the new addresses. Run it once, after `npm run db:copy`, from your computer, with
// these in .env.local:
//   DATABASE_URL (the NEW Neon database), S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
//   (or, for Amazon S3: S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
//   BLOB_READ_WRITE_TOKEN (from the old Blob store: copies EVERY file in the store, not only
//   the ones the database still uses)
//   npm run media:move-to-s3 -- --dry-run   # only lists what would move
//   npm run media:move-to-s3
// Safe to run again: files already in S3 are skipped. The Blob store is not changed, and a list
// of every moved file is written to backups/.
import './env';
import postgres from 'postgres';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { makeS3, publicUrl, s3Settings } from './s3';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BLOB_URL = /https:\/\/[a-z0-9]+\.(?:public|private)\.blob\.vercel-storage\.com\/[^\s"'<>)\\]+/g;
const dryRun = process.argv.includes('--dry-run');
const token = process.env.BLOB_READ_WRITE_TOKEN || Object.entries(process.env).find(([k, v]) => k.endsWith('READ_WRITE_TOKEN') && v?.startsWith('vercel_blob_rw_'))?.[1];

// Every file in the Blob store (needs the store's read-write token)
async function listWholeStore(): Promise<string[]> {
  if (!token) return [];
  const storeId = token.split('_')[3] || '';
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const qs = new URLSearchParams({ limit: '1000', ...(cursor ? { cursor } : {}) });
    const res = await fetch('https://vercel.com/api/blob?' + qs, {
      headers: { authorization: `Bearer ${token}`, 'x-api-version': '13', 'x-vercel-blob-store-id': storeId },
    });
    if (!res.ok) throw new Error(`Could not list the Blob store (${res.status}): ${await res.text().catch(() => '')}`);
    const data = (await res.json()) as { blobs: { url: string }[]; cursor?: string; hasMore: boolean };
    out.push(...data.blobs.map((b) => b.url));
    cursor = data.hasMore ? data.cursor : undefined;
  } while (cursor);
  return out;
}

async function main() {
  const { DATABASE_URL } = process.env;
  const { bucket: S3_BUCKET, ready } = s3Settings();
  if (!DATABASE_URL || !ready) throw new Error('Set DATABASE_URL, S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY first.');
  if (process.env.SOURCE_DATABASE_URL && process.env.SOURCE_DATABASE_URL === DATABASE_URL) throw new Error('DATABASE_URL must be the NEW database, not the old one.');
  const s3 = makeS3();
  const sql = postgres(DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });

  try {
    // 1. Every Blob address used anywhere in the database, plus every file in the store
    const tables = (await sql`select tablename from pg_tables where schemaname = 'public'`).map((r) => r.tablename as string);
    const used = new Set<string>();
    for (const t of tables) {
      for (const r of await sql`select to_jsonb(x)::text as j from ${sql(t)} x`) for (const m of (r.j as string).match(BLOB_URL) || []) used.add(m);
    }
    const store = await listWholeStore();
    const all = new Set([...used, ...store]);
    console.log(`[move] ${used.size} Blob files used by the database, ${token ? store.length + ' files in the Blob store' : 'Blob store not listed (no BLOB_READ_WRITE_TOKEN): only the files the database uses are copied'}`);
    if (!all.size) return;

    // 2. Copy each file to S3, keeping its path (files under private/ stay private)
    const keyOf = new Map<string, string>();
    const failed: string[] = [];
    let copied = 0, skipped = 0;
    for (const url of all) {
      const key = decodeURIComponent(new URL(url).pathname.slice(1));
      if (dryRun) { console.log(`  ${url}\n    -> s3://${S3_BUCKET}/${key}`); keyOf.set(url, key); continue; }
      const exists = await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key })).then(() => true, () => false);
      if (exists) { keyOf.set(url, key); skipped++; continue; }
      const res = await fetch(url, url.includes('.private.') && token ? { headers: { authorization: `Bearer ${token}` } } : {});
      if (!res.ok) { console.warn(`[move] could not download (${res.status}): ${url}`); failed.push(url); continue; }
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET, Key: key, Body: Buffer.from(await res.arrayBuffer()),
        ContentType: res.headers.get('content-type') || 'application/octet-stream',
        CacheControl: key.startsWith('private/') ? 'private, no-store' : 'public, max-age=31536000, immutable',
      }));
      keyOf.set(url, key);
      if (++copied % 25 === 0) console.log(`[move] ${copied} copied…`);
    }
    if (dryRun) { console.log(`[move] dry run: ${all.size} files would be copied. Nothing was changed.`); return; }

    // 3. Point the database at S3, in one transaction
    await sql.begin(async (tx) => {
      for (const url of used) {
        const key = keyOf.get(url);
        if (!key) continue;
        await tx`update media set storage_keys = array_replace(storage_keys, ${url}, ${key}) where ${url} = any(storage_keys)`;
        await tx`update nomination_files set storage_key = ${key}, storage = 's3' where storage_key = ${url}`;
      }
      const cols = await tx`select table_name, column_name, data_type, udt_name from information_schema.columns
        where table_schema = 'public' and (data_type in ('text', 'character varying', 'jsonb', 'json') or udt_name = '_text')`;
      for (const c of cols) {
        if ((c.table_name === 'media' && c.column_name === 'storage_keys') || (c.table_name === 'nomination_files' && c.column_name === 'storage_key')) continue;
        const type = c.udt_name === '_text' ? 'text[]' : c.data_type === 'character varying' ? 'varchar' : c.data_type;
        for (const url of used) {
          const key = keyOf.get(url);
          if (!key || key.startsWith('private/')) continue;
          await tx.unsafe(`update "${c.table_name}" set "${c.column_name}" = replace("${c.column_name}"::text, $1, $2)::${type} where position($1 in "${c.column_name}"::text) > 0`, [url, publicUrl(key)]);
        }
      }
      await tx`update media set storage = 's3' where storage = 'blob' and not exists (select 1 from unnest(storage_keys) k where k like 'https://%blob.vercel-storage.com/%')`;
    });

    // 4. Keep a list of what moved where
    mkdirSync('backups', { recursive: true });
    const file = path.join('backups', `blob-to-s3-${new Date().toISOString().slice(0, 10)}.json`);
    writeFileSync(file, JSON.stringify({ bucket: S3_BUCKET, moved: [...keyOf].map(([from, key]) => ({ from, key })), failed }, null, 1));
    console.log(`[move] done: ${copied} copied, ${skipped} already in S3, ${failed.length} failed. List written to ${file}.`);
    if (failed.length) console.log('[move] run the command again to retry the failed files.');
    console.log('[move] next: npm run move:check');
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('[move] failed:', e.message);
  process.exit(1);
});
