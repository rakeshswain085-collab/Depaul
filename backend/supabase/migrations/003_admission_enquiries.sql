create table if not exists admission_enquiries (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 1 and 20),
  email text not null default '' check (char_length(email) <= 140),
  subject text not null check (char_length(subject) between 1 and 120),
  message text not null check (char_length(message) between 1 and 1000),
  status text not null default 'new'
    check (status in (
      'new',
      'in_progress',
      'awaiting_response',
      'replied',
      'follow_up',
      'admitted',
      'not_admitted',
      'closed'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admission_enquiries_created_idx
  on admission_enquiries (created_at desc);
create index if not exists admission_enquiries_status_idx
  on admission_enquiries (status, created_at desc);

alter table admission_enquiries enable row level security;
