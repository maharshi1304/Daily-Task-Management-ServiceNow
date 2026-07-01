# Daily Task Manager

A personal IT operations log for tracking daily incidents, service requests, work notes, and resolutions — with a dashboard showing today's summary and a live activity feed.

## Run & Operate

- `pnpm --filter @workspace/taskmanager run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, wouter routing, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB tables: incidents, service_requests, work_notes, resolutions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/taskmanager/src/pages/` — React pages (dashboard, incidents, service-requests, work-notes, resolutions + detail views)

## Architecture decisions

- Date fields (incidentDate, requestDate, noteDate, resolutionDate) are stored as `text` in `YYYY-MM-DD` format; dashboard summary filters by exact string match against today's date
- All create routes auto-populate today's date if none is provided, ensuring new items always appear in the daily summary
- Status/priority enums validated server-side; service_requests uses free-text columns but enforces enum values in route handlers

## Product

Personal daily task manager for an IT professional. Tracks:
- **Incidents** — operational disruptions with priority/status
- **Service Requests** — access, hardware, software requests
- **Work Notes** — freeform log entries linked to incidents or SRs
- **Resolutions** — post-mortems with root cause and actions taken

Dashboard shows today's counts, status breakdowns, and a live activity feed.

## User preferences

_Populate as you build._

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema changes before testing the API
- Run codegen (`pnpm --filter @workspace/api-spec run codegen`) after any OpenAPI spec changes
- `lib/` packages are composite; run `pnpm run typecheck:libs` before leaf artifact typechecks if you change a lib

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
