alter table public.patients
  add column if not exists drug_history text,
  add column if not exists uses_steroids boolean not null default false,
  add column if not exists uses_anticoagulants boolean not null default false;

alter table public.note_versions
  add column if not exists is_current boolean not null default false;

create index if not exists note_versions_current_idx
  on public.note_versions (clinical_note_id, is_current);
