# SmartBundle API Contract & Persistence Plan

This document defines the first iteration of the backend surface that the SmartBundle web app will consume, plus the persistence model that will store bundle data collected by scrapers and partner feeds.

## 1. Service Overview

- **Base URL**: `https://{api-host}/api`
- **Authentication**: To be determined. Initial prototype can run without auth; production should require API keys or OAuth2 client credentials.
- **Content Type**: All responses and request payloads are JSON (`application/json`).
- **Versioning**: Include a `X-SmartBundle-Version: 1` response header. Any backward-incompatible changes must bump the version.

## 2. Resources

### 2.1 `GET /bundles/search`

Search bundles with free-text and faceted filters.

| Query Param    | Type             | Description                                                                                          |
|----------------|------------------|------------------------------------------------------------------------------------------------------|
| `q`            | string           | Optional search string. Case-insensitive.                                                            |
| `priceMin`     | number           | Minimum price filter (inclusive).                                                                    |
| `priceMax`     | number           | Maximum price filter (inclusive).                                                                    |
| `regions`      | string           | Comma-separated region codes. Treated as OR within the list.                                         |
| `providers`    | string           | Comma-separated provider names (case-insensitive).                                                   |
| `tags`         | string           | Comma-separated tag slugs.                                                                           |
| `limit`        | integer (1–100)  | Page size. Default: 24.                                                                              |
| `offset`       | integer (>=0)    | Offset in the result set. Default: 0.                                                                |
| `sort`         | enum             | Optional. `relevance` (default) or `price_asc` / `price_desc` / `recent`.                            |

#### Response `200 OK`

```jsonc
{
  "items": [
    {
      "id": "disney-bundle",
      "name": "Disney Bundle: Disney+ + Hulu + ESPN+",
      "services": ["Disney+", "Hulu", "ESPN+"],
      "price": 14.99,
      "currency": "USD",
      "billingCycle": "mo",
      "regions": ["US"],
      "provider": "Disney",
      "link": "https://www.disneyplus.com/bundle",
      "tags": ["bundle", "family"],
      "summary": "All-in-one streaming bundle from Disney.",
      "isActive": true,
      "lastVerified": "2025-09-05T00:00:00Z",
      "source": "official",
      "scrapeMeta": {
        "firstSeen": "2024-06-02T12:00:00Z",
        "lastSeen": "2025-09-05T00:00:00Z",
        "confidence": 0.94
      }
    }
  ],
  "total": 143,
  "limit": 24,
  "offset": 0
}
```

### 2.2 `GET /bundles/{id}`

Fetch a single bundle by stable identifier.

- **Path Parameter**: `id` (string, slug)

#### Response `200 OK`

Returns the full bundle resource (same shape as in `items[]` above) plus any historical metadata:

```jsonc
{
  "bundle": { ... },
  "history": [
    {
      "price": 12.99,
      "currency": "USD",
      "billingCycle": "mo",
      "capturedAt": "2025-05-01T00:00:00Z"
    }
  ]
}
```

#### Response `404 Not Found`

```json
{
  "error": {
    "code": "BUNDLE_NOT_FOUND",
    "message": "Bundle 'spotify-hulu-student' was not found."
  }
}
```

### 2.3 `GET /bundles/facets`

Return facet options derived from active bundles.

#### Response `200 OK`

```jsonc
{
  "regions": ["AU", "CA", "US"],
  "providers": ["Apple", "Disney", "Spotify", "T-Mobile", "Verizon"],
  "tags": ["annual", "bundle", "carrier", "family", "student"],
  "price": {
    "min": 0,
    "max": 120
  },
  "lastUpdated": "2025-09-12T04:00:00Z"
}
```

## 3. Error Model

All error responses use the following structure:

```jsonc
{
  "error": {
    "code": "QUERY_VALIDATION_FAILED",
    "message": "priceMin must be less than priceMax.",
    "details": [
      { "field": "priceMin", "message": "Must be <= priceMax" }
    ]
  }
}
```

- `code`: Upper snake case machine-readable value.
- `message`: Human-readable explanation (safe to display).
- `details`: Optional array of field-level errors.

HTTP status codes:
- `400` validation errors.
- `404` not found.
- `429` throttled.
- `500` internal errors (with request ID).

## 4. Persistence Plan

### 4.1 Database

Use PostgreSQL 15+ for relational structure + JSONB convenience. Core tables:

```sql
CREATE TABLE bundles (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  services         TEXT[] NOT NULL,
  price_cents      INTEGER NOT NULL CHECK (price_cents >= 0),
  currency         TEXT NOT NULL CHECK (currency IN ('USD','EUR','GBP','CAD','AUD')),
  billing_cycle    TEXT NOT NULL CHECK (billing_cycle IN ('mo','yr')),
  regions          TEXT[] NOT NULL,
  provider         TEXT NOT NULL,
  link             TEXT NOT NULL,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  summary          TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  source           TEXT CHECK (source IN ('official','carrier','partner','aggregator')),
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_hash        TEXT NOT NULL,
  confidence       NUMERIC(4,3) NOT NULL DEFAULT 0.000,
  raw_payload      JSONB
);

CREATE TABLE bundle_history (
  bundle_id   TEXT NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  price_cents INTEGER NOT NULL,
  currency    TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  PRIMARY KEY (bundle_id, captured_at)
);

CREATE INDEX idx_bundles_provider ON bundles(provider);
CREATE INDEX idx_bundles_is_active ON bundles(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_bundles_tags ON bundles USING GIN (tags);
CREATE INDEX idx_bundles_regions ON bundles USING GIN (regions);
```

### 4.2 Materialized Facets

To accelerate `/bundles/facets`, create a materialized view refreshed after each ingestion job:

```sql
CREATE MATERIALIZED VIEW bundle_facets AS
SELECT
  ARRAY(SELECT DISTINCT UNNEST(regions) FROM bundles WHERE is_active) AS regions,
  ARRAY(SELECT DISTINCT provider FROM bundles WHERE is_active) AS providers,
  ARRAY(SELECT DISTINCT UNNEST(tags) FROM bundles WHERE is_active) AS tags,
  MIN(price_cents)::INT AS min_price_cents,
  MAX(price_cents)::INT AS max_price_cents,
  MAX(updated_at) AS last_updated
FROM bundles
WHERE is_active;
```

Expose `min`/`max` in whole currency units by dividing by 100 in the API layer.

### 4.3 Data Ingestion Metadata

Create an ingestion log to track scraper runs:

```sql
CREATE TABLE ingestion_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL,
  started_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMP WITH TIME ZONE,
  status        TEXT NOT NULL CHECK (status IN ('running','success','failed','partial')),
  error_message TEXT,
  bundles_ingested INTEGER NOT NULL DEFAULT 0
);
```

Link each bundle row to the most recent successful run via `updated_at`.

### 4.4 ORM / Data Access

- If using Node.js, Prisma or TypeORM can generate migrations. Maintain Zod schemas in a shared package to validate incoming payloads before persistence.
- Consider denormalizing tags/services into separate tables if analytics queries become expensive.

## 5. Next Steps

1. Implement OpenAPI 3.1 spec for the above contract (`docs/openapi.yaml` or similar).
2. Prototype the REST service with in-memory storage to validate flows.
3. Add migrations for the Postgres schema and integrate with CI/CD.
4. Mirror the request DTOs in the frontend `RestDataProvider`.
