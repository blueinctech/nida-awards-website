// Copies all website data from the old database (the Neon database Vercel created) into the new,
// empty Neon database. Run it once, from a computer with the repository, before the first deploy
// on the new host:
//   SOURCE_DATABASE_URL=<old> DATABASE_URL=<new> npm run db:copy
// (or put both in .env.local). It creates the tables in the new database, then copies every row.
// Admin sign-in sessions, reset links and rate-limit counters are not copied: everyone signs in again.
// It refuses to run if the new database already has content, so it can never overwrite anything.
import './env';
import postgres from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// In foreign-key order: a row is only copied after the rows it points to
const TABLES = ['admin_users', 'activity_log', 'site_settings', 'media', 'award_categories', 'awardees', 'events', 'posts', 'nominations', 'nomination_files', 'nomination_notes', 'messages'];
const SKIPPED = ['admin_sessions', 'auth_tokens', 'rate_limits', 'schema_migrations'];

async function main() {
  const from = process.env.SOURCE_DATABASE_URL;
  const to = process.env.DATABASE_URL;
  if (!from || !to) throw new Error('Set SOURCE_DATABASE_URL (the old database) and DATABASE_URL (the new one) first.');
  if (from === to) throw new Error('SOURCE_DATABASE_URL and DATABASE_URL are the same database.');
  const src = postgres(from, { max: 1, prepare: false, onnotice: () => {} });
  const dst = postgres(to, { max: 1, prepare: false, onnotice: () => {} });
  try {
    // 1. Safety: the new database must not have website content yet
    const [{ exists }] = await dst`select to_regclass('public.site_settings') is not null as exists`;
    if (exists) {
      const [{ n }] = await dst`select count(*)::int as n from site_settings`;
      if (n > 0) throw new Error('The new database already has website content. Nothing was copied. Use an empty database (or a new Neon branch).');
    }

    // 2. Create the tables in the new database, exactly as `npm run db:migrate` does, but without the launch content
    await dst`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
    const done = new Set((await dst`select name from schema_migrations`).map((r) => r.name));
    const dir = path.join(process.cwd(), 'db/migrations');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      if (done.has(file)) continue;
      console.log('[copy] creating tables:', file);
      await dst.begin(async (tx) => {
        await tx.unsafe(readFileSync(path.join(dir, file), 'utf8'));
        await tx`insert into schema_migrations (name) values (${file})`;
      });
    }

    // 3. Warn about any table this script does not know
    const srcTables = (await src`select tablename from pg_tables where schemaname = 'public'`).map((r) => r.tablename as string);
    const unknown = srcTables.filter((t) => !TABLES.includes(t) && !SKIPPED.includes(t));
    if (unknown.length) console.warn('[copy] these tables are not copied:', unknown.join(', '));

    // 4. Copy the rows, all in one transaction, so a failure leaves the new database empty
    await dst.begin(async (tx) => {
      for (const t of TABLES) {
        if (!srcTables.includes(t)) continue;
        const rows = await src`select to_jsonb(x) as r from ${src(t)} x`;
        for (let i = 0; i < rows.length; i += 200) {
          const chunk = rows.slice(i, i + 200).map((r) => r.r);
          await tx.unsafe(`insert into "${t}" select * from json_populate_recordset(null::"${t}", $1::json)`, [chunk as never]);
        }
        console.log(`[copy] ${t}: ${rows.length} rows`);
      }
      // Numbered ids continue after the copied rows
      for (const t of ['activity_log', 'nomination_notes']) {
        await tx.unsafe(`select setval(pg_get_serial_sequence('"${t}"', 'id'), coalesce((select max(id) from "${t}"), 0) + 1, false)`);
      }
    });
    console.log('[copy] done. Next: npm run media:move-to-s3 (see deploy/MOVE-TO-HOSTINGER.md).');
  } finally {
    await src.end();
    await dst.end();
  }
}

main().catch((e) => {
  console.error('[copy] failed:', e.message);
  process.exit(1);
});
