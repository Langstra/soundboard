import {
  corsHeaders,
  createAdminClient,
  getCaller,
  json,
  PLACEHOLDER_DOMAIN,
  randomToken,
  saveLinkToken,
} from '../_shared/http.ts';

const MAX_NAME_LENGTH = 40;
const UNIQUE_VIOLATION = '23505';

// Operator only: creates a player as an auth user with a placeholder email, plus the first Personal Link.
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const admin = createAdminClient();
  const caller = await getCaller(admin, request);

  if (caller?.app_metadata?.role !== 'operator') {
    return json({ error: 'forbidden' }, 403);
  }

  const { displayName } = await request.json().catch(() => ({}));
  const name = typeof displayName === 'string' ? displayName.trim() : '';

  if (name === '' || name.length > MAX_NAME_LENGTH) {
    return json({ error: 'invalid_name' }, 400);
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: `${crypto.randomUUID()}@${PLACEHOLDER_DOMAIN}`,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return json({ error: 'create_failed' }, 500);
  }

  const playerId = created.user.id;
  const { error: insertError } = await admin.from('players').insert({ id: playerId, display_name: name });

  if (insertError) {
    await admin.auth.admin.deleteUser(playerId);

    return insertError.code === UNIQUE_VIOLATION
      ? json({ error: 'name_taken' }, 409)
      : json({ error: 'create_failed' }, 500);
  }

  const token = randomToken();

  if (!(await saveLinkToken(admin, playerId, token))) {
    await admin.auth.admin.deleteUser(playerId);

    return json({ error: 'create_failed' }, 500);
  }

  return json({ playerId, token });
});
