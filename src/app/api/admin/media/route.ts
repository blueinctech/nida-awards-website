import { adminApi, json } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { toMedia } from '@/lib/server/repo';
import { toPicked } from '@/lib/server/media';

// Library search for the image picker
export const GET = adminApi('view', async (req) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const kind = url.searchParams.get('kind') === 'image' ? 'image' : null;
  const like = '%' + q.replace(/[%_\\]/g, (c) => '\\' + c) + '%';
  const sql = db();
  const rows = await sql`select * from media where true
    ${kind ? sql`and kind = ${kind}` : sql``}
    ${q ? sql`and (title ilike ${like} or alt ilike ${like} or filename ilike ${like} or folder ilike ${like} or id ilike ${like} or array_to_string(tags, ' ') ilike ${like})` : sql``}
    order by created_at desc, sort_order limit 120`;
  return json({ items: rows.map((r) => toPicked(toMedia(r))) });
});
