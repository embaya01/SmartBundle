# SmartBundle

SmartBundle is a production-ready React + TypeScript web app for browsing curated subscription bundles (streaming, music, carrier deals, and more). The UI runs entirely on the client today, loading validated mock data, and the architecture makes it easy to plug in REST or Cloud Functions scrapers later without touching the UI layer.

## Highlights
- Global search with a 300ms debounce across bundle name, services, and provider, backed by simple prefix/substring/fuzzy scoring.
- Faceted filters for price, region, provider, and tags with AND logic and client-side facet counts.
- Remembers your latest search query and filters via localStorage so the experience picks up where you left off.
- Accessible detail sheet with keyboard support (Enter to open, Esc to close) and a prominent "View Deal" link that emits analytics.
- Responsive Tailwind UI with loading shimmer, empty, and error states; cards surface services, tags, pricing, provider, and regions at a glance.
- Data provider abstraction with a working `MockDataProvider`, shared Zod validation, normalization helpers, and a documented `RestDataProvider` stub.
- Pluggable analytics pipeline (console by default, `RestAnalyticsProvider` when `VITE_ANALYTICS_ENDPOINT` is defined).

## Tech Stack
- React 19 + TypeScript + Vite
- TailwindCSS 3 for styling
- Zod for runtime validation
- Local JSON fixtures (`src/data/bundles.json`) seeded with real-world offers

## Getting Started
```bash
npm install
npm run dev     # start development server
npm run build   # type-check and build for production
npm run test    # run unit tests (Vitest)
npm run preview # preview production build
```

## Deploy (GitHub Pages)
This repo includes a GitHub Actions workflow that builds on pushes to `main` and deploys `dist/` to GitHub Pages.

1) In GitHub: **Settings → Pages**
2) Set **Source** to **GitHub Actions**
3) Push/merge to `main` and the site will publish.

Note: `vite.config.ts` sets `base: "/SmartBundle/"` for Pages. If you deploy somewhere else (Vercel/Netlify), remove that.

To forward analytics events to an API endpoint, set `VITE_ANALYTICS_ENDPOINT` in your environment (e.g., `.env`) and the app will switch to the REST analytics provider automatically. Otherwise events are logged to the console and `window.dataLayer`.

## Project Structure
```
src/
  components/        # SearchBar, Filters, BundleGrid, DetailSheet, states
  data/              # Mock seed data (bundles.json)
  lib/               # Utilities: debounce, search, normalizers, validation
  pages/             # App shell and layout composition
  providers/         # DataProvider interface plus mock and REST implementations
  types.ts           # Shared domain types
```

## Data Providers
- `MockDataProvider` loads `bundles.json`, validates it with Zod (`bundleSchema`), caches the data, and returns search results/facets from memory.
- `RestDataProvider` is a ready-to-wire stub describing the planned endpoints:
  - `GET /api/bundles/search` - list responses with query params from `SearchParams`
  - `GET /api/bundles/:id` - fetch a single bundle
  - `GET /api/bundles/facets` - regions, providers, tags, price bounds

Swap providers by changing the instantiation in `src/pages/App.tsx`.

## Backend API & Persistence (work in progress)
- The first cut of the REST contract and database schema is documented in [`docs/api-contract.md`](docs/api-contract.md).
- Planned backend stack: REST service exposing the endpoints above, backed by PostgreSQL with bundle + history tables and a materialized view for facets.
- Frontend `RestDataProvider` will consume the documented DTOs once the service is available; the current mock provider already mirrors the payload shape.
- The ingestion layer architecture (scraper framework, normalization pipeline, scheduling options, observability, security, shared package) is outlined in [`docs/scraper-framework.md`](docs/scraper-framework.md).
- Execution milestones for the backend/ingestion build-out are tracked in [`docs/backend-roadmap.md`](docs/backend-roadmap.md).

## Search & Filters
- Text search is case-insensitive over name, provider, and services.
- Scoring favors prefix matches, then substring matches, then a lightweight Levenshtein distance for fuzzy hits.
- Filters apply AND logic; values inside each category (regions/providers/tags) behave as OR selections.
- URL query params (`?q=&region=US&min=0...`) mirror UI state for shareable and back-button friendly results.

## Future Integration Notes
- Replace the mock provider with a REST-backed implementation once scraper endpoints are live.
- Wire analytics to a production telemetry system by pointing `VITE_ANALYTICS_ENDPOINT` at the desired REST endpoint.
- Extend bundle validation with additional metadata (promo expirations, contract terms, device support, etc.).

## License
MIT (c) SmartBundle contributors
