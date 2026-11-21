import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, createAdminClient, json, sha256Hex } from '../_shared/http.ts';

// Turns a Personal Link token into a normal Supabase session for the player it belongs to (ADR 0001).
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { token } = await request.json().catch(() => ({}));

  if (typeof token !== 'string' || token.length < 20) {
    return json({ error: 'invalid_link' }, 400);
  }

  const admin = createAdminClient();
  const { data: link } = await admin
    .from('player_links')
    .select('player_id')
    .eq('token_hash', await sha256Hex(token))
    .maybeSingle();

  if (!link) {
    return json({ error: 'invalid_link' }, 404);
  }

  const { data: player } = await admin.auth.admin.getUserById(link.player_id);
  const email = player.user?.email;

  if (!email) {
    return json({ error: 'invalid_link' }, 404);
  }

  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({ type: 'magiclink', email });

  if (generateError) {
    return json({ error: 'session_failed' }, 500);
  }

  const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false },
  });
  const { data: verified, error: verifyError } = await anon.auth.verifyOtp({
    token_hash: generated.properties.hashed_token,
    type: 'magiclink',
  });

  if (verifyError || !verified.session) {
    return json({ error: 'session_failed' }, 500);
  }

  return json({ access_token: verified.session.access_token, refresh_token: verified.session.refresh_token });
});
