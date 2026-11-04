'use server';
// Awardees, award categories, events and articles
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { requireAction } from '@/lib/server/auth';
import { logActivity } from '@/lib/server/activity';
import { ensurePortrait, parseIds } from '@/lib/server/media';
import { bool, done, guard, lines, list, paras, refreshPublicSite, slugify, str, UserError, zSlug, zUrl, type ActionState } from '@/lib/server/actions';

// "2026-11-04T18:30" typed in Paris time -> the exact moment
function parisTime(local: string) {
  const asUtc = new Date(local + ':00Z');
  const paris = new Date(asUtc.toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }).replace(' ', 'T') + 'Z');
  return new Date(asUtc.getTime() - (paris.getTime() - asUtc.getTime()));
}

const year = z.coerce.number().int().min(2000, 'Use a year from 2000').max(2100, 'Use a year before 2100');
const id = (fd: FormData) => {
  const v = str(fd, 'id');
  return /^[0-9a-f-]{36}$/.test(v) ? v : null;
};

// ---------------- Awardees ----------------
const zAwardee = z.object({
  name: z.string().min(2, 'Required').max(150),
  slug: zSlug,
  year,
  award: z.string().min(2, 'Required').max(200),
  category_id: z.string().max(80),
  listed_as: z.string().max(200),
  country: z.string().max(100),
  bio: z.array(z.string().max(5000)).max(20),
  achievements: z.array(z.string().max(500)).max(30),
  note: z.string().max(1000),
  photo_id: z.string().nullable(),
  is_organisation: z.boolean(),
  published: z.boolean(),
  sort_order: z.coerce.number().int().min(-10000).max(100000),
});

export async function saveAwardee(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('content');
    const awardeeId = id(fd);
    const v = zAwardee.parse({
      name: str(fd, 'name'),
      slug: str(fd, 'slug') || slugify(str(fd, 'name')),
      year: str(fd, 'year'),
      award: str(fd, 'award'),
      category_id: str(fd, 'category_id') || 'other',
      listed_as: str(fd, 'listed_as'),
      country: str(fd, 'country'),
      bio: paras(str(fd, 'bio')),
      achievements: lines(str(fd, 'achievements')),
      note: str(fd, 'note'),
      photo_id: parseIds(str(fd, 'photo_id'))[0] || null,
      is_organisation: bool(fd, 'is_organisation'),
      published: bool(fd, 'published'),
      sort_order: str(fd, 'sort_order') || '0',
    });
    await ensurePortrait(v.photo_id); // portrait crops, face crops and a share image for the profile page
    const sql = db();
    let rowId = awardeeId;
    if (awardeeId) {
      await sql`update awardees set name = ${v.name}, slug = ${v.slug}, year = ${v.year}, award = ${v.award}, category_id = ${v.category_id}, listed_as = ${v.listed_as || null},
        country = ${v.country}, bio = ${v.bio}, achievements = ${v.achievements}, note = ${v.note || null}, photo_id = ${v.photo_id}, is_organisation = ${v.is_organisation},
        published = ${v.published}, sort_order = ${v.sort_order}, updated_at = now() where id = ${awardeeId}`;
    } else {
      const [r] = await sql`insert into awardees (name, slug, year, award, category_id, listed_as, country, bio, achievements, note, photo_id, is_organisation, published, sort_order)
        values (${v.name}, ${v.slug}, ${v.year}, ${v.award}, ${v.category_id}, ${v.listed_as || null}, ${v.country}, ${v.bio}, ${v.achievements}, ${v.note || null}, ${v.photo_id}, ${v.is_organisation}, ${v.published},
                ${str(fd, 'sort_order') ? v.sort_order : sql`(select coalesce(min(sort_order), 0) - 1 from awardees)`}) returning id`;
      rowId = r.id;
    }
    await logActivity(user, awardeeId ? 'awardee.update' : 'awardee.create', `${awardeeId ? 'Updated' : 'Added'} awardee ${v.name}${v.published ? '' : ' (unpublished)'}`, 'awardee', rowId!);
    refreshPublicSite();
    if (!awardeeId) redirect(`/admin/awardees/${rowId}/?created=1`);
    return done(v.published ? 'Saved. The profile is live on the website.' : 'Saved. The profile is unpublished, so visitors do not see it.');
  });
}

