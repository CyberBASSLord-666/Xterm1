export default {
  /**
   * Main fetch handler for the GitHub bridge worker.
   * Exposes:
   *   - GET  /health  : public health check
   *   - GET  /tools   : list supported tools (requires API key)
   *   - POST /tool    : invoke a single tool (requires API key)
   *
   * Environment variables:
   *   - GITHUB_TOKEN        : PAT with repo-level scopes for the target repo(s)
   *   - GITHUB_OWNER        : default owner (e.g. "CyberBASSLord-666")
   *   - GITHUB_REPO         : default repo (e.g. "Xterm1")
   *   - GITHUB_DEFAULT_REF  : default branch or ref (e.g. "main")
   *   - BRIDGE_API_KEY      : shared secret for authenticating callers
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return jsonResponse({
          ok: true,
          service: "github-bridge",
          version: "1.0.0",
          time: new Date().toISOString()
        });
      }

      if (url.pathname === "/tools") {
        authenticate(request, env);
        if (request.method !== "GET") {
          return errorResponse(405, "method_not_allowed", "Use GET /tools");
        }
        return jsonResponse({ ok: true, tools: listTools() });
      }

      if (url.pathname === "/tool") {
        authenticate(request, env);
        if (request.method !== "POST") {
          return errorResponse(405, "method_not_allowed", "Use POST /tool");
        }
        const body = await safeParseJson(request);
        const { tool, args } = validateToolCall(body);

        const result = await dispatchTool(tool, args || {}, env);
        return jsonResponse({
          ok: true,
          tool,
          data: result.data,
          meta: result.meta || {}
        });
      }

      return errorResponse(404, "not_found", "Unknown path");
    } catch (err) {
      return handleError(err);
    }
  }
};

/**
 * Auth: require X-Api-Key to match BRIDGE_API_KEY (if set).
 */
function authenticate(request, env) {
  const expected = env.BRIDGE_API_KEY;
  if (!expected) {
    // If you really want this public, leave BRIDGE_API_KEY unset.
    // Strongly recommended to keep it set.
    return;
  }
  const provided = request.headers.get("x-api-key");
  if (!provided || provided !== expected) {
    throw new AuthError("Invalid or missing X-Api-Key");
  }
}

/**
 * Simple structured error helpers.
 */
class ToolError extends Error {
  constructor(message, code = "invalid_request") {
    super(message);
    this.name = "ToolError";
    this.code = code;
  }
}

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthError";
    this.code = "unauthorized";
  }
}

class GitHubError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "GitHubError";
    this.code = "github_error";
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Basic JSON parsing with explicit error surface.
 */
async function safeParseJson(request) {
  const text = await request.text();
  if (!text) throw new ToolError("Request body must be non-empty JSON");
  try {
    return JSON.parse(text);
  } catch {
    throw new ToolError("Request body must be valid JSON");
  }
}

/**
 * Validate the generic tool call envelope.
 */
function validateToolCall(body) {
  if (typeof body !== "object" || body === null) {
    throw new ToolError("Body must be an object");
  }
  const { tool, arguments: args, args: legacyArgs } = body;

  if (typeof tool !== "string" || !tool.trim()) {
    throw new ToolError("Field 'tool' must be a non-empty string");
  }

  const finalArgs = args ?? legacyArgs ?? {};
  if (typeof finalArgs !== "object" || finalArgs === null || Array.isArray(finalArgs)) {
    throw new ToolError("Field 'arguments' must be an object if provided");
  }

  if (!TOOLS[tool]) {
    throw new ToolError(`Unknown tool '${tool}'`, "unknown_tool");
  }

  return { tool, args: finalArgs };
}

/**
 * Tool registry and metadata.
 */
const TOOLS = {
  get_repo_info: {
    description: "Fetch repository metadata and default branch information.",
    handler: tool_get_repo_info
  },
  search_code: {
    description: "Search code in the repository using GitHub's search API.",
    handler: tool_search_code
  },
  get_file: {
    description: "Read a file from the repository (decoded text).",
    handler: tool_get_file
  },
  create_or_update_file: {
    description: "Create or update a file via the Contents API with a commit.",
    handler: tool_create_or_update_file
  },
  list_pull_requests: {
    description: "List pull requests with minimal metadata.",
    handler: tool_list_pull_requests
  },
  get_pull_request_diff: {
    description: "Fetch a unified diff for a pull request.",
    handler: tool_get_pull_request_diff
  },
  get_latest_commit: {
    description: "Get latest commit on a ref with message and author.",
    handler: tool_get_latest_commit
  },
  list_tree: {
    description: "List repository tree recursively (path + type).",
    handler: tool_list_tree
  }
};

