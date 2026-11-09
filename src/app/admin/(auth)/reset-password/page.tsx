import { ActionForm, Submit } from '@/components/admin/forms';
import { resetPassword } from '../../actions/auth';
import { db, hasDatabase } from '@/lib/server/db';
import { sha256 } from '@/lib/server/auth';

export const metadata = { title: 'Choose a password' };
export const dynamic = 'force-dynamic';

// Used for both password reset links and invitations
export default async function ResetPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const token = (await searchParams).token || '';
  const [t] = hasDatabase() && token.length < 100
    ? await db()`select t.purpose, u.name, u.email from auth_tokens t join admin_users u on u.id = t.user_id where t.id = ${sha256(token)} and t.used_at is null and t.expires_at > now() and u.status <> 'deactivated'`
    : [];
  if (!t) {
    return (
      <>
        <h1 className="auth__title">This link has expired</h1>
        <p>Password links work once, for a limited time. Ask for a new one.</p>
        <p className="auth__alt"><a href="/admin/forgot-password/">Reset your password</a> · <a href="/admin/login/">Sign in</a></p>
      </>
    );
  }
  return (
    <>
      <h1 className="auth__title">{t.purpose === 'invite' ? `Welcome, ${t.name}` : 'Choose a new password'}</h1>
      <p>{t.purpose === 'invite' ? 'Choose a password to activate your NIDA admin account' : 'Choose a new password for'} <b>{t.email}</b>.</p>
      <ActionForm action={resetPassword} className="stack">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="username" value={t.email} autoComplete="username" />
        <div className="f"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required autoFocus /><p className="f-hint">At least 8 characters, with letters and numbers or symbols. A short sentence works well.</p></div>
        <div className="f"><label htmlFor="confirm">Repeat the password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required /></div>
        <Submit className="btn btn--primary btn--block">{t.purpose === 'invite' ? 'Activate my account' : 'Save new password'}</Submit>
      </ActionForm>
    </>
  );
}
