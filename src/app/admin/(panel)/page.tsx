import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { settingsMeta } from '@/lib/server/repo';
import { can } from '@/lib/roles';
import { Badge, Card, Empty, PageHead, fmtDateTime, fmtDay } from '@/components/admin/ui';

export const metadata = { title: 'Dashboard' };

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const sp = await searchParams;
  const sql = db();
  const [[c], recent, activity, upcoming, meta] = await Promise.all([
    sql`select
      (select count(*)::int from awardees) as awardees,
      (select count(*)::int from awardees where published) as awardees_pub,
      (select count(*)::int from nominations) as nominations,
      (select count(*)::int from nominations where status = 'pending') as nominations_pending,
      (select count(*)::int from posts where status = 'published') as posts,
      (select count(*)::int from posts where status = 'draft') as drafts,
      (select count(*)::int from events where published and starts_on >= current_date) as upcoming,
      (select count(*)::int from messages where status = 'new' and kind <> 'newsletter') as messages_new,
      (select count(*)::int from messages where kind = 'newsletter') as subscribers`,
    sql`(select 'nomination' as type, id::text, nominee_name as title, category as detail, status, created_at from nominations order by created_at desc limit 8)
        union all
        (select kind as type, id::text, coalesce(nullif(name, ''), email) as title, coalesce(nullif(subject, ''), left(body, 80)) as detail, status, created_at from messages order by created_at desc limit 8)
        order by created_at desc limit 8`,
    sql`select user_name, summary, created_at from activity_log order by created_at desc limit 10`,
    sql`select id, title, date_label, venue, starts_on from events where published and starts_on >= current_date order by starts_on limit 3`,
    settingsMeta(),
  ]);
  const stats = [
    { label: 'Awardees', value: c.awardees, note: `${c.awardees_pub} published`, href: '/admin/awardees/' },
    { label: 'Nominations', value: c.nominations, note: `${c.nominations_pending} pending review`, href: '/admin/nominations/' },
    { label: 'Published articles', value: c.posts, note: `${c.drafts} draft${c.drafts === 1 ? '' : 's'}`, href: '/admin/posts/' },
    { label: 'Upcoming events', value: c.upcoming, note: upcoming[0] ? `Next: ${upcoming[0].title}` : 'None scheduled', href: '/admin/events/' },
  ];
  return (
    <>
      <PageHead
        title={`Welcome, ${user.name.split(' ')[0]}`}
        description="An overview of the NIDA website and its submissions."
        actions={can(user.role, 'content') ? <><a className="btn btn--ghost" href="/admin/awardees/new/">Add awardee</a><a className="btn btn--primary" href="/admin/posts/new/">Write article</a></> : null}
      />
      {sp.denied ? <p className="notice notice--error" role="alert">Your role does not give access to that page.</p> : null}
      {sp.welcome ? <p className="notice notice--ok" role="status">You are signed in. Change your password any time in My account.</p> : null}
      {meta && !meta.inSync && can(user.role, 'content') ? (
        <p className="notice notice--warn">Website content has unpublished changes. <a href="/admin/content/">Review and publish them</a>.</p>
      ) : null}

      <ul className="stats" role="list">
        {stats.map((s) => (
          <li key={s.label}>
            <a className="stat" href={s.href}>
              <span className="stat__label">{s.label}</span>
              <span className="stat__value">{s.value}</span>
              <span className="stat__note">{s.note}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="grid-2">
        <Card title="Recent submissions" actions={<a className="link" href="/admin/messages/">All messages</a>}>
          {recent.length ? (
            <ul className="feed" role="list">
              {recent.map((r) => (
                <li key={r.type + r.id}>
                  <a href={r.type === 'nomination' ? `/admin/nominations/${r.id}/` : `/admin/messages/${r.id}/`}>
                    <span className="feed__main"><b>{r.title}</b><span>{r.type === 'nomination' ? 'Nomination · ' : r.type === 'newsletter' ? 'Mailing list · ' : 'Message · '}{r.detail}</span></span>
                    <span className="feed__side"><Badge status={r.status} /><time>{fmtDateTime(r.created_at)}</time></span>
                  </a>
                </li>
              ))}
            </ul>
          ) : <Empty title="No submissions yet">Nominations, contact messages and mailing-list sign-ups will appear here.</Empty>}
        </Card>
        <Card title="Recent activity" actions={can(user.role, 'activity') ? <a className="link" href="/admin/activity/">Full log</a> : null}>
          <ul className="feed feed--plain" role="list">
            {activity.map((a, i) => (
              <li key={i}><span className="feed__main"><b>{a.user_name}</b><span>{a.summary}</span></span><time className="feed__side">{fmtDateTime(a.created_at)}</time></li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Upcoming events" actions={<a className="link" href="/admin/events/">All events</a>}>
          {upcoming.length ? (
            <ul className="feed feed--plain" role="list">
              {upcoming.map((e) => (
                <li key={e.id}><span className="feed__main"><b><a href={`/admin/events/${e.id}/`}>{e.title}</a></b><span>{e.date_label || fmtDay(e.starts_on)} · {e.venue || 'Venue to be announced'}</span></span></li>
              ))}
            </ul>
          ) : <Empty title="No upcoming events">Add the next NIDA gala in Events &amp; editions. Its date and venue then appear in “Save the date” on the home page.</Empty>}
        </Card>
        <Card title="Inbox">
          <ul className="feed feed--plain" role="list">
            <li><span className="feed__main"><b><a href="/admin/nominations/?status=pending">{c.nominations_pending} nominations</a></b><span>waiting for review</span></span></li>
            <li><span className="feed__main"><b><a href="/admin/messages/?status=new">{c.messages_new} new messages</a></b><span>from the contact form</span></span></li>
            <li><span className="feed__main"><b><a href="/admin/messages/?kind=newsletter">{c.subscribers} mailing-list sign-ups</a></b><span>for “Save the date” news</span></span></li>
          </ul>
        </Card>
      </div>
    </>
  );
}
