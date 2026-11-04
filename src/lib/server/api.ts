import 'server-only';
import { NextResponse } from 'next/server';
import { AuthError, requireAction } from './auth';
import type { Permission } from '../roles';

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Rejects requests sent from other websites (cross-site request forgery). Browsers always send
// Origin on POST; it must match the host the request was sent to.
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return req.method === 'GET';
  try {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Wraps an admin API handler: checks origin, session and permission
export function adminApi(permission: Permission, handler: (req: Request, user: Awaited<ReturnType<typeof requireAction>>, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    if (!sameOrigin(req)) return json({ error: 'This request was blocked because it came from another website.' }, 403);
    try {
      const user = await requireAction(permission);
      return await handler(req, user, ctx);
    } catch (e) {
      if (e instanceof AuthError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: e instanceof Error && e.message.length < 200 ? e.message : 'Something went wrong.' }, 500);
    }
  };
}
