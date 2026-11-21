import { corsHeaders, createAdminClient, getCaller, json, sha256Hex } from '../_shared/http.ts';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));

  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Operator only: replaces the stored hash, so the previous link stops working at once.
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

  const token = randomToken();
  const { error } = await admin
    .from('player_links')
    .upsert({ player_id: playerId, token_hash: await sha256Hex(token), created_at: new Date().toISOString() });

  if (error) {
    return json({ error: 'unknown_player' }, 404);
  }

  return json({ token });
});
