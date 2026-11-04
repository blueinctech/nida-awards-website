import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/server/auth';

// Opens a public page with unpublished changes visible (admins only)
export async function GET(req: Request) {
  if (!(await currentAdmin())) redirect('/admin/login');
  const path = new URL(req.url).searchParams.get('path') || '/';
  const safe = /^\/(?!\/)[\w\-/]*\/?(#[\w-]*)?$/.test(path) && !path.startsWith('/admin') && !path.startsWith('/api') ? path : '/';
  (await draftMode()).enable();
  redirect(safe);
}
