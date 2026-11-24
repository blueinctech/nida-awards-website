import 'server-only';
import { S3Client, PutObjectCommand, DeleteObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { siteOrigin } from './email';

// Where uploaded files live:
//  - 's3'    an Amazon S3 bucket (S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).
//            Used in production. Public media is read straight from the bucket (or S3_PUBLIC_URL,
//            for example a CloudFront address); files under 'private/' are never public.
//  - 'local' a folder on the server's disk (UPLOAD_DIR, default .data/uploads). For local
//            development or a server with a persistent disk.
// 'blob' (Vercel Blob) is only kept so rows from before the move can still be read; new files
// never go there. Large files are never stored in the database; it only keeps their address.
export type StorageMode = 's3' | 'local' | 'none';

export const s3Bucket = () => process.env.S3_BUCKET || '';
const s3Region = () => process.env.S3_REGION || process.env.AWS_REGION || 'eu-west-2';

let client: S3Client | undefined;
export function s3() {
  // Credentials come from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (read by the AWS SDK itself)
  client ??= new S3Client({ region: s3Region() });
  return client;
}

// The public address of a file in the bucket
export function s3PublicUrl(key: string) {
  const base = (process.env.S3_PUBLIC_URL || `https://${s3Bucket()}.s3.${s3Region()}.amazonaws.com`).replace(/\/$/, '');
  return base + '/' + key.split('/').map(encodeURIComponent).join('/');
}

export function storageMode(): StorageMode {
  if (s3Bucket()) return 's3';
  if (process.env.VERCEL) return 'none'; // Vercel's disk is temporary, so a bucket is required there
  return 'local';
}

export const uploadDir = () => path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || '.data/uploads');

export function randomName(ext: string) {
  return randomBytes(12).toString('base64url') + (ext ? '.' + ext : '');
}

// `key` is a path like 'media/2026/abc.webp'. Private files (nomination uploads) go under
// 'private/' and are only ever served to signed-in administrators through /api/admin/files.
export async function putFile(key: string, body: Buffer, contentType: string): Promise<{ url: string; key: string; storage: 's3' | 'local' }> {
  const mode = storageMode();
  if (mode === 'none') throw new Error('File storage is not set up. Set S3_BUCKET and the AWS keys (see README).');
  if (mode === 's3') {
    await s3().send(new PutObjectCommand({
      Bucket: s3Bucket(), Key: key, Body: body, ContentType: contentType,
      // File names are random and never reused, so public files can be cached for a year
      CacheControl: key.startsWith('private/') ? 'private, no-store' : 'public, max-age=31536000, immutable',
    }));
    return { url: key.startsWith('private/') ? '' : s3PublicUrl(key), key, storage: 's3' };
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
    if (storage === 's3') {
      for (let i = 0; i < keys.length; i += 1000) {
        await s3().send(new DeleteObjectsCommand({ Bucket: s3Bucket(), Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true } }));
      }
    } else if (storage === 'blob') console.warn('Not deleting old Vercel Blob files (the Blob store is no longer used):', keys.length);
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
  if (storage === 's3') {
    const res = await s3().send(new GetObjectCommand({ Bucket: s3Bucket(), Key: key }));
    if (!res.Body) throw new Error('File not found');
    return Buffer.from(await res.Body.transformToByteArray());
  }
  if (storage === 'blob') {
    // Vercel Blob files were public; the key was their address
    const res = await fetch(key);
    if (!res.ok) throw new Error('File not found');
    return Buffer.from(await res.arrayBuffer());
  }
  const full = path.join(/* turbopackIgnore: true */ uploadDir(), key);
  if (!full.startsWith(uploadDir() + path.sep)) throw new Error('Bad file path');
  return fs.readFile(full);
}

// Reads any image the site shows (static file in /public, local upload or S3 address)
export async function readImageByUrl(url: string): Promise<Buffer> {
  if (url.startsWith('/uploads/')) return readFile(url.slice('/uploads/'.length), 'local');
  const base = s3Bucket() ? s3PublicUrl('') : '';
  if (base && url.startsWith(base)) return readFile(url.slice(base.length).split('/').map(decodeURIComponent).join('/'), 's3');
  if (url.startsWith('/')) {
    // Files in /public are normally on disk; fall back to fetching them from the site
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
