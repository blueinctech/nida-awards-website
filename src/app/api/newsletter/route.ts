import { db } from '@/lib/server/db';
import { field, isEmail, precheck, reply } from '@/lib/server/public-forms';

// "Save the date" mailing list sign-ups. Listed and exported in /admin/messages → Mailing list.
export async function POST(req: Request) {
  const { stop, fd, ip } = await precheck(req, 'newsletter', 10, 60 * 60);
  if (stop) return stop;
  const email = field(fd!, 'email', 200).toLowerCase();
  if (!isEmail(email)) return reply(req, false, 'Please enter a valid email address.');
  await db()`insert into messages (kind, email, subject, ip_hash) values ('newsletter', ${email}, 'Mailing list sign-up', ${ip!})
             on conflict (lower(email)) where kind = 'newsletter' do update set status = case when messages.status = 'archived' then 'new' else messages.status end, updated_at = now()`;
  return reply(req, true, 'Thank you. You are on the list.');
}
