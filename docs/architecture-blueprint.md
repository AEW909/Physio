# Architecture Blueprint

## Stack

- `Next.js` application
- `Vercel` hosting and runtime environment variables
- `Supabase` for Postgres, Auth, Storage, and Row Level Security
- `OpenAI` via server-side endpoints only

## Core Principle

The browser should never talk directly to OpenAI with a secret key and should never have direct access to privileged database operations.

## High-Level Shape

### Frontend

Next.js application with:

- authenticated staff interface
- patient list and patient detail pages
- appointment pages
- note editor pages
- screening form pages

### Backend

Next.js server-side route handlers or server actions for:

- AI screening requests
- transcription requests
- AI note drafting requests
- privileged write operations where needed

### Data layer

Supabase provides:

- Postgres database
- authentication
- file storage for audio or documents
- Row Level Security policies

## Environment Variable Boundaries

### Browser-safe

- Supabase anon URL
- Supabase anon key

### Server-only

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- any webhook signing secrets

## Runtime Rules

- all AI requests originate from the server
- AI receives only the data necessary for the specific task
- all persisted note changes happen through authenticated application flows
- service role usage is limited and intentional

## Deployment Model

- GitHub for version control
- Vercel for app deployment
- Supabase project hosted in a UK or EU region

## Separation From Prototype

The archived prototype is reference material only.

It may influence:

- UI wording
- field design
- workflow shape

It must not influence:

- security model
- application structure
- API key handling
- data persistence strategy
