import 'server-only';
import { put, del } from '@vercel/blob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { siteOrigin } from './email';

// Where uploaded files live:
//  - 'blob'  Vercel Blob (BLOB_READ_WRITE_TOKEN set). Used in production on Vercel.
//  - 'local' a folder on the server's disk (UPLOAD_DIR, default .data/uploads). For local
//            development or a self-managed Node server with a persistent disk.
// Large files are never stored in the database; it only keeps their address.
export type StorageMode = 'blob' | 'local' | 'none';

export function storageMode(): StorageMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob';
  if (process.env.VERCEL) return 'none'; // Vercel's disk is temporary, so a Blob store is required there
  return 'local';
}

export const uploadDir = () => path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || '.data/uploads');

export function randomName(ext: string) {
  return randomBytes(12).toString('base64url') + (ext ? '.' + ext : '');
}

// `key` is a path like 'media/2026/abc.webp'. Private files (nomination uploads) go under
// 'private/' and are only ever served to signed-in administrators through /api/admin/files.
export async function putFile(key: string, body: Buffer, contentType: string): Promise<{ url: string; key: string; storage: 'blob' | 'local' }> {
  const mode = storageMode();
  if (mode === 'none') throw new Error('File storage is not set up. Add a Vercel Blob store to the project (see README).');
  if (mode === 'blob') {
    const res = await put(key, body, { access: 'public', addRandomSuffix: true, contentType, cacheControlMaxAge: 31536000 });
    return { url: res.url, key: res.url, storage: 'blob' };
  }
  const full = path.join(/* turbopackIgnore: true */ uploadDir(), key);
  if (!full.startsWith(uploadDir() + path.sep)) throw new Error('Bad file path');
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
  return { url: '/uploads/' + key, key, storage: 'local' };
}

export async function deleteFiles(keys: string[], storage: string) {
  if (!keys.length) return;
  try {
    if (storage === 'blob') await del(keys);
    else if (storage === 'local') {
      for (const k of keys) {
        const full = path.join(/* turbopackIgnore: true */ uploadDir(), k);
        if (full.startsWith(uploadDir() + path.sep)) await fs.rm(full, { force: true });
      }
    }
  } catch (e) {
    console.error('Could not delete stored files', e);
  }
}

export async function readFile(key: string, storage: string): Promise<Buffer> {
  if (storage === 'blob') {
    const res = await fetch(key);
    if (!res.ok) throw new Error('File not found');
    return Buffer.from(await res.arrayBuffer());
  }
  const full = path.join(/* turbopackIgnore: true */ uploadDir(), key);
  if (!full.startsWith(uploadDir() + path.sep)) throw new Error('Bad file path');
  return fs.readFile(full);
}

// Reads any image the site shows (static file in /public, local upload or Blob URL)
export async function readImageByUrl(url: string): Promise<Buffer> {
  if (url.startsWith('/uploads/')) return readFile(url.slice('/uploads/'.length), 'local');
  if (url.startsWith('/')) {
    // Files in /public are on disk locally, but on Vercel they are only served by the CDN
    try {
      return await fs.readFile(path.join(/* turbopackIgnore: true */ process.cwd(), 'public', url));
    } catch {
      return readImageByUrl((await siteOrigin()) + url);
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Image not found');
  return Buffer.from(await res.arrayBuffer());
}
