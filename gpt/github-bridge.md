# GitHub Bridge – Tool Catalog & Usage

This document is written for the **Custom GPT** that acts as the lead architect for Xterm1. It explains exactly what the GitHub Bridge Worker can do and how to use it safely.

Unless explicitly overridden, all examples assume:

- `owner` = Worker environment `GITHUB_OWNER` (expected: `CyberBASSLord-666`)
- `repo`  = Worker environment `GITHUB_REPO` (expected: `Xterm1`)
- `ref`   = Worker environment `GITHUB_DEFAULT_REF` (expected: `main`)

## 1. General Call Contract

Every call to the bridge uses the same HTTP shape:

- **Path:** `POST /tool`
- **Headers:**
  - `Content-Type: application/json`
  - `X-Api-Key: <shared secret configured in Worker + GPT Action>`

- **Body:**

```json
{
  "tool": "<tool_name>",
  "arguments": {
    "...": "tool-specific fields"
  }
}
```

Every success response has the same envelope:

```json
{
  "ok": true,
  "tool": "<tool_name>",
  "data": { /* tool-specific result */ },
  "meta": {
    "tool": "<tool_name>"
  }
}
```

On error, the envelope looks like:

```json
{
  "ok": false,
  "error": {
    "code": "string",
    "message": "human-readable message",
    "details": { "optional": "structured details" }
  }
}
```

The model should always **inspect `error.code`** and **never silently ignore failures**.

## 2. Tool: `get_repo_info`

**Purpose:** Basic repo metadata and default branch.

**Arguments:**

* `owner?` – optional override  
* `repo?` – optional override

**What it returns:**

* `owner`, `repo`  
* `default_branch`  
* `private`  
* `description`  
* `html_url`  
* `pushed_at`

**Usage pattern (for the GPT):**

* Use this at session start to confirm you are pointed at the correct repo and branch.
* Read `default_branch` and treat it as the canonical ref unless the user says otherwise.

## 3. Tool: `search_code`

**Purpose:** Precisely locate relevant files/symbols.

**Arguments:**

* `query` (string, required) – search expression, e.g. `"AGENT_WORKFLOW"` or `"class GitHubAgent"`.
* `language?` (string) – GitHub language filter, e.g. `"TypeScript"`.
* `path?` (string) – restrict to subtree, e.g. `"src/"` or `"gpt/"`.
* `per_page?` (int, 1–50) – default `20`.

**What it returns (in `data`):**

* `total_count`
* `incomplete_results`
* `items[]` with:
  * `name`, `path`, `score`, `html_url`
  * `repository.full_name`, `repository.private`

**Best practices for the GPT:**

* Prefer **narrow queries** with `path` when you know the area (e.g. `path:"gpt/"`).
* Use this before doing wide tree scans when hunting for a concept or type name.
* When looking for workflows, configs, or agent code, include keywords from `AGENT_WORKFLOW.md`.

## 4. Tool: `get_file`

**Purpose:** Read a file or list a directory.

**Arguments:**

* `path` (string, required) – file or directory path, without leading `/`.
* `owner?`, `repo?`, `ref?` – optional overrides.

**Behavior:**

* If `path` is a file: returns:
  * `type = "file"`
  * `path`
  * `sha`
  * `size`
  * `encoding`
  * `content` (decoded UTF-8 if `encoding === "base64"`)
* If `path` is a directory: returns:
  * `type = "directory"`
  * `path`
  * `entries[]` with `name`, `path`, `type`, `size`.

**Usage:**

* Read source files before modifying them.
* Read `gpt/*.md`, `gpt/file-map.json`, `AGENT_WORKFLOW.md` and any other knowledge documents.

## 5. Tool: `create_or_update_file`

**Purpose:** Create or update a file with a real Git commit.

**Arguments:**

* `path` (string, required).
* `content` (string, required) – full file contents in UTF-8.
* `message?` (string) – commit message.
* `sha?` (string) – existing blob SHA for updates (optional; auto-detected if omitted).
* `owner?`, `repo?`, `ref?`.

