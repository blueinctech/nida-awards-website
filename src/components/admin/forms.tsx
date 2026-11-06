'use client';
import { createContext, useActionState, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

type State = { ok: boolean; message: string; errors?: string[]; data?: Record<string, string> } | null;
type Action = (state: State, fd: FormData) => Promise<State>;

// Lets Submit buttons show a busy state for ActionForm, which submits through a transition
const Busy = createContext(false);

// A form bound to a server action. Shows the result (saved / what to fix) above the fields,
// and keeps what was typed if something needs fixing.
export function ActionForm({ action, children, className, reset = false, id, onDone }: { action: Action; children: ReactNode; className?: string; reset?: boolean; id?: string; onDone?: (s: State) => void }) {
  const [state, formAction] = useActionState(action, null);
  const [busy, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!state) return;
    if (state.ok && reset) ref.current?.reset();
    if (state.ok) router.refresh();
    onDone?.(state);
    ref.current?.querySelector<HTMLElement>('[data-form-result]')?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    // Submitted through onSubmit rather than the form's action prop: React resets a form after an
    // action, which would wipe what was typed when the server asks for a correction.
    <form
      ref={ref}
      className={className}
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(fd));
      }}
    >
      <Busy.Provider value={busy}>
        <FormResult state={state} />
        {children}
      </Busy.Provider>
    </form>
  );
}

export function FormResult({ state }: { state: State }) {
  if (!state) return <div data-form-result="" tabIndex={-1} />;
  return (
    <div className={'notice ' + (state.ok ? 'notice--ok' : 'notice--error')} role={state.ok ? 'status' : 'alert'} data-form-result="" tabIndex={-1}>
      <p>{state.message}</p>
      {state.errors?.length ? <ul>{state.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
      {state.data?.link ? <CopyField label={state.data.linkLabel || 'Link'} value={state.data.link} /> : null}
    </div>
  );
}

export function Submit({ children, className = 'btn btn--primary', name, value, formAction, disabled }: { children: ReactNode; className?: string; name?: string; value?: string; formAction?: (fd: FormData) => void; disabled?: boolean }) {
  const status = useFormStatus();
  const busy = useContext(Busy);
  const pending = status.pending || busy;
  return (
    <button className={className} type="submit" name={name} value={value} formAction={formAction} disabled={pending || disabled} aria-busy={pending}>
      {children}
    </button>
  );
}

// A button that asks for confirmation in a dialog before submitting its own small form
export function ConfirmForm({ action, children, title, message, confirmLabel = 'Delete', className = 'btn btn--danger', hidden }: { action: Action; children: ReactNode; title: string; message: string; confirmLabel?: string; className?: string; hidden?: Record<string, string> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(action, null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      dialog.current?.close();
      router.refresh();
    }
  }, [state, router]);
  return (
    <>
      <button type="button" className={className} onClick={() => dialog.current?.showModal()}>{children}</button>
      <dialog ref={dialog} className="dialog" aria-labelledby="confirm-title">
        <form action={formAction}>
          {Object.entries(hidden || {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <h2 className="dialog__title">{title}</h2>
          <p>{message}</p>
          {state && !state.ok ? <p className="notice notice--error" role="alert">{state.message}</p> : null}
          <div className="dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={() => dialog.current?.close()}>Cancel</button>
            <Submit className="btn btn--danger">{confirmLabel}</Submit>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="copy-field">
      <label>
        <span>{label}</span>
        <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} />
      </label>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => setCopied(true), () => setCopied(false));
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

// Auto-fills a slug field from a title field until the slug is edited by hand
export function SlugField({ from, name = 'slug', defaultValue = '', prefix }: { from: string; name?: string; defaultValue?: string; prefix: string }) {
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(Boolean(defaultValue));
  useEffect(() => {
    if (touched) return;
    const el = document.querySelector<HTMLInputElement>(`[name="${from}"]`);
    if (!el) return;
    const on = () =>
      setValue(
        el.value
          .normalize('NFKD')
          .replace(/[̀-ͯ]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 80),
      );
    el.addEventListener('input', on);
    return () => el.removeEventListener('input', on);
  }, [from, touched]);
  return (
    <div className="f">
      <label htmlFor={`f-${name}`}>Web address</label>
      <div className="f-prefix">
        <span>{prefix}</span>
        <input id={`f-${name}`} name={name} value={value} required pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={(e) => { setTouched(true); setValue(e.target.value); }} />
      </div>
      <p className="f-hint">Lowercase letters, numbers and hyphens. Changing it later changes the page address.</p>
    </div>
  );
}
