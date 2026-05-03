# Access And Compliance Boundaries

## Working Assumption

This system will handle special-category health data. It must be designed accordingly.

This document is a product and engineering boundary note, not legal advice.

## User Roles

### Owner

Can:

- manage clinic settings
- view all records
- manage staff access
- review audit history

### Clinician

Can:

- view assigned or permitted patient records
- create and edit clinical notes
- run AI screening and note drafting tools
- upload and review documents and audio

### Admin

Can:

- manage scheduling and demographics
- view limited operational patient data
- should not automatically access full clinical note content unless specifically required by policy

## Access Rules

- every patient-linked table must have Row Level Security
- staff access should be role-aware and least-privilege
- privileged operations should be done server-side
- service role credentials must never be exposed to the client

## AI Rules

- all AI calls are server-side only
- send the minimum necessary data
- avoid unnecessary identifiers in prompts
- AI output is draft assistance only
- clinician review is mandatory before a note becomes final
- prompts and outputs that materially affect records should be traceable

## GDPR-Oriented Requirements

- choose a UK or EU Supabase region
- document lawful basis for processing
- document retention rules
- support subject access and deletion workflows where appropriate
- log material record changes
- keep secrets out of the browser
- ensure exported or downloaded data is intentional and auditable

## V1 Compliance Features

- authenticated staff-only access
- role-aware access boundaries
- audit log for material record actions
- explicit AI draft status
- structured ownership of records, files, and edits

## Not Enough On Its Own

The following alone do not make the system compliant:

- using Supabase
- using an EU region
- using HTTPS
- hiding API keys

Compliance depends on policy, legal basis, operational process, access design, and technical enforcement working together.
