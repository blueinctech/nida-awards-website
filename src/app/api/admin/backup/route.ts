import { adminApi } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { logActivity } from '@/lib/server/activity';

const TABLES = ['site_settings', 'media', 'award_categories', 'awardees', 'events', 'posts', 'nominations', 'nomination_files', 'nomination_notes', 'messages', 'activity_log'] as const;

// Full JSON backup of the database (Super Admin only). Passwords are never included.
export const GET = adminApi('backup', async (_req, user) => {
  const sql = db();
  const out: Record<string, unknown> = { format: 'nida-cms-backup-1', createdAt: new Date().toISOString() };
  for (const t of TABLES) out[t] = await sql`select * from ${sql(t)}`;
  out.admin_users = await sql`select id, email, name, role, status, created_at from admin_users`;
  await logActivity(user, 'backup', 'Downloaded a full backup');
  return new Response(JSON.stringify(out, null, 1), {
    headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="nida-backup-${new Date().toISOString().slice(0, 10)}.json"`, 'Cache-Control': 'no-store' },
  });
});
