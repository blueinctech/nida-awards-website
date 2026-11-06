import { pickedByIds } from '@/lib/server/media';
import type { Edition } from '@/lib/types';
import { ActionForm, Submit } from '@/components/admin/forms';
import { MediaPicker } from '@/components/admin/media';
import { Card, Check, Field } from '@/components/admin/ui';
import { saveEvent } from '../../actions/records';

export async function EventForm({ e, editable }: { e?: Edition; editable: boolean }) {
  const [banner, photos] = await Promise.all([pickedByIds([e?.banner]), pickedByIds(e?.photos || [])]);
  const next = new Date().getFullYear() + 1;
  return (
    <ActionForm action={saveEvent} className="edit-grid">
      {e?.id ? <input type="hidden" name="id" value={e.id} /> : null}
      <div className="edit-grid__main">
        <Card title="Event">
          <div className="fields">
            <div className="f-row">
              <Field name="year" label="Edition year" type="number" defaultValue={e?.year ?? next} required min={2000} max={2100} hint="One event per year. Awardees of this year are listed with it." />
              <Field name="ordinal" label="Edition label" defaultValue={e?.ordinal} maxLength={60} placeholder="Fifth edition" />
            </div>
            <Field name="title" label="Title" defaultValue={e?.title ?? `NIDA ${next} Gala`} required maxLength={150} />
            <div className="f-row">
              <Field name="starts_on" label="Date" type="date" defaultValue={e?.startsOn || ''} hint="Decides whether the event is upcoming or past." />
              <Field name="date_label" label="Date as shown" defaultValue={e?.date} maxLength={80} hint="Leave empty to write it from the date, e.g. “Saturday 5 December 2027”." />
            </div>
            <div className="f-row">
              <Field name="venue" label="Venue" defaultValue={e?.venue} maxLength={200} />
              <Field name="city" label="Address or city" defaultValue={e?.city} maxLength={200} />
            </div>
            <Field name="theme" label="Theme" defaultValue={e?.theme} maxLength={200} />
            <Field name="summary" label="Description" rows={6} defaultValue={e?.summary} maxLength={4000} />
            <div className="f-row">
              <Field name="stat_value" label="Key figure" defaultValue={e?.stat?.value} maxLength={20} placeholder="200+" />
              <Field name="stat_label" label="Key figure description" defaultValue={e?.stat?.label} maxLength={120} placeholder="guests from across Europe" />
            </div>
            <Field name="pending" label="Note while honourees are not yet announced" rows={2} defaultValue={e?.pending} maxLength={500} />
            <Field name="ticket_url" label="Ticket or registration link" type="url" defaultValue={e?.ticketUrl} maxLength={500} hint="Shown as “Book tickets” on the Editions page while the event is upcoming." />
          </div>
        </Card>
        <Card title="Photographs">
          <MediaPicker name="photo_ids" label="Event photos" initial={photos} multiple max={30} folder="gallery" hint="The first three appear on the home page; up to six on the Editions page. Mark photos “Show in gallery” in the media library to add them to the Gallery page." />
        </Card>
      </div>
      <div className="edit-grid__side">
        <Card title="Publishing">
          <div className="fields">
            <Check name="published" label="Published on the website" defaultChecked={e ? e.published : true} />
            {editable ? <Submit>{e ? 'Save changes' : 'Add event'}</Submit> : null}
          </div>
        </Card>
        <Card title="Banner"><MediaPicker name="banner_id" label="Event banner" initial={banner} folder="banners" hint="Optional. A wide image for this event." /></Card>
      </div>
    </ActionForm>
  );
}
