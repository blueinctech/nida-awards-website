import 'server-only';
import { db } from './db';
import type { AdminUser } from './auth';

// Records who changed what. Shown on the dashboard and in Administrators → Activity.
export async function logActivity(user: AdminUser | null, action: string, summary: string, entityType?: string, entityId?: string) {
  await db()`insert into activity_log (user_id, user_name, action, entity_type, entity_id, summary)
             values (${user?.id ?? null}, ${user?.name ?? 'System'}, ${action}, ${entityType ?? null}, ${entityId ?? null}, ${summary.slice(0, 500)})`;
}
