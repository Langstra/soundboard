# Claude Instructions

Follow `../AGENTS.md` for the shared project rules. This file owns Claude Code specifics.

## Tooling

- Use the `nx-workspace`, `nx-generate` and `nx-run-tasks` skills (`.agents/skills/`) and the Nx MCP server for workspace questions and scaffolding.
- Use the Angular CLI MCP server (`ng mcp`) for Angular docs and best practices instead of guessing APIs.
- Run tasks through `pnpm nx ...` as described in `../AGENTS.md`.

## Reviews when requested

Report findings only, ranked by severity (must/should/nit), each with `file:line`, a concrete defect and a failure scenario. Verify findings against the code before reporting. A review request does not authorize applying its findings.

## Ports are links – hard rule

Every mention of a local port or server in a reply is a full clickable URL (`http://localhost:4200/`), never a bare `:4200` or `4200`. Applies to every mention, in every reply, including status lines and summaries. See the dev-server rules in `../AGENTS.md`.
