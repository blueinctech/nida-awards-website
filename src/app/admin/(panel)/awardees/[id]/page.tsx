import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { toAwardee } from '@/lib/server/repo';
import { can } from '@/lib/roles';
import { ActionForm, ConfirmForm, Submit } from '@/components/admin/forms';
import { Badge, PageHead } from '@/components/admin/ui';
import { AwardeeForm } from '../AwardeeForm';
import { deleteAwardee, setAwardeePublished } from '../../../actions/records';

export const metadata = { title: 'Edit awardee' };

export default async function EditAwardee({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db()`select * from awardees where id = ${id}`;
  if (!row) notFound();
  const a = toAwardee(row);
  const editable = can(user.role, 'content');
  return (
    <>
      <PageHead
        title={a.name}
        description={<><Badge status={a.published ? 'published' : 'unpublished'} /> {a.award}, NIDA {a.year}</>}
        back={{ href: '/admin/awardees/', label: 'Awardees' }}
        actions={
          <>
            <a className="btn btn--ghost" href={`/api/admin/preview/?path=/awardees/${a.slug}/`} target="_blank" rel="noopener">{a.published ? 'View page ↗' : 'Preview ↗'}</a>
            {editable ? (
              <ActionForm action={setAwardeePublished}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="published" value={a.published ? '0' : '1'} />
                <Submit className="btn btn--ghost">{a.published ? 'Unpublish' : 'Publish'}</Submit>
              </ActionForm>
            ) : null}
            {can(user.role, 'delete') ? (
              <ConfirmForm action={deleteAwardee} hidden={{ id: String(a.id) }} title={`Delete ${a.name}?`} message="The profile is removed from the website and from the admin. This cannot be undone. To hide it instead, unpublish it.">Delete</ConfirmForm>
            ) : null}
          </>
        }
      />
      {(await searchParams).created ? <p className="notice notice--ok" role="status">Awardee added.</p> : null}
      <AwardeeForm a={a} editable={editable} />
    </>
  );
}
