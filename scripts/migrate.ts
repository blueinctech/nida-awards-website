// Brings the database up to date: runs any new file in db/migrations/ (in order, once each),
// then fills a brand-new database with the site's launch content (awardees, editions,
// photos, categories and texts from src/data/). Safe to run on every deploy.
//   npm run db:migrate
import './env';
import postgres from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { legacyAwardees, legacyCategories, legacyEditions, legacyMedia, legacySettings } from '../src/lib/legacy';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('[db] DATABASE_URL is not set: skipping migrations. The site will build from the launch content in src/data/ and /admin will be unavailable.');
    return;
  }
  const sql = postgres(url, { max: 1, onnotice: () => {}, prepare: false });
  try {
    await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
    // Only one deploy at a time may migrate
    await sql`select pg_advisory_lock(424242)`;
    const done = new Set((await sql`select name from schema_migrations`).map((r) => r.name));
    const dir = path.join(process.cwd(), 'db/migrations');
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
      if (done.has(file)) continue;
      console.log('[db] applying', file);
      await sql.begin(async (tx) => {
        await tx.unsafe(readFileSync(path.join(dir, file), 'utf8'));
        await tx`insert into schema_migrations (name) values (${file})`;
      });
    }
    await seed(sql);
    await sql`select pg_advisory_unlock(424242)`;
    console.log('[db] up to date');
  } finally {
    await sql.end();
  }
}

async function seed(sql: postgres.Sql) {
  const [{ n }] = await sql`select count(*)::int as n from site_settings`;
  if (n > 0) return; // already set up: never overwrite edited content
  console.log('[db] new database: importing the launch content');
  await sql.begin(async (tx) => {
    const settings = legacySettings();
    await tx`insert into site_settings (key, draft, published, published_at) values ('site', ${tx.json(settings as never)}, ${tx.json(settings as never)}, now())`;
    for (const m of legacyMedia()) {
      await tx`insert into media (id, kind, title, alt, folder, tags, filename, mime, size, width, height, url, variants, extra, storage, gallery, gallery_year, sort_order)
        values (${m.id}, ${m.kind}, ${m.title}, ${m.alt}, ${m.folder}, ${m.tags}, ${m.filename}, ${m.mime}, ${m.size}, ${m.width}, ${m.height}, ${m.url},
                ${tx.json(m.variants as never)}, ${tx.json(m.extra as never)}, 'static', ${m.gallery}, ${m.galleryYear}, ${m.sortOrder})`;
    }
    for (const c of legacyCategories()) {
      await tx`insert into award_categories (id, name, text, awards, photo_id, sort_order) values (${c.id}, ${c.name}, ${c.text}, ${c.awards}, ${c.photo}, ${c.sortOrder})`;
    }
    for (const a of legacyAwardees()) {
      await tx`insert into awardees (slug, name, year, award, category_id, listed_as, country, bio, achievements, note, photo_id, is_organisation, published, sort_order)
        values (${a.slug}, ${a.name}, ${a.year}, ${a.award}, ${a.group}, ${a.listedAs ?? null}, ${a.country}, ${a.bio}, ${a.achievements}, ${a.note ?? null}, ${a.photoId}, ${a.isOrg}, true, ${a.sortOrder})`;
    }
    for (const e of legacyEditions()) {
      await tx`insert into events (year, title, ordinal, starts_on, date_label, venue, city, theme, summary, stat_value, stat_label, pending, ticket_url, photo_ids, published)
        values (${e.year}, ${e.title}, ${e.ordinal}, ${e.startsOn}, ${e.date}, ${e.venue}, ${e.city}, ${e.theme ?? null}, ${e.summary}, ${e.stat?.value ?? null}, ${e.stat?.label ?? null}, ${e.pending ?? null}, ${e.ticketUrl ?? null}, ${e.photos}, true)`;
    }
    await tx`insert into activity_log (user_name, action, summary) values ('System', 'setup', 'Imported the launch content: awardees, editions, photos, categories and page texts')`;
  });
}

main().catch((e) => {
  console.error('[db] migration failed:', e.message);
  process.exit(1);
});
