import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { toCategory } from '@/lib/server/repo';
import { can } from '@/lib/roles';
import { ConfirmForm } from '@/components/admin/forms';
import { PageHead } from '@/components/admin/ui';
import { CategoryForm } from '../CategoryForm';
import { deleteCategory } from '../../../actions/records';

export const metadata = { title: 'Edit category' };

export default async function EditCategory({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const { id } = await params;
  const [row] = await db()`select * from award_categories where id = ${id}`;
  if (!row) notFound();
  const c = toCategory(row);
  return (
    <>
      <PageHead
        title={c.name}
        back={{ href: '/admin/categories/', label: 'Award categories' }}
        actions={
          <>
            <a className="btn btn--ghost" href={`/api/admin/preview/?path=/awards/`} target="_blank" rel="noopener">Preview ↗</a>
            {can(user.role, 'delete') ? <ConfirmForm action={deleteCategory} hidden={{ id: c.id }} title={`Delete ${c.name}?`} message="The category disappears from the website. Its awardees are kept and listed under Other honours. This cannot be undone.">Delete</ConfirmForm> : null}
          </>
        }
      />
      {(await searchParams).saved ? <p className="notice notice--ok" role="status">Saved.</p> : null}
      <CategoryForm c={c} editable={can(user.role, 'content')} />
    </>
  );
}
