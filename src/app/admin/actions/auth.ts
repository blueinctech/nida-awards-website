'use server';
import { redirect } from 'next/navigation';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { db, hasDatabase } from '@/lib/server/db';
import { adminCount, createSession, currentAdmin, destroySession, hashPassword, newToken, passwordProblem, requestMeta, sha256, verifyPassword } from '@/lib/server/auth';
import { rateLimit } from '@/lib/server/ratelimit';
import { logActivity } from '@/lib/server/activity';
import { emailEnabled, sendEmail, siteOrigin } from '@/lib/server/email';
import { failed, guard, str, UserError, type ActionState } from '@/lib/server/actions';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

// Only same-site relative paths, so the "next" parameter can never send someone elsewhere
const safeNext = (n: string) => (/^\/admin(\/[\w\-/?=&%.]*)?$/.test(n) ? n : '/admin');

export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!hasDatabase()) return failed('The database is not set up yet. See the README.');
  const email = str(fd, 'email').toLowerCase().slice(0, 200);
  const password = String(fd.get('password') || '').slice(0, 200);
  const next = safeNext(str(fd, 'next'));
  const { ip } = await requestMeta();
  if (!(await rateLimit('login-ip', ip, 20, 15 * 60))) return failed('Too many sign-in attempts. Please wait 15 minutes and try again.');
  if (!email || !password) return failed('Enter your email and password.');

  const [u] = await db()`select id, name, email, role, status, password_hash, failed_logins, locked_until from admin_users where email = ${email}`;
  const okPw = await verifyPassword(password, u?.password_hash ?? null);
  if (u && u.locked_until && new Date(u.locked_until) > new Date()) {
    return failed(`This account is locked after too many wrong passwords. Try again after ${LOCK_MINUTES} minutes, or reset your password.`);
  }
  if (!u || !okPw || u.status !== 'active') {
    if (u) {
      const fails = u.failed_logins + 1;
      await db()`update admin_users set failed_logins = ${fails >= MAX_FAILS ? 0 : fails},
                 locked_until = ${fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60e3) : null} where id = ${u.id}`;
      if (fails >= MAX_FAILS) await logActivity(null, 'auth.locked', `Account locked after ${MAX_FAILS} wrong passwords: ${u.email}`, 'user', u.id);
    }
    return failed(u && okPw && u.status === 'deactivated' ? 'This account has been deactivated. Ask a Super Admin to restore access.' : 'The email or password is not correct.');
  }
  await db()`update admin_users set failed_logins = 0, locked_until = null, last_login_at = now() where id = ${u.id}`;
  await createSession(u.id);
  await logActivity({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status }, 'auth.login', 'Signed in');
  redirect(next);
}

export async function logout() {
  const user = await currentAdmin();
  if (user) await logActivity(user, 'auth.logout', 'Signed out');
  await destroySession();
  redirect('/admin/login?signed-out=1');
}

export async function requestReset(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const email = str(fd, 'email').toLowerCase().slice(0, 200);
    const { ip } = await requestMeta();
    if (!(await rateLimit('reset-ip', ip, 5, 60 * 60))) throw new UserError('Too many requests. Please try again in an hour.');
    const generic = { ok: true, message: emailEnabled() ? 'If that address belongs to an administrator, a reset link is on its way. It works for one hour.' : 'Password emails are not set up on this site. Ask a Super Admin to create a reset link for you in Administrators.' };
    if (!emailEnabled() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return generic;
    const [u] = await db()`select id, name from admin_users where email = ${email} and status = 'active'`;
    if (u && (await rateLimit('reset-user', u.id, 3, 60 * 60))) {
      const token = newToken();
      await db()`insert into auth_tokens (id, user_id, purpose, expires_at) values (${sha256(token)}, ${u.id}, 'reset', now() + interval '1 hour')`;
      const link = `${await siteOrigin()}/admin/reset-password/?token=${token}`;
      await sendEmail(email, 'Reset your NIDA admin password', `Hello ${u.name},\n\nSomeone (hopefully you) asked to reset the password for your NIDA admin account.\n\nChoose a new password here (the link works for one hour, once):\n${link}\n\nIf you did not ask for this, you can ignore this email; your password stays the same.\n\nNIDA admin`);
      await logActivity(null, 'auth.reset-requested', `Password reset email requested for ${email}`, 'user', u.id);
    }
    return generic;
  });
}