export async function setAwardeePublished(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('content');
    const published = str(fd, 'published') === '1';
    const [r] = await db()`update awardees set published = ${published}, updated_at = now() where id = ${id(fd)} returning name`;
    if (!r) throw new UserError('That awardee no longer exists.');
    await logActivity(user, published ? 'awardee.publish' : 'awardee.unpublish', `${published ? 'Published' : 'Unpublished'} awardee ${r.name}`, 'awardee', id(fd)!);
    refreshPublicSite();
    return done(published ? `${r.name} is published.` : `${r.name} is unpublished.`);
  });
}

export async function deleteAwardee(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('delete');
    const [r] = await db()`delete from awardees where id = ${id(fd)} returning name`;
    if (!r) throw new UserError('That awardee no longer exists.');
    await logActivity(user, 'awardee.delete', `Deleted awardee ${r.name}`, 'awardee');
    refreshPublicSite();
    redirect('/admin/awardees/?deleted=1');
  });
}

// ---------------- Award categories ----------------
export async function saveCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('content');
    const original = str(fd, 'original_id');
    const v = z
      .object({ id: zSlug.refine((x) => x !== 'other', 'This address is reserved'), name: z.string().min(2, 'Required').max(120), text: z.string().max(1500), awards: z.array(z.string().max(200)).max(30), photo_id: z.string().nullable(), sort_order: z.coerce.number().int(), published: z.boolean() })
      .parse({ id: str(fd, 'id') || slugify(str(fd, 'name')), name: str(fd, 'name'), text: str(fd, 'text'), awards: lines(str(fd, 'awards')), photo_id: parseIds(str(fd, 'photo_id'))[0] || null, sort_order: str(fd, 'sort_order') || '0', published: bool(fd, 'published') });
    const sql = db();
    await sql.begin(async (tx) => {
      if (original) {
        await tx`update award_categories set id = ${v.id}, name = ${v.name}, text = ${v.text}, awards = ${v.awards}, photo_id = ${v.photo_id}, sort_order = ${v.sort_order}, published = ${v.published}, updated_at = now() where id = ${original}`;
        if (original !== v.id) await tx`update awardees set category_id = ${v.id} where category_id = ${original}`;
      } else {
        await tx`insert into award_categories (id, name, text, awards, photo_id, sort_order, published) values (${v.id}, ${v.name}, ${v.text}, ${v.awards}, ${v.photo_id}, ${v.sort_order}, ${v.published})`;
      }
    });
    await logActivity(user, original ? 'category.update' : 'category.create', `${original ? 'Updated' : 'Added'} award category ${v.name}`, 'category', v.id);
    refreshPublicSite();
    if (!original || original !== v.id) redirect(`/admin/categories/${v.id}/?saved=1`);
    return done('Saved. The awards page shows the change.');
  });
}

export async function deleteCategory(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('delete');
    const cid = str(fd, 'id');
    const sql = db();
    const [r] = await sql.begin(async (tx) => {
      await tx`update awardees set category_id = 'other' where category_id = ${cid}`;
      return tx`delete from award_categories where id = ${cid} returning name`;
    });
    if (!r) throw new UserError('That category no longer exists.');
    await logActivity(user, 'category.delete', `Deleted award category ${r.name} (its awardees moved to Other honours)`, 'category', cid);
    refreshPublicSite();
    redirect('/admin/categories/?deleted=1');
  });
}

// ---------------- Events (editions) ----------------
const zEvent = z.object({
  year,
  title: z.string().min(2, 'Required').max(150),
  ordinal: z.string().max(60),
  starts_on: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Use the date picker'),
  date_label: z.string().max(80),
  venue: z.string().max(200),
  city: z.string().max(200),
  theme: z.string().max(200),
  summary: z.string().max(4000),
  stat_value: z.string().max(20),
  stat_label: z.string().max(120),
  pending: z.string().max(500),
  ticket_url: zUrl,
  banner_id: z.string().nullable(),
  photo_ids: z.array(z.string()).max(30),
  published: z.boolean(),
});

