'use server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { SESSION_COOKIE, hashPassword, newToken, passwordProblem, requireAction, sha256, verifyPassword } from '@/lib/server/auth';
import { logActivity } from '@/lib/server/activity';
import { emailEnabled, sendEmail, siteOrigin } from '@/lib/server/email';
import { done, guard, str, UserError, type ActionState } from '@/lib/server/actions';
import { ROLE_LABELS, type Role } from '@/lib/roles';

const ROLES = ['super_admin', 'editor', 'viewer'] as const;
const uuid = (v: string) => (/^[0-9a-f-]{36}$/.test(v) ? v : null);

async function activeSuperAdmins(exceptId?: string) {
  const [{ n }] = await db()`select count(*)::int as n from admin_users where role = 'super_admin' and status = 'active' ${exceptId ? db()`and id <> ${exceptId}` : db()``}`;
  return n as number;
}

async function issueLink(userId: string, purpose: 'invite' | 'reset') {
  const token = newToken();
  const hours = purpose === 'invite' ? 7 * 24 : 24;
  await db()`update auth_tokens set used_at = now() where user_id = ${userId} and used_at is null`; // older links stop working
  await db()`insert into auth_tokens (id, user_id, purpose, expires_at) values (${sha256(token)}, ${userId}, ${purpose}, now() + ${hours + ' hours'}::interval)`;
  return `${await siteOrigin()}/admin/reset-password/?token=${token}`;
}

export async function inviteUser(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const me = await requireAction('users');
    const v = z
      .object({ name: z.string().trim().min(2, 'Enter a name').max(100), email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email').max(200), role: z.enum(ROLES) })
      .parse({ name: str(fd, 'name'), email: str(fd, 'email'), role: str(fd, 'role') });
    const [exists] = await db()`select id from admin_users where email = ${v.email}`;
    if (exists) throw new UserError('An administrator with this email already exists.');
    const [u] = await db()`insert into admin_users (email, name, role, status) values (${v.email}, ${v.name}, ${v.role}, 'invited') returning id`;
    const link = await issueLink(u.id, 'invite');
    const sent = await sendEmail(v.email, 'Your NIDA admin account', `Hello ${v.name},\n\n${me.name} has given you ${ROLE_LABELS[v.role as Role]} access to the NIDA website admin.\n\nChoose your password here (the link works once, for 7 days):\n${link}\n\nNIDA admin`);
    await logActivity(me, 'user.invite', `Invited ${v.name} (${v.email}) as ${ROLE_LABELS[v.role as Role]}`, 'user', u.id);
    return done(sent ? `Invitation emailed to ${v.email}. You can also send them this link yourself:` : `${v.name} is invited. Send them this link (it works once, for 7 days) so they can choose a password:`, { link, linkLabel: 'Invitation link' });
  });
}

export async function updateUser(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const me = await requireAction('users');
    const id = uuid(str(fd, 'id'));
    const v = z.object({ name: z.string().trim().min(2).max(100), role: z.enum(ROLES), status: z.enum(['active', 'deactivated', 'invited']) }).parse({ name: str(fd, 'name'), role: str(fd, 'role'), status: str(fd, 'status') });
    const [u] = await db()`select id, email, role, status, password_hash from admin_users where id = ${id}`;
    if (!u) throw new UserError('That administrator no longer exists.');
    if (u.id === me.id && (v.role !== 'super_admin' || v.status !== 'active')) throw new UserError('You cannot remove your own Super Admin access or deactivate yourself. Ask another Super Admin.');
    const losesSuper = u.role === 'super_admin' && u.status === 'active' && (v.role !== 'super_admin' || v.status !== 'active');
    if (losesSuper && (await activeSuperAdmins(u.id)) === 0) throw new UserError('There must always be at least one active Super Admin.');
    const status = v.status === 'active' && !u.password_hash ? 'invited' : v.status; // cannot be active without a password
    await db()`update admin_users set name = ${v.name}, role = ${v.role}, status = ${status}, updated_at = now() where id = ${id}`;
    if (status === 'deactivated') await db()`delete from admin_sessions where user_id = ${id}`; // signed out at once
    const changes = [u.role !== v.role ? `role ${ROLE_LABELS[v.role as Role]}` : '', u.status !== status ? `status ${status}` : ''].filter(Boolean).join(', ');
    await logActivity(me, 'user.update', `Updated administrator ${u.email}${changes ? ': ' + changes : ''}`, 'user', id!);
    return done(status === 'deactivated' ? 'Saved. The account is deactivated and has been signed out everywhere.' : 'Saved.');
  });
}

