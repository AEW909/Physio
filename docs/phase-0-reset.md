# Phase 0 Reset

## Decision

We are making a clean architectural break from the original prototype.

The prototype demonstrated useful workflows:

- AI pre-assessment screening
- AI-assisted note creation
- AI medical note drafting

But it is not suitable as the production foundation because it is:

- client-side only
- directly calling AI from the browser
- not built around persistent patient records
- not designed for auth, auditability, or GDPR-sensitive health data

## What Has Been Archived

The original prototype now lives in:

- `archive/prototype-v1/index.html`
- `archive/prototype-v1/styles.css`
- `archive/prototype-v1/app.js`
- `archive/prototype-v1/README.md`

## Rules For The Archived Prototype

- Do not treat it as active application code
- Do not extend it with production features
- Only reuse ideas, copy, workflow concepts, and UI references intentionally
- If logic is reused, it should be rewritten into the new architecture rather than transplanted

## New Production Target

### Application stack

- `Next.js`
- `Vercel`
- `Supabase`
- `OpenAI` server-side integration

### Product direction

The application should be a clinical records platform first, with AI features embedded inside it:

- patient records
- appointments
- clinical notes
- AI screening
- AI drafting
- transcription
- audit trail

## Non-Negotiable Constraints

- No client-side AI secrets
- No direct OpenAI calls from the browser
- No production patient data outside the secured application stack
- Access rules designed before note features scale
- GDPR-aware data handling considered from the beginning

## Exit Criteria For Phase 0

Phase 0 is complete when:

- the prototype is archived
- the repo root no longer implies the archived code is the active app
- the target production architecture is documented
- the next phase starts from product and data design, not prototype extension
