# GitHub Copilot Instructions for Xterm1

## Repository & Domain Context

Xterm1 is a production-grade, browser-based terminal and tooling experience implemented as a **modern TypeScript web application**. The repository has been through **Operation Bedrock** and a comprehensive **Production Line** definition, as documented in:

- `DOCUMENTATION_INDEX.md`
- `PRODUCTION_READINESS_REPORT.md`
- `OPERATION_BEDROCK_COMPLETION.md`
- `OPERATION_BEDROCK_SUMMARY.md`
- `PRODUCTION_LINE_GUIDE.md`
- `PRODUCTION_LINE_EXAMPLE_ANALYTICS_DASHBOARD.md`
- `AGENT_WORKFLOW_EXECUTION_LOG.md`
- `.github/AGENT_WORKFLOW.md`

All of these documents are **authoritative** and must be treated as the **source of truth** when there is any ambiguity.

The original PolliWall-specific Angular wording in older docs has been repurposed to describe this repository. Copilot must **mentally substitute**:

- "PolliWall" → **Xterm1** (the project in this repo)
- Angular-component examples → **framework-agnostic patterns** implemented in this codebase (React/TypeScript + PWA + Tailwind)

Where the docs talk about Angular specifics (Signals, `@Component`, `ngOnInit`, etc.), treat them as **design-level patterns** and apply them idiomatically in React/TypeScript or other technologies that actually exist in this repository.

---

## Technology Stack Alignment

From `package.json`, `index.tsx`, `tsconfig.json`, `tailwind.config.js`, `playwright.config.ts`, `jest.config.ts`, and the rest of the codebase, the **actual stack** for Xterm1 is:

- **Language**: TypeScript (strict mode enabled, see `tsconfig.json`)
- **Runtime / UI**:
  - React + TypeScript SPA with entry in `index.tsx`
  - Browser-based application with PWA behavior (`manifest.webmanifest`, `ngsw-config.json`)
- **Styling**:
  - Tailwind CSS (configured in `tailwind.config.js`)
  - Global styles in `styles.css`
- **Testing**:
  - Jest for unit tests (`jest.config.ts`, `setup-jest.ts`)
  - Playwright for E2E tests (`playwright/`, `playwright.config.ts`)
- **Tooling**:
  - Node + npm scripts in `package.json`
  - Git hooks via Husky (see `.husky/`)
- **Security / Deployment**:
  - Security headers via `_headers`, `security-headers.json`, `vercel.json`, `.htaccess`, `nginx.conf.example`
  - Multi-platform deployment options described in `DEPLOYMENT.md` & `DEPLOYMENT_SECURITY.md`

Copilot must align all suggestions with **this actual stack**, not with the older Angular-only wording that appears in some long-form docs.

---

## General Principles

1. **Documentation is Source of Truth**  
   Before modifying code or suggesting patterns, consult:
   - `DOCUMENTATION_INDEX.md` for where to look
   - `ARCHITECTURE.md` / `ARCHITECTURE_NEW.md` for structural patterns
   - `DEVELOPMENT.md` / `DEVELOPMENT_NEW.md` for workflows
   - `API_DOCUMENTATION.md` / `API_DOCUMENTATION_NEW.md` for services and APIs
   - `TEST_COVERAGE.md`, `E2E_TESTING.md` for testing standards
   - `PRODUCTION_READINESS_REPORT.md`, `QUALITY_METRICS.md` for quality targets
   - `DEPLOYMENT*.md`, `DEPLOYMENT_SECURITY.md`, `docs/XSS_PREVENTION.md`, `docs/DEPENDABOT_STRATEGY.md` for operational & security constraints

   If code diverges from these documents, **prioritize the documentation** and adjust code accordingly, unless the divergence is clearly intentional and documented.

2. **Production-Grade Quality by Default**  
   All suggestions and generated code must:
   - Respect TypeScript strictness (no implicit `any`, careful nullability)
   - Use clear, explicit types and interfaces
   - Favor pure, testable functions and small, well-defined modules
   - Include robust error handling, logging, and safe defaults

