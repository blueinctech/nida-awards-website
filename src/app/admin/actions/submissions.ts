'use server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/server/db';
import { requireAction } from '@/lib/server/auth';
import { logActivity } from '@/lib/server/activity';
import { deleteFiles } from '@/lib/server/storage';
import { done, guard, str, UserError, type ActionState } from '@/lib/server/actions';

const NOM_STATUS = ['pending', 'under_review', 'approved', 'rejected'];
const MSG_STATUS = ['new', 'read', 'replied', 'archived'];
const uuid = (v: string) => (/^[0-9a-f-]{36}$/.test(v) ? v : null);
const LABEL: Record<string, string> = { pending: 'Pending', under_review: 'Under review', approved: 'Approved', rejected: 'Rejected', new: 'New', read: 'Read', replied: 'Replied', archived: 'Archived' };

export async function setNominationStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('submissions');
    const status = str(fd, 'status');
    if (!NOM_STATUS.includes(status)) throw new UserError('Choose a status.');
    const [r] = await db()`update nominations set status = ${status}, updated_at = now() where id = ${uuid(str(fd, 'id'))} returning reference, nominee_name`;
    if (!r) throw new UserError('That nomination no longer exists.');
    await logActivity(user, 'nomination.status', `Marked nomination ${r.reference} (${r.nominee_name}) as ${LABEL[status]}`, 'nomination', str(fd, 'id'));
    return done(`Status changed to ${LABEL[status]}.`);
  });
}

export async function addNominationNote(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('submissions');
    const body = str(fd, 'body').slice(0, 5000);
    if (!body) throw new UserError('Write a note first.');
    const id = uuid(str(fd, 'id'));
    const [r] = await db()`select reference from nominations where id = ${id}`;
    if (!r) throw new UserError('That nomination no longer exists.');
    await db()`insert into nomination_notes (nomination_id, user_id, user_name, body) values (${id}, ${user.id}, ${user.name}, ${body})`;
    await logActivity(user, 'nomination.note', `Added a note to nomination ${r.reference}`, 'nomination', id!);
    return done('Note added. Only administrators can see it.');
  });
}

export async function deleteNomination(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('delete');
    const id = uuid(str(fd, 'id'));
    const files = await db()`select storage, storage_key from nomination_files where nomination_id = ${id}`;
    const [r] = await db()`delete from nominations where id = ${id} returning reference, nominee_name`;
    if (!r) throw new UserError('That nomination no longer exists.');
    for (const f of files) await deleteFiles([f.storage_key], f.storage);
    await logActivity(user, 'nomination.delete', `Deleted nomination ${r.reference} (${r.nominee_name}) and its files`, 'nomination');
    redirect('/admin/nominations/?deleted=1');
  });
}

export async function setMessageStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('submissions');
    const status = str(fd, 'status');
    if (!MSG_STATUS.includes(status)) throw new UserError('Choose a status.');
    const ids = [...str(fd, 'ids').split(','), ...fd.getAll('pick').map(String)].map(uuid).filter(Boolean) as string[];
    if (!ids.length) throw new UserError('Select at least one message.');
    const rows = await db()`update messages set status = ${status}, updated_at = now() where id = any(${ids}) returning id`;
    await logActivity(user, 'message.status', `Marked ${rows.length} message${rows.length === 1 ? '' : 's'} as ${LABEL[status]}`, 'message', ids.length === 1 ? ids[0] : undefined);
    return done(`Marked as ${LABEL[status]}.`);
  });
}

export async function deleteMessage(_: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireAction('delete');
    const [r] = await db()`delete from messages where id = ${uuid(str(fd, 'id'))} returning email, kind`;
    if (!r) throw new UserError('That message no longer exists.');
    await logActivity(user, 'message.delete', `Deleted a ${r.kind === 'newsletter' ? 'mailing-list sign-up' : 'message'} from ${r.email}`, 'message');
    redirect(`/admin/messages/?deleted=1${r.kind === 'newsletter' ? '&kind=newsletter' : ''}`);
  });
}
