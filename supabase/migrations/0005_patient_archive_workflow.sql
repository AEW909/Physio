alter table public.patients
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles (id),
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_reason text,
  add column if not exists erased_at timestamptz;

create index if not exists patients_archive_idx on public.patients (is_archived, last_name, first_name);
