import { requirePage } from '@/lib/server/auth';
import { PageHead } from '@/components/admin/ui';
import { EventForm } from '../EventForm';

export const metadata = { title: 'Add event' };

export default async function NewEvent() {
  await requirePage('content');
  return (
    <>
      <PageHead title="Add event" back={{ href: '/admin/events/', label: 'Events & editions' }} />
      <EventForm editable />
    </>
  );
}
