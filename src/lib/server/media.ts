import 'server-only';
import { randomBytes } from 'node:crypto';
import { db } from './db';
import { toMedia } from './repo';
import { checkFile, makePortraitVariants, makeWebVariants, storeDocument } from './files';
import { deleteFiles, readImageByUrl } from './storage';
import type { Media } from '../types';

export type Picked = { id: string; kind: 'image' | 'document'; title: string; alt: string; thumb: string; url: string; filename: string; width: number | null; height: number | null; size: number };

export function toPicked(m: Media): Picked {
  const v = m.variants;
  return {
    id: m.id,
    kind: m.kind,
    title: m.title,
    alt: m.alt,
    thumb: m.kind === 'image' ? (v.find((x) => x.w >= 300) || v[v.length - 1] || { url: m.url }).url : '/assets/img/brand/favicon-192.png',
    url: m.url,
    filename: m.filename,
    width: m.width,
    height: m.height,
    size: m.size,
  };
}

export async function getMedia(id: string): Promise<Media | null> {
  const [r] = await db()`select * from media where id = ${id}`;
  return r ? toMedia(r) : null;
}

export async function pickedByIds(ids: (string | null | undefined)[]): Promise<Picked[]> {
  const clean = ids.filter((x): x is string => Boolean(x));
  if (!clean.length) return [];
  const rows = await db()`select * from media where id = any(${clean})`;
  const map = new Map(rows.map((r) => [r.id, toPicked(toMedia(r))]));
  return clean.map((id) => map.get(id)).filter((x): x is Picked => Boolean(x));
}

export const parseIds = (v: string) => v.split(',').map((x) => x.trim()).filter((x) => /^[\w-]{1,80}$/.test(x));

// Where a media item is used on the website (shown before deleting it)
export async function mediaUsage(id: string): Promise<string[]> {
  const sql = db();
  const [aw, ev, cat, posts, settings] = await Promise.all([
    sql`select name from awardees where photo_id = ${id}`,
    sql`select title from events where banner_id = ${id} or ${id} = any(photo_ids)`,
    sql`select name from award_categories where photo_id = ${id}`,
    sql`select title from posts where image_id = ${id}`,
    sql`select (draft::text like ${'%"' + id + '"%'}) as d, (published::text like ${'%"' + id + '"%'}) as p from site_settings where key = 'site'`,
  ]);
  const out = [
    ...aw.map((r) => `Awardee portrait: ${r.name}`),
    ...ev.map((r) => `Event: ${r.title}`),
    ...cat.map((r) => `Award category: ${r.name}`),
    ...posts.map((r) => `Article: ${r.title}`),
  ];
  if (settings[0]?.p || settings[0]?.d) out.push('Website content (page images, home page, sponsors)');
  return out;
}

export const newMediaId = () => 'm_' + randomBytes(9).toString('base64url').replace(/[^\w]/g, 'x');

// Stores an uploaded file and creates its media record
export async function createMedia(buf: Buffer, filename: string, opts: { folder: string; userId: string; kind: 'image' | 'any' }): Promise<Media> {
  const checked = await checkFile(buf, filename, opts.kind === 'image' ? ['image'] : ['image', 'document']);
  const id = newMediaId();
  const title = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim().slice(0, 200);
  if (checked.kind === 'image') {
    const out = await makeWebVariants(buf, 'media');
    const largest = out.variants[out.variants.length - 1];
    await db()`insert into media (id, kind, title, alt, folder, filename, mime, size, width, height, url, variants, storage, storage_keys, created_by)
      values (${id}, 'image', ${title}, '', ${opts.folder}, ${filename.slice(0, 200)}, 'image/webp', ${buf.length}, ${out.width}, ${out.height}, ${largest.url},
              ${db().json(out.variants as never)}, ${out.storage}, ${out.keys}, ${opts.userId})`;
  } else {
    const saved = await storeDocument(buf, checked.ext, checked.mime, 'documents');
    await db()`insert into media (id, kind, title, folder, filename, mime, size, url, storage, storage_keys, created_by)
      values (${id}, 'document', ${title}, ${opts.folder}, ${filename.slice(0, 200)}, ${checked.mime}, ${buf.length}, ${saved.url}, ${saved.storage}, ${[saved.key]}, ${opts.userId})`;
  }
  return (await getMedia(id))!;
}

// Swaps the file behind a media record, keeping its id, so every page that uses it updates
export async function replaceMedia(id: string, buf: Buffer, filename: string): Promise<Media> {
  const old = await getMedia(id);
  if (!old) throw new Error('That media item no longer exists.');
  const checked = await checkFile(buf, filename, old.kind === 'image' ? ['image'] : ['document']);
  const [row] = await db()`select storage, storage_keys from media where id = ${id}`;
  if (checked.kind === 'image') {
    const out = await makeWebVariants(buf, 'media');
    let extra: Media['extra'] = {};
    let keys = out.keys;
    // A portrait in use keeps its portrait crops, share image and face crops up to date
    if (old.extra.portrait || old.extra.faces) {
      const p = await makePortraitVariants(buf);
      extra = { portrait: p.portrait, og: p.og, faces: p.faces };
      keys = [...keys, ...p.keys];
    }
    await db()`update media set url = ${out.variants[out.variants.length - 1].url}, variants = ${db().json(out.variants as never)}, extra = ${db().json(extra as never)},
               width = ${out.width}, height = ${out.height}, size = ${buf.length}, mime = 'image/webp', filename = ${filename.slice(0, 200)},
               storage = ${out.storage}, storage_keys = ${keys}, updated_at = now() where id = ${id}`;
  } else {
    if (checked.kind !== 'document') throw new Error('Replace a document with another document.');
    const saved = await storeDocument(buf, checked.ext, checked.mime, 'documents');
    await db()`update media set url = ${saved.url}, size = ${buf.length}, mime = ${checked.mime}, filename = ${filename.slice(0, 200)},
               storage = ${saved.storage}, storage_keys = ${[saved.key]}, updated_at = now() where id = ${id}`;
  }
  if (row.storage !== 'static') await deleteFiles(row.storage_keys, row.storage);
  return (await getMedia(id))!;
}

// Makes sure an image chosen as an honouree portrait has the portrait crops the site needs
export async function ensurePortrait(id: string | null) {
  if (!id) return;
  const m = await getMedia(id);
  if (!m || m.kind !== 'image' || (m.extra.portrait && m.extra.og)) return;
  const source = m.variants[m.variants.length - 1]?.url || m.url;
  const buf = await readImageByUrl(source);
  const p = await makePortraitVariants(buf);
  const [row] = await db()`select storage_keys from media where id = ${id}`;
  await db()`update media set extra = ${db().json({ ...m.extra, portrait: p.portrait, og: p.og, faces: p.faces } as never)},
             storage_keys = ${[...(row.storage_keys || []), ...p.keys]}, updated_at = now() where id = ${id}`;
}

export async function deleteMedia(id: string) {
  const [row] = await db()`delete from media where id = ${id} returning storage, storage_keys`;
  if (row && row.storage !== 'static') await deleteFiles(row.storage_keys, row.storage);
  return Boolean(row);
}
