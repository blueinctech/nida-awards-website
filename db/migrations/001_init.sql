-- NIDA CMS: initial schema

create extension if not exists pgcrypto;

-- ---------- Administrators and security ----------
create table admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null,
  password_hash text,                       -- null until an invited admin sets a password
  role          text not null check (role in ('super_admin', 'editor', 'viewer')),
  status        text not null default 'active' check (status in ('invited', 'active', 'deactivated')),
  failed_logins int not null default 0,
  locked_until  timestamptz,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table admin_sessions (
  id           text primary key,             -- SHA-256 of the session token; the token itself is only in the cookie
  user_id      uuid not null references admin_users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  ip           text,
  user_agent   text
);
create index admin_sessions_user on admin_sessions(user_id);

create table auth_tokens (
  id         text primary key,               -- SHA-256 of the token sent by email or shown once
  user_id    uuid not null references admin_users(id) on delete cascade,
  purpose    text not null check (purpose in ('invite', 'reset')),
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create table activity_log (
  id          bigserial primary key,
  user_id     uuid references admin_users(id) on delete set null,
  user_name   text,
  action      text not null,
  entity_type text,
  entity_id   text,
  summary     text not null,
  created_at  timestamptz not null default now()
);
create index activity_log_created on activity_log(created_at desc);

create table rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  count        int not null
);

-- ---------- Website content ----------
-- One JSON document per key ('site'): `draft` is what editors work on, `published` is what the public site shows.
create table site_settings (
  key          text primary key,
  draft        jsonb not null,
  published    jsonb not null,
  updated_at   timestamptz not null default now(),
  published_at timestamptz,
  updated_by   uuid references admin_users(id) on delete set null
);

create table media (
  id          text primary key,               -- legacy photos keep their ids ('2024-39'); uploads get 'm_…'
  kind        text not null check (kind in ('image', 'document')),
  title       text not null default '',
  alt         text not null default '',
  folder      text not null default 'general',
  tags        text[] not null default '{}',
  filename    text not null default '',
  mime        text not null default '',
  size        int not null default 0,
  width       int,
  height      int,
  url         text not null,                  -- main (largest) URL
  variants    jsonb not null default '[]',    -- [{ "w": 640, "h": 427, "url": "…" }], smallest first
  extra       jsonb not null default '{}',    -- e.g. { "og": "…", "faces": […] }
  storage     text not null default 'static' check (storage in ('static', 'blob', 'local')),
  storage_keys text[] not null default '{}',  -- files to delete with this record
  gallery     boolean not null default false,
  gallery_year int,
  sort_order  int not null default 0,
  created_by  uuid references admin_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index media_gallery on media(gallery, gallery_year);

create table award_categories (
  id         text primary key,                -- slug, used in URLs (/awards/#business)
  name       text not null,
  text       text not null default '',
  awards     text[] not null default '{}',
  photo_id   text references media(id) on delete set null,
  sort_order int not null default 0,
  published  boolean not null default true,
  updated_at timestamptz not null default now()
);

create table awardees (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  year            int not null,
  award           text not null,
  category_id     text,                       -- award_categories.id, or 'other'
  listed_as       text,
  country         text not null default '',
  bio             text[] not null default '{}',
  achievements    text[] not null default '{}',
  note            text,
  photo_id        text references media(id) on delete set null,
  is_organisation boolean not null default false,
  published       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index awardees_year on awardees(year);

create table events (
  id          uuid primary key default gen_random_uuid(),
  year        int not null unique,            -- each NIDA gala is one edition per year
  title       text not null,
  ordinal     text not null default '',
  starts_on   date,
  date_label  text not null default '',
  venue       text not null default '',
  city        text not null default '',
  theme       text,
  summary     text not null default '',
  stat_value  text,
  stat_label  text,
  pending     text,
  ticket_url  text,
  banner_id   text references media(id) on delete set null,
  photo_ids   text[] not null default '{}',
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text not null default '',
  body         text not null default '',      -- Markdown
  category     text not null default '',
  tags         text[] not null default '{}',
  image_id     text references media(id) on delete set null,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id    uuid references admin_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- Submissions ----------
create table nominations (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,
  edition          int not null,
  category         text not null,
  nominator_email  text not null,
  nominator_name   text not null,
  nominator_country text not null,
  nominator_whatsapp text not null default '',
  nominee_name     text not null,
  nominee_email    text not null,
  nominee_phone    text not null,
  nominee_country  text not null,
  about_nominee    text not null,
  impact           text not null,
  links            text not null,
  status           text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected')),
  ip_hash          text,
  user_agent       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index nominations_created on nominations(created_at desc);

create table nomination_files (
  id            uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references nominations(id) on delete cascade,
  kind          text not null check (kind in ('photo', 'document')),
  filename      text not null,
  mime          text not null,
  size          int not null,
  storage       text not null check (storage in ('blob', 'local')),
  storage_key   text not null,                -- never shown to visitors; admins download through /api/admin/files
  created_at    timestamptz not null default now()
);

create table nomination_notes (
  id            bigserial primary key,
  nomination_id uuid not null references nominations(id) on delete cascade,
  user_id       uuid references admin_users(id) on delete set null,
  user_name     text not null,
  body          text not null,
  created_at    timestamptz not null default now()
);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('contact', 'newsletter', 'enquiry')),
  name       text not null default '',
  email      text not null,
  subject    text not null default '',
  body       text not null default '',
  data       jsonb not null default '{}',
  status     text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  ip_hash    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index messages_created on messages(created_at desc);
create unique index messages_newsletter_email on messages(lower(email)) where kind = 'newsletter';
