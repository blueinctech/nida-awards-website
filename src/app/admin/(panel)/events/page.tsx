import { db } from '@/lib/server/db';
import { requirePage } from '@/lib/server/auth';
import { can } from '@/lib/roles';
import { Badge, Empty, PageHead, fmtDay } from '@/components/admin/ui';

export const metadata = { title: 'Events & editions' };

export default async function EventsAdmin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requirePage('view');
  const sp = await searchParams;
  const when = sp.when || '';
  const sql = db();
  const rows = await sql`select e.*, (select count(*)::int from awardees a where a.year = e.year) as n, (e.starts_on >= current_date) as upcoming from events e
    where true ${when === 'upcoming' ? sql`and e.starts_on >= current_date` : when === 'past' ? sql`and (e.starts_on < current_date)` : sql``}
    order by e.year desc`;
  return (
    <>
      <PageHead
        title="Events & editions"
        description="Each NIDA gala is one edition. Published events appear on the Editions page, the home page tabs, the About timeline and the footer."
        actions={can(user.role, 'content') ? <a className="btn btn--primary" href="/admin/events/new/">Add event</a> : null}
      />
      {sp.deleted ? <p className="notice notice--ok" role="status">The event was deleted.</p> : null}
      <nav className="tabs tabs--small" aria-label="Filter events">
        <a href="/admin/events/" aria-current={!when ? 'page' : undefined}>All</a>
        <a href="/admin/events/?when=upcoming" aria-current={when === 'upcoming' ? 'page' : undefined}>Upcoming</a>
        <a href="/admin/events/?when=past" aria-current={when === 'past' ? 'page' : undefined}>Past</a>
      </nav>
      {rows.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th scope="col">Event</th><th scope="col">Date</th><th scope="col">Venue</th><th scope="col">Honourees</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td><a href={`/admin/events/${e.id}/`}><b>{e.title}</b></a><br /><small className="muted">{e.ordinal}</small></td>
                  <td>{e.date_label || fmtDay(e.starts_on)}</td>
                  <td>{e.venue}<br /><small className="muted">{e.city}</small></td>
                  <td>{e.n}</td>
                  <td><Badge status={e.published ? 'published' : 'unpublished'} /> <Badge status={e.upcoming ? 'upcoming' : 'past'} /></td>
                  <td className="cell-actions"><a className="link" href={`/admin/events/${e.id}/`}>Edit</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty title="No events here" />}
    </>
  );
}
