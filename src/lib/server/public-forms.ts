import 'server-only';
import { headers } from 'next/headers';
import { json, sameOrigin } from './api';
import { rateLimit, ipHash } from './ratelimit';
import { hasDatabase } from './db';

export async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}

const wantsJson = (req: Request) => (req.headers.get('accept') || '').includes('application/json');

// A visitor with JavaScript turned off posts the form normally; they get a short page back
export function reply(req: Request, ok: boolean, message: string, status = ok ? 200 : 400) {
  if (wantsJson(req)) return json(ok ? { ok: true, message } : { error: message }, status);
  const esc = message.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NIDA</title><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:15vh auto;padding:0 1rem;color:#03180C"><h1 style="color:#083B1E">${ok ? 'Thank you' : 'Sorry'}</h1><p>${esc}</p><p><a href="/" style="color:#01913C">Back to the NIDA website</a></p></body>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

// Checks shared by every public form. Returns a Response to send back if the request must stop.
export async function precheck(req: Request, bucket: string, limit: number, windowSeconds: number): Promise<{ stop?: Response; fd?: FormData; ip?: string }> {
  if (!sameOrigin(req)) return { stop: reply(req, false, 'This form can only be sent from the NIDA website.', 403) };
  if (!hasDatabase()) return { stop: reply(req, false, 'Online forms are not available right now. Please email nida@friendsofnigeria.net.', 503) };
  const len = Number(req.headers.get('content-length') || 0);
  if (len > 4.5 * 1024 * 1024) return { stop: reply(req, false, 'The attached files are too large. Please keep them under 4 MB in total.', 413) };
  const fd = await req.formData().catch(() => null);
  if (!fd) return { stop: reply(req, false, 'The form could not be read. Please try again.') };
  const ip = await clientIp();
  // Spam trap: a hidden field people never see. Bots that fill it get a normal-looking answer.
  if (String(fd.get('_gotcha') || '')) return { stop: reply(req, true, 'Thank you.') };
  if (!(await rateLimit(bucket, ip, limit, windowSeconds))) return { stop: reply(req, false, 'Too many submissions from your connection. Please try again later.', 429) };
  return { fd, ip: ipHash(ip) };
}

export const field = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? '').trim().slice(0, max);
export const isEmail = (e: string) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(e) && e.length <= 200;
