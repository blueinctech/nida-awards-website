import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { can } from '@/lib/roles';
import { ActionForm, ConfirmForm, Submit } from '@/components/admin/forms';
import { Badge, Card, PageHead, fmtDateTime } from '@/components/admin/ui';
import { deleteMessage, setMessageStatus } from '../../../actions/submissions';

export const metadata = { title: 'Message' };

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage('view');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const manage = can(user.role, 'submissions');
  let [m] = await db()`select * from messages where id = ${id}`;
  if (!m) notFound();
  // Opening a new message marks it as read
  if (m.status === 'new' && manage) [m] = await db()`update messages set status = 'read', updated_at = now() where id = ${id} returning *`;
  const isList = m.kind === 'newsletter';
  return (
    <>
      <PageHead
        title={isList ? m.email : m.subject || 'Message'}
        description={<><Badge status={m.status} /> {isList ? 'Mailing-list sign-up' : m.kind === 'enquiry' ? 'General enquiry' : 'Contact form'} · {fmtDateTime(m.created_at)}</>}
        back={{ href: isList ? '/admin/messages/?kind=newsletter' : '/admin/messages/', label: 'Messages & forms' }}
        actions={
          <>
            {!isList ? <a className="btn btn--primary" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message to NIDA'))}`}>Reply by email</a> : null}
            {can(user.role, 'delete') ? <ConfirmForm action={deleteMessage} hidden={{ id }} title="Delete this message?" message="It is removed permanently.">Delete</ConfirmForm> : null}
          </>
        }
      />
      <div className="edit-grid">
        <div className="edit-grid__main">
          <Card>
            <dl className="meta-list">
              {m.name ? <div><dt>Name</dt><dd>{m.name}</dd></div> : null}
              <div><dt>Email</dt><dd><a className="link" href={`mailto:${m.email}`}>{m.email}</a></dd></div>
            </dl>
            {m.body ? <p className="pre message-body">{m.body}</p> : null}
          </Card>
        </div>
        <div className="edit-grid__side">
          {manage ? (
            <Card title="Status">
              <ActionForm action={setMessageStatus} className="fields">
                <input type="hidden" name="ids" value={id} />
                <div className="radio-list">
                  {[['new', 'New'], ['read', 'Read'], ['replied', 'Replied'], ['archived', 'Archived']].map(([v, l]) => (
                    <label key={v}><input type="radio" name="status" value={v} defaultChecked={m.status === v} /> {l}</label>
                  ))}
                </div>
                <Submit>Update status</Submit>
              </ActionForm>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
