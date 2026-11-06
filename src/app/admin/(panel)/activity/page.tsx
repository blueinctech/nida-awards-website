import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { Empty, PageHead, Pager, fmtDateTime } from '@/components/admin/ui';

export const metadata = { title: 'Activity log' };

const PER_PAGE = 50;
const AREAS: [string, string][] = [
  ['', 'All areas'], ['auth', 'Sign-ins and passwords'], ['user', 'Administrators'], ['content', 'Website content'], ['awardee', 'Awardees'],
  ['category', 'Award categories'], ['event', 'Events'], ['post', 'News'], ['media', 'Media'], ['nomination', 'Nominations'], ['message', 'Messages'], ['backup', 'Backups'], ['export', 'Exports'],
];

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requirePage('activity');
  const sp = await searchParams;
  const area = AREAS.some(([v]) => v === sp.area) ? sp.area : '';
  const who = /^[0-9a-f-]{36}$/.test(sp.who || '') ? sp.who : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const sql = db();
  const where = sql`where true ${area ? sql`and split_part(action, '.', 1) = ${area}` : sql``} ${who ? sql`and user_id = ${who}` : sql``}`;
  const [rows, [{ n }], people] = await Promise.all([
    sql`select id, user_name, action, summary, created_at from activity_log ${where} order by created_at desc limit ${PER_PAGE} offset ${(page - 1) * PER_PAGE}`,
    sql`select count(*)::int as n from activity_log ${where}`,
    sql`select id, name from admin_users order by name`,
  ]);
  const base = '/admin/activity/?' + new URLSearchParams({ ...(area ? { area } : {}), ...(who ? { who } : {}) }).toString();
  return (
    <>
      <PageHead title="Activity log" description={`Every change made in the admin, with who made it and when. ${n} entr${n === 1 ? 'y' : 'ies'}.`} back={{ href: '/admin/users/', label: 'Administrators' }} />
      <form className="toolbar">
        <select className="input" name="area" defaultValue={area} aria-label="Area">{AREAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select className="input" name="who" defaultValue={who} aria-label="Administrator"><option value="">Everyone</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button className="btn btn--ghost" type="submit">Filter</button>
        {area || who ? <a className="link" href="/admin/activity/">Clear</a> : null}
      </form>
      {rows.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">What</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.created_at)}</td>
                  <td>{r.user_name || 'System'}</td>
                  <td>{r.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title="Nothing logged here yet" />}
      <Pager page={page} pages={Math.ceil(n / PER_PAGE)} base={base} />
    </>
  );
}
