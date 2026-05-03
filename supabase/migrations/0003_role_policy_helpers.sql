create or replace function public.current_user_role()
returns public.profile_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

drop policy if exists "owners can read all profiles" on public.profiles;
drop policy if exists "owners can update profiles" on public.profiles;
drop policy if exists "staff can read patients" on public.patients;
drop policy if exists "staff can insert patients" on public.patients;
drop policy if exists "staff can update patients" on public.patients;
drop policy if exists "staff can read appointments" on public.appointments;
drop policy if exists "staff can manage appointments" on public.appointments;
drop policy if exists "clinicians can read screenings" on public.screenings;
drop policy if exists "clinicians can manage screenings" on public.screenings;
drop policy if exists "clinicians and admins can read notes" on public.clinical_notes;
drop policy if exists "clinicians can manage notes" on public.clinical_notes;
drop policy if exists "clinicians and admins can read note versions" on public.note_versions;
drop policy if exists "clinicians can manage note versions" on public.note_versions;
drop policy if exists "staff can read documents" on public.documents;
drop policy if exists "clinicians and admins can upload documents" on public.documents;
drop policy if exists "owners can read audit log" on public.audit_log;

create policy "authenticated staff can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "owners can update profiles"
on public.profiles
for update
to authenticated
using (public.current_user_role() = 'owner')
with check (public.current_user_role() = 'owner');

create policy "staff can read patients"
on public.patients
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "staff can insert patients"
on public.patients
for insert
to authenticated
with check (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "staff can update patients"
on public.patients
for update
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'))
with check (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "staff can read appointments"
on public.appointments
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "staff can manage appointments"
on public.appointments
for all
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'))
with check (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "clinicians can read screenings"
on public.screenings
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician'));

create policy "clinicians can manage screenings"
on public.screenings
for all
to authenticated
using (public.current_user_role() in ('owner', 'clinician'))
with check (public.current_user_role() in ('owner', 'clinician'));

create policy "clinicians and admins can read notes"
on public.clinical_notes
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "clinicians can manage notes"
on public.clinical_notes
for all
to authenticated
using (public.current_user_role() in ('owner', 'clinician'))
with check (public.current_user_role() in ('owner', 'clinician'));

create policy "clinicians and admins can read note versions"
on public.note_versions
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "clinicians can manage note versions"
on public.note_versions
for all
to authenticated
using (public.current_user_role() in ('owner', 'clinician'))
with check (public.current_user_role() in ('owner', 'clinician'));

create policy "staff can read documents"
on public.documents
for select
to authenticated
using (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "clinicians and admins can upload documents"
on public.documents
for insert
to authenticated
with check (public.current_user_role() in ('owner', 'clinician', 'admin'));

create policy "owners can read audit log"
on public.audit_log
for select
to authenticated
using (public.current_user_role() = 'owner');
