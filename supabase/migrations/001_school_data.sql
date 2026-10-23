-- Apply in the Supabase SQL editor before running the import script.
create extension if not exists pgcrypto;

create table if not exists admins (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) <= 100),
  email text not null unique check (char_length(email) <= 254),
  password_hash text not null,
  role text not null default 'admin' check (role in ('superadmin', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists notices (
  id text primary key default gen_random_uuid()::text, title text not null, description text not null,
  notice_date text not null, pdf_url text not null default '', published boolean not null default false,
  is_latest boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists notices_public_idx on notices (is_latest desc, notice_date desc, created_at desc) where published;
create table if not exists school_books (
  id text primary key default gen_random_uuid()::text, title text not null, author text not null default '',
  subject text not null default '', class_name text not null default '', publisher text not null default '',
  academic_year text not null default '', price numeric check (price >= 0), published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists school_books_public_idx on school_books (class_name, academic_year, subject, title) where published;
create table if not exists school_events (
  id text primary key default gen_random_uuid()::text, title text not null, description text not null,
  event_date date not null, venue text not null, image_url text not null default '',
  status text not null default 'Upcoming' check (status in ('Upcoming', 'Completed')),
  published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists school_events_public_idx on school_events (event_date desc, created_at desc) where published;
create table if not exists school_exam_results (
  id text primary key default gen_random_uuid()::text, academic_year text not null, class_name text not null,
  examination_key text not null, examination_name text not null, roll_number text not null, student_name text not null,
  subjects jsonb not null default '[]'::jsonb, total_marks numeric not null, maximum_marks numeric not null,
  percentage numeric not null, automatic_grade text not null default '', manual_grade text not null default '',
  final_grade text not null default '', result_status text not null check (result_status in ('Pass','Fail','Needs Improvement')),
  published boolean not null default false, published_at timestamptz, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), created_by text not null default '',
  unique (academic_year, class_name, examination_key, roll_number)
);
create index if not exists exam_results_lookup_idx on school_exam_results (academic_year, class_name, examination_key, roll_number) where published;
create table if not exists exam_import_drafts (
  id text primary key default gen_random_uuid()::text, admin_id text not null references admins(id) on delete cascade,
  academic_year text not null, class_name text not null, examination_key text not null, examination_name text not null,
  students jsonb not null default '[]'::jsonb, existing_roll_numbers jsonb not null default '[]'::jsonb,
  removed_roll_numbers jsonb not null default '[]'::jsonb, expires_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists gallery (
  id text primary key default gen_random_uuid()::text, year integer not null, category text not null, title text not null default '',
  caption text not null default '', image_url text not null, original_url text, source_type text not null default 'url',
  storage_path text, created_at timestamptz not null default now()
);
create index if not exists gallery_order_idx on gallery (year desc, created_at desc);
create table if not exists school_staff (
  id text primary key default gen_random_uuid()::text, name text not null, designation text not null, subject text not null default '',
  category text not null check (category in ('PGT Teachers','TGT Teachers','PRT Teachers')), photo_path text, published boolean not null default false,
  sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists mandatory_disclosures (
  id text primary key default gen_random_uuid()::text, title text not null, category text not null, description text not null default '',
  academic_year text not null default '', file_path text not null, file_name text not null, content_type text not null default 'application/pdf',
  file_size bigint not null default 0, published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists mandatory_disclosure_content (
  key text primary key, payload jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Server routes use DATABASE_URL. Keep browser access closed until explicit RLS policies are designed.
alter table admins enable row level security; alter table notices enable row level security; alter table school_books enable row level security;
alter table school_events enable row level security; alter table school_exam_results enable row level security; alter table exam_import_drafts enable row level security;
alter table gallery enable row level security; alter table school_staff enable row level security; alter table mandatory_disclosures enable row level security;
alter table mandatory_disclosure_content enable row level security;

insert into storage.buckets (id, name, public) values
  ('gallery-images', 'gallery-images', true),
  ('staff-photos', 'staff-photos', true),
  ('mandatory-disclosure-files', 'mandatory-disclosure-files', false)
on conflict (id) do update set public = excluded.public;
