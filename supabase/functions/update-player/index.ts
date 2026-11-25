import { corsHeaders, createAdminClient, getCaller, json, PLACEHOLDER_DOMAIN, UUID_PATTERN } from '../_shared/http.ts';

const MAX_NAME_LENGTH = 40;
const UNIQUE_VIOLATION = '23505';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Operator only: renames a player and/or sets their email, which takes effect without a code (ADR 0002).
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const admin = createAdminClient();
  const caller = await getCaller(admin, request);

  if (caller?.app_metadata?.role !== 'operator') {
    return json({ error: 'forbidden' }, 403);
  }

  const { playerId, displayName, email } = await request.json().catch(() => ({}));

  if (typeof playerId !== 'string' || !UUID_PATTERN.test(playerId)) {
    return json({ error: 'invalid_player' }, 400);
  }

  const name = typeof displayName === 'string' ? displayName.trim() : undefined;
  const address = typeof email === 'string' ? email.trim().toLowerCase() : undefined;

  if (name !== undefined && (name === '' || name.length > MAX_NAME_LENGTH)) {
    return json({ error: 'invalid_name' }, 400);
  }

  if (address !== undefined && (!EMAIL_PATTERN.test(address) || address.endsWith(`@${PLACEHOLDER_DOMAIN}`))) {
    return json({ error: 'invalid_email' }, 400);
  }

  if (name === undefined && address === undefined) {
    return json({ error: 'nothing_to_update' }, 400);
  }

  const { data: existing } = await admin.from('players').select('id').eq('id', playerId).maybeSingle();

  if (!existing) {
    return json({ error: 'unknown_player' }, 404);
  }

  if (name !== undefined) {
    const { error } = await admin.from('players').update({ display_name: name }).eq('id', playerId);

    if (error) {
      return error.code === UNIQUE_VIOLATION
        ? json({ error: 'name_taken' }, 409)
        : json({ error: 'update_failed' }, 500);
    }
  }

  if (address !== undefined) {
    const { data: owner } = await admin
      .from('players')
      .select('id')
      .eq('email', address)
      .neq('id', playerId)
      .maybeSingle();

    if (owner) {
      return json({ error: 'email_taken' }, 409);
    }

    const { error } = await admin.auth.admin.updateUserById(playerId, { email: address, email_confirm: true });

    if (error) {
      return error.code === 'email_exists'
        ? json({ error: 'email_taken' }, 409)
        : json({ error: 'update_failed' }, 500);
    }
  }

  return json({ ok: true });
});
