import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { can } from '@/lib/roles';
import { Badge, Empty, PageHead, fmtDay } from '@/components/admin/ui';

export const metadata = { title: 'News & blog' };

export default async function PostsAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const sp = await searchParams;
  const q = (sp.q || '').trim().slice(0, 100);
  const status = sp.status === 'published' || sp.status === 'draft' ? sp.status : '';
  const cat = (sp.category || '').slice(0, 60);
  const sql = db();
  const like = '%' + q.replace(/[%_\\]/g, (c) => '\\' + c) + '%';
  const [rows, cats] = await Promise.all([
    sql`select p.*, u.name as author from posts p left join admin_users u on u.id = p.author_id where true
      ${q ? sql`and (p.title ilike ${like} or p.excerpt ilike ${like} or array_to_string(p.tags, ' ') ilike ${like})` : sql``}
      ${status ? sql`and p.status = ${status}` : sql``} ${cat ? sql`and p.category = ${cat}` : sql``}
      order by coalesce(p.published_at, p.updated_at) desc`,
    sql`select distinct category from posts where category <> '' order by category`,
  ]);
  return (
    <>
      <PageHead
        title="News & blog"
        description="Published articles appear on the News page of the website. “News” is added to the menu once the first article is published."
        actions={can(user.role, 'content') ? <a className="btn btn--primary" href="/admin/posts/new/">Write article</a> : null}
      />
      {sp.deleted ? <p className="notice notice--ok" role="status">The article was deleted.</p> : null}
      <form className="toolbar" role="search">
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search titles and tags" aria-label="Search articles" />
        <select className="input" name="status" defaultValue={status} aria-label="Status"><option value="">Drafts and published</option><option value="published">Published</option><option value="draft">Drafts</option></select>
        <select className="input" name="category" defaultValue={cat} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c.category}>{c.category}</option>)}</select>
        <button className="btn btn--ghost" type="submit">Filter</button>
      </form>
      {rows.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Title</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col">Author</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><a href={`/admin/posts/${p.id}/`}><b>{p.title}</b></a>{p.tags.length ? <><br /><small className="muted">{p.tags.join(', ')}</small></> : null}</td>
                  <td>{p.category || '—'}</td>
                  <td><Badge status={p.status} /></td>
                  <td>{fmtDay(p.published_at || p.updated_at)}</td>
                  <td>{p.author || '—'}</td>
                  <td className="cell-actions"><a className="link" href={`/admin/posts/${p.id}/`}>Edit</a>{p.status === 'published' ? <a className="link" href={`/news/${p.slug}/`} target="_blank" rel="noopener">View ↗</a> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title={q || status || cat ? 'No articles match' : 'No articles yet'}>{can(user.role, 'content') ? <a className="btn btn--primary" href="/admin/posts/new/">Write the first article</a> : null}</Empty>}
    </>
  );
}