3. **No Regressions in Security, Performance, or Accessibility**  
   - Never weaken security headers, CSP, validation, or XSS defenses
   - Do not introduce blocking, heavy computations on the main thread without justification
   - Maintain or improve accessibility (WCAG 2.1 AA) as documented in `QUALITY_METRICS.md` and testing docs

---

## TypeScript & Code Style

Follow the conventions implicit in `tsconfig.json`, `.eslintrc.json`, `prettier` configuration, and existing code.

- **Strict TypeScript**:
  - `strict` is enabled; all new code must compile under strict settings.
  - Avoid `any`. Prefer explicit types, generics, or `unknown` plus type guards.
  - Explicit return types for exported functions and public methods.

- **Error Handling**:
  - Wrap async operations in `try/catch` at appropriate boundaries.
  - Surface errors to a centralized error/logging mechanism where it exists.
  - Never leak secrets or sensitive data into logs.

- **Async Patterns**:
  - Use `async/await` rather than raw Promise chains.
  - Model long-running tasks with explicit loading and error state.
  - For fire-and-forget behavior in event handlers, use `void` prefix to signal intentional non-awaiting: `void doSomethingAsync();`.

- **Structure & Naming**:
  - Keep modules cohesive; one primary responsibility per file.
  - Follow existing naming patterns in each directory (e.g., `*.service.ts`, `*.spec.ts`, `*.config.ts`).
  - Co-locate small, non-shared types with their implementations; promote to `types/` only when reused.

---

## React & Component Patterns (Adapting Architectural Intent)

The long-form architecture docs talk about Angular components, Signals, `computed()`, and lifecycle hooks. For this repository, **adapt those patterns into idiomatic React+TS**:

- Use **function components** with hooks instead of Angular classes.
- Use `useState`, `useReducer`, or custom hooks for local component state.
- Use `useMemo` and `useCallback` for derived values and stable functions (conceptual equivalent of `computed()`).
- Use `useEffect` for side effects and cleanup (conceptual equivalent of `ngOnInit` + `ngOnDestroy`).
- Favor composition and hooks for shared state (instead of Angular services) while still respecting the service boundaries documented in `API_DOCUMENTATION.md`.

Example pattern:

```tsx
import React, { useEffect, useMemo, useState } from 'react';

interface TerminalProps {
  initialCommand?: string;
}

export function Terminal({ initialCommand }: TerminalProps): JSX.Element {
  const [history, setHistory] = useState<string[]>([]);
  const [input, setInput] = useState(initialCommand ?? '');
  const [isRunning, setIsRunning] = useState(false);

  const isEmpty = useMemo(() => history.length === 0, [history]);

  async function handleSubmit(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || isRunning) return;

    setIsRunning(true);
    try {
      setHistory(prev => [...prev, trimmed]);
      setInput('');
      // TODO: dispatch command to backend/worker
    } catch (error) {
      // TODO: integrate with centralized logging/error handling
    } finally {
      setIsRunning(false);
    }
  }

  useEffect(() => {
    // Setup listeners or side effects here
    return () => {
      // Cleanup here
    };
  }, []);

  return (
    <div className="terminal">
      {/* render history and input */}
    </div>
  );
}
```

When adding new components:

- Mirror the **separation of concerns** from `ARCHITECTURE.md`:
  - Terminal UI, history rendering, settings panels, etc. should be modular.
- Maintain **accessibility** (roles, ARIA labels, focus management, keyboard navigation) as described in `QUALITY_METRICS.md` and `E2E_TESTING.md`.

---

## Services, Utilities, and Architecture

Even though the architecture docs are expressed in Angular terms, they define a **service-oriented architecture** that applies here as well.

When working on or adding services/utilities:

- Respect categories defined in `ARCHITECTURE.md` and `API_DOCUMENTATION.md`:
  - Foundation services (logging, error handling, validation)
  - Performance & monitoring
  - Resource management (e.g., blob URL lifecycle)
  - User experience services (notifications, keyboard shortcuts)
  - Feature services (domain-specific logic)
  - Infrastructure (config, environment, devices)

