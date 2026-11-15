create table if not exists exam_result_imports (
  id text primary key default gen_random_uuid()::text,
  draft_id text references exam_import_drafts(id) on delete set null,
  file_name text not null,
  status text not null check (
    status in ('Draft', 'Validating', 'Ready to Publish', 'Published', 'Failed')
  ),
  detected_classes jsonb not null default '[]'::jsonb,
  selected_classes jsonb not null default '[]'::jsonb,
  student_count integer not null default 0 check (student_count >= 0),
  published_student_count integer not null default 0 check (published_student_count >= 0),
  failed_records jsonb not null default '[]'::jsonb,
  error_message text not null default '',
  created_by text not null references admins(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists exam_result_imports_history_idx
  on exam_result_imports (created_at desc);

create unique index if not exists exam_result_imports_draft_id_idx
  on exam_result_imports (draft_id)
  where draft_id is not null;

create index if not exists exam_result_imports_status_idx
  on exam_result_imports (status, updated_at desc);

alter table school_exam_results
  add column if not exists import_id text
    references exam_result_imports(id) on delete set null;

create index if not exists exam_results_import_id_idx
  on school_exam_results (import_id)
  where import_id is not null;

alter table exam_result_imports enable row level security;
