import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { can } from '@/lib/roles';
import { ActionForm, ConfirmForm, Submit } from '@/components/admin/forms';
import { Badge, Card, PageHead, fmtDateTime, fmtSize } from '@/components/admin/ui';
import { addNominationNote, deleteNomination, setNominationStatus } from '../../../actions/submissions';

export const metadata = { title: 'Nomination' };

const linkify = (text: string) =>
  text.split(/(\s+)/).map((w, i) => (/^https?:\/\/\S+$/.test(w) ? <a key={i} className="link" href={w} target="_blank" rel="noopener noreferrer nofollow">{w}</a> : w));

export default async function NominationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage('view');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [[n], files, notes] = await Promise.all([
    db()`select * from nominations where id = ${id}`,
    db()`select id, kind, filename, mime, size from nomination_files where nomination_id = ${id} order by kind desc, created_at`,
    db()`select user_name, body, created_at from nomination_notes where nomination_id = ${id} order by created_at`,
  ]);
  if (!n) notFound();
  const manage = can(user.role, 'submissions');
  return (
    <>
      <PageHead
        title={n.nominee_name}
        description={<><Badge status={n.status} /> {n.category} · NIDA {n.edition} · {n.reference}</>}
        back={{ href: '/admin/nominations/', label: 'Nominations' }}
        actions={can(user.role, 'delete') ? <ConfirmForm action={deleteNomination} hidden={{ id }} title="Delete this nomination?" message="The nomination, its uploaded files and its notes are deleted permanently.">Delete</ConfirmForm> : null}
      />
      <div className="edit-grid">
        <div className="edit-grid__main">
          <Card title="The nominee">
            <dl className="meta-list">
              <div><dt>Name</dt><dd>{n.nominee_name}</dd></div>
              <div><dt>Email</dt><dd><a className="link" href={`mailto:${n.nominee_email}`}>{n.nominee_email}</a></dd></div>
              <div><dt>Phone</dt><dd><a className="link" href={`tel:${n.nominee_phone.replace(/\s/g, '')}`}>{n.nominee_phone}</a></dd></div>
              <div><dt>Country of residence</dt><dd>{n.nominee_country}</dd></div>
              <div><dt>Category</dt><dd>{n.category}</dd></div>
            </dl>
          </Card>
          <Card title="What is special about the nominee’s work"><p className="pre">{n.about_nominee}</p></Card>
          <Card title="Accomplishments and impact"><p className="pre">{n.impact}</p></Card>
          <Card title="Links"><p className="pre">{linkify(n.links)}</p></Card>
          <Card title={`Files (${files.length})`}>
            {files.length ? (
              <ul className="files" role="list">
                {files.map((f) => (
                  <li key={f.id}>
                    {f.kind === 'photo' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a href={`/api/admin/files/${f.id}/`} target="_blank" rel="noopener"><img src={`/api/admin/files/${f.id}/`} alt={`Photo of ${n.nominee_name}`} /></a>
                    ) : <span className="media-tile__doc">{(f.filename.split('.').pop() || 'file').toUpperCase()}</span>}
                    <span><b>{f.filename}</b><small>{f.kind === 'photo' ? 'Photograph' : 'Document'} · {fmtSize(f.size)}</small></span>
                    <span className="cell-actions"><a className="link" href={`/api/admin/files/${f.id}/`} target="_blank" rel="noopener">Open</a><a className="link" href={`/api/admin/files/${f.id}/?download=1`}>Download</a></span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">No files were attached.</p>}
          </Card>
        </div>
        <div className="edit-grid__side">
          <Card title="Status">
            {manage ? (
              <ActionForm action={setNominationStatus} className="fields">
                <input type="hidden" name="id" value={id} />
                <div className="radio-list">
                  {[['pending', 'Pending'], ['under_review', 'Under review'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([v, l]) => (
                    <label key={v}><input type="radio" name="status" value={v} defaultChecked={n.status === v} /> {l}</label>
                  ))}
                </div>
                <Submit>Update status</Submit>
              </ActionForm>
            ) : <Badge status={n.status} />}
          </Card>
          <Card title="Nominated by">
            <dl className="meta-list">
              <div><dt>Name</dt><dd>{n.nominator_name}</dd></div>
              <div><dt>Email</dt><dd><a className="link" href={`mailto:${n.nominator_email}`}>{n.nominator_email}</a></dd></div>
              <div><dt>Country</dt><dd>{n.nominator_country}</dd></div>
              {n.nominator_whatsapp ? <div><dt>WhatsApp</dt><dd>{n.nominator_whatsapp}</dd></div> : null}
              <div><dt>Received</dt><dd>{fmtDateTime(n.created_at)}</dd></div>
            </dl>
          </Card>
          <Card title="Internal notes">
            {notes.length ? (
              <ul className="notes" role="list">
                {notes.map((x, i) => <li key={i}><p className="pre">{x.body}</p><small>{x.user_name} · {fmtDateTime(x.created_at)}</small></li>)}
              </ul>
            ) : <p className="muted">No notes yet. Notes are only visible to administrators.</p>}
            {manage ? (
              <ActionForm action={addNominationNote} className="fields" reset>
                <input type="hidden" name="id" value={id} />
                <div className="f"><label htmlFor="note">Add a note</label><textarea id="note" name="body" rows={3} maxLength={5000} required /></div>
                <Submit className="btn btn--ghost">Add note</Submit>
              </ActionForm>
            ) : null}
          </Card>
        </div>
      </div>
    </>
  );
}
