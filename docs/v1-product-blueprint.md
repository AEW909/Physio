# V1 Product Blueprint

## Product Goal

Build a production-oriented physiotherapy practice platform with:

- secure staff access
- patient records
- appointment-linked clinical notes
- AI-powered pre-assessment screening
- AI-assisted note drafting and transcription

The application is a clinical records system first. AI features exist inside that system and must not define the architecture.

## Primary Users

- clinic owner
- physiotherapist / clinician
- admin / receptionist

Patient-facing access is out of scope for the first version unless a narrow form-sharing flow is added later.

## V1 Modules

### 1. Staff authentication

- sign in
- sign out
- session management
- role assignment

### 2. Patient records

- create patient
- edit patient demographics
- store contact details
- store relevant medical and administrative context
- search and view patients

### 3. Appointments

- create appointments
- link appointments to patients
- link notes and screenings to appointments

### 4. Clinical notes

- initial assessment note
- follow-up note
- discharge note
- note editing
- note versioning

### 5. AI screening

- send structured pre-assessment data to a server-side AI endpoint
- generate screening summary
- highlight red flags
- suggest follow-up questions
- save screening output against patient and appointment

### 6. AI note assistance

- transcribe uploaded or recorded audio
- draft SOAP notes from transcript and context
- draft clinical documents such as referral or discharge text
- always save AI outputs as editable drafts

### 7. Audit trail

- record creation events
- record update events
- record deletion or archival events
- identify actor and timestamp

## Explicitly Out Of Scope For V1

- billing and invoicing
- exercise prescription library
- patient self-service portal
- online appointment booking
- SMS / email automation
- multi-clinic tenancy unless required at launch
- extensive reporting dashboards

## UX Principles

- clinician workflows first
- editing always easier than rewriting
- AI outputs clearly labeled as draft
- patient-sensitive actions require explicit confirmation
- no hidden background AI writes into the record

## Success Criteria For V1

- clinicians can manage patient records securely
- clinicians can create and edit notes without AI
- clinicians can use AI to speed up screening and note drafting
- patient data stays inside an authenticated, access-controlled system
- AI keys and privileged database keys never reach the browser
