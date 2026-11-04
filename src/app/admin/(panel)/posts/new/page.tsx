import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { PageHead } from '@/components/admin/ui';
import { PostForm } from '../PostForm';

export const metadata = { title: 'Write article' };

export default async function NewPost() {
  await requirePage('content');
  const cats = await db()`select distinct category from posts where category <> '' order by category`;
  return (
    <>
      <PageHead title="Write article" back={{ href: '/admin/posts/', label: 'News & blog' }} />
      <PostForm editable categories={cats.map((c) => c.category)} />
    </>
  );
}
