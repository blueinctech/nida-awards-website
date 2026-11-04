import { db } from '@/lib/server/db';
import { pickedByIds } from '@/lib/server/media';
import type { Awardee } from '@/lib/types';
import { ActionForm, SlugField, Submit } from '@/components/admin/forms';
import { MediaPicker } from '@/components/admin/media';
import { Card, Check, Field, Select } from '@/components/admin/ui';
import { saveAwardee } from '../../actions/records';

export async function AwardeeForm({ a, editable }: { a?: Awardee; editable: boolean }) {
  const cats = await db()`select id, name from award_categories order by sort_order`;
  const photo = await pickedByIds([a?.photoId]);
  return (
    <ActionForm action={saveAwardee} className="edit-grid">
      {a?.id ? <input type="hidden" name="id" value={a.id} /> : null}
      <div className="edit-grid__main">
        <Card title="Profile">
          <div className="fields">
            <Field name="name" label="Full name (or organisation)" defaultValue={a?.name} required maxLength={150} />
            <SlugField from="name" defaultValue={a?.slug} prefix="/awardees/" />
            <div className="f-row">
              <Field name="year" label="NIDA edition (year)" type="number" defaultValue={a?.year ?? new Date().getFullYear()} required min={2000} max={2100} />
              <Field name="country" label="Country of residence" defaultValue={a?.country} maxLength={100} />
            </div>
            <Field name="award" label="Award" defaultValue={a?.award} required maxLength={200} hint="As shown on the website, for example “Titan Professional of the Year”." />
            <Select name="category_id" label="Award category" defaultValue={a?.group || 'other'} options={[...cats.map((c) => [c.id, c.name] as [string, string]), ['other', 'Other honours']]} />
            <Field name="bio" label="Biography" rows={12} defaultValue={a?.bio.join('\n\n')} hint="Leave an empty line between paragraphs. The first paragraph is shown larger and on the home page." />
            <Field name="achievements" label="Achievements (one per line)" rows={5} defaultValue={a?.achievements.join('\n')} hint="Optional. Shown as a list under the biography." />
            <Field name="note" label="Editorial note" rows={2} defaultValue={a?.note} maxLength={1000} hint="Optional, shown in small print under the biography." />
          </div>
        </Card>
      </div>
      <div className="edit-grid__side">
        <Card title="Publishing">
          <div className="fields">
            <Check name="published" label="Published on the website" defaultChecked={a ? a.published : true} />
            <Field name="sort_order" label="Order" type="number" defaultValue={a?.sortOrder ?? ''} hint="Lower numbers come first within the archive. Leave empty to add at the top." />
            {editable ? <Submit>{a ? 'Save changes' : 'Add awardee'}</Submit> : null}
          </div>
        </Card>
        <Card title="Photograph">
          <MediaPicker name="photo_id" label="Portrait" initial={photo} folder="awardees" hint="A portrait photo works best (at least 600 × 760 pixels). It is cropped automatically for the cards, the profile page and share images." />
          <Check name="is_organisation" label="This is an organisation (show the image as a logo)" defaultChecked={a?.isOrg} />
        </Card>
        {a ? <Card title="Original listing"><Field name="listed_as" label="Award as first listed" defaultValue={a?.listedAs} maxLength={200} hint="For records only; not shown on the website." /></Card> : null}
      </div>
    </ActionForm>
  );
}
