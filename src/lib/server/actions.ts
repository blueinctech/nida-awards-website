import 'server-only';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { AuthError } from './auth';

// What every admin form action returns to the page (shown by <ActionForm>)
export type ActionState = { ok: boolean; message: string; errors?: string[]; data?: Record<string, string> } | null;

export const done = (message: string, data?: Record<string, string>): ActionState => ({ ok: true, message, data });
export const failed = (message: string, errors?: string[]): ActionState => ({ ok: false, message, errors });

// Runs an action and turns expected problems (validation, permissions) into a message for the form
export async function guard(fn: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await fn();
  } catch (e) {
    unstable_rethrow(e); // let redirect() and notFound() through
    if (e instanceof AuthError) return failed(e.message);
    if (e instanceof z.ZodError) return failed('Please check the form.', e.issues.map((i) => (i.path.length ? `${labelOf(i.path)}: ` : '') + i.message));
    if (e instanceof UserError) return failed(e.message);
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === '23505') return failed('That address (slug), email or year is already used by another record.');
    console.error(e);
    return failed('Something went wrong and nothing was saved. Please try again.');
  }
}

export class UserError extends Error {}

const labelOf = (path: PropertyKey[]) =>
  path
    .map((p) => (typeof p === 'number' ? `#${p + 1}` : String(p).replace(/([A-Z])/g, ' $1').toLowerCase()))
    .join(' › ');

// Public pages are cached; after any change that visitors can see, they are rebuilt on the next visit
export function refreshPublicSite() {
  revalidatePath('/', 'layout');
}

export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

// ---------- Reading form fields ----------
export const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
export const bool = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true' || fd.get(k) === '1';
export const lines = (v: string) => v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
export const paras = (v: string) => v.split(/\r?\n\s*\r?\n/).map((x) => x.replace(/\s*\r?\n\s*/g, ' ').trim()).filter(Boolean);
export const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);

// Common validators
export const zUrl = z.string().max(500).refine((u) => u === '' || /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(u), 'Use a full web address (https://…), mailto:, tel: or a page path starting with /');
export const zEmail = z.string().max(200).refine((e) => e === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), 'Enter a valid email address');
export const zSlug = z.string().min(1, 'Required').max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');
export const zMediaId = z.string().max(80).regex(/^[\w-]*$/).nullable();
