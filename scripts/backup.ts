// Writes a complete JSON backup of the CMS database (content, awardees, submissions, and the
// administrator list without password hashes) to backups/nida-backup-<date>.json.
// Uploaded files stay in Vercel Blob and are referenced by URL.
//   DATABASE_URL=… npm run db:backup
import './env';
import postgres from 'postgres';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const TABLES = ['site_settings', 'media', 'award_categories', 'awardees', 'events', 'posts', 'nominations', 'nomination_files', 'nomination_notes', 'messages', 'activity_log'];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL first.');
  const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });
  try {
    const out: Record<string, unknown> = { format: 'nida-cms-backup-1', createdAt: new Date().toISOString() };
    for (const t of TABLES) out[t] = await sql`select * from ${sql(t)}`;
    out.admin_users = await sql`select id, email, name, role, status, created_at from admin_users`;
    const dir = path.join(process.cwd(), 'backups');
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `nida-backup-${new Date().toISOString().slice(0, 10)}.json`);
    writeFileSync(file, JSON.stringify(out, null, 1));
    console.log('Backup written to', file);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
