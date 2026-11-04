import { randomBytes } from 'node:crypto';
import { db } from '@/lib/server/db';
import { readSettings } from '@/lib/server/repo';
import { checkFile, MAX_UPLOAD_BYTES } from '@/lib/server/files';
import { putFile, randomName } from '@/lib/server/storage';
import { field, isEmail, precheck, reply } from '@/lib/server/public-forms';
import { sendEmail, siteOrigin } from '@/lib/server/email';

export const runtime = 'nodejs';
export const maxDuration = 60;

// The public nomination form (/nomination/) posts here. Entries appear in /admin/nominations.
export async function POST(req: Request) {
  const { stop, fd, ip } = await precheck(req, 'nomination', 8, 60 * 60);
  if (stop) return stop;
  const f = fd!;
  const settings = await readSettings('published');
  const n = settings.nominations;
  if (!n.open) return reply(req, false, 'Nominations are closed at the moment.', 403);

  const v = {
    email: field(f, 'email', 200).toLowerCase(),
    full_name: field(f, 'full_name', 200),
    country: field(f, 'country', 100),
    whatsapp: field(f, 'whatsapp', 40),
    category: field(f, 'category', 200),
    nominee_name: field(f, 'nominee_name', 200),
    nominee_email: field(f, 'nominee_email', 200).toLowerCase(),
    nominee_phone: field(f, 'nominee_phone', 40),
    nominee_country: field(f, 'nominee_country', 100),
    about_nominee: field(f, 'about_nominee', 8000),
    impact: field(f, 'impact', 8000),
    links: field(f, 'links', 4000),
  };
  const missing = Object.entries(v).filter(([k, val]) => k !== 'whatsapp' && !val);
  if (missing.length) return reply(req, false, 'Please fill in every required field.');
  if (!isEmail(v.email) || !isEmail(v.nominee_email)) return reply(req, false, 'Please check the email addresses.');
  if (!n.categories.includes(v.category)) return reply(req, false, 'Please choose one of the award categories.');
  if (!/^[+\d][\d\s().-]{5,}$/.test(v.nominee_phone)) return reply(req, false, 'Please check the nominee’s phone number.');

  // Optional files, checked by their content
  const files: { kind: 'photo' | 'document'; file: File }[] = [];
  if (n.acceptFiles) {
    for (const x of f.getAll('photo')) if (x instanceof File && x.size) files.push({ kind: 'photo', file: x });
    for (const x of f.getAll('documents')) if (x instanceof File && x.size) files.push({ kind: 'document', file: x });
  }
  if (files.filter((x) => x.kind === 'photo').length > 1 || files.filter((x) => x.kind === 'document').length > 3) return reply(req, false, 'Please attach one photo and at most 3 documents.');
  if (files.reduce((t, x) => t + x.file.size, 0) > MAX_UPLOAD_BYTES) return reply(req, false, 'The attached files are too large. Please keep them under 4 MB in total.', 413);
  const stored: { kind: string; filename: string; mime: string; size: number; storage: string; key: string }[] = [];
  for (const x of files) {
    const buf = Buffer.from(await x.file.arrayBuffer());
    let checked;
    try {
      checked = await checkFile(buf, x.file.name, x.kind === 'photo' ? ['image'] : ['document']);
    } catch (e) {
      return reply(req, false, `${x.file.name}: ${(e as Error).message}`);
    }
    const ext = checked.kind === 'image' ? (checked.format === 'jpeg' ? 'jpg' : checked.format) : checked.ext;
    const mime = checked.kind === 'image' ? `image/${checked.format}` : checked.mime;
    const saved = await putFile(`private/nominations/${new Date().getFullYear()}/${randomName(ext)}`, buf, mime);
    stored.push({ kind: x.kind, filename: x.file.name.replace(/[^\w .()-]/g, '_').slice(0, 150) || 'file.' + ext, mime, size: buf.length, storage: saved.storage, key: saved.key });
  }

  const reference = `NIDA-${n.edition}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const ua = (req.headers.get('user-agent') || '').slice(0, 300);
  await db().begin(async (tx) => {
    const [row] = await tx`insert into nominations (reference, edition, category, nominator_email, nominator_name, nominator_country, nominator_whatsapp,
        nominee_name, nominee_email, nominee_phone, nominee_country, about_nominee, impact, links, ip_hash, user_agent)
      values (${reference}, ${n.edition}, ${v.category}, ${v.email}, ${v.full_name}, ${v.country}, ${v.whatsapp}, ${v.nominee_name}, ${v.nominee_email},
              ${v.nominee_phone}, ${v.nominee_country}, ${v.about_nominee}, ${v.impact}, ${v.links}, ${ip!}, ${ua}) returning id`;
    for (const s of stored) {
      await tx`insert into nomination_files (nomination_id, kind, filename, mime, size, storage, storage_key) values (${row.id}, ${s.kind}, ${s.filename}, ${s.mime}, ${s.size}, ${s.storage}, ${s.key})`;
    }
  });
  if (settings.notifyEmail) {
    await sendEmail(settings.notifyEmail, `New NIDA nomination: ${v.nominee_name} (${v.category})`, `A new nomination was submitted on the website.\n\nReference: ${reference}\nNominee: ${v.nominee_name}\nCategory: ${v.category}\nNominated by: ${v.full_name} <${v.email}>\n\nRead it in the admin: ${await siteOrigin()}/admin/nominations/\n`);
  }
  return reply(req, true, `Thank you. Your nomination has been received. Your reference is ${reference}.`);
}
