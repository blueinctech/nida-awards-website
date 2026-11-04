import { adminApi, json } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { readFile } from '@/lib/server/storage';

// Nomination uploads are private: they are only sent to signed-in administrators, through here
export const GET = adminApi('view', async (req, _user, ctx) => {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'Not found' }, 404);
  const [f] = await db()`select filename, mime, storage, storage_key from nomination_files where id = ${id}`;
  if (!f) return json({ error: 'Not found' }, 404);
  const buf = await readFile(f.storage_key, f.storage);
  const inline = new URL(req.url).searchParams.get('download') !== '1' && /^(image\/|application\/pdf)/.test(f.mime);
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': f.mime,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.filename)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
});
