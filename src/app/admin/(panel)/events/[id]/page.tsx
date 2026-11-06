import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { toEdition } from '@/lib/server/repo';
import { can } from '@/lib/roles';
import { ConfirmForm } from '@/components/admin/forms';
import { Badge, PageHead } from '@/components/admin/ui';
import { EventForm } from '../EventForm';
import { deleteEvent } from '../../../actions/records';

export const metadata = { title: 'Edit event' };

export default async function EditEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db()`select * from events where id = ${id}`;
  if (!row) notFound();
  const e = toEdition(row);
  return (
    <>
      <PageHead
        title={e.title}
        description={<><Badge status={e.published ? 'published' : 'unpublished'} /> {e.date} · {e.venue}</>}
        back={{ href: '/admin/events/', label: 'Events & editions' }}
        actions={
          <>
            <a className="btn btn--ghost" href={`/api/admin/preview/?path=/editions/%23nida-${e.year}`} target="_blank" rel="noopener">Preview ↗</a>
            {can(user.role, 'delete') ? <ConfirmForm action={deleteEvent} hidden={{ id: e.id! }} title={`Delete ${e.title}?`} message="The edition disappears from the website. Its awardees are kept. This cannot be undone. To hide it instead, unpublish it.">Delete</ConfirmForm> : null}
          </>
        }
      />
      {(await searchParams).created ? <p className="notice notice--ok" role="status">Event added.</p> : null}
      <EventForm e={e} editable={can(user.role, 'content')} />
    </>
  );
}
