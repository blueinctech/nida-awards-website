'use client';
import { usePathname } from 'next/navigation';

type Item = { href?: string; label?: string; icon?: string; badge?: number; group?: string };

const ICONS: Record<string, string> = {
  home: 'M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10',
  layout: 'M4 4h16v16H4zM4 9h16M9 9v11',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01',
  inbox: 'M4 13h5l1 3h4l1-3h5M4 13l2-8h12l2 8v6H4z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
};

export function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] || ICONS.layout} />
    </svg>
  );
}

export function AdminNav({ items }: { items: Item[] }) {
  const path = usePathname() || '/admin/';
  const norm = (p: string) => (p.endsWith('/') ? p : p + '/');
  const active = (href: string) => (href === '/admin/' ? norm(path) === '/admin/' : norm(path).startsWith(href));
  return (
    <nav className="adm-nav" aria-label="Admin">
      <ul role="list">
        {items.map((it, i) =>
          it.group ? (
            <li key={i} className="adm-nav__group">{it.group}</li>
          ) : (
            <li key={it.href}>
              <a href={it.href} aria-current={active(it.href!) ? 'page' : undefined}>
                <Icon name={it.icon!} />
                <span>{it.label}</span>
                {it.badge ? <b className="adm-nav__badge" aria-label={`${it.badge} new`}>{it.badge}</b> : null}
              </a>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
