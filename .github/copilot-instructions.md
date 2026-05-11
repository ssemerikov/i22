# Copilot instructions for this repository

Purpose: Help future Copilot sessions understand how to build, run, and reason about this codebase.

## Build / test / lint commands
- This repository has no build, test, or lint scripts defined in package.json (it is an empty JSON object). There is no test runner configured.
- To run the simple Node demo server used here:
  - Start: node webserver0/hello-world.js
- To run a single JavaScript file (ad-hoc):
  - node path/to/file.js
- Jupyter notebooks exist (lab4.ipynb, lab6.ipynb). Open with jupyter notebook or JupyterLab to run cells.

If tests are added later, prefer adding npm scripts to package.json so Copilot can reference `npm test` and `npm run <script>`.

## High-level architecture
- Static web content (HTML/CSS/JS) in the repository root and the `public/` folder. Typical entry points: index.html, index3.html.
- webserver0/hello-world.js: minimal Node HTTP server that serves files from ../public and provides simple endpoints (/ls, /download, /client, /user). Use this file to run a local demo server.
- tinyweb/ and aframe/ contain sample/third-party artifacts (legacy demos).
- Several `lab*` folders and Jupyter notebooks are educational examples; they may reference large binary artifacts (e.g., word_embeddings.pkl) stored at repo root.
- node_modules/ exists but package.json is empty; dependency provenance is unclear—do not assume available npm scripts.

## Key conventions and repository specifics
- public/ is the canonical static-assets directory. webserver0 resolves baseDir as ../public — relative paths matter when running the server from webserver0.
- Large artifacts: word_embeddings.pkl is very large. Avoid opening or editing binary files; reference them from notebooks or scripts instead of loading into memory indiscriminately.
- Localization: some server messages and UI strings are in Ukrainian (e.g., "Вміст каталогу"). Be mindful when editing string literals.
- Minimal Node server is implemented without external frameworks; changes to hello-world.js should preserve path resolution checks (prevents directory traversal).
- No CI/automation config detected in repository root (.github/workflows absent).

## AI / assistant config to be aware of
- .claude/settings.local.json exists — contains local settings for Claude tooling. Do not overwrite without review.
- No other AI assistant-specific config files (AGENTS.md, .cursorrules, .windsurfrules, .clinerules) were found.

## Quick pointers for Copilot sessions
- Prefer editing HTML/JS/CSS under root and public/; run the Node demo server to validate dynamic behavior.
- Avoid modifying large binary artifacts or node_modules contents; prefer updating package.json when introducing scripts or dependencies.
- If adding tests or linters, add npm scripts and a top-level README explaining commands so Copilot can find them.

---

If you want, I can (a) add brief npm scripts and a README with basic commands, or (b) configure a simple GitHub Actions workflow for running lint/tests. Which should I do next?