export async function createResetLink(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const me = await requireAction('users');
    const id = uuid(str(fd, 'id'));
    const [u] = await db()`select id, name, email, status, password_hash from admin_users where id = ${id}`;
    if (!u) throw new UserError('That administrator no longer exists.');
    if (u.status === 'deactivated') throw new UserError('Reactivate the account first.');
    const purpose = u.password_hash ? 'reset' : 'invite';
    const link = await issueLink(u.id, purpose);
    const sent = emailEnabled() && fd.get('send') === '1' ? await sendEmail(u.email, purpose === 'invite' ? 'Your NIDA admin account' : 'Reset your NIDA admin password', `Hello ${u.name},\n\nUse this link to ${purpose === 'invite' ? 'choose your password' : 'choose a new password'} for the NIDA admin (it works once, for ${purpose === 'invite' ? '7 days' : '24 hours'}):\n${link}\n\nNIDA admin`) : false;
    await logActivity(me, 'user.reset-link', `Created a ${purpose === 'invite' ? 'new invitation' : 'password reset'} link for ${u.email}`, 'user', u.id);
    return done(sent ? `Emailed to ${u.email}. The link is also here:` : `Send this link to ${u.name}. It works once, for ${purpose === 'invite' ? '7 days' : '24 hours'}. Older links stop working.`, { link, linkLabel: purpose === 'invite' ? 'Invitation link' : 'Password reset link' });
  });
}

export async function signOutUser(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const me = await requireAction('users');
    const id = uuid(str(fd, 'id'));
    const rows = await db()`delete from admin_sessions where user_id = ${id} returning id`;
    await logActivity(me, 'user.signout', `Signed an administrator out of ${rows.length} session${rows.length === 1 ? '' : 's'}`, 'user', id!);
    return done(`Signed out of ${rows.length} session${rows.length === 1 ? '' : 's'}.`);
  });
}

export async function deleteUser(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const me = await requireAction('users');
    const id = uuid(str(fd, 'id'));
    if (id === me.id) throw new UserError('You cannot delete your own account.');
    const [u] = await db()`select email, role, status from admin_users where id = ${id}`;
    if (!u) throw new UserError('That administrator no longer exists.');
    if (u.role === 'super_admin' && u.status === 'active' && (await activeSuperAdmins(id!)) === 0) throw new UserError('There must always be at least one active Super Admin.');
    await db()`delete from admin_users where id = ${id}`;
    await logActivity(me, 'user.delete', `Deleted administrator ${u.email}`, 'user');
    redirect('/admin/users/?deleted=1');
  });
}

// ---------- My account ----------
export async function changeOwnPassword(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const me = await requireAction('view');
    const current = String(fd.get('current') || '');
    const next = String(fd.get('password') || '');
    if (next !== String(fd.get('confirm') || '')) throw new UserError('The two new passwords do not match.');
    const problem = passwordProblem(next);
    if (problem) throw new UserError(problem);
    const [u] = await db()`select password_hash from admin_users where id = ${me.id}`;
    if (!(await verifyPassword(current, u?.password_hash ?? null))) throw new UserError('Your current password is not correct.');
    await db()`update admin_users set password_hash = ${await hashPassword(next)}, updated_at = now() where id = ${me.id}`;
    // Other devices are signed out; this one stays signed in
    const token = (await cookies()).get(SESSION_COOKIE)?.value || '';
    await db()`delete from admin_sessions where user_id = ${me.id} and id <> ${sha256(token)}`;
    await logActivity(me, 'auth.password', 'Changed their password');
    return done('Password changed. Any other devices were signed out.');
  });
}

export async function updateOwnName(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const me = await requireAction('view');
    const name = z.string().trim().min(2, 'Enter your name').max(100).parse(str(fd, 'name'));
    await db()`update admin_users set name = ${name}, updated_at = now() where id = ${me.id}`;
    return done('Saved.');
  });
}

export async function signOutOtherSessions(_: ActionState): Promise<ActionState> {
  return guard(async () => {
    const me = await requireAction('view');
    const token = (await cookies()).get(SESSION_COOKIE)?.value || '';
    const rows = await db()`delete from admin_sessions where user_id = ${me.id} and id <> ${sha256(token)} returning id`;
    await logActivity(me, 'auth.signout-others', 'Signed out of their other devices');
    return done(`Signed out of ${rows.length} other session${rows.length === 1 ? '' : 's'}.`);
  });
}
