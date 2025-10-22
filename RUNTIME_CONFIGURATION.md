# Runtime Configuration and Secret Injection

This document details how PolliWall sources, validates, and refreshes runtime configuration values in production. It is the
canonical reference for Gemini API key management and analytics measurement identifiers referenced throughout the application.

## Sources of Truth

Runtime values are resolved using the priority order enforced in `AppInitializerService.bootstrapSecrets`:

1. `window.__POLLIWALL_RUNTIME_CONFIG__` or `window.__POLLINATIONS_RUNTIME_CONFIG__`
2. Signed meta tags `<meta name="gemini-api-key">` and `<meta name="analytics-measurement-id">`
3. `environment.defaults` defined in `src/environments/environment*.ts`
4. Legacy top-level keys from the environment bundle (maintained for backwards compatibility)

The first non-empty string discovered for each key is normalised and persisted in `ConfigService`.

## Runtime Config Payload

The edge middleware publishes a JSON payload at `/runtime-config.json` with the following structure:

```json
{
  "geminiApiKey": "vault:v1:base64url(ciphertext)",
  "analyticsMeasurementId": "vault:v1:base64url(ciphertext)",
  "issuedAt": "2024-05-12T00:00:00.000Z",
  "expiresAt": "2024-05-12T06:00:00.000Z"
}
```

- Values are encrypted using AES-GCM with a per-session key negotiated via Cloudflare Workers.
- `AppInitializerService.getRuntimeConfiguration` handles empty or malformed payloads by returning an empty object.
- Decryption occurs inside the worker; the browser receives plain text inserted as meta tags.

## Meta Tag Contract

When running behind static hosting that cannot inject runtime JavaScript, PolliWall reads secrets from meta tags. The hosting
platform populates them through HTML rewrites:

```html
<meta name="gemini-api-key" content="pk-live-xxxxx" />
<meta name="analytics-measurement-id" content="G-XXXXXXX" />
```

`AppInitializerService.readMetaTag` trims the content and ignores missing tags to avoid spurious boot failures.

## Failure Handling

- Production builds default `failOnMissingGeminiKey` to `true`. If no key is resolved, the initializer throws and prevents
  application boot. This ensures broken deployments are caught immediately.
- Analytics enablement is gated by `environment.production`. Without a measurement ID, analytics remains disabled and logs a
  structured warning for observability.
- HTTPS enforcement protects secrets in transit when clients are not behind the CDN.

## Key Management

- Production and development keys are segregated. Development builds rely on developer-provided keys stored in `.env.local` files
  that never sync to git.
- Rotation occurs quarterly and on-demand after incidents. The rotation playbook in `OPERATIONS_RUNBOOK.md#secrets-rotation`
  details the Vault update, CDN cache purge, and smoke testing steps.
- Access controls: only members of the `polliwall-ops` group in Vault may read production secrets. Access is logged and rotated
  via short-lived tokens.

## Automated Verification

Unit tests in `src/services/__tests__/app-initializer.service.spec.ts` and `src/services/__tests__/config.service.spec.ts` assert:

- Runtime payloads override defaults
- Meta tag fallbacks work when runtime config is missing
- Empty strings are ignored
- Analytics measurement IDs enable instrumentation only in production

These tests run in CI to prevent regressions to the bootstrapping contract.
