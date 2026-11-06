import { getSite } from '@/lib/server/content';
import { Arrow } from './icons';

// Shown on the nomination page only while nominations are open (/admin → Website content → Nominations).
// Entries go to /api/nominations and appear in /admin/nominations. Submission is handled by main.js,
// which also shrinks large photos before sending.
const fieldset = { border: 0, padding: 0, margin: 0 };

export default async function NominationForm() {
  const { site } = await getSite();
  const n = site.nominations;
  return (
    <form className="form" style={{ marginTop: '2rem' }} action="/api/nominations/" method="post" encType="multipart/form-data" noValidate data-ajax-form="" data-max-bytes={4 * 1024 * 1024} data-success="Thank you. Your nomination has been received.">
      <p className="field__hint">Fields marked <span className="req">*</span> are required.</p>
      <fieldset className="form" style={fieldset}><legend className="form__legend">About you</legend>
        <div className="form__row">
          <div className="field"><label htmlFor="n-email">Email <span className="req">*</span></label><input id="n-email" name="email" type="email" required autoComplete="email" /><p className="field__error" data-error=""></p></div>
          <div className="field"><label htmlFor="n-name">Full name <span className="req">*</span></label><input id="n-name" name="full_name" required autoComplete="name" /><p className="field__error" data-error=""></p></div>
        </div>
        <div className="form__row">
          <div className="field"><label htmlFor="n-country">Your country of residence <span className="req">*</span></label><input id="n-country" name="country" required autoComplete="country-name" /><p className="field__error" data-error=""></p></div>
          <div className="field"><label htmlFor="n-wa">Your WhatsApp number</label><input id="n-wa" name="whatsapp" type="tel" autoComplete="tel" placeholder="+33…" /><p className="field__hint">With country code, e.g. +12345600</p></div>
        </div>
      </fieldset>
      <fieldset className="form" style={fieldset}><legend className="form__legend">The nominee</legend>
        <div className="field"><label htmlFor="n-cat">Award category <span className="req">*</span></label><select id="n-cat" name="category" required><option value="">Choose a category</option>{n.categories.map((c) => <option key={c}>{c}</option>)}</select><p className="field__error" data-error=""></p></div>
        <div className="form__row">
          <div className="field"><label htmlFor="n-nominee">Name of nominee <span className="req">*</span></label><input id="n-nominee" name="nominee_name" required /><p className="field__error" data-error=""></p></div>
          <div className="field"><label htmlFor="n-nemail">Email address of nominee <span className="req">*</span></label><input id="n-nemail" name="nominee_email" type="email" required /><p className="field__error" data-error=""></p></div>
        </div>
        <div className="form__row">
          <div className="field"><label htmlFor="n-nphone">Phone number of nominee <span className="req">*</span></label><input id="n-nphone" name="nominee_phone" type="tel" required placeholder="+33…" /><p className="field__error" data-error=""></p></div>
          <div className="field"><label htmlFor="n-ncountry">Country of residence of nominee <span className="req">*</span></label><input id="n-ncountry" name="nominee_country" required /><p className="field__error" data-error=""></p></div>
        </div>
        <div className="field"><label htmlFor="n-special">Tell us about your nominee and what is special about his/her work <span className="req">*</span></label><textarea id="n-special" name="about_nominee" required></textarea><p className="field__error" data-error=""></p></div>
        <div className="field"><label htmlFor="n-impact">Accomplishments and impact: how is his/her work making a difference? <span className="req">*</span></label><textarea id="n-impact" name="impact" required></textarea><p className="field__error" data-error=""></p></div>
        <div className="field"><label htmlFor="n-links">Links you want to share (articles, websites, LinkedIn, social media) <span className="req">*</span></label><textarea id="n-links" name="links" required style={{ minHeight: '100px' }}></textarea><p className="field__error" data-error=""></p></div>
      </fieldset>
      {n.acceptFiles ? (
        <fieldset className="form" style={fieldset}><legend className="form__legend">Supporting files (optional)</legend>
          <div className="form__row">
            <div className="field"><label htmlFor="n-photo">Photograph of the nominee</label><input id="n-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><p className="field__hint">JPG, PNG or WebP.</p><p className="field__error" data-error=""></p></div>
            <div className="field"><label htmlFor="n-docs">Documents (CV, press, letters of support)</label><input id="n-docs" name="documents" type="file" multiple accept=".pdf,.doc,.docx,application/pdf" /><p className="field__hint">PDF or Word, up to 3 files. All files together up to 4 MB.</p><p className="field__error" data-error=""></p></div>
          </div>
        </fieldset>
      ) : null}
      <div className="hp" aria-hidden="true"><label htmlFor="n-hp">Leave empty</label><input id="n-hp" name="_gotcha" tabIndex={-1} autoComplete="off" /></div>
      <p className="form-status" role="status" data-form-status=""></p>
      <p><button className="btn btn--dark" type="submit">Submit nomination <Arrow className="arrow" /></button></p>
    </form>
  );
}
