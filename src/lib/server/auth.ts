import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db, hasDatabase } from './db';
import { can, type Permission, type Role } from '../roles';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

export const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-nida_admin' : 'nida_admin';
const SESSION_HOURS = 12; // signed out after 12 hours without activity
const SESSION_MAX_DAYS = 7; // and always after 7 days

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'invited' | 'active' | 'deactivated';
}

// ---------- Passwords (scrypt, random salt per password) ----------
const N = 16384, r = 8, p = 1, KEYLEN = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  // Always do the work, so a missing account takes as long as a wrong password
  const parts = (stored || 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(88)).split('$');
  const [, n, rr, pp, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, { N: Number(n), r: Number(rr), p: Number(pp), maxmem: 64 * 1024 * 1024 });
  return Boolean(stored) && key.length === expected.length && timingSafeEqual(key, expected);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return 'Use at least 12 characters.';
  if (pw.length > 200) return 'Use at most 200 characters.';
  if (!/[a-z]/i.test(pw) || !/[0-9\W_]/.test(pw)) return 'Use a mix of letters and numbers or symbols.';
  return null;
}

// ---------- Tokens ----------
export const newToken = () => randomBytes(32).toString('base64url');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function requestMeta() {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || '';
  return { ip, userAgent: (h.get('user-agent') || '').slice(0, 300) };
}

// ---------- Sessions ----------
export async function createSession(userId: string) {
  const token = newToken();
  const { ip, userAgent } = await requestMeta();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600e3);
  await db()`insert into admin_sessions (id, user_id, expires_at, ip, user_agent) values (${sha256(token)}, ${userId}, ${expires}, ${ip}, ${userAgent})`;
  await db()`delete from admin_sessions where expires_at < now() or created_at < now() - interval '7 days'`;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_DAYS * 86400,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && hasDatabase()) await db()`delete from admin_sessions where id = ${sha256(token)}`;
  jar.delete(SESSION_COOKIE);
}

// The signed-in administrator for this request, or null. Checks the database every time,
// so a deactivated account or a deleted session stops working immediately.
export const currentAdmin = cache(async (): Promise<AdminUser | null> => {
  if (!hasDatabase()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const id = sha256(token);
  const [row] = await db()`
    select u.id, u.email, u.name, u.role, u.status, s.last_seen_at
    from admin_sessions s join admin_users u on u.id = s.user_id
    where s.id = ${id} and s.expires_at > now() and s.created_at > now() - interval '7 days' and u.status = 'active'`;
  if (!row) return null;
  // Sliding expiry, written at most every 5 minutes
  if (Date.now() - new Date(row.last_seen_at).getTime() > 5 * 60e3) {
    await db()`update admin_sessions set last_seen_at = now(), expires_at = now() + ${SESSION_HOURS + ' hours'}::interval where id = ${id}`;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role, status: row.status };
});

// For admin pages: sends visitors to the login page, and shows "no access" for missing permissions
export async function requirePage(permission: Permission = 'view'): Promise<AdminUser> {
  const user = await currentAdmin();
  if (!user) redirect('/admin/login');
  if (!can(user.role, permission)) redirect('/admin?denied=1');
  return user;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

// For server actions and API routes: throws instead of redirecting
export async function requireAction(permission: Permission): Promise<AdminUser> {
  const user = await currentAdmin();
  if (!user) throw new AuthError(401, 'Your session has ended. Please sign in again.');
  if (!can(user.role, permission)) throw new AuthError(403, 'Your role does not allow this action.');
  return user;
}

export async function adminCount() {
  const [{ n }] = await db()`select count(*)::int as n from admin_users`;
  return n as number;
}
