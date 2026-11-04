import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { can } from '@/lib/roles';
import { ActionForm, Submit } from '@/components/admin/forms';
import { Badge, Empty, PageHead, Pager, STATUS_LABEL, fmtDateTime } from '@/components/admin/ui';
import { setMessageStatus } from '../../actions/submissions';

export const metadata = { title: 'Messages & forms' };
const PER = 50;

export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const sp = await searchParams;
  const kind = sp.kind === 'newsletter' ? 'newsletter' : '';
  const status = ['new', 'read', 'replied', 'archived'].includes(sp.status) ? sp.status : '';
  const q = (sp.q || '').trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);
  const sql = db();
  const like = '%' + q.replace(/[%_\\]/g, (c) => '\\' + c) + '%';
  const where = sql`where ${kind ? sql`kind = 'newsletter'` : sql`kind <> 'newsletter'`}
    ${status ? sql`and status = ${status}` : kind ? sql`` : sql`and status <> 'archived'`}
    ${q ? sql`and (email ilike ${like} or name ilike ${like} or subject ilike ${like} or body ilike ${like})` : sql``}`;
  const [rows, [{ n }], [c]] = await Promise.all([
    sql`select * from messages ${where} order by created_at desc limit ${PER} offset ${(page - 1) * PER}`,
    sql`select count(*)::int as n from messages ${where}`,
    sql`select (select count(*)::int from messages where kind <> 'newsletter' and status = 'new') as new_msgs, (select count(*)::int from messages where kind = 'newsletter') as subs, (select count(*)::int from nominations where status = 'pending') as noms`,
  ]);
  const manage = can(user.role, 'submissions');
  const qs = new URLSearchParams(Object.entries({ kind, status, q }).filter(([, v]) => v)).toString();
  return (
    <>
      <PageHead
        title="Messages & forms"
        description="Everything sent through the website’s forms: contact messages and enquiries, “Save the date” mailing-list sign-ups and nominations."
        actions={manage ? <a className="btn btn--ghost" href={`/api/admin/export/${kind ? 'newsletter' : 'messages'}/${status ? '?status=' + status : ''}`}>Export CSV</a> : null}
      />
      {sp.deleted ? <p className="notice notice--ok" role="status">Deleted.</p> : null}
      <nav className="tabs" aria-label="Form">
        <a href="/admin/messages/" aria-current={!kind ? 'page' : undefined}>Contact &amp; enquiries {c.new_msgs ? <b className="tab-badge">{c.new_msgs}</b> : null}</a>
        <a href="/admin/messages/?kind=newsletter" aria-current={kind ? 'page' : undefined}>Mailing list ({c.subs})</a>
        <a href="/admin/nominations/">Nominations {c.noms ? <b className="tab-badge">{c.noms}</b> : null}</a>
      </nav>
      <form className="toolbar" role="search">
        {kind ? <input type="hidden" name="kind" value={kind} /> : null}
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search name, email or text" aria-label="Search messages" />
        <select className="input" name="status" defaultValue={status} aria-label="Status"><option value="">{kind ? 'Any status' : 'Not archived'}</option>{['new', 'read', 'replied', 'archived'].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <button className="btn btn--ghost" type="submit">Filter</button>
      </form>
      {rows.length ? (
        <ActionForm action={setMessageStatus}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr>{manage ? <th scope="col"><span className="visually-hidden">Select</span></th> : null}<th scope="col">{kind ? 'Email' : 'From'}</th>{kind ? null : <th scope="col">Message</th>}<th scope="col">Received</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className={m.status === 'new' ? 'is-new' : undefined}>
                    {manage ? <td><input type="checkbox" name="pick" value={m.id} aria-label={`Select message from ${m.email}`} /></td> : null}
                    <td><a href={`/admin/messages/${m.id}/`}><b>{m.name || m.email}</b></a>{m.name ? <><br /><small className="muted">{m.email}</small></> : null}</td>
                    {kind ? null : <td><b>{m.subject}</b><br /><small className="muted">{m.body.slice(0, 120)}{m.body.length > 120 ? '…' : ''}</small></td>}
                    <td>{fmtDateTime(m.created_at)}</td>
                    <td><Badge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {manage ? <BulkBar /> : null}
        </ActionForm>
      ) : <Empty title="Nothing here">{kind ? 'Sign-ups from the “Save the date” form appear here.' : 'Messages from the contact form appear here.'}</Empty>}
      <Pager page={page} pages={Math.ceil(n / PER)} base={`/admin/messages/${qs ? '?' + qs : ''}`} />
    </>
  );
}

// Applies a status to the ticked rows
function BulkBar() {
  return (
    <div className="bulk">
      <span>With selected:</span>
      <select className="input" name="status" defaultValue="read" aria-label="New status">
        <option value="read">Mark as read</option><option value="new">Mark as new</option><option value="replied">Mark as replied</option><option value="archived">Archive</option>
      </select>
      <Submit className="btn btn--ghost btn--sm">Apply</Submit>
    </div>
  );
}