**What it returns:**

* `path`
* `sha`
* `commit.sha`
* `commit.message`
* `commit.html_url`
* `created` (boolean, `true` if file was created, `false` if updated).

**Usage pattern:**

* Always write the full file content (no patching).
* Use it to maintain `gpt/*.md`, `AGENT_WORKFLOW.md` (when instructed), and other docs the GPT depends on.
* Use precise commit messages describing the intent, e.g. `docs(gpt): clarify agent workflows`.

## 6. Tool: `list_pull_requests`

**Purpose:** Inspect active or historical PRs.

**Arguments:**

* `state?` – `"open" | "closed" | "all"`, default `"open"`.
* `per_page?` – 1–50.
* `owner?`, `repo?`.

**What it returns:**

Array of PRs with:

* `number`, `title`, `state`, `draft`
* `head.label`, `head.ref`, `head.sha`
* `base.label`, `base.ref`, `base.sha`
* `user.login`
* `created_at`, `updated_at`
* `html_url`

**Usage:**

* Locate PRs by title, number, or state.
* Combine with `get_pull_request_diff` for detailed review.

## 7. Tool: `get_pull_request_diff`

**Purpose:** Fetch a unified diff for a single PR.

**Arguments:**

* `number` (int, required).
* `owner?`, `repo?`.

**What it returns:**

* `number`
* `diff` – unified diff as a string.

**Usage:**

* Use for code review.
* Identify impacted files and sections, then read full files with `get_file`.

## 8. Tool: `get_latest_commit`

**Purpose:** Understand the current state of a branch/ref.

**Arguments:**

* `ref?` – branch or ref.
* `owner?`, `repo?`.

**What it returns:**

* `sha`, `html_url`
* `author` (login, name, email, date)
* `committer` (login, name, email, date)
* `message`

**Usage:**

* Confirm that changes have been applied on `main`.
* Anchor explanations to a specific commit when describing behavior.

## 9. Tool: `list_tree`

**Purpose:** Enumerate the entire repository tree for a ref.

**Arguments:**

* `ref?` – branch/ref.
* `owner?`, `repo?`.

**What it returns:**

* `truncated` (boolean)
* `tree[]` with:
  * `path`
  * `type` (`"blob"` or `"tree"`)
  * `mode`
  * `size`

**Usage:**

* Build a mental model of the project structure.
* Fallback when `gpt/file-map.json` is missing or outdated.

## 10. Safety & Discipline Rules (for the GPT)

1. Never write speculative code or docs without reading the relevant files first.
2. Always include descriptive commit messages.
3. Prefer small, focused edits.
4. Keep `gpt/*.md` synchronized with reality whenever you change behavior or structure.
5. When working on agent logic:
   * Always read `AGENT_WORKFLOW.md`.
   * Ensure `gpt/agent-workflows.md` matches the behavior and constraints defined there.
6. When errors occur:
   * Inspect `error.code`, `error.message`, and `error.details`.
   * Explain failures to the user instead of hiding them.

## 11. Commit Message Discipline

When using `create_or_update_file`:

- Make commit messages:
  - Descriptive: include intent and scope.
  - Scoped: use a prefix like `chore(gpt):`, `docs(gpt):`, or `feat(gpt):`.

Examples:

- `docs(gpt): clarify GitHub bridge architecture`
- `chore(gpt): update file-map.json`
- `feat(gpt): add agent workflow documentation`

## 12. Alignment with `AGENT_WORKFLOW.md`

When the user explicitly references `AGENT_WORKFLOW.md`:

1. Use `get_file` to read it.
2. Verify that your planned behavior matches the workflows and constraints encoded there.
3. If this file (`gpt/agent-workflows.md`) diverges from `AGENT_WORKFLOW.md`, update this file to reflect the canonical behavior, and mention that alignment to the user.
