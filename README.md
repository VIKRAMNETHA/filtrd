# Filtrd

Multi-tenant applicant tracking system. Each organization onboards, gets its own career site at `<slug>.<ROOT_DOMAIN>`, publishes roles with a shortlist score, active days and hiring rounds, and HR receives the shortlist by email when a role closes.

## Run locally

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run db:setup             # creates the database, the restricted role and the schema
npm run seed                 # optional second demo tenant
npm run dev
```

- App: http://localhost:3000
- Career sites: http://<slug>.localhost:3000
- Tests: `npm test` (the isolation tests need the database)

## How tenancy works

Tables share one schema, and every tenant row has an `org_id`. Postgres row-level security enforces isolation, and the app connects as a role that can't bypass it. `withTenant(orgId, fn)` sets the tenant for a single transaction, so a query missing a tenant filter returns nothing. Composite foreign keys also prevent cross-tenant references.

## Automation

`tick()` in `lib/automation.ts` closes expired roles, applies the threshold, queues the HR report and retries unsent email. It runs every minute inside a long-running server. Serverless deployments should call `GET /api/cron/tick` with `Authorization: Bearer $CRON_SECRET` instead.

## Optional services

- `SMTP_HOST` and related settings: without them, email is kept in the in-app Emails page and not delivered.
- `ANTHROPIC_API_KEY`: enables AI scoring. Without it, a keyword matcher scores resumes. The UI labels which method produced each score.
