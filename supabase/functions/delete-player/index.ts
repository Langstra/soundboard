import { corsHeaders, createAdminClient, getCaller, json, UUID_PATTERN } from '../_shared/http.ts';

// Operator only: deleting the auth user cascades to the player, their song choice and their link.
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const admin = createAdminClient();
  const caller = await getCaller(admin, request);

  if (caller?.app_metadata?.role !== 'operator') {
    return json({ error: 'forbidden' }, 403);
  }

  const { playerId } = await request.json().catch(() => ({}));

  if (typeof playerId !== 'string' || !UUID_PATTERN.test(playerId)) {
    return json({ error: 'invalid_player' }, 400);
  }

  const { data: existing } = await admin.from('players').select('id').eq('id', playerId).maybeSingle();

  if (!existing) {
    return json({ error: 'unknown_player' }, 404);
  }

  const { error } = await admin.auth.admin.deleteUser(playerId);

  return error ? json({ error: 'delete_failed' }, 500) : json({ ok: true });
});
