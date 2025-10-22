# Operations Runbook — PolliWall Production

This runbook provides the authoritative operational guide for PolliWall's production environment. It captures deployment
procedures, observability tooling, security posture, and recovery playbooks with exhaustive, step-by-step instructions.

## Table of Contents

1. [Environment Overview](#environment-overview)
2. [Runtime Configuration and Secrets](#runtime-configuration-and-secrets)
3. [Build Artifacts](#build-artifacts)
4. [Bundle Breakdown](#bundle-breakdown)
5. [Security Headers Audit](#security-headers-audit)
6. [CDN Configuration](#cdn-configuration)
7. [DNS](#dns)
8. [Monitoring and Alerting](#monitoring-and-alerting)
9. [Playwright Regression Suite](#playwright-regression-suite)
10. [Manual QA Sign-Off](#manual-qa)
11. [Error Tracking](#error-tracking)
12. [Secrets Rotation](#secrets-rotation)
13. [Incident Response](#incident-response)

---

## Environment Overview

- **Primary hosting**: Vercel Edge Functions + Static Hosting
- **Edge network**: Cloudflare CDN in proxy mode for TLS termination, WAF, rate limiting, and caching
- **Primary domain**: `polliwall.app`
- **Secondary domain**: `polliwall.net` (hot standby, fails over via Cloudflare Load Balancer health checks)
- **Secrets management**: HashiCorp Vault (production) with Vercel/Cloudflare environment variables for deployment-time injection

## Runtime Configuration and Secrets

1. Secrets are stored in Vault under the `kv/polliwall/prod` namespace with the following keys:
   - `GEMINI_API_KEY`
   - `GA4_MEASUREMENT_ID`
   - `SENTRY_DSN`
2. During CI, the `scripts/export-secrets.sh` job reads these values using a short-lived Vault token and publishes them as encrypted Vercel environment variables (`VERCEL_ENV=production`).
3. Vercel injects the variables as build-time secrets while simultaneously emitting runtime configuration through the `runtime-config.json` edge function consumed by the bootstrap script documented in [RUNTIME_CONFIGURATION.md](RUNTIME_CONFIGURATION.md).
4. For client-side runtime injection, the `runtime-config` edge middleware emits `<meta name="gemini-api-key">` and `<meta name="analytics-measurement-id">` tags with encrypted payloads decrypted in-browser using the session key described in the runtime configuration document.
5. Quarterly rotation uses the playbook in [Secrets Rotation](#secrets-rotation).

## Build Artifacts

- Latest production build executed with `npm run build` (Angular CLI 18.1) on 2024-05-12.
- Build logs archived at `artifacts/build/angular-build.log` (contains differential loading summary, CSS budget report, and warnings — currently zero).
- Generated bundle metrics stored in [`artifacts/performance/bundle-report.json`](artifacts/performance/bundle-report.json).
- `.map` files stripped during deployment via Vercel ignore build step (`"generateBuildCommand": "npm run build && node scripts/prune-maps.js"`).

## Bundle Breakdown

Refer to [`artifacts/performance/bundle-report.json`](artifacts/performance/bundle-report.json) for full module distribution. Initial bundle remains under 1 MB parsed, with lazy chunks dedicated to gallery and settings features. Tree shaking validation performed using
`npm run analyze` with `source-map-explorer` output archived.

## Security Headers Audit

- Latest scan performed with [securityheaders.com](https://securityheaders.com/) on 2024-05-11.
- Full transcript captured in [`artifacts/security/securityheaders-scan.md`](artifacts/security/securityheaders-scan.md).
- Cloudflare edge configuration mirrors headers defined in `_headers`, `vercel.json`, and `nginx.conf.example`.
- TLS version enforcement: TLS 1.3 preferred, TLS 1.2 fallback with modern cipher suites (`TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`, `TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384`).

## CDN Configuration

- **Provider**: Cloudflare (zone `polliwall.app`)
- **Caching rules**:
  - `/assets/*`: Cache Everything, Edge TTL 1 year, Browser Cache TTL 1 year, `cache-control: public, max-age=31536000, immutable`
  - `/service-worker.js` and `/ngsw.json`: Edge TTL 1 hour, respect origin headers to allow periodic updates
  - `/api/*`: Bypass cache; rely on origin caching layer and client-side request cache service
- **Page rules**: Always use HTTPS, Opportunistic Encryption enabled, HTTP/2 + HTTP/3 enabled
- **Rate limiting**: `POST /api/generate` limited to 120 requests per minute per IP; bursts allowed due to request queueing logic

## DNS

- **Registrar**: Cloudflare Registrar
- **Records**:
  - `A @` → Vercel edge IP alias (managed by CNAME flattening)
  - `CNAME www` → `cname.vercel-dns.com`
  - `A failover` → Backup static hosting bucket
- Zone export attached as `artifacts/security/dns-zone-2024-05-11.txt`.

## Monitoring and Alerting

- **APM**: Datadog RUM + Synthetic checks
  - RUM instrumentation configured in `PerformanceMonitorService` streaming Core Web Vitals and custom events (`app_init`, `gallery_sync`, `generation_start`, `generation_complete`).
  - Synthetic monitors hitting `/healthz` and `/api/status` every 60 seconds from 5 regions.
- **Alerting thresholds**:
  - Error rate > 2% over 5 minutes → PagerDuty P1
  - LCP p75 > 2500 ms over 30 minutes → PagerDuty P2
  - API latency p95 > 1200 ms → PagerDuty P2
- **Log aggregation**: Cloudflare logs shipped to BigQuery via Logpush; retention 13 months.

## Playwright Regression Suite

- Executed nightly via GitHub Actions matrix (Chromium, Firefox, WebKit) and weekly on BrowserStack real devices (Pixel 7, iPhone 14 Pro, iPad Air).
- Results exported to `artifacts/test/playwright-summary.xml` in JUnit format.
- Tests cover onboarding, prompt submission, gallery CRUD, analytics opt-in, offline mode, and PWA install prompts.

## Manual QA

- QA sign-off performed on 2024-05-11 following release candidate `2024.05.11-rc1`.
- Exploratory checklist includes:
  - Prompt submission success/failure
  - Network interruption handling
  - Keyboard navigation and screen reader compatibility (NVDA 2023.3, VoiceOver iOS 17.4)
  - Mobile gestures for gallery interactions
- Evidence archived as annotated screenshots in Ops vault.

## Error Tracking

- **Provider**: Sentry SaaS (organization `polliwall`)
- Release health tied to git SHA through `SENTRY_RELEASE` environment variable.
- Sample rate: 0.4 for production, 1.0 for staging.
- Alert rules:
  - New issue of level `error` or higher → PagerDuty P1
  - Regression of previously resolved issue → Slack `#polliwall-alerts`
- Breadcrumbs enriched with analytics event IDs to support cross-system tracing.

## Secrets Rotation

1. Rotate Gemini API key via Pollinations console.
2. Update Vault secret `kv/polliwall/prod/GEMINI_API_KEY` with the new value.
3. Trigger GitHub Actions workflow `Rotate Secrets` which:
   - Syncs Vault to Vercel + Cloudflare
   - Invalidates CDN caches for `/runtime-config.json`
   - Posts rotation confirmation to `#polliwall-operations`
4. Validate by running `npm run smoke:prod` (invokes health check and verifies `AppInitializer` receives the new key).

## Incident Response

- **Primary contact**: on-call engineer (see PagerDuty schedule `PolliWall Ops`)
- **Severity definitions**:
  - P0: Production outage, no wallpaper generation possible
  - P1: Core feature degraded (generation latency > 30s, authentication failure)
  - P2: Non-core feature issues (gallery sync delays)
- **Runbooks**:
  - P0: Initiate incident in PagerDuty, fail over to backup domain, post status page update
  - P1: Throttle Pollinations queue using `scripts/update-rate-limit.ts`, notify stakeholders
  - P2: Create Jira issue, schedule fix, communicate via release notes
- **Post-incident**: Mandatory blameless retrospective within 48 hours with action items tracked in Jira
