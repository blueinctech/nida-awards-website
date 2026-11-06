import { pickedByIds } from '@/lib/server/media';
import type { Category } from '@/lib/types';
import { ActionForm, Submit } from '@/components/admin/forms';
import { MediaPicker } from '@/components/admin/media';
import { Card, Check, Field } from '@/components/admin/ui';
import { saveCategory } from '../../actions/records';

export async function CategoryForm({ c, editable }: { c?: Category; editable: boolean }) {
  const photo = await pickedByIds([c?.photo]);
  return (
    <ActionForm action={saveCategory} className="edit-grid">
      <input type="hidden" name="original_id" value={c?.id || ''} />
      <div className="edit-grid__main">
        <Card title="Category">
          <div className="fields">
            <Field name="name" label="Name" defaultValue={c?.name} required maxLength={120} />
            <Field name="id" label="Web address" defaultValue={c?.id} maxLength={80} hint="Used in links such as /awards/#business. Lowercase letters, numbers and hyphens. Leave empty to make one from the name." />
            <Field name="text" label="Description" rows={4} defaultValue={c?.text} maxLength={1500} />
            <Field name="awards" label="Awards in this category (one per line)" rows={6} defaultValue={c?.awards.join('\n')} />
          </div>
        </Card>
      </div>
      <div className="edit-grid__side">
        <Card title="Publishing">
          <div className="fields">
            <Check name="published" label="Shown on the website" defaultChecked={c ? c.published : true} />
            <Field name="sort_order" label="Order" type="number" defaultValue={c?.sortOrder ?? 0} />
            {editable ? <Submit>{c ? 'Save changes' : 'Add category'}</Submit> : null}
          </div>
        </Card>
        <Card title="Photo"><MediaPicker name="photo_id" label="Photo on the Awards page" initial={photo} folder="gallery" /></Card>
      </div>
    </ActionForm>
  );
}
