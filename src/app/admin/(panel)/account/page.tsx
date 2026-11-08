import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { ROLE_HELP, ROLE_LABELS } from '@/lib/roles';
import { ActionForm, Submit } from '@/components/admin/forms';
import { Card, Field, PageHead, fmtDateTime } from '@/components/admin/ui';
import { changeOwnPassword, signOutOtherSessions, updateOwnName } from '../../actions/users';

export const metadata = { title: 'My account' };

export default async function AccountPage() {
  const me = await requirePage('view');
  const [[u], [{ n }]] = await Promise.all([
    db()`select last_login_at, created_at from admin_users where id = ${me.id}`,
    db()`select count(*)::int as n from admin_sessions where user_id = ${me.id} and expires_at > now()`,
  ]);
  return (
    <>
      <PageHead title="My account" description={<>{me.email} · {ROLE_LABELS[me.role]}: {ROLE_HELP[me.role]}</>} />
      <div className="grid-2">
        <Card title="Your name">
          <ActionForm action={updateOwnName} className="stack">
            <Field name="name" label="Name" defaultValue={me.name} required maxLength={100} hint="Shown in the activity log." />
            <div><Submit>Save name</Submit></div>
          </ActionForm>
          <dl className="meta-list">
            <div><dt>Email</dt><dd>{me.email} <span className="muted">(your sign-in name)</span></dd></div>
            <div><dt>Last sign-in</dt><dd>{fmtDateTime(u?.last_login_at)}</dd></div>
          </dl>
        </Card>
        <Card title="Change password">
          <ActionForm action={changeOwnPassword} className="stack" reset>
            <Field name="current" label="Current password" type="password" required />
            <Field name="password" label="New password" type="password" required hint="At least 8 characters, with letters and numbers or symbols. A short sentence works well." />
            <Field name="confirm" label="New password again" type="password" required />
            <div><Submit>Change password</Submit></div>
          </ActionForm>
        </Card>
        <Card title="Devices">
          <p className="card__desc">You are signed in on {n} device{n === 1 ? '' : 's'}, including this one. Sessions end after 12 hours without activity.</p>
          <ActionForm action={signOutOtherSessions}>
            <Submit className="btn btn--ghost" disabled={n < 2}>Sign out of other devices</Submit>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
