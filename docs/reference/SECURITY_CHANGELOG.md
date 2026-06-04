# Security Changelog

> Dedicated history of security control changes, audits, and remediation work.

---

## Quarterly Audit Entries

### 2026-Q2

- Added CSP violation reporting directives (`report-uri`, `report-to`) across deployment header configurations.
- Added `Reporting-Endpoints` header mappings for CSP telemetry endpoint `/api/csp-report`.
- Introduced runtime CSP monitoring service (`CspMonitoringService`) to capture `securitypolicyviolation` events and forward reports.
- Tightened CI security gates with explicit `security:validate` execution in CI and Security workflows.
- Added quarterly scheduled workflow `.github/workflows/security-docs-audit.yml` for security documentation governance.

---

## Recording Rules

- Record all security-affecting configuration changes in this file as part of the same PR.
- Include quarter, summary, and impacted controls (CSP, headers, validation, dependencies, CI).
- Keep entries append-only for audit traceability.
