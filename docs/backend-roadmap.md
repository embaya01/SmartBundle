# Backend Implementation Roadmap

This roadmap captures the concrete engineering steps required to build the SmartBundle ingestion platform and REST API now that the data model, scraping architecture, and observability requirements have been defined.

## 1. Repository & Tooling Setup
1. Convert the existing frontend repo into a Yarn/NPM workspace monorepo (root + `packages/*`).  
2. Create a `packages/shared` library exposing:
   - `types.ts`, `validation.ts`, `normalizers.ts`, `search.ts` (migrated from frontend).  
   - Build config (tsup/rollup) producing ESM + CJS outputs.  
   - Vitest suite mirroring current frontend tests.  
3. Update the frontend to import from `@smartbundle/shared/...` and ensure tree shaking remains intact.

## 2. Ingestion Service Scaffold
1. Create new service workspace `services/ingest` (Node 20 + TypeScript).  
2. Install core deps: `bullmq`, `ioredis`, `undici`, `zod`, `pino` (logging), `prom-client`.  
3. Implement CLI entry point (`yarn ingest run --source=spotify`) to execute scrapers locally.  
4. Implement scheduler stub that reads `config/sources.yml` and enqueues jobs on an interval (rely on `node-cron` or platform scheduler during phase 1).

## 3. Database Access Layer
1. Introduce Prisma or Knex in `services/ingest` for Postgres access.  
2. Generate migrations matching `docs/api-contract.md` (bundles, bundle_history, ingestion_runs, bundle_facets).  
3. Implement repository functions:
   - `upsertBundle`, `recordHistory`, `markInactive`, `createIngestionRun`, `completeIngestionRun`.

## 4. Scraper Implementations (MVP Set)
1. Build base scraper utilities (`fetchJson`, `fetchHtml`, retry helpers, robots.txt checker).  
2. Implement first-party scrapers (Spotify Student, Disney Bundle, Verizon Play More, T-Mobile Netflix).  
3. Add unit tests using recorded fixtures for each scraper.  
4. Wire normalization pipeline (shared helpers) and persistence flow.

## 5. Observability & Admin
1. Embed structured logging via `pino`.  
2. Publish Prometheus metrics endpoint (`/metrics`).  
3. Record ingestion stats to `ingestion_runs`.  
4. Add a minimal admin API:
   - `POST /jobs/enqueue` (manual replay).  
   - `GET /runs/:id` (fetch run summary).  
5. Document Grafana dashboards and alert rules per `docs/scraper-framework.md`.

## 6. REST API Service
1. Scaffold `services/api` (Fastify or Express + TypeScript).  
2. Install shared package dependency.  
3. Implement handlers:
   - `GET /api/bundles/search` (query Postgres with filters, pagination, sorting).  
   - `GET /api/bundles/:id` (with history).  
   - `GET /api/bundles/facets` (serve cached materialized view).  
4. Add caching (Redis) and rate limiting (e.g., `@fastify/rate-limit`).  
5. Integrate OpenAPI spec and validation middleware.

## 7. Deployment & Operations
1. Author Dockerfiles for `services/ingest` and `services/api`.  
2. Create Kubernetes manifests or serverless configs (depending on hosting decision).  
3. Configure CI pipeline (GitHub Actions) running lint, tests, and docker builds.  
4. Provision Redis, Postgres, and secret manager in the target cloud environment.  
5. Implement database migrations in CI/CD on deploy.

## 8. Milestone Sequencing
| Milestone | Deliverables | Target |
|-----------|--------------|--------|
| M1 | Monorepo + shared package + ingestion scaffold (CLI, DB access) | Week 1 |
| M2 | First four scrapers running on schedule with logging/metrics | Week 2 |
| M3 | REST API service, OpenAPI, integration tests with frontend | Week 3 |
| M4 | Production deployment (K8s/serverless), dashboards, alerting | Week 4 |

## 9. Outstanding Decisions
- Hosting platform (AWS vs. GCP vs. Azure vs. Render/Heroku).  
- Secret management tool selection (Vault vs. cloud native).  
- Primary scheduler (self-hosted cron vs. managed Cloud Scheduler).  
- Authentication for REST API (API key, OAuth2, or session tokens).  
- Budget for headless browser scraping (Playwright concurrency limits).

## 10. Next Steps
1. Approve tooling choices (Prisma vs. Knex, Fastify vs. Express, hosting provider).  
2. Kick off monorepo conversion and shared package extraction.  
3. Stand up development Postgres + Redis instances for local testing.  
4. Start implementing the ingestion service per sections above.
