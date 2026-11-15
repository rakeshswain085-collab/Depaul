alter table school_exam_results
  add column if not exists serial_number text not null default '',
  add column if not exists examination_date date;
