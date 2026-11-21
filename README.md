# soundboard

Nx monorepo with an Angular app (zoneless, SCSS, Vitest, Playwright) and a local Supabase backend.

## Requirements

- Node 22+, [pnpm](https://pnpm.io/) (version pinned in `package.json`)
- Docker (for the local Supabase stack)

## Getting started

```shell
pnpm install
pnpm db:start     # local Supabase; copy the anon/publishable key from `pnpm db:status`
                  # into apps/web/src/environments/environment.ts
pnpm start        # http://localhost:4200
```

## Scripts

| Script                           | What it does                                         |
| -------------------------------- | ---------------------------------------------------- |
| `pnpm start` / `pnpm build`      | serve / build `apps/web`                             |
| `pnpm lint` / `pnpm test`        | lint / unit tests for every project                  |
| `pnpm e2e`                       | Playwright tests (`apps/web-e2e`)                    |
| `pnpm check`                     | lint, test, build and format check                   |
| `pnpm db:start` / `pnpm db:stop` | start / stop the local Supabase stack                |
| `pnpm db:migration <name>`       | new SQL migration in `supabase/migrations`           |
| `pnpm db:reset`                  | re-apply migrations and `supabase/seed.sql`          |
| `pnpm db:types`                  | regenerate `database.types.ts` from the local schema |

## Layout

- `apps/web`, `apps/web-e2e` – Angular app and its Playwright tests
- `libs/supabase/data-access` – typed Supabase client (`provideSupabase`, `injectSupabase`)
- `libs/shared/ui` – shared UI components
- `supabase/` – Supabase CLI project (config, migrations, seed)
- `style-guide/` – coding conventions; `AGENTS.md` – rules for AI agents (adapted from [L-X-T/ng-agentic](https://github.com/L-X-T/ng-agentic))
