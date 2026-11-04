import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { toMedia } from '@/lib/server/repo';
import { storageMode } from '@/lib/server/storage';
import { toPicked } from '@/lib/server/media';
import { can } from '@/lib/roles';
import { Uploader } from '@/components/admin/media';
import { Empty, PageHead, Pager, fmtSize } from '@/components/admin/ui';

export const metadata = { title: 'Media library' };
const PER = 60;

export default async function MediaAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const sp = await searchParams;
  const q = (sp.q || '').trim().slice(0, 100);
  const kind = sp.kind === 'image' || sp.kind === 'document' ? sp.kind : '';
  const folder = (sp.folder || '').slice(0, 40);
  const gallery = sp.gallery === '1';
  const page = Math.max(1, Number(sp.page) || 1);
  const sql = db();
  const like = '%' + q.replace(/[%_\\]/g, (c) => '\\' + c) + '%';
  const where = sql`where true ${q ? sql`and (title ilike ${like} or alt ilike ${like} or filename ilike ${like} or id ilike ${like} or array_to_string(tags, ' ') ilike ${like})` : sql``}
    ${kind ? sql`and kind = ${kind}` : sql``} ${folder ? sql`and folder = ${folder}` : sql``} ${gallery ? sql`and gallery` : sql``}`;
  const [rows, [{ n }], folders] = await Promise.all([
    sql`select * from media ${where} order by created_at desc, sort_order limit ${PER} offset ${(page - 1) * PER}`,
    sql`select count(*)::int as n from media ${where}`,
    sql`select folder, count(*)::int as n from media group by folder order by folder`,
  ]);
  const mode = storageMode();
  const qs = new URLSearchParams(Object.entries({ q, kind, folder, gallery: gallery ? '1' : '' }).filter(([, v]) => v)).toString();
  return (
    <>
      <PageHead title="Media library" description={`${n} file${n === 1 ? '' : 's'}. Images are stored in ${mode === 'blob' ? 'Vercel Blob' : mode === 'local' ? 'the server’s upload folder' : '— storage not set up'} in web-ready sizes.`} />
      {sp.deleted ? <p className="notice notice--ok" role="status">The file was deleted.</p> : null}
      {mode === 'none' ? <p className="notice notice--error">Uploads are not possible yet: add a Vercel Blob store to the project (see System &amp; backups).</p> : null}
      {can(user.role, 'media') && mode !== 'none' ? <Uploader folder={folder || 'general'} /> : null}
      <form className="toolbar" role="search">
        <input className="input" type="search" name="q" defaultValue={q} placeholder="Search by title, file name or tag" aria-label="Search media" />
        <select className="input" name="kind" defaultValue={kind} aria-label="Type"><option value="">Images and documents</option><option value="image">Images</option><option value="document">Documents</option></select>
        <select className="input" name="folder" defaultValue={folder} aria-label="Folder"><option value="">All folders</option>{folders.map((f) => <option key={f.folder} value={f.folder}>{f.folder} ({f.n})</option>)}</select>
        <label className="toolbar__check"><input type="checkbox" name="gallery" value="1" defaultChecked={gallery} /> In gallery</label>
        <button className="btn btn--ghost" type="submit">Filter</button>
      </form>
      {rows.length ? (
        <ul className="media-grid" role="list">
          {rows.map((r) => {
            const m = toMedia(r);
            const p = toPicked(m);
            return (
              <li key={m.id}>
                <a className="media-tile" href={`/admin/media/${encodeURIComponent(m.id)}/`}>
                  {m.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumb} alt="" loading="lazy" />
                  ) : <span className="media-tile__doc">{(m.filename.split('.').pop() || 'file').toUpperCase()}</span>}
                  <span>{m.title || m.filename || m.id}</span>
                  <small>{m.folder}{m.gallery ? ` · gallery ${m.galleryYear}` : ''}{m.size ? ` · ${fmtSize(m.size)}` : ''}</small>
                </a>
              </li>
            );
          })}
        </ul>
      ) : <Empty title="No files match">Upload files above, or change the filters.</Empty>}
      <Pager page={page} pages={Math.ceil(n / PER)} base={`/admin/media/${qs ? '?' + qs : ''}`} />
    </>
  );
}
