import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { readSettings } from '@/lib/server/repo';
import { can } from '@/lib/roles';
import { Badge, Empty, PageHead, Pager, STATUS_LABEL, fmtDateTime } from '@/components/admin/ui';

export const metadata = { title: 'Nominations' };
const PER = 50;

export default async function NominationsAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const sp = await searchParams;
  const q = (sp.q || '').trim().slice(0, 100);
  const status = ['pending', 'under_review', 'approved', 'rejected'].includes(sp.status) ? sp.status : '';
  const category = (sp.category || '').slice(0, 200);
  const edition = Number(sp.edition) || null;
  const page = Math.max(1, Number(sp.page) || 1);
  const sql = db();
  const like = '%' + q.replace(/[%_\\]/g, (c) => '\\' + c) + '%';
  const where = sql`where true ${q ? sql`and (nominee_name ilike ${like} or nominator_name ilike ${like} or nominee_email ilike ${like} or nominator_email ilike ${like} or reference ilike ${like} or nominee_country ilike ${like})` : sql``}
    ${status ? sql`and status = ${status}` : sql``} ${category ? sql`and category = ${category}` : sql``} ${edition ? sql`and edition = ${edition}` : sql``}`;
  const [rows, [{ n }], counts, cats, editions, settings] = await Promise.all([
    sql`select n.*, (select count(*)::int from nomination_files f where f.nomination_id = n.id) as files from nominations n ${where} order by created_at desc limit ${PER} offset ${(page - 1) * PER}`,
    sql`select count(*)::int as n from nominations ${where}`,
    sql`select status, count(*)::int as n from nominations group by status`,
    sql`select distinct category from nominations order by category`,
    sql`select distinct edition from nominations order by edition desc`,
    readSettings('published'),
  ]);
  const count: Record<string, number> = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  const qs = new URLSearchParams(Object.entries({ q, status, category, edition: edition ? String(edition) : '' }).filter(([, v]) => v)).toString();
  return (
    <>
      <PageHead
        title="Nominations"
        description={<>Entries from the nomination form on the website. Nominations are currently <b>{settings.nominations.open ? `open for NIDA ${settings.nominations.edition}` : 'closed'}</b> (<a className="link" href="/admin/content/?tab=awards">change</a>).</>}
        actions={can(user.role, 'submissions') ? <a className="btn btn--ghost" href={`/api/admin/export/nominations/${qs ? '?' + qs : ''}`}>Export CSV</a> : null}
      />
      {sp.deleted ? <p className="notice notice--ok" role="status">The nomination was deleted.</p> : null}
      <nav className="tabs tabs--small" aria-label="Filter by status">
        <a href="/admin/nominations/" aria-current={!status ? 'page' : undefined}>All ({Object.values(count).reduce((a, b) => a + Number(b), 0)})</a>
        {['pending', 'under_review', 'approved', 'rejected'].map((s) => <a key={s} href={`/admin/nominations/?status=${s}`} aria-current={status === s ? 'page' : undefined}>{STATUS_LABEL[s]} ({count[s] || 0})</a>)}
      </nav>
      <form className="toolbar" role="search">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search nominee, nominator, email or reference" aria-label="Search nominations" />
        <select className="input" name="category" defaultValue={category} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c.category}>{c.category}</option>)}</select>
        <select className="input" name="edition" defaultValue={edition || ''} aria-label="Edition"><option value="">All editions</option>{editions.map((e) => <option key={e.edition} value={e.edition}>{e.edition}</option>)}</select>
        <button className="btn btn--ghost" type="submit">Filter</button>
      </form>
      {rows.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Nominee</th><th scope="col">Category</th><th scope="col">Nominated by</th><th scope="col">Received</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><a href={`/admin/nominations/${r.id}/`}><b>{r.nominee_name}</b></a><br /><small className="muted">{r.reference} · {r.nominee_country}{r.files ? ` · ${r.files} file${r.files === 1 ? '' : 's'}` : ''}</small></td>
                  <td>{r.category}</td>
                  <td>{r.nominator_name}<br /><small className="muted">{r.nominator_email}</small></td>
                  <td>{fmtDateTime(r.created_at)}</td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title={q || status || category ? 'No nominations match' : 'No nominations yet'}>When nominations are open, entries from the website form appear here.</Empty>}
      <Pager page={page} pages={Math.ceil(n / PER)} base={`/admin/nominations/${qs ? '?' + qs : ''}`} />
    </>
  );
}
