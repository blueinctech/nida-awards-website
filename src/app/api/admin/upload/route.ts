import { adminApi, json } from '@/lib/server/api';
import { createMedia, replaceMedia, toPicked } from '@/lib/server/media';
import { MAX_UPLOAD_BYTES } from '@/lib/server/files';
import { logActivity } from '@/lib/server/activity';
import { refreshPublicSite } from '@/lib/server/actions';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Upload a new file to the media library, or replace the file of an existing item (field "replace")
export const POST = adminApi('media', async (req, user) => {
  const fd = await req.formData().catch(() => null);
  const file = fd?.get('file');
  if (!fd || !(file instanceof File)) return json({ error: 'Choose a file to upload.' }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ error: `${file.name} is larger than 4 MB.` }, 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const replace = String(fd.get('replace') || '');
  const folder = String(fd.get('folder') || 'general').replace(/[^\w -]/g, '').slice(0, 40) || 'general';
  const kind = fd.get('kind') === 'image' ? 'image' : 'any';
  try {
    if (replace) {
      const m = await replaceMedia(replace, buf, file.name);
      await logActivity(user, 'media.replace', `Replaced the file of “${m.title || m.id}”`, 'media', m.id);
      refreshPublicSite();
      return json({ media: toPicked(m) });
    }
    const m = await createMedia(buf, file.name, { folder, userId: user.id, kind });
    await logActivity(user, 'media.upload', `Uploaded “${m.filename}”`, 'media', m.id);
    return json({ media: toPicked(m) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'The upload failed.';
    return json({ error: msg }, /storage is not set up/.test(msg) ? 503 : 400);
  }
});
