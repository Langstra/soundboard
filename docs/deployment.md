# Deployment

The static site is served by Cloudflare and deployed by GitHub Actions. The backend (database and Edge Functions) lives in a Supabase project and is deployed by a separate, manual workflow.

## Overview

| What                    | Where                     | Workflow                                         |
| ----------------------- | ------------------------- | ------------------------------------------------ |
| Checks on pull requests | GitHub Actions            | `.github/workflows/ci.yml`                       |
| Angular app (static)    | Cloudflare Workers assets | `.github/workflows/deploy.yml` (push to `main`)  |
| Database and functions  | Supabase                  | `.github/workflows/supabase-deploy.yml` (manual) |

A push to `main` runs the same checks as a pull request (`pnpm check`), then builds with production settings and deploys. Cloudflare serves `dist/apps/web/browser` and falls back to `index.html` for client-side routes such as `/p/<token>`. The Worker name and asset folder are set in `wrangler.jsonc`.

## One-time setup

### 1. Supabase project

1. Create a project and note its project ref, URL and anon (publishable) key.
2. Under Authentication, URL Configuration, set the Site URL to the final site URL (see step 2).
3. Create the operator and the players in Authentication, then mark the operator in SQL:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "operator"}'
where email = 'operator@example.com';
```

Each player also needs a row in `public.players` with the same `id` as their auth user. The migrations create the tables; the seed file is for local development only and is never applied remotely.

### 2. Cloudflare

1. Create an API token from the "Edit Cloudflare Workers" template and note your account ID.
2. The first deploy creates the Worker named in `wrangler.jsonc`. Its address is `https://soundboard.<your-subdomain>.workers.dev`. To use your own domain, add it in the dashboard under the Worker, Settings, Domains and Routes.

### 3. Spotify

1. In the Spotify dashboard, add the exact redirect URI `https://<your-site>/` (with the trailing slash) to the app.
2. A new Spotify app starts in development mode: only accounts added under User Management can log in, and the app owner needs Premium. Request an extended quota only if more people than that must log in as operator. Players never log in to Spotify.

### 4. GitHub

Create an environment named `production` (Settings, Environments). Adding required reviewers there makes every deploy wait for approval.

| Kind     | Name                    | Value                                                  |
| -------- | ----------------------- | ------------------------------------------------------ |
| Secret   | `CLOUDFLARE_API_TOKEN`  | The token from step 2                                  |
| Secret   | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                             |
| Secret   | `SUPABASE_ACCESS_TOKEN` | A personal access token from the Supabase dashboard    |
| Secret   | `SUPABASE_DB_PASSWORD`  | The project's database password                        |
| Secret   | `SPOTIFY_CLIENT_SECRET` | The Spotify app's client secret                        |
| Variable | `SUPABASE_PROJECT_REF`  | The project ref                                        |
| Variable | `SUPABASE_URL`          | `https://<ref>.supabase.co`                            |
| Variable | `SUPABASE_ANON_KEY`     | The anon or publishable key (public by design)         |
| Variable | `SPOTIFY_CLIENT_ID`     | The Spotify client ID (public under PKCE)              |
| Variable | `SPOTIFY_REDIRECT_URI`  | `https://<your-site>/`, identical to the Spotify entry |

Never put the `service_role` key anywhere in GitHub variables. The build script refuses a key that looks like one.

### 5. First deploy

1. Run the "Deploy Supabase" workflow manually. It applies migrations, sets the Edge Function secrets and deploys the three functions.
2. Push to `main` (or run "Deploy" manually). The site goes live.

## Day to day

- Open a pull request: CI runs `pnpm check`.
- Merge to `main`: CI, then build and deploy to Cloudflare.
- Changed a migration or a function: run "Deploy Supabase" before or together with the merge. Migrations are never applied by the site deploy.

## Building the deploy bundle locally

```bash
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_ANON_KEY=<anon key> \
SPOTIFY_CLIENT_ID=<client id> \
SPOTIFY_REDIRECT_URI=https://<your-site>/ \
pnpm build:deploy
```

`tools/write-environment.mjs` writes the git-ignored `apps/web/src/environments/environment.deploy.ts`, and the `deploy` build configuration swaps it in for `environment.ts`. The plain `pnpm build` keeps using the local values.

## Not covered yet

- A Content Security Policy. It must allow Spotify's player script and frame and Supabase; test it against the real login and playback flow before enforcing it.
- Rate limiting on the Personal Link exchange. Tokens are 256-bit random values, so guessing is not realistic, but a limit is still worth adding.
- Preview deployments for pull requests. Spotify only accepts registered redirect URIs, so a preview could not log in anyway.
- Pushing Supabase Auth settings from `config.toml`: the local file holds local URLs, so the remote settings are managed in the dashboard.
