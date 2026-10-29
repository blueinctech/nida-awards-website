import { site } from '@/lib/data';
import { Arrow } from './icons';

// "Save the date" mailing-list form. Behaviour depends on site.newsletter (see src/data/site.ts);
// submission is handled by public/assets/js/main.js.
export default function NewsletterForm({ id = 'nl', theme = 'light', button = 'Keep me informed' }: { id?: string; theme?: 'light' | 'dark'; button?: string }) {
  const n = site.newsletter;
  const mode = n.provider && n.endpoint ? n.provider : 'mailto';
  const action = mode === 'mailto' ? {} : { action: n.endpoint, method: 'post' };
  return (
    <form className={`nl-form nl-form--${theme}`} {...action} noValidate data-newsletter={mode} data-to={n.email} data-edition={n.edition}>
      <div className="nl-form__row">
        <div className="nl-form__field">
          <label htmlFor={`${id}-email`}>Email address</label>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" inputMode="email" placeholder="name@example.com" aria-describedby={`${id}-note ${id}-err`} />
        </div>
        <button className={`btn ${theme === 'light' ? 'btn--dark' : ''}`} type="submit">{button} <Arrow className="arrow" /></button>
      </div>
      <p className="nl-form__error" id={`${id}-err`} data-error="" aria-live="assertive"></p>
      <div className="hp" aria-hidden="true"><label htmlFor={`${id}-hp`}>Leave empty</label><input id={`${id}-hp`} name="_gotcha" tabIndex={-1} autoComplete="off" /></div>
      <p className="nl-form__note" id={`${id}-note`}>
        {mode === 'mailto' ? (
          <>Subscribing opens your email app with a ready-made request to <a className="text-link" href={`mailto:${n.email}`}>{n.email}</a>. Send it and NIDA will add you to the mailing list.</>
        ) : (
          <>We will only use your email to send news about NIDA from {site.organizer.name}. You can unsubscribe at any time.</>
        )}
      </p>
      <p className="form-status nl-form__status" role="status" data-form-status=""></p>
    </form>
  );
}
