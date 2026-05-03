# Data Model Outline

## Design Priorities

- patient records are first-class
- notes are versioned
- screenings are linked to patients and optionally appointments
- uploaded audio and documents have a clear owner and provenance
- auditability is built in

## Core Tables

### `profiles`

Purpose:
- metadata for authenticated staff users

Suggested fields:
- `id`
- `email`
- `full_name`
- `role`
- `created_at`
- `updated_at`

### `patients`

Purpose:
- master patient record

Suggested fields:
- `id`
- `first_name`
- `last_name`
- `date_of_birth`
- `email`
- `phone`
- `address`
- `emergency_contact_name`
- `emergency_contact_phone`
- `gp_name`
- `gp_contact`
- `medical_flags`
- `consent_status`
- `created_by`
- `created_at`
- `updated_at`

### `appointments`

Purpose:
- patient visit instances

Suggested fields:
- `id`
- `patient_id`
- `scheduled_at`
- `appointment_type`
- `status`
- `clinician_id`
- `location`
- `created_at`
- `updated_at`

### `screenings`

Purpose:
- pre-assessment and intake records

Suggested fields:
- `id`
- `patient_id`
- `appointment_id`
- `submitted_by`
- `raw_payload`
- `ai_summary`
- `triage_level`
- `red_flags`
- `follow_up_questions`
- `status`
- `reviewed_by`
- `reviewed_at`
- `created_at`
- `updated_at`

### `clinical_notes`

Purpose:
- current canonical note record

Suggested fields:
- `id`
- `patient_id`
- `appointment_id`
- `note_type`
- `title`
- `status`
- `current_version_id`
- `created_by`
- `created_at`
- `updated_at`

### `note_versions`

Purpose:
- immutable note history

Suggested fields:
- `id`
- `clinical_note_id`
- `source_type`
- `content`
- `ai_prompt_snapshot`
- `transcript_snapshot`
- `created_by`
- `created_at`

### `documents`

Purpose:
- metadata for uploaded files

Suggested fields:
- `id`
- `patient_id`
- `appointment_id`
- `storage_path`
- `document_type`
- `uploaded_by`
- `created_at`

### `audit_log`

Purpose:
- track important system activity

Suggested fields:
- `id`
- `actor_profile_id`
- `entity_type`
- `entity_id`
- `action`
- `before_state`
- `after_state`
- `created_at`

## Important Modeling Rules

- note content should not live only in one mutable row
- AI output should be distinguishable from clinician-authored revisions
- screenings should preserve the original submitted intake data
- uploaded audio should be traceable to the transcription and note draft it informed
- deletions should prefer archival or soft-delete patterns unless hard delete is legally or operationally required
