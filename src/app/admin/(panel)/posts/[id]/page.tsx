import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { toPost } from '@/lib/server/repo';
import { can } from '@/lib/roles';
import { ConfirmForm } from '@/components/admin/forms';
import { Badge, PageHead } from '@/components/admin/ui';
import { PostForm } from '../PostForm';
import { deletePost } from '../../../actions/records';

export const metadata = { title: 'Edit article' };

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db()`select * from posts where id = ${id}`;
  if (!row) notFound();
  const p = toPost(row);
  const cats = await db()`select distinct category from posts where category <> '' order by category`;
  const saved = (await searchParams).saved;
  return (
    <>
      <PageHead
        title={p.title}
        description={<Badge status={p.status} />}
        back={{ href: '/admin/posts/', label: 'News & blog' }}
        actions={
          <>
            <a className="btn btn--ghost" href={`/api/admin/preview/?path=/news/${p.slug}/`} target="_blank" rel="noopener">Preview ↗</a>
            {can(user.role, 'delete') ? <ConfirmForm action={deletePost} hidden={{ id: p.id }} title={`Delete “${p.title}”?`} message="The article is removed from the website and the admin. This cannot be undone.">Delete</ConfirmForm> : null}
          </>
        }
      />
      {saved ? <p className="notice notice--ok" role="status">{saved === 'publish' ? 'Published. The article is live on the website.' : 'Draft saved.'}</p> : null}
      <PostForm p={p} editable={can(user.role, 'content')} categories={cats.map((c) => c.category)} />
    </>
  );
}
