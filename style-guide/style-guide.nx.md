# Nx Workspace Style Guide

Last updated on 2026-11-20.

This document contains guidelines for the Nx monorepo structure.

## Do

### Must do

- run tasks through Nx (`pnpm nx <target> <project>`, `pnpm nx affected -t lint test build`), not through the underlying tools
- create apps and libraries with generators (`pnpm nx g @nx/angular:library ...`); check `--help` before passing flags
- layout
  - `apps/<name>` – deployable apps and their `-e2e` projects; thin: routing, config, composition only
  - `libs/<domain>/<type>` – everything else, e.g. `libs/supabase/data-access`, `libs/shared/ui`
- import libraries only through their path alias `@soundboard/<domain>/<type>`, which points at the lib's `src/index.ts`; never deep-import
- tag every project with `scope:<domain>` and `type:<app|feature|ui|data-access|util>`; `@nx/enforce-module-boundaries` in `eslint.config.mjs` enforces the allowed dependency directions
  - `app` → `feature`, `ui`, `data-access`, `util`
  - `feature` → `ui`, `data-access`, `util`
  - `ui` → `ui`, `util`
  - `data-access` → `data-access`, `util`
  - `util` → `util`
- export only the public API from a lib's `index.ts`; keep everything else internal

### Should do

- put code in the narrowest lib that uses it; extract to `shared` only after a second consumer exists
- use `pnpm nx graph` or the Nx MCP server to inspect dependencies before moving code
- keep `project.json` targets minimal; prefer Nx plugin-inferred targets

## Don't

- don't create circular dependencies between libs
- don't add a lib for a single file that has one consumer
- don't edit `nx.json` plugin options without checking the Nx docs

## Back to index

- [Angular Coding Style Guide](style-guide.md)
