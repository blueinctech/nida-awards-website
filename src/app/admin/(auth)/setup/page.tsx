import { redirect } from 'next/navigation';
import { ActionForm, Submit } from '@/components/admin/forms';
import { setupFirstAdmin } from '../../actions/auth';
import { adminCount } from '@/lib/server/auth';
import { hasDatabase } from '@/lib/server/db';

export const metadata = { title: 'First-time setup' };
export const dynamic = 'force-dynamic';

// Creates the first Super Admin. Works only while there is no administrator at all, and only for
// someone who knows the ADMIN_SETUP_TOKEN secret set in the hosting environment.
export default async function SetupPage() {
  if (!hasDatabase()) redirect('/admin/login');
  if ((await adminCount()) > 0) redirect('/admin/login');
  const configured = (process.env.ADMIN_SETUP_TOKEN || '').length >= 16;
  return (
    <>
      <h1 className="auth__title">First-time setup</h1>
      {configured ? (
        <>
          <p>Create the first Super Admin account. You will need the setup code you saved as <code>ADMIN_SETUP_TOKEN</code> in the hosting settings.</p>
          <ActionForm action={setupFirstAdmin} className="stack">
            <div className="f"><label htmlFor="setup_token">Setup code</label><input id="setup_token" name="setup_token" type="password" autoComplete="off" required /></div>
            <div className="f"><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" required /></div>
            <div className="f"><label htmlFor="email">Your email</label><input id="email" name="email" type="email" autoComplete="username" required /></div>
            <div className="f"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required /><p className="f-hint">At least 12 characters, with letters and numbers or symbols.</p></div>
            <div className="f"><label htmlFor="confirm">Repeat the password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} required /></div>
            <Submit className="btn btn--primary btn--block">Create Super Admin</Submit>
          </ActionForm>
        </>
      ) : (
        <p>To create the first administrator, add an environment variable named <code>ADMIN_SETUP_TOKEN</code> (a long random code of at least 16 characters) to the hosting project, redeploy, and open this page again. See the README for the steps.</p>
      )}
    </>
  );
}
