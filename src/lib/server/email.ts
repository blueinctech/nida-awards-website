import 'server-only';

// Optional email sending through Resend (https://resend.com). Set RESEND_API_KEY and EMAIL_FROM
// (an address on a domain verified in Resend). Without them, nothing is sent: password reset and
// invitation links are shown to the Super Admin instead, who passes them on.
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!emailEnabled() || !to) return false;
  try {
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

// The address used in emailed and copied links. ADMIN_URL (or Vercel's production domain) is
// preferred over the request's Host header, so links can never point to another site.
export async function siteOrigin() {
  const fromEnv = process.env.ADMIN_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '');
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const { headers } = await import('next/headers');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
