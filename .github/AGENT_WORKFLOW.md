# PolliWall (Xterm1) - Agent-Driven Development Workflow
#
# This document defines the unabridged, high-rigor process for all
# development, refactoring, and documentation tasks. It is enforced
# by the project's full team of specialized agents.
#
# Adherence to this workflow is not optional. It is the sole mechanism
# for achieving a "production-ready finished product" on every commit.
# ----------------------------------------------------------------------

## PART 1: Operation: Bedrock (Documentation & Conformance Pass)

This is a one-time, foundational operation to establish a new, "best-practice" baseline for the *entire* repository. It must be executed before any new feature work begins.

### Phase 1.1: Foundational Cleanup & Hardening

1.  **Codebase Janitorial Pass:**
    * **Agent:** `my-janitor`
    * **Action:** Executes a full repository scan. It will identify and create pull requests to remove all dead code, unused dependencies, stale comments, and duplicated logic. Its goal is to create a clean slate *before* documentation begins.

2.  **Configuration & CI/CD Audit:**
    * **Agent:** `devops-engineer`
    * **Action:** Audits *every* file in `.github/workflows/` and all deployment configurations (`vercel.json`, `_headers`, etc.). It will ensure all GitHub Actions are pinned to secure versions, `npm ci` is used correctly, and all cache/build steps are optimized.

3.  **Security Baseline Audit:**
    * **Agent:** `security-specialist`
    * **Action:** Audits all deployment configurations (`vercel.json`, `security-headers.json`, etc.) to ensure all security headers (CSP, HSTS, etc.) are present, correct, and identical across all targets. It will also update `.github/codeql-config.yml` for maximum scan coverage.

### Phase 1.2: The Great Documentation Rewrite

This phase proceeds from the assumption that **all existing documentation is deprecated.**

1.  **Declaration of Deprecation:**
    * **Agent:** `technical-scribe`
    * **Action:** Deletes the *entire contents* (retaining only the file) of:
        * `API_DOCUMENTATION.md`
        * `ARCHITECTURE.md`
        * `DEVELOPMENT.md`
        * `E2E_TESTING.md`
        * `TEST_COVERAGE.md`
        * `DEPLOYMENT.md`
        * `DEPLOYMENT_SECURITY.md`
        * `docs/XSS_PREVENTION.md`
        * `docs/DEPENDABOT_STRATEGY.md`
    * It will also empty the `[Unreleased]` section of `CHANGELOG.md`.

2.  **Hierarchical Documentation Generation:**
    * This is a collaborative, multi-agent process where documentation is rewritten *from* the code and architectural "best practices," establishing a new, inviolable source of truth.

    * **Step A: Architecture & API:**
        * **Agent:** `lead-architect` (leading) with `technical-scribe` (executing).
        * **Action:** The `lead-architect` performs a comprehensive, file-by-file audit of the *entire* `src/` directory. For each service, component, and utility, it dictates the "best practice" implementation and purpose.
        * The `technical-scribe` uses these directives to generate the new, unabridged `ARCHITECTURE.md` (defining *how* the app is built) and `API_DOCUMENTATION.md` (defining *what* each public-facing class/method/signal does).

    * **Step B: Testing Strategy:**
        * **Agent:** `qa-engineer` (leading) with `technical-scribe` (executing).
        * **Action:** The `qa-engineer` dictates the project's complete testing strategy, covering `jest.config.ts` and `playwright.config.ts`.
        * The `technical-scribe` generates the new, unabridged `E2E_TESTING.md` and `TEST_COVERAGE.md`.

    * **Step C: Security & Deployment:**
        * **Agent:** `security-specialist` & `devops-engineer` (leading) with `technical-scribe` (executing).
        * **Action:** The `security-specialist` dictates the complete data sanitization and vulnerability remediation policy. The `devops-engineer` dictates the complete CI/CD and deployment pipeline.
        * The `technical-scribe` generates the new, unabridged `DEPLOYMENT.md`, `DEPLOYMENT_SECURITY.md`, `docs/XSS_PREVENTION.md`, and `docs/DEPENDABOT_STRATEGY.md`.

    * **Step D: Development Lifecycle:**
        * **Agent:** `code-assistant` (leading) with `technical-scribe` (executing).
        * **Action:** The `code-assistant` dictates the "day-to-day" developer setup, including `npm run` scripts and `angular.json` structure.
        * The `technical-scribe` generates the new, unabridged `DEVELOPMENT.md`.