const zPassword = z.string().superRefine((v, ctx) => {
  const p = passwordProblem(v);
  if (p) ctx.addIssue({ code: 'custom', message: p });
});

export async function resetPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const token = str(fd, 'token');
    const password = String(fd.get('password') || '');
    if (password !== String(fd.get('confirm') || '')) throw new UserError('The two passwords do not match.');
    zPassword.parse(password);
    const [t] = await db()`select t.id, t.user_id, t.purpose, u.name, u.email, u.role, u.status from auth_tokens t join admin_users u on u.id = t.user_id
                           where t.id = ${sha256(token)} and t.used_at is null and t.expires_at > now()`;
    if (!t || t.status === 'deactivated') throw new UserError('This link has expired or was already used. Ask for a new one.');
    const hash = await hashPassword(password);
    await db().begin(async (tx) => {
      await tx`update admin_users set password_hash = ${hash}, status = 'active', failed_logins = 0, locked_until = null, updated_at = now() where id = ${t.user_id}`;
      await tx`update auth_tokens set used_at = now() where user_id = ${t.user_id} and used_at is null`;
      await tx`delete from admin_sessions where user_id = ${t.user_id}`;
    });
    await logActivity({ id: t.user_id, name: t.name, email: t.email, role: t.role, status: 'active' }, t.purpose === 'invite' ? 'auth.invite-accepted' : 'auth.reset', t.purpose === 'invite' ? 'Accepted the invitation and set a password' : 'Reset their password');
    await createSession(t.user_id);
    redirect('/admin?welcome=1');
  });
}

// First-time setup: only while no administrator exists, and only with the ADMIN_SETUP_TOKEN secret
export async function setupFirstAdmin(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const secret = process.env.ADMIN_SETUP_TOKEN || '';
    const given = str(fd, 'setup_token');
    const { ip } = await requestMeta();
    if (!(await rateLimit('setup-ip', ip, 10, 60 * 60))) throw new UserError('Too many attempts. Please wait an hour.');
    if (secret.length < 16) throw new UserError('Set ADMIN_SETUP_TOKEN (at least 16 characters) in the hosting environment first.');
    const a = Buffer.from(sha256(given)), b = Buffer.from(sha256(secret));
    if (!timingSafeEqual(a, b)) throw new UserError('The setup code is not correct.');
    if ((await adminCount()) > 0) throw new UserError('Setup is already complete. Sign in instead.');
    const data = z
      .object({
        name: z.string().trim().min(2, 'Enter your name').max(100),
        email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address').max(200),
        password: zPassword,
      })
      .parse({ name: str(fd, 'name'), email: str(fd, 'email'), password: String(fd.get('password') || '') });
    if (data.password !== String(fd.get('confirm') || '')) throw new UserError('The two passwords do not match.');
    const hash = await hashPassword(data.password);
    // "where not exists" makes this safe even if two people submit the form at the same moment
    const [u] = await db()`insert into admin_users (email, name, password_hash, role, status)
                           select ${data.email}, ${data.name}, ${hash}, 'super_admin', 'active' where not exists (select 1 from admin_users) returning id`;
    if (!u) throw new UserError('Setup is already complete. Sign in instead.');
    await logActivity({ id: u.id, name: data.name, email: data.email, role: 'super_admin', status: 'active' }, 'user.create', 'Created the first Super Admin account (setup)');
    await createSession(u.id);
    redirect('/admin?welcome=1');
  });
}
