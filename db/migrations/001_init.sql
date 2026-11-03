-- Multi-tenancy model: shared schema, every tenant row carries org_id, and Postgres
-- row-level security enforces isolation. The app connects as a non-owner role and sets
-- app.org_id per transaction, so a query that forgets a tenant filter returns nothing.

create function app_org_id() returns uuid language sql stable as
  $$ select nullif(current_setting('app.org_id', true), '')::uuid $$;
create function app_user_id() returns uuid language sql stable as
  $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

-- Public branding only: the career site reads this before any tenant is known.
create table organizations (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'),
  name          text not null,
  website       text,
  industry      text,
  company_size  text,
  headquarters  text,
  tagline       text,
  about         text,
  brand_color   text not null default '#111111' check (brand_color ~ '^#[0-9a-fA-F]{6}$'),
  created_at    timestamptz not null default now()
);

-- Global identity, used at login before a tenant is known.
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));

create table memberships (
  org_id     uuid not null references organizations(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  role       text not null default 'admin' check (role in ('admin', 'recruiter')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on memberships (user_id);

create table org_settings (
  org_id              uuid primary key references organizations(id) on delete cascade,
  hr_email            text not null,
  default_threshold   int  not null default 70 check (default_threshold between 0 and 100),
  default_active_days int  not null default 30 check (default_active_days between 1 and 365),
  default_rounds      jsonb not null default '[]',
  departments         text[] not null default '{}'
);

create table jobs (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organizations(id) on delete cascade,
  title            text not null,
  department       text,
  location         text,
  workplace        text not null default 'onsite' check (workplace in ('onsite', 'hybrid', 'remote')),
  employment_type  text not null default 'full_time' check (employment_type in ('full_time', 'part_time', 'contract', 'internship')),
  experience_min   int check (experience_min >= 0),
  experience_max   int check (experience_max >= 0),
  salary_range     text,
  description      text not null,
  required_skills  text[] not null default '{}',
  nice_skills      text[] not null default '{}',
  threshold        int not null check (threshold between 0 and 100),
  active_days      int not null check (active_days between 1 and 365),
  notify_emails    text[] not null default '{}',
  status           text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  published_at     timestamptz,
  closes_at        timestamptz,
  shortlist_sent_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (org_id, id)
);
create index jobs_org_status_idx on jobs (org_id, status);

-- Composite foreign keys below make a cross-tenant reference impossible at the schema level.
create table job_rounds (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null,
  job_id    uuid not null,
  position  int  not null,
  name      text not null,
  kind      text not null default 'interview' check (kind in ('screening', 'assessment', 'interview', 'final')),
  unique (job_id, position),
  unique (org_id, id),
  foreign key (org_id, job_id) references jobs (org_id, id) on delete cascade
);

create table applications (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null,
  job_id           uuid not null,
  name             text not null,
  email            text not null,
  phone            text,
  linkedin_url     text,
  location         text,
  years_experience numeric(4,1),
  cover_note       text,
  consent_at       timestamptz not null,
  status           text not null default 'new'
                   check (status in ('new', 'shortlisted', 'not_shortlisted', 'in_rounds', 'hired', 'rejected')),
  current_round_id uuid,
  score            int check (score between 0 and 100),
  score_status     text not null default 'pending' check (score_status in ('pending', 'done', 'failed')),
  score_method     text,
  score_details    jsonb,
  resume_text      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (org_id, id),
  foreign key (org_id, job_id) references jobs (org_id, id) on delete cascade,
  foreign key (org_id, current_round_id) references job_rounds (org_id, id)
);
create unique index applications_one_per_email on applications (job_id, lower(email));
create index applications_org_job_idx on applications (org_id, job_id, status);
create index applications_pending_idx on applications (score_status) where score_status = 'pending';

-- Resume files live under RLS with their tenant rather than in a shared bucket path.
create table resumes (
  application_id uuid primary key,
  org_id         uuid not null,
  filename       text not null,
  content_type   text not null,
  data           bytea not null,
  foreign key (org_id, application_id) references applications (org_id, id) on delete cascade
);

create table application_events (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null,
  application_id uuid not null,
  kind           text not null,
  detail         text,
  actor          text,
  created_at     timestamptz not null default now(),
  foreign key (org_id, application_id) references applications (org_id, id) on delete cascade
);
create index application_events_app_idx on application_events (application_id, created_at);

-- Outbox: emails commit with the state change that caused them, then get dispatched.
create table emails (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  kind       text not null,
  to_addrs   text[] not null,
  subject    text not null,
  html       text not null,
  status     text not null default 'queued' check (status in ('queued', 'sent', 'captured', 'failed')),
  error      text,
  attempts   int not null default 0,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
create index emails_org_idx on emails (org_id, created_at desc);
create index emails_queued_idx on emails (status) where status = 'queued';

alter table organizations enable row level security;
alter table organizations force row level security;
create policy org_read on organizations for select using (true);
create policy org_create on organizations for insert with check (true);
create policy org_update on organizations for update using (id = app_org_id()) with check (id = app_org_id());

alter table memberships enable row level security;
alter table memberships force row level security;
create policy membership_read on memberships for select using (org_id = app_org_id() or user_id = app_user_id());
create policy membership_write on memberships for all using (org_id = app_org_id()) with check (org_id = app_org_id());

do $$
declare t text;
begin
  foreach t in array array['org_settings','jobs','job_rounds','applications','resumes','application_events','emails'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('create policy tenant_isolation on %I using (org_id = app_org_id()) with check (org_id = app_org_id())', t);
  end loop;
end $$;

-- The background worker must discover work across tenants. These expose only ids, and each
-- item is then processed inside that tenant's RLS context.
create function app_due_jobs() returns table (org_id uuid, job_id uuid)
language sql security definer set search_path = public as $$
  select org_id, id from jobs
  where shortlist_sent_at is null
    and ((status = 'published' and closes_at <= now()) or status = 'closed')
$$;

create function app_orgs_with_pending_work() returns table (org_id uuid)
language sql security definer set search_path = public as $$
  select org_id from applications where score_status = 'pending'
  union
  select org_id from emails where status = 'queued' and attempts < 5
$$;