export async function saveEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('content');
    const eventId = id(fd);
    const v = zEvent.parse({
      year: str(fd, 'year'), title: str(fd, 'title'), ordinal: str(fd, 'ordinal'), starts_on: str(fd, 'starts_on'), date_label: str(fd, 'date_label'),
      venue: str(fd, 'venue'), city: str(fd, 'city'), theme: str(fd, 'theme'), summary: str(fd, 'summary'), stat_value: str(fd, 'stat_value'), stat_label: str(fd, 'stat_label'),
      pending: str(fd, 'pending'), ticket_url: str(fd, 'ticket_url'), banner_id: parseIds(str(fd, 'banner_id'))[0] || null, photo_ids: parseIds(str(fd, 'photo_ids')), published: bool(fd, 'published'),
    });
    const dateLabel = v.date_label || (v.starts_on ? new Date(v.starts_on + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'To be announced');
    const sql = db();
    const vals = { ...v, starts_on: v.starts_on || null, date_label: dateLabel, theme: v.theme || null, stat_value: v.stat_value || null, stat_label: v.stat_label || null, pending: v.pending || null, ticket_url: v.ticket_url || null };
    let rowId = eventId;
    if (eventId) {
      await sql`update events set ${sql(vals)}, updated_at = now() where id = ${eventId}`;
    } else {
      const [r] = await sql`insert into events ${sql(vals)} returning id`;
      rowId = r.id;
    }
    await logActivity(user, eventId ? 'event.update' : 'event.create', `${eventId ? 'Updated' : 'Added'} event ${v.title}`, 'event', rowId!);
    refreshPublicSite();
    if (!eventId) redirect(`/admin/events/${rowId}/?created=1`);
    return done('Saved. The editions page, home page and footer show the change.');
  });
}

export async function deleteEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('delete');
    const [r] = await db()`delete from events where id = ${id(fd)} returning title`;
    if (!r) throw new UserError('That event no longer exists.');
    await logActivity(user, 'event.delete', `Deleted event ${r.title}`, 'event');
    refreshPublicSite();
    redirect('/admin/events/?deleted=1');
  });
}

// ---------------- Articles ----------------
const zPost = z.object({
  title: z.string().min(2, 'Required').max(200),
  slug: zSlug,
  excerpt: z.string().max(600),
  body: z.string().max(100000),
  category: z.string().max(60),
  tags: z.array(z.string().max(40)).max(15),
  image_id: z.string().nullable(),
  published_at: z.string().regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?$/, 'Use the date picker'),
});

export async function savePost(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('content');
    const postId = id(fd);
    const intent = str(fd, '__intent'); // draft | publish | unpublish
    const v = zPost.parse({ title: str(fd, 'title'), slug: str(fd, 'slug') || slugify(str(fd, 'title')), excerpt: str(fd, 'excerpt'), body: str(fd, 'body'), category: str(fd, 'category'), tags: list(str(fd, 'tags')), image_id: parseIds(str(fd, 'image_id'))[0] || null, published_at: str(fd, 'published_at') });
    const sql = db();
    const [cur] = postId ? await sql`select status, published_at from posts where id = ${postId}` : [null];
    const status = intent === 'publish' ? 'published' : intent === 'unpublish' ? 'draft' : cur?.status || 'draft';
    // Publication date: the one given (Paris time), or now when first published
    const given = v.published_at ? parisTime(v.published_at) : null;
    if (given && given.getTime() > Date.now() + 60e3) throw new UserError('The publication date cannot be in the future. Save the article as a draft and publish it on the day.');
    const publishedAt = given || cur?.published_at || (status === 'published' ? new Date() : null);
    const vals = { title: v.title, slug: v.slug, excerpt: v.excerpt, body: v.body, category: v.category, tags: v.tags, image_id: v.image_id, status, published_at: publishedAt };
    let rowId = postId;
    if (postId) await sql`update posts set ${sql(vals)}, updated_at = now() where id = ${postId}`;
    else {
      const [r] = await sql`insert into posts ${sql({ ...vals, author_id: user.id })} returning id`;
      rowId = r.id;
    }
    const verb = intent === 'publish' ? 'Published' : intent === 'unpublish' ? 'Unpublished' : postId ? 'Updated' : 'Created a draft of';
    await logActivity(user, 'post.' + (intent || 'save'), `${verb} article “${v.title}”`, 'post', rowId!);
    refreshPublicSite();
    if (!postId) redirect(`/admin/posts/${rowId}/?saved=${intent || 'draft'}`);
    return done(status === 'published' ? 'Saved. The article is live on the website.' : 'Draft saved. Visitors do not see it until you publish it.');
  });
}

export async function deletePost(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('delete');
    const [r] = await db()`delete from posts where id = ${id(fd)} returning title`;
    if (!r) throw new UserError('That article no longer exists.');
    await logActivity(user, 'post.delete', `Deleted article “${r.title}”`, 'post');
    refreshPublicSite();
    redirect('/admin/posts/?deleted=1');
  });
}
