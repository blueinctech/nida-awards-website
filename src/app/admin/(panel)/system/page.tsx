import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { emailEnabled } from '@/lib/server/email';
import { storageMode } from '@/lib/server/storage';
import { can } from '@/lib/roles';
import { Card, PageHead, fmtDateTime, fmtSize } from '@/components/admin/ui';

export const metadata = { title: 'System & backups' };

// Status of the services the admin depends on. Shows whether each is set up, never any secret values.
export default async function SystemPage() {
  const user = await requirePage('view');
  const sql = db();
  const [[c], [last]] = await Promise.all([
    sql`select
      (select count(*)::int from awardees) as awardees, (select count(*)::int from events) as events,
      (select count(*)::int from posts) as posts, (select count(*)::int from nominations) as nominations,
      (select count(*)::int from messages) as messages, (select count(*)::int from media) as media,
      (select coalesce(sum(size), 0)::bigint from media where storage <> 'static') as media_bytes,
      (select count(*)::int from admin_users where status <> 'deactivated') as admins,
      pg_database_size(current_database())::bigint as db_bytes`,
    sql`select created_at, user_name from activity_log where action = 'backup' order by created_at desc limit 1`.then((r) => (r.length ? r : [null])),
  ]);
  const storage = storageMode();
  const host = (() => { try { return new URL(process.env.DATABASE_URL || '').hostname; } catch { return ''; } })();
  const provider = host.includes('neon') ? 'Neon Postgres' : host.includes('supabase') ? 'Supabase Postgres' : host === 'localhost' || host === '127.0.0.1' ? 'Local Postgres' : 'Postgres';
  const ok = (good: boolean, yes: string, no: string) => <><span className={'badge badge--' + (good ? 'green' : 'gold')}>{good ? 'OK' : 'Check'}</span> {good ? yes : no}</>;
  return (
    <>
      <PageHead title="System & backups" description="Where the website’s data and files are kept, and how to back them up." />
      <div className="grid-2">
        <Card title="Services">
          <dl className="meta-list">
            <div><dt>Database</dt><dd>{ok(true, `${provider} connected, ${fmtSize(Number(c.db_bytes))} used.`, '')}</dd></div>
            <div><dt>File storage</dt><dd>{storage === 'blob' ? ok(true, 'Vercel Blob. Uploads are kept outside the database.', '') : storage === 'local' ? ok(true, 'Server disk (local development or a self-managed server).', '') : ok(false, '', 'No Blob token found, so uploads are disabled. In Vercel, connect the Blob store to this project for the Production environment (it adds BLOB_READ_WRITE_TOKEN), then redeploy.')}</dd></div>
            <div><dt>Email</dt><dd>{ok(emailEnabled(), 'Invitations, password resets and new-submission alerts are emailed.', 'Not set up. Invitation and reset links are shown here for you to send yourself, and new submissions appear in the admin only.')}</dd></div>
            <div><dt>Uploaded files</dt><dd>{c.media} items in the media library, {fmtSize(Number(c.media_bytes))} uploaded.</dd></div>
          </dl>
        </Card>
        <Card title="What is stored">
          <dl className="meta-list">
            <div><dt>Awardees</dt><dd>{c.awardees}</dd></div>
            <div><dt>Events and editions</dt><dd>{c.events}</dd></div>
            <div><dt>News articles</dt><dd>{c.posts}</dd></div>
            <div><dt>Nominations</dt><dd>{c.nominations}</dd></div>
            <div><dt>Messages and sign-ups</dt><dd>{c.messages}</dd></div>
            <div><dt>Active administrators</dt><dd>{c.admins}</dd></div>
          </dl>
        </Card>
      </div>
      <Card title="Backups">
        <p className="card__desc">Three layers protect the content. You do not need to do anything for the first one.</p>
        <ol className="plain-list">
          <li><b>Automatic database history.</b> The hosted database (Neon) keeps a restorable history of every change. Its owner can restore the database to any moment in that window from the Neon console (Branches → Restore).</li>
          <li><b>Download a full backup.</b> A Super Admin can download every record (content, awardees, events, articles, nominations, messages, media list and activity) as one JSON file. Passwords are never included. Keep a copy somewhere safe, for example once a month and before big changes.</li>
          <li><b>Files.</b> Uploaded images and documents live in the Vercel Blob store, which keeps them separately from the database. The JSON backup lists the address of every file.</li>
        </ol>
        {can(user.role, 'backup') ? (
          <p className="btn-stack">
            <a className="btn btn--primary" href="/api/admin/backup/" download>Download full backup (JSON)</a>
            <span className="muted">{last ? `Last downloaded ${fmtDateTime(last.created_at)} by ${last.user_name}.` : 'No backup downloaded yet.'}</span>
          </p>
        ) : <p className="muted">Only a Super Admin can download backups.</p>}
      </Card>
    </>
  );
}