- Keep each service with **single responsibility** and a clear public API.
- Keep side effects at the edges. Core logic should be pure and testable.
- Use dependency injection by **parameterization and composition** (pass services into functions/hooks) rather than global singletons, unless the repo already defines a standard.

When docs mention specific services like `LoggerService`, `ErrorHandlerService`, `ValidationService`, `AnalyticsService`, `BlobUrlManagerService`, etc., and the repo contains analogues:

- Always use the repo’s actual service implementations.
- Never bypass them with ad-hoc `console.log`, raw `fetch`, or inlined validation.

---

## Error Handling & User Safety

From `PRODUCTION_READINESS_REPORT.md`, `QUALITY_METRICS.md`, and `docs/XSS_PREVENTION.md`, error handling and user safety are mandatory concerns.

- **Try/Catch** around async boundaries that involve I/O, networking, or parsing.
- **User-Friendly Messaging**:
  - Separate internal error details (logs) from user-facing messages.
  - Avoid technical jargon in UI strings; use clear, actionable messages.
- **No Silent Failures**:
  - Any failure that affects user-visible behavior must surface a visible notification or error state.

---

## Security: Never Downgrade Guarantees

This repo has extensive security documentation and configuration. Copilot must never suggest changes that weaken security or conflict with:

- `DEPLOYMENT_SECURITY.md`
- `docs/XSS_PREVENTION.md`
- `security-headers.json`, `_headers`, `.htaccess`, `nginx.conf.example`, `vercel.json`

Key rules:

- Never log secrets, tokens, or sensitive user data.
- Never disable or loosen CSP or security headers for convenience.
- Always validate and sanitize user input.
- Do not introduce dynamic code execution (`eval`, `Function`, unsafe `new Function`) or unsafe DOM manipulation.

When in doubt, **err on the side of stronger validation and stricter defaults**.

---

## Testing Obligations

Xterm1 treats tests as first-class artifacts. All non-trivial changes should be accompanied by tests that:

- Follow patterns from `TEST_COVERAGE.md` and `E2E_TESTING.md`.
- Use Jest for unit tests and Playwright for E2E.
- Maintain or improve the coverage thresholds already enforced in `jest.config.ts`.

Guidelines:

- Test **public behavior**, not implementation details.
- Mock external I/O and network calls.
- Ensure tests are deterministic and independent.
- Use `data-testid` and accessibility-friendly selectors in E2E tests (as documented).

---

## CI/CD and Automation

CI/CD workflows under `.github/workflows/` are part of the project’s quality contract. Copilot must:

- Retain pinned action versions and least-privilege permissions.
- Respect existing job structure, caching, and artifact handling.

Suggestions that modify CI must **improve or maintain**:

- Build reliability and speed
- Security scanning coverage (CodeQL, dependency checks)
- Test execution (unit + E2E) and coverage reporting

---

## Documentation & ExecPlans

This repository is documentation-heavy and uses **ExecPlans** and **Production Line** workflows:

- `PLAN.md` defines how to write executable plans.
- `PLAN_OF_RECORD_TEMPLATE.md` defines feature plans.
- `PRODUCTION_LINE_GUIDE.md` and `PRODUCTION_LINE_EXAMPLE_ANALYTICS_DASHBOARD.md` show how features are added end-to-end.

When Copilot is asked to design or implement **non-trivial features or refactors**:

1. Prefer to **draft or update an ExecPlan** following `PLAN.md` and `PLAN_OF_RECORD_TEMPLATE.md`.
2. Ensure the plan is **self-contained**, with clear purpose, context, progress tracking, decision log, and acceptance criteria.
3. Only then propose code changes, ensuring code conforms exactly to the plan and to the rest of the documentation.

---

## When in Doubt

- If there is a conflict between old PolliWall/Angular wording and the actual Xterm1 React/TypeScript implementation, treat the architectural **intent** as binding and the framework-specific details as adaptable.
- Always keep behavior:
  - Secure
  - Accessible
  - Performant
  - Testable
  - Well-documented

Copilot must operate at the same level of rigor, thoroughness, and production-readiness as the existing Operation Bedrock and Production Line documentation.