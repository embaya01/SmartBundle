# SmartBundle Scraper Framework Blueprint

This document scopes the ingestion layer that will populate the SmartBundle database. It focuses on modularity, resilience, and ease of onboarding new data sources.

## 1. Goals

- Continuously harvest bundle offers from official APIs, marketing pages, partner feeds, and press releases.
- Normalize raw data into the canonical `Bundle` schema before persistence.
- Run on a schedule with observability, retries, and failure isolation.
- Minimize duplicated extraction logic via sharable utilities and configuration-driven scrapers.

## 2. High-Level Architecture

```
┌─────────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────────┐
│ Schedulers  │ ───▶ │ Workers  │ ───▶ │ Normalization│ ───▶ │ Persistence  │
│ (Cloud      │      │ (Scraper │      │  & Validation│      │  (Postgres + │
│  Scheduler, │      │  Pods)   │      │   (Zod)      │      │   Facets)    │
└─────────────┘      └──────────┘      └──────────────┘      └──────────────┘
                           │                    │                     │
                           ▼                    ▼                     ▼
                     Source fetchers      Shared helpers        Ingestion logs
                     (HTTP, HTML, API)    (normalizers)         & metrics
```

- **Schedulers** trigger jobs (cron, workflow engine). Each job describes the source, cadence, and limits.
- **Workers** execute scraper modules. Each module fetches data, handles auth, and outputs raw records.
- **Normalization** applies canonicalization (`normalizers`, Zod validation, dedupe, currency conversion).
- **Persistence** stores final bundles, history snapshots, and updates facets/materialized views.

## 3. Technology Options

| Layer        | Recommendation                                    | Notes                                                                 |
|--------------|----------------------------------------------------|-----------------------------------------------------------------------|
| Runtime      | Node.js 20 (TypeScript) with Playwright/Puppeteer  | Reuse TypeScript types/normalizers, easy sharing with frontend.       |
| HTTP Client  | `undici` / `axios`                                 | For JSON APIs.                                                        |
| HTML Parsing | `@playwright/test` (headless) + `cheerio`           | Supports JS-heavy sites, fallback to cheerio for simple HTML.        |
| Job runner   | Temporal, BullMQ, or AWS/Lambda + EventBridge      | Choose based on hosting environment.                                 |
| Config       | YAML/JSON recipes per source stored in Git         | Keeps scrape parameters version-controlled.                           |
| Secrets      | Vault/KMS or platform secret manager               | Store credentials for API-based sources securely.                     |

## 4. Scraper Module Contract

Each scraper implements:

```ts
export interface ScrapeContext {
  logger: Logger;
  request: typeof fetch;
  runId: string;
  source: string;
  options: Record<string, unknown>;
}

export interface Scraper {
  fetch(context: ScrapeContext): Promise<ScrapedBundle[]>;
}
```

- `options` allow per-source overrides (regions, campaign IDs).
- `ScrapedBundle` is a loose shape that at minimum contains name/provider/link, plus source metadata.
- Normalization phase maps `ScrapedBundle -> Bundle`.

## 5. Ingestion Pipeline Steps

1. **Job Start**  
   - Scheduler enqueues job payload `{ source: 'spotify', runId }`.  
   - Worker creates `ingestion_runs` row with status `running`.

2. **Fetch & Extract**  
   - Scraper fetches data using configured strategy (API call, HTML crawl, sitemap).  
   - If pagination, loops until limit or exhaustion.  
   - Emits raw `ScrapedBundle` items with `rawPayload`.

3. **Normalize**  
   - Apply shared helpers: `canonicalizeServiceName`, currency conversions, dedupe.  
   - Translate to canonical `Bundle` shape; compute `data_hash` (e.g., SHA-256 of sorted fields).  
   - Validate with Zod; collect errors for logging.

4. **Upsert**  
   - For each valid bundle:  
     - `INSERT ... ON CONFLICT (id)` update price, metadata, `updated_at`, `data_hash`.  
     - If `data_hash` changes, append entry in `bundle_history`.  
   - Track counts (`bundles_ingested`, `bundles_failed`).

