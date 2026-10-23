create table if not exists website_images (
  slot text primary key,
  storage_path text not null,
  content_type text not null default 'image/webp',
  updated_at timestamptz not null default now()
);

alter table website_images enable row level security;

insert into storage.buckets (id, name, public) values
  ('site-images', 'site-images', true)
on conflict (id) do update set public = excluded.public;
