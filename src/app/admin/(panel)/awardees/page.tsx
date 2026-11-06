import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { toAwardee, toMedia } from '@/lib/server/repo';
import { can } from '@/lib/roles';
import { Badge, Empty, PageHead } from '@/components/admin/ui';

export const metadata = { title: 'Awardees' };

export default async function AwardeesAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const sp = await searchParams;
  const q = (sp.q || '').trim().slice(0, 100);
  const year = Number(sp.year) || null;
  const cat = sp.category || '';
  const status = sp.status || '';
  const sql = db();
  const like = '%' + q.replace(/[%_\\]/g, (c) => '\\' + c) + '%';
  const [rows, years, cats] = await Promise.all([
    sql`select a.*, m.variants as m_variants, m.extra as m_extra, m.id as m_id, m.kind as m_kind from awardees a left join media m on m.id = a.photo_id
        where true ${q ? sql`and (a.name ilike ${like} or a.award ilike ${like} or a.country ilike ${like})` : sql``}
        ${year ? sql`and a.year = ${year}` : sql``} ${cat ? sql`and a.category_id = ${cat}` : sql``}
        ${status === 'published' ? sql`and a.published` : status === 'unpublished' ? sql`and not a.published` : sql``}
        order by a.year desc, a.sort_order, a.name`,
    sql`select distinct year from awardees order by year desc`,
    sql`select id, name from award_categories order by sort_order`,
  ]);
  const catName: Record<string, string> = Object.fromEntries([...cats.map((c) => [c.id, c.name]), ['other', 'Other honours']]);
  return (
    <>
      <PageHead
        title="Awardees"
        description={`${rows.length} shown. Every published awardee has a profile page on the website.`}
        actions={can(user.role, 'content') ? <a className="btn btn--primary" href="/admin/awardees/new/">Add awardee</a> : null}
      />
      {sp.deleted ? <p className="notice notice--ok" role="status">The awardee was deleted.</p> : null}
      <form className="toolbar" role="search">
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search by name, award or country" aria-label="Search awardees" />
        <select className="input" name="year" defaultValue={year || ''} aria-label="Year"><option value="">All years</option>{years.map((y) => <option key={y.year} value={y.year}>{y.year}</option>)}</select>
        <select className="input" name="category" defaultValue={cat} aria-label="Category"><option value="">All categories</option>{Object.entries(catName).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className="input" name="status" defaultValue={status} aria-label="Status"><option value="">Published and unpublished</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select>
        <button className="btn btn--ghost" type="submit">Filter</button>
        {q || year || cat || status ? <a className="link" href="/admin/awardees/">Clear</a> : null}
      </form>
      {rows.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Awardee</th><th scope="col">Award</th><th scope="col">Year</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const a = toAwardee(r);
                const m = r.m_id ? toMedia({ id: r.m_id, kind: r.m_kind, variants: r.m_variants, extra: r.m_extra }) : null;
                const thumb = m ? (m.extra.portrait || m.variants)[0]?.url : null;
                return (
                  <tr key={a.id}>
                    <td>
                      <a className="cell-person" href={`/admin/awardees/${a.id}/`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {thumb ? <img src={thumb} alt="" width={40} height={50} loading="lazy" /> : <span className="cell-person__ph" aria-hidden="true">★</span>}
                        <b>{a.name}</b>
                      </a>
                    </td>
                    <td>{a.award}</td>
                    <td>{a.year}</td>
                    <td>{catName[a.group] || a.group}</td>
                    <td><Badge status={a.published ? 'published' : 'unpublished'} /></td>
                    <td className="cell-actions">
                      <a className="link" href={`/admin/awardees/${a.id}/`}>Edit</a>
                      {a.published ? <a className="link" href={`/awardees/${a.slug}/`} target="_blank" rel="noopener">View ↗</a> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty title="No awardees match">Try another search or filter.</Empty>}
    </>
  );
}
