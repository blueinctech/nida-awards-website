import { requirePage } from '@/lib/server/auth';
import { PageHead } from '@/components/admin/ui';
import { CategoryForm } from '../CategoryForm';

export const metadata = { title: 'Add category' };

export default async function NewCategory() {
  await requirePage('content');
  return (
    <>
      <PageHead title="Add award category" back={{ href: '/admin/categories/', label: 'Award categories' }} />
      <CategoryForm editable />
    </>
  );
}
