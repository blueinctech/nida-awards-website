'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { requireAction } from '@/lib/server/auth';
import { logActivity } from '@/lib/server/activity';
import { deleteMedia, mediaUsage } from '@/lib/server/media';
import { bool, done, guard, list, refreshPublicSite, str, UserError, type ActionState } from '@/lib/server/actions';

export async function updateMedia(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('media');
    const id = str(fd, 'id');
    const v = z
      .object({ title: z.string().max(200), alt: z.string().max(300), folder: z.string().max(40).regex(/^[\w -]*$/, 'Letters, numbers, spaces and hyphens'), tags: z.array(z.string().max(40)).max(20), gallery: z.boolean(), gallery_year: z.number().int().min(2000).max(2100).nullable(), sort_order: z.number().int() })
      .parse({ title: str(fd, 'title'), alt: str(fd, 'alt'), folder: str(fd, 'folder') || 'general', tags: list(str(fd, 'tags')), gallery: bool(fd, 'gallery'), gallery_year: str(fd, 'gallery_year') ? Number(str(fd, 'gallery_year')) : null, sort_order: Number(str(fd, 'sort_order') || 0) });
    if (v.gallery && !v.gallery_year) throw new UserError('Choose the edition year for photos shown in the gallery.');
    const [r] = await db()`update media set title = ${v.title}, alt = ${v.alt}, folder = ${v.folder}, tags = ${v.tags}, gallery = ${v.gallery}, gallery_year = ${v.gallery_year}, sort_order = ${v.sort_order}, updated_at = now() where id = ${id} returning id`;
    if (!r) throw new UserError('That file no longer exists.');
    await logActivity(user, 'media.update', `Updated details of “${v.title || id}”`, 'media', id);
    refreshPublicSite();
    return done('Saved.');
  });
}

export async function removeMedia(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('media');
    await requireAction('delete');
    const id = str(fd, 'id');
    const used = await mediaUsage(id);
    if (used.length) throw new UserError(`This file is still used on the website (${used.join('; ')}). Replace it there first, or use “Replace image” to swap the file.`);
    const [m] = await db()`select title, filename from media where id = ${id}`;
    if (!m || !(await deleteMedia(id))) throw new UserError('That file no longer exists.');
    await logActivity(user, 'media.delete', `Deleted “${m.title || m.filename}” from the media library`, 'media', id);
    refreshPublicSite();
    redirect('/admin/media/?deleted=1');
  });
}
