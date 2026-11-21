# Personal Link is an opaque token exchanged for a Supabase session

Supabase magic links are single-use and expire within 24 hours, but a Personal Link must be reusable and revocable per player. Each player gets a long random token, stored only as a hash; opening `/p/<token>` calls an Edge Function that validates it and mints a normal Supabase session for that player's user, so RLS applies as usual. Regenerating a link replaces the stored hash. A signed, expiring URL was rejected because revoking one link would require rotating the signing key for everyone.
