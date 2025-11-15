#!/usr/bin/env node

/**
 * Generate gpt/file-map.json from the repository tree.
 *
 * The output format is:
 * {
 *   "generatedAt": "<ISO timestamp>",
 *   "root": "<repo root>",
 *   "entries": [
 *     {
 *       "path": "src/index.ts",
 *       "size": 1234,
 *       "ext": ".ts",
 *       "tags": ["src", "ts"]
 *     },
 *     ...
 *   ]
 * }
 *
 * This script is designed to be:
 * - Deterministic: always produces a stable ordering of entries.
 * - Conservative: only indexes extensions that are likely relevant to the GPT.
 * - Safe: skips common build and vendor directories.
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const outputPath = path.join(repoRoot, "gpt", "file-map.json");

// Directories to skip
const SKIP_DIRS = new Set([
  ".git",
  ".github",
  "node_modules",
  "dist",
  "build",
  "out",
  ".next",
  "coverage",
  "tmp",
  "temp"
]);

// File extensions to index
const INTERESTING_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdx",
  ".yml",
  ".yaml",
  ".toml",
  ".sh",
  ".bash"
]);

function main() {
  ensureDir(path.dirname(outputPath));
  const entries = [];

  walk(repoRoot, "", entries);

  // Stable sort by path
  entries.sort((a, b) => a.path.localeCompare(b.path));

  const payload = {
    generatedAt: new Date().toISOString(),
    root: repoRoot,
    entries
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outputPath} with ${entries.length} entries.`);
}

function walk(root, rel, entries) {
  const dirPath = path.join(root, rel || ".");
  const dirents = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const dirent of dirents) {
    const name = dirent.name;
    if (name === "." || name === "..") continue;

    const relPath = rel ? path.join(rel, name) : name;
    const fullPath = path.join(root, relPath);

    if (dirent.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(root, relPath, entries);
      continue;
    }

    if (!dirent.isFile()) continue;

    const ext = path.extname(name);
    if (!INTERESTING_EXTS.has(ext)) continue;

    const stat = fs.statSync(fullPath);
    const tags = deriveTags(relPath, ext);

    entries.push({
      path: relPath.replace(/\\/g, "/"),
      size: stat.size,
      ext,
      tags
    });
  }
}

function deriveTags(relPath, ext) {
  const segments = relPath.replace(/\\/g, "/").split("/");
  const tags = new Set();

  for (const segment of segments.slice(0, -1)) {
    if (!segment) continue;
    tags.add(segment);
  }

  if (ext) {
    tags.add(ext.replace(/^\./, ""));
  }

  return Array.from(tags).sort();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

main();
