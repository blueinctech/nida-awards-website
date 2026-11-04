import { requirePage } from '@/lib/server/auth';
import { PageHead } from '@/components/admin/ui';
import { AwardeeForm } from '../AwardeeForm';

export const metadata = { title: 'Add awardee' };

export default async function NewAwardee() {
  await requirePage('content');
  return (
    <>
      <PageHead title="Add awardee" back={{ href: '/admin/awardees/', label: 'Awardees' }} />
      <AwardeeForm editable />
    </>
  );
}
