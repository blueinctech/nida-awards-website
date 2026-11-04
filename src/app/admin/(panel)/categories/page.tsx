import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { can } from '@/lib/roles';
import { Badge, PageHead } from '@/components/admin/ui';

export const metadata = { title: 'Award categories' };

export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const rows = await db()`select c.*, (select count(*)::int from awardees a where a.category_id = c.id) as n from award_categories c order by sort_order, name`;
  return (
    <>
      <PageHead
        title="Award categories"
        description="The categories on the Awards page and the home page. Nomination form categories are set in Website content → Awards & nominations."
        actions={can(user.role, 'content') ? <a className="btn btn--primary" href="/admin/categories/new/">Add category</a> : null}
      />
      {(await searchParams).deleted ? <p className="notice notice--ok" role="status">The category was deleted. Its awardees are now listed under Other honours.</p> : null}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th scope="col">Category</th><th scope="col">Awards</th><th scope="col">Awardees</th><th scope="col">Order</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><a href={`/admin/categories/${c.id}/`}><b>{c.name}</b></a></td>
                <td>{c.awards.length}</td>
                <td>{c.n}</td>
                <td>{c.sort_order}</td>
                <td><Badge status={c.published ? 'published' : 'unpublished'} /></td>
                <td className="cell-actions"><a className="link" href={`/admin/categories/${c.id}/`}>Edit</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