function listTools() {
  return Object.entries(TOOLS).map(([name, def]) => ({
    name,
    description: def.description
  }));
}

async function dispatchTool(toolName, args, env) {
  const def = TOOLS[toolName];
  if (!def) {
    throw new ToolError(`Unknown tool '${toolName}'`, "unknown_tool");
  }
  const data = await def.handler(args, env);
  return { data, meta: { tool: toolName } };
}

/**
 * Resolve owner/repo/ref from args or env defaults.
 */
function resolveRepoContext(args, env) {
  const owner = (args.owner || env.GITHUB_OWNER || "").trim();
  const repo = (args.repo || env.GITHUB_REPO || "").trim();
  const ref = (args.ref || env.GITHUB_DEFAULT_REF || "main").trim();

  if (!owner || !repo) {
    throw new ToolError(
      "owner/repo must be provided either in arguments or environment variables",
      "missing_repo_context"
    );
  }
  return { owner, repo, ref };
}

/**
 * GitHub request helper.
 */
async function githubRequest(path, env, init = {}) {
  const url = `https://api.github.com${path}`;
  const headers = {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "User-Agent": "xterm1-github-bridge-worker/1.0",
    ...init.headers
  };

  if (!env.GITHUB_TOKEN) {
    throw new ToolError("GITHUB_TOKEN is not configured in the Worker environment", "missing_github_token");
  }

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson && text ? safeJsonParse(text) : text;

  if (!response.ok) {
    throw new GitHubError(
      `GitHub API error ${response.status} for ${path}`,
      response.status,
      payload
    );
  }

  return { payload, response };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Tool implementations
 */

async function tool_get_repo_info(args, env) {
  const { owner, repo } = resolveRepoContext(args, env);
  const { payload } = await githubRequest(`/repos/${owner}/${repo}`, env);
  return {
    owner,
    repo,
    default_branch: payload.default_branch,
    private: payload.private,
    description: payload.description,
    html_url: payload.html_url,
    pushed_at: payload.pushed_at
  };
}

async function tool_search_code(args, env) {
  const { owner, repo } = resolveRepoContext(args, env);
  const query = typeof args.query === "string" ? args.query.trim() : "";
  if (!query) {
    throw new ToolError("search_code requires a non-empty 'query' string");
  }

  const language = typeof args.language === "string" ? args.language.trim() : "";
  const pathFilter = typeof args.path === "string" ? args.path.trim() : "";
  const per_page = Number.isFinite(args.per_page) ? Math.min(Math.max(args.per_page, 1), 50) : 20;

  let q = `${query} repo:${owner}/${repo}`;
  if (language) q += ` language:${language}`;
  if (pathFilter) q += ` path:${pathFilter}`;

  const { payload } = await githubRequest(
    `/search/code?q=${encodeURIComponent(q)}&per_page=${per_page}`,
    env
  );

  return {
    total_count: payload.total_count,
    incomplete_results: payload.incomplete_results,
    items: (payload.items || []).map(item => ({
      name: item.name,
      path: item.path,
      score: item.score,
      html_url: item.html_url,
      repository: {
        full_name: item.repository?.full_name,
        private: item.repository?.private
      }
    }))
  };
}

async function tool_get_file(args, env) {
  const { owner, repo, ref } = resolveRepoContext(args, env);
  const path = normalizePath(args.path);
  if (!path) throw new ToolError("get_file requires 'path'");

  const encodedPath = encodePathSegments(path);
  const { payload } = await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
    env
  );

  if (Array.isArray(payload)) {
    // Directory listing
    return {
      type: "directory",
      path,
      entries: payload.map(e => ({
        name: e.name,
        path: e.path,
        type: e.type,
        size: e.size
      }))
    };
  }

  const encoding = payload.encoding;
  let decoded = null;
  if (encoding === "base64" && typeof payload.content === "string") {
    // GitHub may include newlines in base64; strip them
    const normalized = payload.content.replace(/\s+/g, "");
    decoded = atob(normalized);
  }

  return {
    type: payload.type,
    path: payload.path,
    sha: payload.sha,
    size: payload.size,
    encoding,
    content: decoded,
    raw: encoding === "base64" ? undefined : payload.content
  };
}

