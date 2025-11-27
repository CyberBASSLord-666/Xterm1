# GPT Operating Workflows – Xterm1

This file defines how the Custom GPT should **behave** when working with the Xterm1 repository through the GitHub Bridge Worker. Treat these as hard rules, not suggestions.

The GPT must also read and obey `AGENT_WORKFLOW.md`. If there is a conflict between this file and `AGENT_WORKFLOW.md`, treat `AGENT_WORKFLOW.md` as authoritative for behavior, and update this file accordingly.

## 1. Session Bootstrap

When a conversation starts and the user mentions the repo or code:

1. Call `get_repo_info` to confirm:
   - `owner`, `repo`
   - `default_branch`
2. If you have not already done so in this session:
   - Use `get_file` to read:
     - `gpt/architecture.md`
     - `gpt/github-bridge.md`
     - `gpt/agent-workflows.md` (this file)
     - `AGENT_WORKFLOW.md`
     - `gpt/file-map.json` if present.
3. Do **not** rely on memory from previous sessions when safety or correctness matters.
4. Only after these reads should you answer technical questions or propose changes.

## 2. Answering Architecture / "How does this work?" Questions

When asked to explain system behavior, architecture, or workflows:

1. Use `search_code` and/or `gpt/file-map.json` to find the relevant modules.
2. Use `get_file` on each candidate file.
3. Build a mental model from **actual implementation**, not prior assumptions.
4. If the explanation reveals missing or outdated documentation:
   - Update `gpt/architecture.md` or create a new `gpt/<topic>.md` via `create_or_update_file`.
   - Include clear sections: Purpose, Data Flow, Key Types, Extension Points.
5. If the question is about agent behavior:
   - Re-read `AGENT_WORKFLOW.md`.
   - Ensure the explanation is consistent with that workflow.

## 3. Implementing Changes

When the user requests real code changes:

1. Identify the affected files using:
   - `search_code` for types, functions, or config keys.
   - `list_tree` and `gpt/file-map.json` when structure is unclear.
2. For each file to modify:
   - Read it fully with `get_file`.
   - Reason about the existing style, patterns, and constraints.
3. Prepare a **full file rewrite** in your response:
   - Do not rely on the worker to apply patches; it expects a complete new version.
   - Show the new version in the conversation for user visibility.
   - Call `create_or_update_file` with the complete content and a precise commit message.
4. After changes:
   - Update or create relevant knowledge docs in `gpt/`.
   - If the change affects agent behavior, update `AGENT_WORKFLOW.md` only when explicitly instructed by the user.
   - Describe the changes in natural language for the user.

## 4. Reviewing Pull Requests

When asked to review a PR:

1. Call `list_pull_requests` to locate the target PR if only a title or "latest PR" is given.
2. Call `get_pull_request_diff` for the chosen PR.
3. Identify impacted files from the diff.
4. Use `get_file` on those files at the target ref if you need full context.
5. Produce a review that covers:
   - Correctness and safety.
   - Style and consistency.
   - Test coverage and missing cases.
   - Potential regressions and edge cases.
6. If the review reveals missing documentation:
   - Plan follow-up commits using `create_or_update_file` to improve `gpt/` or user-facing docs.

## 5. Maintaining the Knowledge Base (`gpt/`)

You own the `gpt/` directory. Behave like its maintainer:

- When you touch a subsystem for the first time:
  - Check whether there is a `gpt/<subsystem>.md`.
  - If not, create one with a minimal but accurate description.
- When you detect stale information:
  - Correct it in the relevant `gpt/*.md` file.
  - Ensure the new description matches the current implementation and the behavior described in `AGENT_WORKFLOW.md`.

## 6. Using `gpt/file-map.json`

When present, `gpt/file-map.json` is the fastest way to understand the tree:

- Use it to:
  - Locate files by path prefix, extension, or directory grouping.
  - Avoid repeated calls to `list_tree`.
- If `gpt/file-map.json` looks inconsistent with `list_tree`:
  - Trust `list_tree` as canonical.
  - Describe the mismatch to the user.
  - CI will regenerate the file map on the next push to `main`.

## 7. Error Handling Philosophy

When a bridge call fails:

- For `400 invalid_request`:
  - Fix your arguments and retry, explaining what changed.
- For `401 unauthorized`:
  - Explain that the Worker credentials or API key need to be fixed outside your control.
- For `502 github_error`:
  - Surface the status code and basic details.
  - Suggest likely causes (permissions, missing branch, rate limiting).
- For `500 internal_error`:
  - Treat it as a bug in the Worker; explain that someone needs to inspect the Worker logs.

Never silently ignore a failure. Always tell the user what went wrong and what you attempted.

## 8. Commit Message Discipline

When using `create_or_update_file`:

- Make commit messages:
  - Descriptive: include intent and scope.
  - Scoped: use a prefix like `chore(gpt):`, `docs(gpt):`, or `feat(gpt):`.

Examples:

- `docs(gpt): clarify GitHub bridge architecture`
- `chore(gpt): update file-map.json`
- `feat(gpt): add agent workflow documentation`

## 9. Alignment with `AGENT_WORKFLOW.md`

When the user explicitly references `AGENT_WORKFLOW.md`:

1. Use `get_file` to read it.
2. Verify that your planned behavior matches the workflows and constraints encoded there.
3. If this file (`gpt/agent-workflows.md`) diverges from `AGENT_WORKFLOW.md`, update this file to reflect the canonical behavior, and mention that alignment to the user.
