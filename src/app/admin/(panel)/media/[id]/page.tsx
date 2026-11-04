import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/server/auth';
import { getMedia, mediaUsage } from '@/lib/server/media';
import { can } from '@/lib/roles';
import { ActionForm, ConfirmForm, CopyField, Submit } from '@/components/admin/forms';
import { ReplaceButton } from '@/components/admin/media';
import { Card, Check, Field, PageHead, fmtDateTime, fmtSize } from '@/components/admin/ui';
import { removeMedia, updateMedia } from '../../../actions/media';

export const metadata = { title: 'Media' };

export default async function MediaItem({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage('view');
  const id = decodeURIComponent((await params).id);
  if (!/^[\w-]{1,80}$/.test(id)) notFound();
  const m = await getMedia(id);
  if (!m) notFound();
  const used = await mediaUsage(id);
  const editable = can(user.role, 'media');
  const big = m.variants[m.variants.length - 1];
  return (
    <>
      <PageHead
        title={m.title || m.filename || m.id}
        back={{ href: '/admin/media/', label: 'Media library' }}
        actions={
          <>
            {editable ? <ReplaceButton id={m.id} kind={m.kind} /> : null}
            {can(user.role, 'delete') && editable ? (
              <ConfirmForm action={removeMedia} hidden={{ id: m.id }} title="Delete this file?" message={used.length ? 'This file is used on the website, so it cannot be deleted until it is replaced there.' : 'The file is removed from the library and from storage. This cannot be undone.'}>Delete</ConfirmForm>
            ) : null}
          </>
        }
      />
      <div className="edit-grid">
        <div className="edit-grid__main">
          <Card>
            {m.kind === 'image' && big ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="media-preview" src={big.url} alt={m.alt} width={big.w} height={big.h} />
            ) : (
              <p><a className="btn btn--ghost" href={m.url} target="_blank" rel="noopener">Open {m.filename} ↗</a></p>
            )}
            <dl className="meta-list">
              <div><dt>File</dt><dd>{m.filename || '—'}</dd></div>
              {m.width ? <div><dt>Size</dt><dd>{m.width} × {m.height} px{m.size ? `, ${fmtSize(m.size)}` : ''}</dd></div> : m.size ? <div><dt>Size</dt><dd>{fmtSize(m.size)}</dd></div> : null}
              <div><dt>Stored</dt><dd>{m.storage === 'static' ? 'Built into the website' : m.storage === 'blob' ? 'Vercel Blob' : 'Server upload folder'}</dd></div>
              {m.kind === 'image' ? <div><dt>Web sizes</dt><dd>{m.variants.map((v) => `${v.w}px`).join(', ')}{m.extra.portrait ? ' · portrait crops' : ''}{m.extra.faces ? ' · face crops' : ''}</dd></div> : null}
              <div><dt>Added</dt><dd>{fmtDateTime(m.createdAt)}</dd></div>
            </dl>
            <CopyField label="File address" value={m.kind === 'image' ? big?.url || m.url : m.url} />
          </Card>
          <Card title="Where it is used">
            {used.length ? <ul className="plain-list">{used.map((u) => <li key={u}>{u}</li>)}</ul> : <p className="muted">Not used on any page. {m.gallery ? 'It is shown in the gallery.' : ''}</p>}
          </Card>
        </div>
        <div className="edit-grid__side">
          <Card title="Details">
            <ActionForm action={updateMedia} className="fields">
              <input type="hidden" name="id" value={m.id} />
              <Field name="title" label="Title" defaultValue={m.title} maxLength={200} />
              {m.kind === 'image' ? <Field name="alt" label="Description for screen readers (alt text)" rows={2} defaultValue={m.alt} maxLength={300} hint="Describe what the image shows, e.g. “Two honourees holding their NIDA trophies”." /> : null}
              <Field name="folder" label="Folder" defaultValue={m.folder} maxLength={40} />
              <Field name="tags" label="Tags" defaultValue={m.tags.join(', ')} hint="Separate with commas." />
              {m.kind === 'image' ? (
                <>
                  <Check name="gallery" label="Show in the gallery" defaultChecked={m.gallery} />
                  <Field name="gallery_year" label="Gallery edition (year)" type="number" defaultValue={m.galleryYear ?? ''} min={2000} max={2100} />
                </>
              ) : null}
              <Field name="sort_order" label="Order" type="number" defaultValue={m.sortOrder} hint="Lower numbers come first in the gallery." />
              {editable ? <Submit>Save details</Submit> : null}
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
