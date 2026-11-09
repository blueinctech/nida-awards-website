import { ActionForm, Submit } from '@/components/admin/forms';
import { recoverAccess } from '../../actions/auth';
import { hasDatabase } from '@/lib/server/db';

export const metadata = { title: 'Recover access' };
export const dynamic = 'force-dynamic';

// For the site owner when no Super Admin can sign in. Protected by the ADMIN_SETUP_TOKEN secret.
export default function RecoverPage() {
  const enabled = hasDatabase() && (process.env.ADMIN_SETUP_TOKEN || '').length >= 16;
  return (
    <>
      <h1 className="auth__title">Recover access</h1>
      {enabled ? (
        <>
          <p>Choose a new password for a Super Admin account. If the email has no account yet, a new Super Admin is created. You need the setup code saved as <code>ADMIN_SETUP_TOKEN</code> in the hosting settings.</p>
          <ActionForm action={recoverAccess} className="stack">
            <div className="f"><label htmlFor="setup_token">Setup code</label><input id="setup_token" name="setup_token" type="password" autoComplete="off" required /></div>
            <div className="f"><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" required /></div>
            <div className="f"><label htmlFor="email">Your email</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
            <div className="f"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /><p className="f-hint">At least 8 characters, with letters and numbers or symbols.</p></div>
            <div className="f"><label htmlFor="confirm">Repeat the password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required /></div>
            <Submit className="btn btn--primary btn--block">Save and sign in</Submit>
          </ActionForm>
        </>
      ) : (
        <p>Account recovery is switched off. To use it, add an environment variable named <code>ADMIN_SETUP_TOKEN</code> (a long random code of at least 16 characters) in the hosting settings, redeploy, and open this page again. Remove the variable when you are back in.</p>
      )}
      <p className="auth__alt"><a href="/admin/login/">Back to sign in</a></p>
    </>
  );
}
