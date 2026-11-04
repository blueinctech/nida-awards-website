import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { emailEnabled } from '@/lib/server/email';
import { ROLE_LABELS, type Role } from '@/lib/roles';
import { ActionForm, ConfirmForm, Submit } from '@/components/admin/forms';
import { Badge, Card, Field, PageHead, Select, fmtDateTime } from '@/components/admin/ui';
import { createResetLink, deleteUser, signOutUser, updateUser } from '../../../actions/users';

export const metadata = { title: 'Administrator' };

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage('users');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sql = db();
  const [u] = await sql`select id, name, email, role, status, last_login_at, locked_until, created_at, password_hash is not null as has_password from admin_users where id = ${id}`;
  if (!u) notFound();
  const [sessions, recent] = await Promise.all([
    sql`select created_at, last_seen_at, ip, user_agent from admin_sessions where user_id = ${id} and expires_at > now() order by last_seen_at desc`,
    sql`select summary, created_at from activity_log where user_id = ${id} order by created_at desc limit 15`,
  ]);
  const self = u.id === me.id;
  const locked = u.locked_until && new Date(u.locked_until) > new Date();
  return (
    <>
      <PageHead
        title={u.name}
        description={<><Badge status={u.status} /> {ROLE_LABELS[u.role as Role]} · {u.email}{self ? ' · This is you' : ''}</>}
        back={{ href: '/admin/users/', label: 'Administrators' }}
        actions={!self ? <ConfirmForm action={deleteUser} hidden={{ id }} title={`Delete ${u.name}?`} message="Their account is removed permanently and they are signed out. Their past activity stays in the log. To keep the account but block access, set the status to Deactivated instead.">Delete</ConfirmForm> : null}
      />
      {locked ? <p className="notice notice--warn">Sign-in is temporarily locked after too many wrong passwords (until {fmtDateTime(u.locked_until)}). A new password reset link unlocks it.</p> : null}
      <div className="edit-grid">
        <div className="edit-grid__main">
          <Card title="Details and access">
            <ActionForm action={updateUser} className="stack">
              <input type="hidden" name="id" value={id} />
              <Field name="name" label="Name" defaultValue={u.name} required maxLength={100} />
              <Select name="role" label="Role" defaultValue={u.role} options={(Object.keys(ROLE_LABELS) as Role[]).map((r) => [r, ROLE_LABELS[r]])} hint={self ? 'You cannot change your own role. Ask another Super Admin.' : undefined} />
              <Select
                name="status"
                label="Status"
                defaultValue={u.status}
                options={[['active', 'Active'], ['invited', 'Invited (has not chosen a password yet)'], ['deactivated', 'Deactivated (cannot sign in)']]}
                hint="Deactivating signs the person out everywhere at once. An account only becomes active after its owner has chosen a password."
              />
              <div><Submit>Save changes</Submit></div>
            </ActionForm>
          </Card>
          <Card title="Recent activity">
            {recent.length ? (
              <ul className="feed feed--plain">
                {recent.map((a, i) => <li key={i}><span className="feed__main">{a.summary}</span><span className="feed__side">{fmtDateTime(a.created_at)}</span></li>)}
              </ul>
            ) : <p className="muted">No activity yet.</p>}
          </Card>
        </div>
        <div className="edit-grid__side">
          <Card title={u.has_password ? 'Password' : 'Invitation'}>
            <p className="card__desc">
              {u.has_password
                ? 'Create a one-time link for this person to choose a new password. It works for 24 hours. Administrators never see each other’s passwords.'
                : 'They have not chosen a password yet. Create a fresh invitation link (valid 7 days). Older links stop working.'}
            </p>
            {u.status === 'deactivated' ? <p className="muted">Reactivate the account first.</p> : (
              <ActionForm action={createResetLink} className="stack">
                <input type="hidden" name="id" value={id} />
                {emailEnabled() ? <label className="f f--check"><span><input type="checkbox" name="send" value="1" defaultChecked /> Also email it to {u.email}</span></label> : null}
                <div><Submit className="btn btn--ghost">{u.has_password ? 'Create reset link' : 'Create new invitation link'}</Submit></div>
              </ActionForm>
            )}
          </Card>
          <Card title="Sessions">
            <dl className="meta-list">
              <div><dt>Last sign-in</dt><dd>{fmtDateTime(u.last_login_at)}</dd></div>
              <div><dt>Account created</dt><dd>{fmtDateTime(u.created_at)}</dd></div>
              <div><dt>Signed in on</dt><dd>{sessions.length} device{sessions.length === 1 ? '' : 's'}</dd></div>
            </dl>
            {sessions.length ? (
              <ul className="plain-list">
                {sessions.map((s, i) => <li key={i}><span className="muted">Active {fmtDateTime(s.last_seen_at)}</span><br />{String(s.user_agent || 'Unknown browser').slice(0, 90)}</li>)}
              </ul>
            ) : null}
            {sessions.length && !self ? (
              <ActionForm action={signOutUser}>
                <input type="hidden" name="id" value={id} />
                <Submit className="btn btn--ghost btn--sm">Sign out everywhere</Submit>
              </ActionForm>
            ) : null}
            {self ? <p className="muted">Manage your own sessions in <a className="link" href="/admin/account/">My account</a>.</p> : null}
          </Card>
        </div>
      </div>
    </>
  );
}
