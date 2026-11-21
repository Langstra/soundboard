# Supabase Style Guide

Last updated on 2026-11-20.

This document contains guidelines for Supabase usage (local stack, migrations, client code).

## Do

### Must do

- the schema is defined only by migrations in `supabase/migrations/`
  - create with `pnpm db:migration <name>` and write plain SQL; never edit an applied migration, add a new one
  - never change the schema through Studio without capturing it in a migration (`supabase db diff`)
- enable **Row Level Security** on every table in `public` and add explicit policies in the same migration
- regenerate types with `pnpm db:types` after each migration; commit `database.types.ts`; never hand-edit it
- access Supabase only through `injectSupabase()` from `@soundboard/supabase/data-access`, inside services in data-access libs; components never call the client directly
- the client uses the **anon/publishable key** only; the `service_role` key never enters the repo, the browser bundle, or chat
- handle the `{ data, error }` result of every call; throw or map `error`, never ignore it
- use `supabase/seed.sql` for local development data only

### Should do

- use `pnpm db:start` / `pnpm db:stop` for the local stack (needs Docker); `pnpm db:reset` re-applies migrations and seed
- name tables in plural `snake_case`, columns in `snake_case`, primary keys as `uuid` with `gen_random_uuid()`
- select explicit columns instead of `*` in app queries
- wrap Supabase calls in signals/resources inside the data-access service and expose typed domain data

## Don't

- don't run `supabase db push`, `supabase link` or any command against a remote project without explicit approval
- don't disable RLS to "make it work"; fix the policy
- don't commit `.env` files or access tokens

## Resources

- [Supabase docs](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

## Back to index

- [Angular Coding Style Guide](style-guide.md)