5. **Deactivate Missing**  
   - Mark bundles from the same provider/source as inactive if they were not seen in this run for N consecutive runs (configurable).  
   - Optionally send alerts for deletions.

6. **Post-Processing**  
   - Refresh `bundle_facets` materialized view.  
   - Update `ingestion_runs` row with `status` and metrics.  
   - Emit metrics/events to monitoring.

## 6. Error Handling & Retries

- Implement exponential backoff with jitter for transient network failures.  
- Guard against ban/anti-bot measures: respect `robots.txt`, throttle requests, randomize user agents.  
- On critical failure, mark run as `failed` and alert the on-call channel.  
- Implement circuit breakers per source to avoid repeated failures.

## 7. Observability & Alerting

### 7.1 Logging
- Emit structured JSON logs with at least: `runId`, `source`, `stage` (`fetch`, `normalize`, `persist`), `bundleId`, `status` (`success`, `retry`, `fail`), `durationMs`, `attempt`.  
- Tag logs with `ingestion_runs.id` so operators can cross-reference database records.  
- Centralize logs in ELK/OpenSearch or Cloud Logging with saved views per source.

### 7.2 Metrics
Expose Prometheus-style metrics (or equivalent) from workers:
- `scrape_duration_seconds` (histogram by `source`).  
- `scrape_bundles_collected_total` (counter).  
- `scrape_bundles_dropped_total` (counter with reason labels: `validation`, `duplicate`, `inactive`).  
- `scrape_failures_total` (counter with reason).  
- `queue_jobs_ready` / `queue_jobs_active` / `queue_jobs_failed` for BullMQ/Redis.  
- `bundle_staleness_seconds` (gauge = now - `last_verified_at` per provider).

### 7.3 Dashboards & Alerts
- **Dashboard panels**: jobs per hour by source, success/failure rate, queue depth, median scrape duration, bundle recency heatmap.  
- **Alert thresholds** (hooked into PagerDuty/Slack/Email):  
  - `scrape_failures_total` increases by N within a 10-minute window per source.  
  - `bundle_staleness_seconds` exceeds SLA (e.g., >48h for high-priority providers).  
  - Queue depth > configurable threshold for >15 minutes (indicates backlog).  
  - Materialized view refresh failures.  
- Provide runbook links directly from alerts (grafana annotation + docs).

### 7.4 Run Auditing
- Persist status changes in `ingestion_runs` (including `bundles_ingested`, `bundles_failed`, `duration_seconds`).  
- Keep raw scraper payload in `raw_payload` column for replay/debug (with TTL via partitioning or separate storage).  
- Implement CLI/API to fetch a run summary (`GET /ingestion-runs/{id}`) and drill into failed bundles.

## 8. Onboarding a New Source

1. Add entry to `sources.yml` with URL, schedule, auth config, parsing hints.  
2. Implement scraper module `src/scrapers/{source}.ts`.  
3. Add unit tests using recorded fixtures.  
4. Register job in scheduler.  
5. Deploy and monitor first runs in a staging environment before promoting to production.

## 9. Shared Validation Package

Create a shared package (e.g., `packages/shared`) consumed by both frontend and ingestion services to eliminate schema drift:

- `packages/shared/src/types.ts` – exports `Bundle`, `CurrencyCode`, `SearchParams`.
- `packages/shared/src/validation.ts` – exports the Zod `bundleSchema`, helper to validate arrays (`validateBundles`).
- `packages/shared/src/normalizers.ts` – canonicalize services, normalize text, format currency (existing frontend implementations moved here).
- `packages/shared/src/search.ts` – optional reuse of search scoring if needed server-side.

**Implementation steps:**
1. Convert the current frontend `src/lib/{normalizers,validation,search}.ts` into a package under a workspaces-aware monorepo (`package.json` → `workspaces: ["packages/*", ""]`).  
2. Frontend imports from `@smartbundle/shared/normalizers` etc., while the ingestion service adds the package as a dependency (either via local workspace or published npm package).  
3. Unit tests reside alongside the shared code (`packages/shared/__tests__`).  
4. Add build step to transpile the shared package (tsup/tsc).  
5. Use semantic versioning when publishing to avoid breaking ingest or frontend unexpectedly.

