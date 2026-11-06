import { requirePage } from '@/lib/server/auth';
import { readSettings, settingsMeta } from '@/lib/server/repo';
import { pickedByIds, type Picked } from '@/lib/server/media';
import { can } from '@/lib/roles';
import { TABS, getPath, type FieldDef } from '@/lib/content-schema';
import { ActionForm, ConfirmForm, Submit } from '@/components/admin/forms';
import { MediaPicker } from '@/components/admin/media';
import { Card, PageHead, fmtDateTime } from '@/components/admin/ui';
import { discardDraft, publishContent, saveContent } from '../../actions/content';

export const metadata = { title: 'Website content' };

function imageIds(fields: FieldDef[], data: unknown): string[] {
  const ids: string[] = [];
  for (const f of fields) {
    const v = getPath(data, f.path);
    if (f.type === 'image' && v) ids.push(v);
    if (f.type === 'images' && Array.isArray(v)) ids.push(...v);
    if (f.type === 'group' && Array.isArray(v)) for (const sf of f.fields) if (sf.type === 'image') for (const it of v) if (it?.[sf.key]) ids.push(it[sf.key]);
  }
  return ids;
}

function Input({ f, value, media, readOnly }: { f: FieldDef; value: unknown; media: Map<string, Picked>; readOnly: boolean }) {
  const id = 'f-' + f.path.replace(/\./g, '-');
  const hint = f.hint ? <p className="f-hint">{f.hint}</p> : null;
  const label = <label htmlFor={id}>{f.label}{f.required ? <span className="req" aria-hidden="true"> *</span> : null}</label>;
  switch (f.type) {
    case 'text':
      return <div className="f">{label}<input id={id} name={f.path} defaultValue={String(value ?? '')} maxLength={f.max} required={f.required} type={f.kind === 'email' ? 'email' : 'text'} readOnly={readOnly} />{hint}</div>;
    case 'textarea':
      return <div className="f">{label}<textarea id={id} name={f.path} defaultValue={String(value ?? '')} rows={f.rows || 3} maxLength={f.max} required={f.required} readOnly={readOnly} />{hint}</div>;
    case 'lines':
      return <div className="f">{label}<textarea id={id} name={f.path} defaultValue={((value as string[]) || []).join('\n')} rows={f.rows || 5} readOnly={readOnly} />{hint}</div>;
    case 'paras':
      return <div className="f">{label}<textarea id={id} name={f.path} defaultValue={((value as string[]) || []).join('\n\n')} rows={f.rows || 6} readOnly={readOnly} />{hint}</div>;
    case 'number':
      return <div className="f f--short">{label}<input id={id} name={f.path} type="number" defaultValue={Number(value)} min={f.min} max={f.max} readOnly={readOnly} />{hint}</div>;
    case 'bool':
      return <div className="f f--check"><label><input type="checkbox" name={f.path} defaultChecked={Boolean(value)} disabled={readOnly} /> <span>{f.label}</span></label>{hint}</div>;
    case 'select':
      return <div className="f">{label}<select id={id} name={f.path} defaultValue={String(value)} disabled={readOnly}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>{hint}</div>;
    case 'image': {
      const m = value ? media.get(String(value)) : undefined;
      return <MediaPicker name={f.path} label={f.label} hint={f.hint} initial={m ? [m] : []} folder="banners" />;
    }
    case 'images': {
      const items = ((value as string[]) || []).map((x) => media.get(x)).filter((x): x is Picked => Boolean(x));
      return <MediaPicker name={f.path} label={f.label} hint={f.hint} initial={items} multiple max={f.maxItems} folder="gallery" />;
    }
    case 'group': {
      const items = ((value as Record<string, string>[]) || []).concat([{}]); // one empty row to add a new item
      return (
        <fieldset className="group">
          <legend>{f.label}</legend>
          {hint}
          <input type="hidden" name={`${f.path}.__count`} value={items.length} />
          {items.map((it, i) => (
            <div className="group__row" key={i}>
              <p className="group__label">{i < items.length - 1 ? `${f.itemLabel} ${i + 1}` : `Add a ${f.itemLabel.toLowerCase()}`}</p>
              <div className="group__fields">
                {f.fields.map((sf) => {
                  const n = `${f.path}.${i}.${sf.key}`;
                  if (sf.type === 'image') {
                    const m = it[sf.key] ? media.get(it[sf.key]) : undefined;
                    return <MediaPicker key={sf.key} name={n} label={sf.label} initial={m ? [m] : []} folder="logos" />;
                  }
                  return (
                    <div className="f" key={sf.key}>
                      <label htmlFor={'f-' + n.replace(/\./g, '-')}>{sf.label}</label>
                      {sf.type === 'textarea' ? (
                        <textarea id={'f-' + n.replace(/\./g, '-')} name={n} defaultValue={it[sf.key] || ''} rows={2} maxLength={sf.max} readOnly={readOnly} />
                      ) : (
                        <input id={'f-' + n.replace(/\./g, '-')} name={n} defaultValue={it[sf.key] || ''} maxLength={sf.max} readOnly={readOnly} />
                      )}
                    </div>
                  );
                })}
              </div>
              {i < items.length - 1 && !readOnly ? <label className="group__remove"><input type="checkbox" name={`${f.path}.${i}.__remove`} /> Remove</label> : null}
            </div>
          ))}
        </fieldset>
      );
    }
  }
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const editable = can(user.role, 'content');
  const tabId = (await searchParams).tab || 'home';
  const tab = TABS.find((t) => t.id === tabId) || TABS[0];
  const [draft, meta] = await Promise.all([readSettings('draft'), settingsMeta()]);
  const fields = tab.sections.flatMap((s) => s.fields);
  const media = new Map((await pickedByIds(imageIds(fields, draft))).map((m) => [m.id, m]));
  const preview = tab.sections.find((s) => s.preview)?.preview || '/';
  return (
    <>
      <PageHead
        title="Website content"
        description="Edit the texts, images and contact details of the public website. Save a draft, preview it, then publish."
        actions={<a className="btn btn--ghost" href={`/api/admin/preview/?path=${encodeURIComponent(preview)}`} target="_blank" rel="noopener">Preview draft ↗</a>}
      />
      <div className={'publish-bar' + (meta?.inSync ? '' : ' publish-bar--pending')}>
        <p>
          {meta?.inSync ? <><b>Everything is published.</b> Last published {fmtDateTime(meta?.publishedAt)}.</> : <><b>There are unpublished changes.</b> Visitors still see the version published {fmtDateTime(meta?.publishedAt)}.</>}
        </p>
        {!meta?.inSync && editable ? (
          <div className="publish-bar__actions">
            <ConfirmForm action={discardDraft} title="Discard unpublished changes?" message="The editor goes back to what the website shows now. Drafts in every section are lost." confirmLabel="Discard changes" className="btn btn--ghost btn--sm">Discard changes</ConfirmForm>
            <ActionForm action={publishContent}><Submit className="btn btn--primary btn--sm">Publish all changes</Submit></ActionForm>
          </div>
        ) : null}
      </div>
      <nav className="tabs" aria-label="Content sections">
        {TABS.map((t) => <a key={t.id} href={`/admin/content/?tab=${t.id}`} aria-current={t.id === tab.id ? 'page' : undefined}>{t.label}</a>)}
      </nav>
      <ActionForm action={saveContent} className="content-form" key={tab.id}>
        <input type="hidden" name="__tab" value={tab.id} />
        {tab.sections.map((s) => (
          <Card key={s.title} title={s.title} actions={s.preview ? <a className="link" href={`/api/admin/preview/?path=${encodeURIComponent(s.preview)}`} target="_blank" rel="noopener">Preview ↗</a> : null}>
            {s.description ? <p className="card__desc">{s.description}</p> : null}
            <div className="fields">
              {s.fields.map((f) => <Input key={f.path} f={f} value={getPath(draft, f.path)} media={media} readOnly={!editable} />)}
            </div>
          </Card>
        ))}
        {editable ? (
          <div className="sticky-actions">
            <Submit className="btn btn--ghost" name="__intent" value="draft">Save draft</Submit>
            <Submit className="btn btn--primary" name="__intent" value="publish">Save and publish</Submit>
          </div>
        ) : <p className="notice">Your role can view the content but not change it.</p>}
      </ActionForm>
    </>
  );
}
