'use server';
import { db } from '@/lib/server/db';
import { requireAction } from '@/lib/server/auth';
import { readSettings } from '@/lib/server/repo';
import { logActivity } from '@/lib/server/activity';
import { done, guard, lines, paras, refreshPublicSite, str, UserError, type ActionState } from '@/lib/server/actions';
import { parseIds } from '@/lib/server/media';
import { TABS, setPath, type FieldDef, type SubField } from '@/lib/content-schema';

const URL_RE = /^(https?:\/\/|mailto:|tel:|\/|#)/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkText(v: string, f: { label: string; max?: number; kind?: 'url' | 'email'; required?: boolean }, errors: string[], where = '') {
  const name = where + f.label;
  if (f.required && !v) errors.push(`${name}: required`);
  if (f.max && v.length > f.max) errors.push(`${name}: at most ${f.max} characters (now ${v.length})`);
  if (v && f.kind === 'url' && !URL_RE.test(v)) errors.push(`${name}: use a full web address (https://…) or a page path starting with /`);
  if (v && f.kind === 'email' && !EMAIL_RE.test(v)) errors.push(`${name}: enter a valid email address`);
}

// Reads one field from the submitted form, checking it against its definition
function readField(f: FieldDef, fd: FormData, errors: string[]): unknown {
  const raw = str(fd, f.path);
  switch (f.type) {
    case 'text':
    case 'textarea':
      checkText(raw, f, errors);
      return raw;
    case 'lines':
    case 'paras': {
      const items = f.type === 'lines' ? lines(raw) : paras(raw);
      if (f.maxItems && items.length > f.maxItems) errors.push(`${f.label}: at most ${f.maxItems}`);
      if (items.some((x) => x.length > 2000)) errors.push(`${f.label}: an item is too long`);
      return items;
    }
    case 'number': {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < f.min || n > f.max) errors.push(`${f.label}: a whole number from ${f.min} to ${f.max}`);
      return n;
    }
    case 'bool':
      return fd.get(f.path) === 'on';
    case 'select':
      if (!f.options.some(([v]) => v === raw)) errors.push(`${f.label}: choose an option`);
      return raw;
    case 'image':
      return parseIds(raw)[0] || '';
    case 'images': {
      const ids = parseIds(raw);
      if (f.maxItems && ids.length > f.maxItems) errors.push(`${f.label}: at most ${f.maxItems} images`);
      return ids;
    }
    case 'group': {
      const count = Math.min(Number(str(fd, f.path + '.__count')) || 0, 50);
      const out: Record<string, string>[] = [];
      for (let i = 0; i < count; i++) {
        if (fd.get(`${f.path}.${i}.__remove`) === 'on') continue;
        const item: Record<string, string> = {};
        let any = false;
        for (const sf of f.fields as SubField[]) {
          const v = sf.type === 'image' ? parseIds(str(fd, `${f.path}.${i}.${sf.key}`))[0] || '' : str(fd, `${f.path}.${i}.${sf.key}`);
          item[sf.key] = v;
          if (v) any = true;
        }
        if (!any) continue; // empty rows are ignored
        for (const sf of f.fields as SubField[]) if (sf.type !== 'image') checkText(item[sf.key], sf, errors, `${f.label} #${out.length + 1}, `);
        out.push(item);
      }
      if (f.maxItems && out.length > f.maxItems) errors.push(`${f.label}: at most ${f.maxItems}`);
      return out;
    }
  }
}

// Saves a tab of the Website content editor as a draft (and publishes it if asked)
export async function saveContent(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('content');
    const tab = TABS.find((t) => t.id === str(fd, '__tab'));
    if (!tab) throw new UserError('Unknown section.');
    const draft = await readSettings('draft');
    const errors: string[] = [];
    for (const section of tab.sections) for (const f of section.fields) setPath(draft, f.path, readField(f, fd, errors));
    if (errors.length) return { ok: false, message: 'Nothing was saved. Please fix the following:', errors };
    const publish = str(fd, '__intent') === 'publish';
    await db()`insert into site_settings (key, draft, published, updated_by) values ('site', ${db().json(draft as never)}, ${db().json(draft as never)}, ${user.id})
               on conflict (key) do update set draft = excluded.draft, updated_at = now(), updated_by = ${user.id}
               ${publish ? db()`, published = excluded.draft, published_at = now()` : db()``}`;
    await logActivity(user, publish ? 'content.publish' : 'content.draft', `${publish ? 'Published' : 'Saved a draft of'} website content: ${tab.label}`, 'content', tab.id);
    if (publish) refreshPublicSite();
    return done(publish ? 'Saved and published. The website now shows these changes.' : 'Draft saved. Use Preview to check it, then Publish when ready.');
  });
}

export async function publishContent(_: ActionState): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('content');
    await db()`update site_settings set published = draft, published_at = now(), updated_by = ${user.id} where key = 'site'`;
    await logActivity(user, 'content.publish', 'Published all draft website content', 'content');
    refreshPublicSite();
    return done('Published. The website now shows the latest content.');
  });
}

export async function discardDraft(_: ActionState): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('content');
    await db()`update site_settings set draft = published, updated_at = now(), updated_by = ${user.id} where key = 'site'`;
    await logActivity(user, 'content.discard', 'Discarded unpublished website content changes', 'content');
    return done('Unpublished changes were discarded. The editor shows the live content again.');
  });
}
