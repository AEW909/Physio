create table if not exists public.acupuncture_consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  token text not null unique,
  status text not null check (status in ('generated', 'submitted', 'approved', 'rejected')),
  requested_by uuid references public.profiles (id),
  reviewed_by uuid references public.profiles (id),
  patient_full_name text,
  patient_date_of_birth date,
  understands_treatment boolean not null default false,
  understands_risks boolean not null default false,
  disclosed_relevant_history boolean not null default false,
  history_notes text,
  consent_to_treatment boolean not null default false,
  signature_name text,
  clinician_review_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists acupuncture_consents_patient_idx
  on public.acupuncture_consents (patient_id, created_at desc);

create index if not exists acupuncture_consents_status_idx
  on public.acupuncture_consents (status, created_at desc);

alter table public.acupuncture_consents enable row level security;

drop policy if exists "staff can read acupuncture consents" on public.acupuncture_consents;
drop policy if exists "staff can manage acupuncture consents" on public.acupuncture_consents;

create policy "staff can read acupuncture consents"
on public.acupuncture_consents
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "staff can manage acupuncture consents"
on public.acupuncture_consents
for all
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'))
with check (public.current_user_role() in ('owner', 'clinician', 'admin'));
