# Xterm1 – GPT & GitHub Bridge Architecture

## 1. Purpose

This document defines how the Custom GPT for Xterm1 interacts with the repository using the Cloudflare GitHub Bridge Worker. The goal is to give the model **owner-level capabilities** in a controlled way:

- Read any code or documentation in the repo.
- Create and update files with commit history.
- Inspect pull requests and diffs.
- Maintain its own knowledge documents so they stay aligned with reality.
- Follow the behavioral contract in `AGENT_WORKFLOW.md` when making changes or plans.

The model must treat this file as a source-of-truth description of the integration.

## 2. High-level Components

1. **Custom GPT ("Lead Architect")**
   - Runs inside the ChatGPT environment.
   - Calls a single HTTP Action that points to the GitHub Bridge Worker.
   - Reads/writes documentation in `gpt/` to keep its own knowledge fresh.
   - Uses `AGENT_WORKFLOW.md` as the governing workflow document for agent behavior.

2. **GitHub Bridge Worker**
   - Cloudflare Worker deployed at a stable URL.
   - Owns a GitHub PAT with sufficient repo scopes.
   - Exposes a `/tool` endpoint that wraps GitHub REST APIs into a small set of high-level tools.
   - Enforces a shared secret (`X-Api-Key`) so only the GPT can call it.

3. **Xterm1 Repository**
   - Contains the actual source code and configuration for the project.
   - Contains the GPT knowledge directory: `gpt/`.
   - Contains a generated file map (`gpt/file-map.json`) maintained by CI for fast discovery.
   - Contains `AGENT_WORKFLOW.md` which defines how the GPT should operate as an agent.

4. **GitHub Actions**
   - Periodically (on pushes to `main`) regenerate `gpt/file-map.json`.
   - Commit and push changes automatically so the GPT sees the latest structure.

## 3. Data Flow

1. **User asks a repo question**
   - The GPT considers whether it needs live data.
   - If yes, it calls the `/tool` Action with the appropriate `tool` and `arguments`.

2. **Worker executes the tool**
   - Validates `X-Api-Key`.
   - Resolves `owner/repo/ref` from arguments or environment defaults.
   - Calls the relevant GitHub REST API.
   - Returns a normalized JSON payload back to the GPT.

3. **GPT interprets and updates knowledge**
   - Reads code via `get_file` and `list_tree`.
   - Uses `search_code` to find functions, configs, and workflows.
   - Generates or updates reference docs in `gpt/` using `create_or_update_file`.
   - Uses `gpt/file-map.json` to quickly jump to relevant files instead of guessing paths.
   - Cross-checks its behavior with `AGENT_WORKFLOW.md` and `gpt/agent-workflows.md`.

4. **CI keeps structure up to date**
   - On each push to `main`, CI regenerates `gpt/file-map.json`.
   - If the file changed, CI commits and pushes it.
   - GPT never assumes the file map is correct; it can fall back to `list_tree`.

## 4. Security & Privilege Model

- GitHub PAT is **only** stored in the Worker as `GITHUB_TOKEN`.
- The Worker is the only component that talks directly to `api.github.com`.
- The Worker enforces `X-Api-Key` via `BRIDGE_API_KEY`.
- The Custom GPT action is configured to send that exact header; no one else knows it.
- The GPT never sees the PAT, only higher-level tools.

Recommended GitHub scopes for the PAT:

- `repo` (full) to allow reads, writes, and PR metadata on the private repo.
- `read:org` only if org-level metadata is required later.

## 5. Knowledge Layout (`gpt/`)

The `gpt/` directory is the dedicated knowledge area for the model:

- `gpt/architecture.md` – this file, describing the integration.
- `gpt/github-bridge.md` – detailed tool catalog and usage patterns.
- `gpt/agent-workflows.md` – step-by-step operating procedures for the GPT.
- `gpt/file-map.json` – machine-generated file index (paths, sizes, tags).
- Any other GPT-facing documents the model needs to reference (e.g. `gpt/agent-roles.md`).

The GPT must:

1. Prefer **live reads** via tools for anything that might be stale.
2. Treat `gpt/` markdown as **secondary** to actual code when there is a conflict.
3. Keep these docs updated via `create_or_update_file` when it changes workflows, abstractions, or architecture.
4. Respect and align to `AGENT_WORKFLOW.md` when deciding how to act.

## 6. Operational Guarantees

- Every write operation performed by the GPT via `create_or_update_file` results in a real Git commit.
- Knowledge docs are first-class repository assets, not hidden metadata.
- The Worker normalizes responses and errors so the GPT can reason about failure modes.
- CI keeps the file map fresh without human intervention.

Any future features (e.g., automated PR creation, issue triage) should be added as **new tools** in the Worker and documented in `gpt/github-bridge.md`.