This setup guarantees the same validation/normalization logic runs in both environments, preventing divergence.

## 10. Security & Compliance

- **Secrets**: Store API keys and credentials in a managed secret store (Vault, AWS Secrets Manager, GCP Secret Manager). Rotate keys regularly and audit access.  
- **Traffic Hygiene**: Respect `robots.txt`, apply IP rotation only where permitted, and configure rate limits per domain/source to avoid bans.  
- **TLS & Certificates**: Enforce HTTPS for all outbound calls. Validate certificates (disable insecure TLS options).  
- **Access Control**: Use least-privilege IAM policies for ingestion workers. Separate roles for reading vs. mutating the database.  
- **Attribution & Legal**: Record origin URLs in `raw_payload`/metadata, surface attribution requirements to the UI, and maintain a list of sources requiring manual approvals.  
- **PII Handling**: Avoid scraping personal data. If unavoidable, document the lawful basis, apply hashing/anonymization, and ensure compliance with GDPR/CCPA policies.  
- **Audit & Logging**: Log administrative actions (manual replays, overrides). Preserve logs according to retention policy (e.g., 90 days).  
- **Vulnerability Management**: Pin dependency versions, run dependabot/snyk scans, and patch promptly.  
- **Disaster Recovery**: Schedule regular database backups (point-in-time restore), test restores, and version schemas with migrations.

## 10. Scheduling & Orchestration Strategy

We need orchestration that can handle dozens of heterogeneous sources, fan-out retries, and manual replays. Three viable approaches:

| Option | Pros | Cons | Recommended Usage |
|--------|------|------|-------------------|
| **Managed cron + serverless functions** (e.g., Cloud Scheduler + Cloud Functions / AWS EventBridge + Lambda) | Zero infrastructure to maintain, straightforward to scale elastically, pay-per-run | Harder to coordinate multi-step workflows, limited visibility into job DAGs, cold-start latency for long crawls | Lightweight sources with simple fetch → normalize → persist flow |
| **Queue + worker pool** (e.g., BullMQ on Redis, RabbitMQ, SQS) | Fine-grained control over concurrency, retries, dead-lettering; supports long-running workers; easy to add manual replays | Requires operating the queue and workers, less native workflow visualization | Primary recommendation for SmartBundle ingestion. Each scrape job enqueues tasks consumed by Node workers |
| **Workflow engines** (Temporal, Airflow, Prefect) | Built-in DAG visualization, human-friendly replays, strong SLA tooling | Higher operational overhead, steeper learning curve, may be overkill for mid-sized pipeline | Reserve for future when number of sources and dependencies explodes |

### Decision Criteria
- **Scale**: near-term volume (<100 sources, <= hourly cadence) favors queue + worker pool.  
- **Task duration**: scrapers can be long-running (several minutes) which aligns better with persistent workers.  
- **Observability**: instrument queue metrics (jobs queued, failed, duration) plus ingestion tables.  
- **Portability**: queue-based system can deploy on any infrastructure (Docker/Kubernetes/VMs) without managed service lock-in.

### Baseline Plan
- Adopt **BullMQ + Redis** (or AWS SQS if hosted on AWS) for job dispatch.  
- Run worker pods in Kubernetes (or PM2-managed Node processes) with horizontal auto-scaling keyed to queue depth.  
- Create a small “scheduler” service that reads `sources.yml` and enqueues jobs on cron-like intervals.  
- Expose `/jobs` admin API (or CLI) for manual replays (`enqueue source=disney`).  
- Store job metadata (runId, source, status) in `ingestion_runs` table for cross-reference.  
- Later, upgrade to full Temporal/Prefect only if dependency chains or branching workflows become complex.

## 11. Deliverables

- Scaffolding repository `smartbundle-ingest` with TypeScript runtime, CLI, and integration tests.  
- Shared package exporting `Bundle` types, normalizers, and Zod schema for server use.  
- Deployment manifests (Dockerfile, Helm chart, or serverless config).  
- Runbooks for operators (refreshing mat view, replaying runs, adding sources).
