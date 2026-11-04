import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { ROLE_HELP, ROLE_LABELS, type Role } from '@/lib/roles';
import { Badge, Card, PageHead, fmtDateTime } from '@/components/admin/ui';

export const metadata = { title: 'Administrators' };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requirePage('users');
  const sp = await searchParams;
  const rows = await db()`select u.id, u.name, u.email, u.role, u.status, u.last_login_at, u.locked_until,
      (select count(*)::int from admin_sessions s where s.user_id = u.id and s.expires_at > now()) as sessions
    from admin_users u order by u.status = 'deactivated', u.role = 'viewer', u.role = 'editor', u.name`;
  return (
    <>
      <PageHead
        title="Administrators"
        description="People who can sign in to this admin. There is no public sign-up: only a Super Admin can invite someone."
        actions={<><a className="btn btn--ghost" href="/admin/activity/">Activity log</a><a className="btn btn--primary" href="/admin/users/new/">Invite administrator</a></>}
      />
      {sp.deleted ? <p className="notice notice--ok" role="status">The administrator was deleted.</p> : null}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Last sign-in</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <a className="link" href={`/admin/users/${u.id}/`}><b>{u.name}</b></a>
                  {u.id === me.id ? <span className="muted"> (you)</span> : null}
                  <br /><span className="muted">{u.email}</span>
                </td>
                <td>{ROLE_LABELS[u.role as Role]}</td>
                <td>
                  <Badge status={u.status} />
                  {u.locked_until && new Date(u.locked_until) > new Date() ? <> <span className="badge badge--red">Locked</span></> : null}
                </td>
                <td>{fmtDateTime(u.last_login_at)}{u.sessions ? <><br /><span className="muted">{u.sessions} active session{u.sessions === 1 ? '' : 's'}</span></> : null}</td>
                <td className="cell-actions"><a className="link" href={`/admin/users/${u.id}/`}>Manage</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title="What each role can do">
        <dl className="meta-list">
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <div key={r}><dt>{ROLE_LABELS[r]}</dt><dd>{ROLE_HELP[r]}</dd></div>)}
        </dl>
      </Card>
    </>
  );
}