### Phase 1.3: Code Conformance Refactoring

With the new "best practice" documentation locked, the codebase is now forced to conform.

1.  **Identify Non-Conformance:**
    * **Agent:** `lead-architect`
    * **Action:** Scans the *entire* codebase *against* the newly generated documentation. It identifies all files and code blocks that violate the new "source of truth" (e.g., a component not using `LoggerService`, a utility without 100% test coverage, a manual `fetch` call). It generates a complete "Non-Conformance Report."

2.  **Execute Refactoring:**
    * **Agent:** `my-janitor`
    * **Action:** Takes the "Non-Conformance Report" from the architect and performs a complete, unabridged refactoring of the *entire codebase* to bring it into 100% compliance with the new documentation.

3.  **Update Test Suites:**
    * **Agent:** `qa-engineer`
    * **Action:** Follows the `my-janitor`'s refactoring, updating *all* corresponding Jest and Playwright tests to match the new, compliant code. It *must* run `npm test` and `npm run e2e:headless` until all tests pass.

4.  **Final Architectural Approval:**
    * **Agent:** `lead-architect`
    * **Action:** Performs a final review. It approves the refactored code and tests, certifying that the codebase is now 100% compliant with the documentation.

**Operation: Bedrock is now complete. The repository is in a production-ready, fully documented, and compliant state.**

---

## PART 2: The Production Line (Ongoing Feature Workflow)

This is the standard, cyclical workflow for adding any new, feature-complete, production-ready functionality to the project.

1.  **Feature Initiation (The Plan):**
    * **Agent:** `lead-architect`
    * **Action:** Upon receiving a new feature request (e.g., "Add 'Favorites' collection"), the architect creates a **"Plan of Record."** This is a detailed, multi-step plan that specifies:
        * What new components, services, and directives to create.
        * Which *existing* core services (`LoggerService`, `ValidationService`, etc.) *must* be injected and used.
        * The exact data structures (e.g., Angular Signals) to be used.
    * This plan is the "ticket" for the `code-assistant`.

2.  **Implementation (The Code):**
    * **Agent:** `code-assistant`
    * **Action:** Takes the architect's "Plan of Record" and generates the *complete, unabridged* application code. It *must* adhere perfectly to the plan. It *does not* generate tests.

3.  **Quality Assurance (The Tests):**
    * **Agent:** `qa-engineer`
    * **Action:** Takes the new code from the `code-assistant`. It generates the 100% coverage Jest unit tests (`.spec.ts`) and the full-flow Playwright E2E tests (`.spec.ts`) for the new feature. It runs all tests until they pass.

4.  **Security Audit (The Hardening):**
    * **Agent:** `security-specialist`
    * **Action:** Audits the new code and tests. It *specifically* analyzes any new user input fields or API interactions. It *must* ensure the new code uses `ValidationService` for all inputs and *must* update any security-related configurations (`vercel.json`, etc.) if the new feature requires them.

5.  **Architectural Review (The Gate):**
    * **Agent:** `lead-architect`
    * **Action:** Performs a final review of the code *and* tests. It compares the implementation against its original "Plan of Record."
        * If it matches 100% and adheres to all directives, it is **Approved**.
        * If it deviates, it is **Rejected** and sent back to the `code-assistant` for rework.

6.  **Documentation (The Scribe):**
    * **Agent:** `technical-scribe`
    * **Action:** *After* the feature is "Approved," the scribe updates all relevant documentation. This is non-negotiable and *must* include:
        * A new entry in `CHANGELOG.md` under `[Unreleased]`.
        * New entries in `API_DOCUMENTATION.md` for the new components/services.
        * Updates to `E2E_TESTING.md` describing the new user flow.
        * Updates to `ARCHITECTURE.md` if the feature introduced a new pattern.

7.  **Deployment (The Release):**
    * **Agent:** `devops-engineer`
    * **Action:** Performs a final check. It ensures the new feature has not broken any CI/CD workflows (`ci.yml`), that bundle size is acceptable (`bundle-size.yml`), and that no new environment variables are needed for deployment.

8.  **Pull Request:**
    * **Agent:** `code-assistant`
    * **Action:** Creates the final pull request, which now contains:
        1.  The feature-complete application code.
        2.  The 100% coverage Jest tests.
        3.  The complete Playwright E2E tests.
        4.  All updated documentation (`CHANGELOG.md`, `API_DOCUMENTATION.md`, etc.).
    * This pull request is now, by definition, **Production Ready.**
