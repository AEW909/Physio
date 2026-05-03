alter table public.patients
  add column if not exists past_medical_history jsonb not null default '[]'::jsonb,
  add column if not exists past_medical_history_details text,
  add column if not exists past_operations text;

update public.patients
set past_medical_history = medical_flags
where (past_medical_history = '[]'::jsonb or past_medical_history is null)
  and medical_flags is not null
  and jsonb_typeof(medical_flags) = 'array'
  and jsonb_array_length(medical_flags) > 0;
