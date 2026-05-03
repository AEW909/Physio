create extension if not exists "pgcrypto";

create type public.profile_role as enum ('owner', 'clinician', 'admin');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.note_type as enum ('initial_assessment', 'follow_up', 'discharge', 'referral');
create type public.note_status as enum ('draft', 'final', 'archived');
create type public.screening_status as enum ('pending_review', 'reviewed', 'archived');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.profile_role not null default 'clinician',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  email text,
  phone text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  gp_name text,
  gp_contact text,
  medical_flags jsonb not null default '[]'::jsonb,
  consent_status text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  scheduled_at timestamptz not null,
  appointment_type text not null,
  status public.appointment_status not null default 'scheduled',
  clinician_id uuid references public.profiles (id),
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.screenings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  submitted_by uuid references public.profiles (id),
  raw_payload jsonb not null default '{}'::jsonb,
  ai_summary text,
  triage_level text,
  red_flags jsonb not null default '[]'::jsonb,
  follow_up_questions jsonb not null default '[]'::jsonb,
  status public.screening_status not null default 'pending_review',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  note_type public.note_type not null,
  title text not null,
  status public.note_status not null default 'draft',
  current_version_id uuid,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.note_versions (
  id uuid primary key default gen_random_uuid(),
  clinical_note_id uuid not null references public.clinical_notes (id) on delete cascade,
  source_type text not null,
  content jsonb not null default '{}'::jsonb,
  ai_prompt_snapshot jsonb,
  transcript_snapshot jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.clinical_notes
  add constraint clinical_notes_current_version_fk
  foreign key (current_version_id) references public.note_versions (id) on delete set null;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  storage_path text not null,
  document_type text not null,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists patients_name_idx on public.patients (last_name, first_name);
create index if not exists appointments_patient_idx on public.appointments (patient_id, scheduled_at desc);
create index if not exists screenings_patient_idx on public.screenings (patient_id, created_at desc);
create index if not exists clinical_notes_patient_idx on public.clinical_notes (patient_id, created_at desc);
create index if not exists note_versions_note_idx on public.note_versions (clinical_note_id, created_at desc);
create index if not exists documents_patient_idx on public.documents (patient_id, created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.screenings enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.note_versions enable row level security;
alter table public.documents enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'clinician'
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists set_screenings_updated_at on public.screenings;
create trigger set_screenings_updated_at
before update on public.screenings
for each row execute function public.set_updated_at();

drop trigger if exists set_clinical_notes_updated_at on public.clinical_notes;
create trigger set_clinical_notes_updated_at
before update on public.clinical_notes
for each row execute function public.set_updated_at();

drop trigger if exists create_profile_on_signup on auth.users;
create trigger create_profile_on_signup
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create policy "profiles can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "owners can read all profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role = 'owner'
  )
);

create policy "owners can update profiles"
on public.profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role = 'owner'
  )
);

create policy "staff can read patients"
on public.patients
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "staff can insert patients"
on public.patients
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "staff can update patients"
on public.patients
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "staff can read appointments"
on public.appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "staff can manage appointments"
on public.appointments
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "clinicians can read screenings"
on public.screenings
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician')
  )
);

create policy "clinicians can manage screenings"
on public.screenings
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician')
  )
)
with check (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician')
  )
);

create policy "clinicians and admins can read notes"
on public.clinical_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "clinicians can manage notes"
on public.clinical_notes
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician')
  )
)
with check (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician')
  )
);

create policy "clinicians and admins can read note versions"
on public.note_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "clinicians can manage note versions"
on public.note_versions
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician')
  )
)
with check (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician')
  )
);

create policy "staff can read documents"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "clinicians and admins can upload documents"
on public.documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('owner', 'clinician', 'admin')
  )
);

create policy "owners can read audit log"
on public.audit_log
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role = 'owner'
  )
);
