import { asset } from '@/lib/data';
import { requirePage } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { can, ROLE_LABELS } from '@/lib/roles';
import { logout } from '../actions/auth';
import { AdminNav } from '@/components/admin/nav';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePage('view');
  const [counts] = await db()`select
    (select count(*)::int from nominations where status = 'pending') as nominations,
    (select count(*)::int from messages where status = 'new' and kind <> 'newsletter') as messages`;
  const items = [
    { href: '/admin/', label: 'Dashboard', icon: 'home' },
    { group: 'Website' },
    { href: '/admin/content/', label: 'Website content', icon: 'layout' },
    { href: '/admin/awardees/', label: 'Awardees', icon: 'star' },
    { href: '/admin/categories/', label: 'Award categories', icon: 'grid' },
    { href: '/admin/events/', label: 'Events & editions', icon: 'calendar' },
    { href: '/admin/posts/', label: 'News & blog', icon: 'pen' },
    { href: '/admin/media/', label: 'Media library', icon: 'image' },
    { group: 'Submissions' },
    { href: '/admin/nominations/', label: 'Nominations', icon: 'inbox', badge: counts.nominations },
    { href: '/admin/messages/', label: 'Messages & forms', icon: 'mail', badge: counts.messages },
    { group: 'Administration' },
    ...(can(user.role, 'users') ? [{ href: '/admin/users/', label: 'Administrators', icon: 'users' }] : []),
    ...(can(user.role, 'activity') ? [{ href: '/admin/activity/', label: 'Activity log', icon: 'clock' }] : []),
    { href: '/admin/system/', label: 'System & backups', icon: 'shield' },
    { href: '/admin/account/', label: 'My account', icon: 'user' },
  ];
  return (
    <div className="adm">
      <input type="checkbox" id="adm-nav" className="adm-nav-toggle visually-hidden" aria-label="Show menu" />
      <header className="adm-top">
        <label htmlFor="adm-nav" className="adm-top__menu" aria-hidden="true"><span /></label>
        <a href="/admin/" className="adm-top__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('img/brand/nida-logo-white.png')} width={726} height={201} alt="NIDA" />
          <span>Admin</span>
        </a>
      </header>
      <aside className="adm-side">
        <a href="/admin/" className="adm-side__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('img/brand/nida-logo-white.png')} width={726} height={201} alt="NIDA, Nigerians in Diaspora Awards" />
          <span>Admin</span>
        </a>
        <AdminNav items={items} />
        <div className="adm-side__user">
          <p><b>{user.name}</b><span>{ROLE_LABELS[user.role]}</span></p>
          <div className="adm-side__links">
            <a href="/" target="_blank" rel="noopener">View website ↗</a>
            <form action={logout}><button type="submit">Sign out</button></form>
          </div>
        </div>
      </aside>
      <label htmlFor="adm-nav" className="adm-scrim" aria-hidden="true" />
      <main className="adm-main" id="main">{children}</main>
    </div>
  );
}
