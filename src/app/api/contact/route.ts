import { db } from '@/lib/server/db';
import { readSettings } from '@/lib/server/repo';
import { field, isEmail, precheck, reply } from '@/lib/server/public-forms';
import { sendEmail, siteOrigin } from '@/lib/server/email';

// The contact form (/contact/) posts here. Messages appear in /admin/messages.
export async function POST(req: Request) {
  const { stop, fd, ip } = await precheck(req, 'contact', 10, 60 * 60);
  if (stop) return stop;
  const name = field(fd!, 'name', 200);
  const email = field(fd!, 'email', 200).toLowerCase();
  const message = field(fd!, 'message', 10000);
  const subject = field(fd!, 'subject', 200) || 'Website enquiry' + (name ? ' from ' + name : '');
  if (!isEmail(email)) return reply(req, false, 'Please enter a valid email address.');
  if (message.length < 2) return reply(req, false, 'Please write your message.');
  const kind = fd!.get('kind') === 'enquiry' ? 'enquiry' : 'contact';
  await db()`insert into messages (kind, name, email, subject, body, ip_hash) values (${kind}, ${name}, ${email}, ${subject}, ${message}, ${ip!})`;
  const settings = await readSettings('published');
  if (settings.notifyEmail) {
    await sendEmail(settings.notifyEmail, `New message on the NIDA website: ${subject}`, `From: ${name || '(no name)'} <${email}>\n\n${message}\n\nReply from your email, or see all messages: ${await siteOrigin()}/admin/messages/\n`);
  }
  return reply(req, true, 'Thank you. Your message has been sent.');
}
