alter table public.treatment_plans
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles (id);

alter table public.appointments
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles (id);

create index if not exists treatment_plans_archive_idx
  on public.treatment_plans (patient_id, is_archived, status, updated_at desc);

create index if not exists appointments_archive_idx
  on public.appointments (treatment_plan_id, is_archived, scheduled_at desc);
