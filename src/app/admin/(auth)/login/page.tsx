import { redirect } from 'next/navigation';
import { ActionForm, Submit } from '@/components/admin/forms';
import { login } from '../../actions/auth';
import { currentAdmin, adminCount } from '@/lib/server/auth';
import { hasDatabase } from '@/lib/server/db';

export const metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  if (!hasDatabase()) {
    return (
      <>
        <h1 className="auth__title">Admin not set up yet</h1>
        <p>The database is not connected. Add a Postgres database to the hosting project and set <code>DATABASE_URL</code> (see the README, section “Admin CMS setup”).</p>
      </>
    );
  }
  if (await currentAdmin()) redirect('/admin');
  if ((await adminCount()) === 0) redirect('/admin/setup');
  return (
    <>
      <h1 className="auth__title">Sign in</h1>
      {sp['signed-out'] ? <p className="notice notice--ok" role="status">You are signed out.</p> : null}
      <ActionForm action={login} className="stack">
        <input type="hidden" name="next" value={sp.next || ''} />
        <div className="f"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required autoFocus /></div>
        <div className="f"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
        <Submit className="btn btn--primary btn--block">Sign in</Submit>
      </ActionForm>
      <p className="auth__alt"><a href="/admin/forgot-password/">Forgot your password?</a></p>
    </>
  );
}
