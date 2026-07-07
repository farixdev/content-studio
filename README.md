# Mindcob Content Studio

An internal content‑production management tool for writers, reviewers and designers —
assign a guide, write it, review it, hand it to design, publish, and track every piece
from brief to SEO‑optimized.

## Stack
- **Next.js 15** (App Router, TypeScript) — UI + API route handlers
- **PostgreSQL** via **Prisma**
- **Tailwind CSS** + Radix UI + framer‑motion + lucide icons
- JWT session (httpOnly cookie), bcrypt password hashing, role‑based middleware

## Roles
- **Admin / Manager** — creates & assigns content, reviews, hands off to design, publishes, manages the team
- **Writer** — writes and submits content, resolves feedback
- **Reviewer** (Umar & Waqar) — approve content or send it back with notes
- **Designer** — designs approved content and uploads the finished asset

## Getting started

The app is **currently configured to run on SQLite** (zero‑config) and is already
seeded, so you can start it immediately:

```
npm run dev
```
Open http://localhost:3000 and sign in with a demo account below.

### Switch to PostgreSQL
PostgreSQL 18 is installed on this machine. To use it instead of SQLite:

1. In `prisma/schema.prisma`, set `provider = "postgresql"`.
2. In `.env`, set (with your real password):
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/mindcob_content?schema=public"
   ```
3. Run `npm run prisma:migrate` — it creates the schema and seeds the demo data.

The schema is portable (plain string fields, no DB‑specific types), so nothing else
needs to change.

## Demo logins (from the seed)
| Role     | Username | Password   |
|----------|----------|------------|
| Admin    | admin    | 123        |
| Writer   | ayesha   | ayesha123  |
| Writer   | hamza    | hamza123   |
| Reviewer | umar     | umar123    |
| Reviewer | waqar    | waqar123   |
| Designer | sara     | sara123    |

## Customizing
- **Content types & statuses** live in [`lib/constants.ts`](lib/constants.ts) — edit the
  `CONTENT_TYPES` array (and status metadata) in one place to change them everywhere.
- **Workflow rules** (who can do what, review gates) live in [`lib/workflow.ts`](lib/workflow.ts).

## Status pipeline
`Assigned → In Progress → Written → (Needs Improvement → Issue Resolved) → Reviewed by Umar
→ Reviewed by Waqar → Design Now → Designing → Designed → Post Now → Posted → SEO Optimized`
(plus `Cancelled` at any point).

## Integrations (planned)
Guide generation (Web Content Analyzer) and AI content audit (Content Quality Auditor)
have UI seams in place; deep automation is a later phase.
