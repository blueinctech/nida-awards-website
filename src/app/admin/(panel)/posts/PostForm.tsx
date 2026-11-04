import { pickedByIds } from '@/lib/server/media';
import type { Post } from '@/lib/types';
import { ActionForm, SlugField, Submit } from '@/components/admin/forms';
import { MediaPicker } from '@/components/admin/media';
import { Card, Field } from '@/components/admin/ui';
import { savePost } from '../../actions/records';

// datetime-local value in Paris time
const local = (iso: string | null) => (iso ? new Date(iso).toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }).slice(0, 16).replace(' ', 'T') : '');

export async function PostForm({ p, editable, categories }: { p?: Post; editable: boolean; categories: string[] }) {
  const image = await pickedByIds([p?.imageId]);
  return (
    <ActionForm action={savePost} className="edit-grid">
      {p?.id ? <input type="hidden" name="id" value={p.id} /> : null}
      <div className="edit-grid__main">
        <Card title="Article">
          <div className="fields">
            <Field name="title" label="Title" defaultValue={p?.title} required maxLength={200} />
            <SlugField from="title" defaultValue={p?.slug} prefix="/news/" />
            <Field name="excerpt" label="Summary" rows={3} defaultValue={p?.excerpt} maxLength={600} hint="Shown on the News page, at the top of the article and when the link is shared." />
            <Field
              name="body"
              label="Text"
              rows={20}
              defaultValue={p?.body}
              hint={<>Formatting: an empty line starts a new paragraph. <code>## Heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>- list item</code>, <code>[link text](https://…)</code>, <code>&gt; quote</code>.</>}
            />
          </div>
        </Card>
      </div>
      <div className="edit-grid__side">
        <Card title="Publishing">
          <div className="fields">
            <p className="muted">Status: <b>{p?.status === 'published' ? 'Published' : 'Draft'}</b></p>
            <Field name="published_at" label="Publication date" type="datetime-local" defaultValue={local(p?.publishedAt ?? null)} hint="Paris time. Leave empty to use the moment you publish." />
            {editable ? (
              <div className="btn-stack">
                <Submit className="btn btn--ghost" name="__intent" value="draft">{p?.status === 'published' ? 'Save changes' : 'Save draft'}</Submit>
                {p?.status === 'published' ? (
                  <Submit className="btn btn--ghost" name="__intent" value="unpublish">Unpublish</Submit>
                ) : (
                  <Submit className="btn btn--primary" name="__intent" value="publish">Publish</Submit>
                )}
              </div>
            ) : null}
          </div>
        </Card>
        <Card title="Featured image"><MediaPicker name="image_id" label="Image" initial={image} folder="news" hint="Shown on the News page and at the top of the article." /></Card>
        <Card title="Categories and tags">
          <div className="fields">
            <Field name="category" label="Category" defaultValue={p?.category} maxLength={60} placeholder="Announcements" />
            {categories.length ? <p className="f-hint">In use: {categories.join(', ')}</p> : null}
            <Field name="tags" label="Tags" defaultValue={p?.tags.join(', ')} hint="Separate tags with commas." />
          </div>
        </Card>
      </div>
    </ActionForm>
  );
}
