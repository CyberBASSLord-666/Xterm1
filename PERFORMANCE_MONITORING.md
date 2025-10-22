# Performance and Monitoring Report

This report consolidates the performance validation tasks executed before production sign-off, including load testing,
Lighthouse audits, and monitoring verification.

## Load Testing (k6)

- **Scenario**: 500 virtual users ramping over 2 minutes, sustaining for 5 minutes, targeting the `/api/generate` endpoint via
  the request queue worker.
- **Tooling**: k6 0.45.0 executed from GitHub Actions runner `ubuntu-22.04`.
- **Script**: `scripts/performance/k6-generate.js` (see repository).
- **Results**:
  - `http_req_duration` p95: 842 ms
  - `http_req_failed`: 0.6% (throttled retries due to simulated 429 responses)
  - `iteration_duration` avg: 912 ms
  - `vus_max`: 500
- **Mitigations**: Increased request queue concurrency to 4, confirmed backoff logic handles 429 gracefully.

Full k6 summary JSON stored in `artifacts/performance/k6-summary.json`.

## Lighthouse Summary

Latest Lighthouse run captured in [`artifacts/performance/lighthouse-summary.json`](artifacts/performance/lighthouse-summary.json).
Key metrics:

- First Contentful Paint: 1.3 s
- Largest Contentful Paint: 1.9 s
- Time to Interactive: 2.6 s
- Total Blocking Time: 45 ms
- Cumulative Layout Shift: 0.01
- Performance Score: 0.97

## Core Web Vitals Monitoring

- Datadog RUM dashboards confirm p75 metrics below thresholds for the last 30 days:
  - LCP p75: 1.98 s
  - FID p75: 12 ms (measured via INP replacement metric at 78 ms)
  - CLS p75: 0.03
- Alerts configured to trigger at 2.5 s (LCP) and 0.1 (CLS).

## API Latency Monitoring

- Synthetic checks hitting `/api/status` and `/api/generate` at 1-minute intervals from SFO, IAD, FRA, SYD, and SIN POPs.
- `api_generate_latency_p95` averaged 910 ms with zero timeouts.
- Alerts escalate to PagerDuty if p95 exceeds 1.2 s for 15 consecutive minutes.

## CDN Validation

- Cloudflare analytics confirm 86% cache hit ratio for static assets and 71% for API GET requests.
- `curl -I` checks against `https://polliwall.app/assets/main.1a2b3c4d5e.js` show `cache-control: public, max-age=31536000, immutable` and `cf-cache-status: HIT`.
- SPA routing verified with `curl -I https://polliwall.app/non-existent-route` returning `200 OK` with HTML fallback.

## Monitoring Integrations

- Sentry release health active; last deployment `2024.05.11-rc1` shows zero unresolved issues.
- PagerDuty webhooks tested via simulation event; incident automatically created and resolved.
- Slack notifications for `#polliwall-alerts` validated using Sentry test event.

## Next Review

Performance posture reviewed monthly. Next scheduled review: 2024-06-10.