async function tool_create_or_update_file(args, env) {
  const { owner, repo, ref } = resolveRepoContext(args, env);
  const path = normalizePath(args.path);
  if (!path) throw new ToolError("create_or_update_file requires 'path'");

  const message = typeof args.message === "string" && args.message.trim()
    ? args.message.trim()
    : `chore(gpt): update ${path}`;

  const content = typeof args.content === "string" ? args.content : null;
  if (content === null) {
    throw new ToolError("create_or_update_file requires 'content' as a string");
  }

  const encodedContent = btoa(content);
  let sha = typeof args.sha === "string" && args.sha.trim() ? args.sha.trim() : null;

  // If sha not supplied, try to detect whether file exists
  if (!sha) {
    try {
      const existing = await tool_get_file({ owner, repo, ref, path }, env);
      if (existing && existing.sha) {
        sha = existing.sha;
      }
    } catch (err) {
      if (!(err instanceof GitHubError && err.status === 404)) {
        throw err;
      }
      // 404 = new file; sha stays null
    }
  }

  const encodedPath = encodePathSegments(path);
  const body = {
    message,
    content: encodedContent,
    branch: ref
  };
  if (sha) body.sha = sha;

  const { payload } = await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodedPath}`,
    env,
    {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return {
    path: payload.content?.path,
    sha: payload.content?.sha,
    commit: {
      sha: payload.commit?.sha,
      message: payload.commit?.message,
      html_url: payload.commit?.html_url
    },
    created: !sha
  };
}

async function tool_list_pull_requests(args, env) {
  const { owner, repo } = resolveRepoContext(args, env);
  const state = ["open", "closed", "all"].includes(args.state) ? args.state : "open";
  const per_page = Number.isFinite(args.per_page) ? Math.min(Math.max(args.per_page, 1), 50) : 20;

  const { payload } = await githubRequest(
    `/repos/${owner}/${repo}/pulls?state=${encodeURIComponent(state)}&per_page=${per_page}`,
    env
  );

  return payload.map(pr => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    draft: pr.draft,
    head: {
      label: pr.head?.label,
      ref: pr.head?.ref,
      sha: pr.head?.sha
    },
    base: {
      label: pr.base?.label,
      ref: pr.base?.ref,
      sha: pr.base?.sha
    },
    user: {
      login: pr.user?.login
    },
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    html_url: pr.html_url
  }));
}

async function tool_get_pull_request_diff(args, env) {
  const { owner, repo } = resolveRepoContext(args, env);
  const number = Number(args.number);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ToolError("get_pull_request_diff requires a positive integer 'number'");
  }

  const { payload } = await githubRequest(
    `/repos/${owner}/${repo}/pulls/${number}`,
    env,
    {
      headers: {
        "Accept": "application/vnd.github.v3.diff"
      }
    }
  );

  return {
    number,
    diff: typeof payload === "string" ? payload : String(payload || "")
  };
}

async function tool_get_latest_commit(args, env) {
  const { owner, repo, ref } = resolveRepoContext(args, env);
  const { payload } = await githubRequest(
    `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(ref)}&per_page=1`,
    env
  );

  const commit = Array.isArray(payload) && payload.length ? payload[0] : null;
  if (!commit) {
    throw new GitHubError("No commits found", 404, payload);
  }

  return {
    sha: commit.sha,
    html_url: commit.html_url,
    author: {
      login: commit.author?.login,
      name: commit.commit?.author?.name,
      email: commit.commit?.author?.email,
      date: commit.commit?.author?.date
    },
    committer: {
      login: commit.committer?.login,
      name: commit.commit?.committer?.name,
      email: commit.commit?.committer?.email,
      date: commit.commit?.committer?.date
    },
    message: commit.commit?.message
  };
}

async function tool_list_tree(args, env) {
  const { owner, repo, ref } = resolveRepoContext(args, env);
  const { payload } = await githubRequest(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    env
  );

  return {
    truncated: payload.truncated,
    tree: (payload.tree || []).map(entry => ({
      path: entry.path,
      type: entry.type,
      mode: entry.mode,
      size: entry.size
    }))
  };
}

/**
 * Path utilities.
 */
function normalizePath(path) {
  if (typeof path !== "string") return "";
  return path.replace(/^\/+/, "").trim();
}

function encodePathSegments(path) {
  return path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

/**
 * Response helpers.
 */
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function errorResponse(status, code, message, details) {
  return jsonResponse(
    {
      ok: false,
      error: {
        code,
        message,
        details: details ?? null
      }
    },
    status
  );
}

function handleError(err) {
  if (err instanceof AuthError) {
    return errorResponse(401, err.code, err.message);
  }
  if (err instanceof ToolError) {
    return errorResponse(400, err.code, err.message);
  }
  if (err instanceof GitHubError) {
    return errorResponse(
      502,
      err.code,
      err.message,
      {
        status: err.status,
        payload: err.payload
      }
    );
  }
  return errorResponse(500, "internal_error", "Unexpected error", {
    name: err && err.name,
    message: err && err.message
  });
}
