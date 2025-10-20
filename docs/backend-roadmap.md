# Backend Implementation Roadmap

This roadmap captures the concrete engineering steps required to build the SmartBundle ingestion platform and REST API now that the data model, scraping architecture, and observability requirements have been defined.

## 1. Repository & Tooling Setup
- [x] Convert the existing frontend repo into a workspace monorepo (root + packages/*).  
- [x] Create packages/shared exporting types, validation, normalizers, search utilities with tsup build + Vitest coverage.  
- [x] Update the frontend to consume @smartbundle/shared/... imports.

## 2. Ingestion Service Scaffold
- [x] Create workspace services/ingest (Node 20 + TypeScript) with shared package wiring.  
- [x] Install core dependencies (ullmq, ioredis, undici, zod, pino, prom-client, 
anoid, yargs, Prisma).  
- [x] Implement initial CLI (
pm run ingest:dev) supporting un, enqueue, and list commands with stubbed runner + queue/persistence.  
- [x] Implement scheduler stub that reads config/sources.yml and enqueues jobs on an interval.

## 3. Database Access Layer
- [x] Adopt Prisma in services/ingest with schema coverage for bundles, history, and ingestion runs.  
- [ ] Generate migrations matching docs/api-contract.md (bundles, bundle_history, ingestion_runs, bundle_facets).  
- [ ] Implement repository functions:
  - upsertBundle, ecordHistory, markInactive, createIngestionRun, completeIngestionRun.

## 4. Scraper Implementations (MVP Set)
1. Build base scraper utilities (etchJson, etchHtml, retry helpers, robots.txt checker).  
2. Implement first-party scrapers (Spotify Student, Disney Bundle, Verizon Play More, T-Mobile Netflix).  
3. Add unit tests using recorded fixtures for each scraper.  
4. Wire normalization pipeline (shared helpers) and persistence flow.

## 5. Observability & Admin
1. Embed structured logging via pino.  
2. Publish Prometheus metrics endpoint (/metrics).  
3. Record ingestion stats to ingestion_runs.  
4. Add a minimal admin API:
   - POST /jobs/enqueue (manual replay).  
   - GET /runs/:id (fetch run summary).  
5. Document Grafana dashboards and alert rules per docs/scraper-framework.md.

## 6. REST API Service
1. Scaffold services/api (Fastify or Express + TypeScript).  
2. Install shared package dependency.  
3. Implement handlers:
   - GET /api/bundles/search (query Postgres with filters, pagination, sorting).  
   - GET /api/bundles/:id (with history).  
   - GET /api/bundles/facets (serve cached materialized view).  
4. Add caching (Redis) and rate limiting (e.g., @fastify/rate-limit).  
5. Integrate OpenAPI spec and validation middleware.

## 7. Deployment & Operations
1. Author Dockerfiles for services/ingest and services/api.  
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
1. Stand up development Postgres + Redis instances for local testing (DATABASE_URL, REDIS_*).  
2. Generate and apply initial Prisma migrations.  
3. Implement repository helpers and wire persistence into ingestion runs.  
4. Implement the scheduler stub (config/sources.yml + queue enqueuer).  
5. Begin first real scraper module after persistence lands.

