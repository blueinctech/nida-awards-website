import { adminApi, json } from '@/lib/server/api';
import { db } from '@/lib/server/db';
import { logActivity } from '@/lib/server/activity';

// CSV downloads for spreadsheets. Cells that start with = + - @ are prefixed with ' so
// spreadsheet apps never run them as formulas.
const cell = (v: unknown) => {
  let s = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};
const csv = (rows: Record<string, unknown>[], cols: [string, string][]) =>
  '﻿' + [cols.map((c) => cell(c[1])).join(','), ...rows.map((r) => cols.map((c) => cell(r[c[0]])).join(','))].join('\r\n');

export const GET = adminApi('submissions', async (req, user, ctx) => {
  const { kind } = await ctx.params;
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const sql = db();
  let body = '';
  let name = '';
  if (kind === 'nominations') {
    const edition = Number(url.searchParams.get('edition')) || null;
    const rows = await sql`select n.*, (select string_agg(filename, '; ') from nomination_files f where f.nomination_id = n.id) as files,
                           (select string_agg(user_name || ': ' || body, ' | ' order by created_at) from nomination_notes x where x.nomination_id = n.id) as notes
                           from nominations n where true ${status ? sql`and status = ${status}` : sql``} ${edition ? sql`and edition = ${edition}` : sql``}
                           order by created_at desc`;
    body = csv(rows, [['reference', 'Reference'], ['created_at', 'Submitted'], ['status', 'Status'], ['edition', 'Edition'], ['category', 'Category'], ['nominee_name', 'Nominee'], ['nominee_email', 'Nominee email'], ['nominee_phone', 'Nominee phone'], ['nominee_country', 'Nominee country'], ['about_nominee', 'About the nominee'], ['impact', 'Accomplishments and impact'], ['links', 'Links'], ['nominator_name', 'Nominated by'], ['nominator_email', 'Nominator email'], ['nominator_country', 'Nominator country'], ['nominator_whatsapp', 'Nominator WhatsApp'], ['files', 'Files'], ['notes', 'Internal notes']]);
    name = 'nida-nominations';
  } else if (kind === 'messages' || kind === 'newsletter') {
    const rows = await sql`select * from messages where ${kind === 'newsletter' ? sql`kind = 'newsletter'` : sql`kind <> 'newsletter'`} ${status ? sql`and status = ${status}` : sql``} order by created_at desc`;
    body = csv(rows, kind === 'newsletter' ? [['email', 'Email'], ['created_at', 'Signed up'], ['status', 'Status']] : [['created_at', 'Received'], ['kind', 'Type'], ['status', 'Status'], ['name', 'Name'], ['email', 'Email'], ['subject', 'Subject'], ['body', 'Message']]);
    name = kind === 'newsletter' ? 'nida-mailing-list' : 'nida-messages';
  } else return json({ error: 'Unknown export' }, 404);
  await logActivity(user, 'export', `Exported ${name.replace('nida-', '').replace('-', ' ')} (CSV)`);
  return new Response(body, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' },
  });
});
