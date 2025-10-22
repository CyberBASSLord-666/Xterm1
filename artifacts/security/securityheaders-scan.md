# SecurityHeaders.com Scan — 2024-05-11

- **URL**: https://polliwall.app/
- **Grade**: A+
- **Directives Verified**:
  - `strict-transport-security: max-age=63072000; includeSubDomains; preload`
  - `content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://image.pollinations.ai; connect-src 'self' https://image.pollinations.ai https://generativelanguage.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`
  - `x-content-type-options: nosniff`
  - `x-frame-options: DENY`
  - `referrer-policy: strict-origin-when-cross-origin`
  - `permissions-policy: geolocation=(), microphone=(), camera=(), payment=(), interest-cohort=()`
- **Remediation Notes**: None — configuration meets hardened baseline. Verification screenshot archived internally under Ops vault.
