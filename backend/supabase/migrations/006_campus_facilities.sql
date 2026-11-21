create table if not exists campus_facilities (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  photo_category text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default '🏫',
  image_slot text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campus_facilities_public_idx
  on campus_facilities (sort_order, title)
  where published;

alter table campus_facilities enable row level security;

insert into campus_facilities
  (id, slug, photo_category, title, description, icon, image_slot, sort_order)
values
  (
    'science-laboratories',
    'science-laboratories',
    'Science Laboratories',
    'Science Laboratories',
    'Separate physics, chemistry and biology work areas where students perform experiments linked to their syllabus.',
    '🔬',
    'scienceLab',
    0
  ),
  (
    'library-reading-room',
    'library-reading-room',
    'Library & Reading Room',
    'Library & Reading Room',
    'A calm reading space with story books, reference titles, newspapers and magazines for all age groups.',
    '📚',
    'library',
    1
  ),
  (
    'playground-sports',
    'playground-sports',
    'Playground & Sports',
    'Playground & Sports',
    'Open ground for athletics, football, kabaddi, volleyball and annual sports day competitions.',
    '⚽',
    'sports',
    2
  ),
  (
    'auditorium-stage',
    'auditorium-stage',
    'Auditorium & Stage',
    'Auditorium & Stage',
    'A stage and assembly area used for cultural programmes, competitions, celebrations and school functions.',
    '🎭',
    'cultural',
    3
  )
on conflict (slug) do nothing;
