create type public.treatment_plan_status as enum ('active', 'completed', 'on_hold');

create table if not exists public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  title text not null,
  status public.treatment_plan_status not null default 'active',
  presenting_problem_summary text,
  goals_summary text,
  progress_summary text,
  overall_findings text,
  first_session_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments
  add column if not exists treatment_plan_id uuid references public.treatment_plans (id) on delete set null;

alter table public.clinical_notes
  add column if not exists treatment_plan_id uuid references public.treatment_plans (id) on delete set null;

create index if not exists treatment_plans_patient_status_idx
  on public.treatment_plans (patient_id, status, updated_at desc);

create index if not exists appointments_treatment_plan_idx
  on public.appointments (treatment_plan_id, scheduled_at desc);

create index if not exists clinical_notes_treatment_plan_idx
  on public.clinical_notes (treatment_plan_id, created_at desc);

alter table public.treatment_plans enable row level security;

drop trigger if exists set_treatment_plans_updated_at on public.treatment_plans;
create trigger set_treatment_plans_updated_at
before update on public.treatment_plans
for each row execute function public.set_updated_at();

create policy "staff can read treatment plans"
on public.treatment_plans
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "staff can manage treatment plans"
on public.treatment_plans
for all
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'))
with check (public.current_user_role() in ('owner', 'clinician', 'admin'));

with legacy_patients as (
  select
    a.patient_id,
    min(a.scheduled_at) as first_session_at
  from public.appointments a
  where a.treatment_plan_id is null
  group by a.patient_id
),
inserted_plans as (
  insert into public.treatment_plans (
    patient_id,
    title,
    status,
    first_session_at,
    created_at,
    updated_at
  )
  select
    legacy_patients.patient_id,
    'Imported treatment history',
    'active',
    legacy_patients.first_session_at,
    now(),
    now()
  from legacy_patients
  returning id, patient_id
)
update public.appointments a
set treatment_plan_id = inserted_plans.id
from inserted_plans
where a.patient_id = inserted_plans.patient_id
  and a.treatment_plan_id is null;

update public.clinical_notes n
set treatment_plan_id = a.treatment_plan_id
from public.appointments a
where n.appointment_id = a.id
  and n.treatment_plan_id is null
  and a.treatment_plan_id is not null;
