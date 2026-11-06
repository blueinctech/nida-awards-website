'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type PickedMedia = { id: string; kind: 'image' | 'document'; title: string; alt: string; thumb: string; url: string; filename: string; width: number | null; height: number | null; size: number };

const MAX = 4 * 1024 * 1024;

// Resizes big photos in the browser before upload (longest side 2560px), so uploads stay under
// the 4 MB limit of the hosting platform. Smaller files are sent unchanged.
async function prepare(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const longest = Math.max(bmp.width, bmp.height);
  if (longest <= 2560 && file.size <= 3.5 * 1024 * 1024) return file;
  const scale = Math.min(1, 2560 / longest);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  const type = file.type === 'image/png' ? 'image/webp' : 'image/jpeg'; // keeps transparency for PNG logos
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, type, 0.9));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, type === 'image/webp' ? '.webp' : '.jpg'), { type });
}

export async function uploadFile(file: File, opts: { folder?: string; replace?: string; kind?: 'image' | 'any' } = {}): Promise<PickedMedia> {
  const f = await prepare(file);
  if (f.size > MAX) throw new Error(`${file.name} is larger than 4 MB. Please use a smaller file.`);
  const fd = new FormData();
  fd.append('file', f, f.name);
  if (opts.folder) fd.append('folder', opts.folder);
  if (opts.replace) fd.append('replace', opts.replace);
  if (opts.kind) fd.append('kind', opts.kind);
  const res = await fetch('/api/admin/upload/', { method: 'POST', body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'The upload failed. Please try again.');
  return json.media as PickedMedia;
}

// Drag-and-drop / browse uploader used by the media library
export function Uploader({ folder, onUploaded, accept = 'image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xlsx,.pptx', kind = 'any', label = 'Upload files' }: { folder?: string; onUploaded?: (m: PickedMedia) => void; accept?: string; kind?: 'image' | 'any'; label?: string }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const handle = async (files: FileList | File[]) => {
    setError('');
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      setBusy(`Uploading ${i + 1} of ${list.length}: ${list[i].name}`);
      try {
        const m = await uploadFile(list[i], { folder, kind });
        onUploaded?.(m);
      } catch (e) {
        setError((e as Error).message);
        break;
      }
    }
    setBusy('');
    if (input.current) input.current.value = '';
    router.refresh();
  };
  return (
    <div
      className={'dropzone' + (over ? ' is-over' : '')}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) handle(e.dataTransfer.files); }}
    >
      <p><b>{label}</b> Drag files here, or</p>
      <label className="btn btn--primary btn--sm">
        Choose files
        <input ref={input} type="file" multiple accept={accept} className="visually-hidden" onChange={(e) => e.target.files?.length && handle(e.target.files)} disabled={Boolean(busy)} />
      </label>
      <p className="f-hint">{kind === 'image' ? 'JPG, PNG or WebP' : 'Images (JPG, PNG, WebP) or documents (PDF, Word, Excel, PowerPoint)'}. Large photos are resized automatically; other files up to 4 MB.</p>
      {busy ? <p className="dropzone__status" role="status">{busy}…</p> : null}
      {error ? <p className="notice notice--error" role="alert">{error}</p> : null}
    </div>
  );
}

// Replace the file behind an existing media item: every page using it shows the new file
export function ReplaceButton({ id, kind }: { id: string; kind: 'image' | 'document' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  return (
    <div>
      <label className="btn btn--ghost">
        {busy ? 'Replacing…' : kind === 'image' ? 'Replace image' : 'Replace file'}
        <input
          type="file"
          className="visually-hidden"
          accept={kind === 'image' ? 'image/jpeg,image/png,image/webp' : '.pdf,.doc,.docx,.xlsx,.pptx'}
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setError('');
            try {
              await uploadFile(f, { replace: id, kind: kind === 'image' ? 'image' : 'any' });
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
            }
            setBusy(false);
            e.target.value = '';
          }}
        />
      </label>
      {error ? <p className="notice notice--error" role="alert">{error}</p> : null}
    </div>
  );
}

// Image field: a hidden input holding media id(s), with thumbnails and a library browser
export function MediaPicker({ name, initial, multiple = false, max, label, hint, folder }: { name: string; initial: PickedMedia[]; multiple?: boolean; max?: number; label: string; hint?: string; folder?: string }) {
  const [items, setItems] = useState<PickedMedia[]>(initial);
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PickedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const search = useCallback(async (query: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/media/?kind=image&q=${encodeURIComponent(query)}`);
    const json = await res.json().catch(() => ({ items: [] }));
    setResults(json.items || []);
    setLoading(false);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => dialog.current?.open && search(q), 250);
    return () => clearTimeout(t);
  }, [q, search]);
  const pick = (m: PickedMedia) => {
    setItems((cur) => (multiple ? (cur.some((x) => x.id === m.id) ? cur : [...cur, m].slice(0, max || 99)) : [m]));
    if (!multiple) dialog.current?.close();
  };
  const full = Boolean(max && items.length >= max);
  return (
    <div className="f">
      <span className="f-label">{label}</span>
      <input type="hidden" name={name} value={items.map((m) => m.id).join(',')} />
      <ul className={'picker' + (multiple ? ' picker--multi' : '')} role="list">
        {items.map((m, i) => (
          <li key={m.id} className="picker__item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.thumb} alt={m.alt || m.title} loading="lazy" />
            <span className="picker__name" title={m.title || m.filename}>{m.title || m.filename || m.id}</span>
            <span className="picker__tools">
              {multiple && i > 0 ? <button type="button" className="icon-btn" aria-label="Move earlier" onClick={() => setItems((c) => { const n = c.slice(); [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}>←</button> : null}
              <button type="button" className="icon-btn" aria-label={`Remove ${m.title || 'image'}`} onClick={() => setItems((c) => c.filter((x) => x.id !== m.id))}>×</button>
            </span>
          </li>
        ))}
        {!full ? (
          <li>
            <button type="button" className="picker__add" onClick={() => { dialog.current?.showModal(); search(q); }}>
              {items.length && !multiple ? 'Change image' : multiple ? '+ Add images' : '+ Choose image'}
            </button>
          </li>
        ) : null}
      </ul>
      {hint ? <p className="f-hint">{hint}</p> : null}
      <dialog ref={dialog} className="dialog dialog--wide" aria-label="Choose an image">
        <div className="dialog__head">
          <h2 className="dialog__title">Choose an image</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={() => dialog.current?.close()}>×</button>
        </div>
        <Uploader folder={folder} kind="image" accept="image/jpeg,image/png,image/webp" label="Upload a new image." onUploaded={(m) => { pick(m); search(q); }} />
        <input className="input" type="search" placeholder="Search the media library" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the media library" />
        {loading ? <p className="muted">Loading…</p> : null}
        <ul className="media-grid media-grid--pick" role="list">
          {results.map((m) => (
            <li key={m.id}>
              <button type="button" className={'media-tile' + (items.some((x) => x.id === m.id) ? ' is-picked' : '')} onClick={() => pick(m)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumb} alt="" loading="lazy" />
                <span>{m.title || m.filename || m.id}</span>
              </button>
            </li>
          ))}
        </ul>
        {multiple ? <div className="dialog__actions"><button type="button" className="btn btn--primary" onClick={() => dialog.current?.close()}>Done</button></div> : null}
      </dialog>
    </div>
  );
}
