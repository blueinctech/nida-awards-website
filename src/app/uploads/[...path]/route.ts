import { promises as fs } from 'node:fs';
import path from 'node:path';
import { uploadDir } from '@/lib/server/storage';

// Serves files uploaded to the server's own disk (local development or a self-managed server).
// On Vercel, uploads live in Vercel Blob and this route is not used. Private files are never served here.
const TYPES: Record<string, string> = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const parts = (await ctx.params).path;
  if (!parts.length || parts[0] === 'private' || parts.some((p) => p.startsWith('.') || p.includes('\\'))) return new Response('Not found', { status: 404 });
  const full = path.join(uploadDir(), ...parts);
  if (!full.startsWith(uploadDir() + path.sep)) return new Response('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(full);
    const ext = (full.split('.').pop() || '').toLowerCase();
    return new Response(new Uint8Array(buf), {
      headers: { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
