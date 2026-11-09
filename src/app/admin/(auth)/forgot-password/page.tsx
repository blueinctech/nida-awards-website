import { ActionForm, Submit } from '@/components/admin/forms';
import { requestReset } from '../../actions/auth';
import { emailEnabled } from '@/lib/server/email';

export const metadata = { title: 'Reset your password' };
export const dynamic = 'force-dynamic';

export default function ForgotPage() {
  return (
    <>
      <h1 className="auth__title">Reset your password</h1>
      {emailEnabled() ? (
        <>
          <p>Enter the email address of your admin account. We will send you a link to choose a new password.</p>
          <ActionForm action={requestReset} className="stack" reset>
            <div className="f"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required autoFocus /></div>
            <Submit className="btn btn--primary btn--block">Send reset link</Submit>
          </ActionForm>
        </>
      ) : (
        <p>Ask a Super Admin to create a password reset link for you: in the admin, open <b>Administrators</b>, choose your name and select <b>Create reset link</b>. </p>
      )}
      <p className="auth__alt">Site owner and locked out? <a href="/admin/recover/">Recover access with the setup code</a></p>
      <p className="auth__alt"><a href="/admin/login/">Back to sign in</a></p>
    </>
  );
}
