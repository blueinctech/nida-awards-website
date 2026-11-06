// Small building blocks for admin pages (server components)
import type { ReactNode } from 'react';

export function PageHead({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="adm-head">
      <div>
        {back ? <a className="adm-head__back" href={back.href}>← {back.label}</a> : null}
        <h1>{title}</h1>
        {description ? <p className="adm-head__desc">{description}</p> : null}
      </div>
      {actions ? <div className="adm-head__actions">{actions}</div> : null}
    </header>
  );
}

const BADGE: Record<string, string> = {
  pending: 'gold', under_review: 'blue', approved: 'green', rejected: 'red',
  new: 'gold', read: 'grey', replied: 'green', archived: 'grey',
  published: 'green', draft: 'grey', unpublished: 'grey',
  active: 'green', invited: 'gold', deactivated: 'red',
  upcoming: 'gold', past: 'grey',
};
export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', under_review: 'Under review', approved: 'Approved', rejected: 'Rejected',
  new: 'New', read: 'Read', replied: 'Replied', archived: 'Archived',
  published: 'Published', draft: 'Draft', unpublished: 'Unpublished',
  active: 'Active', invited: 'Invited', deactivated: 'Deactivated', upcoming: 'Upcoming', past: 'Past',
};

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return <span className={`badge badge--${BADGE[status] || 'grey'}`}>{children ?? STATUS_LABEL[status] ?? status}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {children ? <div className="empty__body">{children}</div> : null}
    </div>
  );
}

export function Card({ title, children, actions, className = '' }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={'card ' + className}>
      {title || actions ? (
        <div className="card__head">
          {title ? <h2 className="card__title">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => base + (base.includes('?') ? '&' : '?') + 'page=' + p;
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 ? <a className="btn btn--ghost btn--sm" href={href(page - 1)}>← Previous</a> : <span />}
      <span>Page {page} of {pages}</span>
      {page < pages ? <a className="btn btn--ghost btn--sm" href={href(page + 1)}>Next →</a> : <span />}
    </nav>
  );
}

// Text input / textarea with label and hint
export function Field({ name, label, defaultValue, hint, type = 'text', required, rows, maxLength, placeholder, min, max, readOnly }: {
  name: string; label: string; defaultValue?: string | number | null; hint?: ReactNode; type?: string; required?: boolean; rows?: number; maxLength?: number; placeholder?: string; min?: number; max?: number; readOnly?: boolean;
}) {
  const id = 'f-' + name.replace(/[^\w-]/g, '-');
  return (
    <div className="f">
      <label htmlFor={id}>{label}{required ? <span className="req" aria-hidden="true"> *</span> : null}</label>
      {rows ? (
        <textarea id={id} name={name} defaultValue={defaultValue ?? ''} rows={rows} required={required} maxLength={maxLength} placeholder={placeholder} readOnly={readOnly} />
      ) : (
        <input id={id} name={name} type={type} defaultValue={defaultValue ?? ''} required={required} maxLength={maxLength} placeholder={placeholder} min={min} max={max} readOnly={readOnly} />
      )}
      {hint ? <p className="f-hint">{hint}</p> : null}
    </div>
  );
}

export function Check({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: ReactNode }) {
  return (
    <div className="f f--check">
      <label><input type="checkbox" name={name} defaultChecked={defaultChecked} /> <span>{label}</span></label>
      {hint ? <p className="f-hint">{hint}</p> : null}
    </div>
  );
}

export function Select({ name, label, options, defaultValue, hint, required }: { name: string; label: string; options: [string, string][]; defaultValue?: string; hint?: ReactNode; required?: boolean }) {
  const id = 'f-' + name.replace(/[^\w-]/g, '-');
  return (
    <div className="f">
      <label htmlFor={id}>{label}{required ? <span className="req" aria-hidden="true"> *</span> : null}</label>
      <select id={id} name={name} defaultValue={defaultValue} required={required}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {hint ? <p className="f-hint">{hint}</p> : null}
    </div>
  );
}

export const fmtDateTime = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }) : '—';
export const fmtDay = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Paris' }) : '—';
export const fmtSize = (n: number) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
