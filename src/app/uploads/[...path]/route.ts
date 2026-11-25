import { promises as fs } from 'node:fs';
import path from 'node:path';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3, s3Bucket, storageMode, uploadDir } from '@/lib/server/storage';

// Serves uploaded public files (media/, documents/):
//  - from the S3-compatible bucket when S3_BUCKET is set (Neon Object Storage keeps the bucket
//    private, so the website serves its files from here), or
//  - from the server's own disk in local development.
// Private files (nomination uploads under private/) are never served here.
const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });

function headersFor(key: string, type: string, length?: number) {
  const h: Record<string, string> = { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' };
  if (length !== undefined) h['Content-Length'] = String(length);
  if (type === 'image/svg+xml') h['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  if (!type.startsWith('image/') && type !== 'application/pdf') h['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(key.split('/').pop() || 'file')}`;
  return h;
}

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const parts = (await ctx.params).path.map((p) => decodeURIComponent(p));
  if (!parts.length || parts[0] === 'private' || parts.some((p) => !p || p.startsWith('.') || p.includes('\\') || p.includes('/'))) return notFound();
  const key = parts.join('/');
  const ext = (key.split('.').pop() || '').toLowerCase();

  if (storageMode() === 's3') {
    try {
      const res = await s3().send(new GetObjectCommand({ Bucket: s3Bucket(), Key: key }));
      if (!res.Body) return notFound();
      const buf = await res.Body.transformToByteArray();
      return new Response(new Uint8Array(buf), { headers: headersFor(key, TYPES[ext] || res.ContentType || 'application/octet-stream', buf.length) });
    } catch {
      return notFound();
    }
  }

  const full = path.join(uploadDir(), ...parts);
  if (!full.startsWith(uploadDir() + path.sep)) return notFound();
  try {
    const buf = await fs.readFile(full);
    return new Response(new Uint8Array(buf), { headers: headersFor(key, TYPES[ext] || 'application/octet-stream', buf.length) });
  } catch {
    return notFound();
  }
}
