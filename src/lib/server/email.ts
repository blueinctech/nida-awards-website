import 'server-only';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// Optional email sending through Amazon SES. Set EMAIL_FROM (an address or domain verified in SES)
// and the AWS keys (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and SES_REGION or AWS_REGION).
// Resend (RESEND_API_KEY) still works as an alternative. Without either, nothing is sent: password
// reset and invitation links are shown to the Super Admin instead, who passes them on.
const sesReady = () => Boolean(process.env.EMAIL_FROM && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && (process.env.SES_REGION || process.env.AWS_REGION));
const resendReady = () => Boolean(process.env.EMAIL_FROM && process.env.RESEND_API_KEY);
export const emailEnabled = () => sesReady() || resendReady();

let ses: SESv2Client | undefined;

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!emailEnabled() || !to) return false;
  try {
    if (sesReady()) {
      ses ??= new SESv2Client({ region: process.env.SES_REGION || process.env.AWS_REGION });
      await ses.send(new SendEmailCommand({
        FromEmailAddress: process.env.EMAIL_FROM,
        Destination: { ToAddresses: [to] },
        ...(process.env.EMAIL_REPLY_TO ? { ReplyToAddresses: [process.env.EMAIL_REPLY_TO] } : {}),
        Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' } } } },
      }));
      return true;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
    });
    if (!res.ok) console.error('Email not sent', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('Email not sent', e);
    return false;
  }
}

// The address used in emailed and copied links. ADMIN_URL (or SITE_URL) is preferred over the
// request's Host header, so links can never point to another site.
export async function siteOrigin() {
  const fromEnv = process.env.ADMIN_URL || process.env.SITE_URL || '';
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const { headers } = await import('next/headers');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
