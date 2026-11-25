import { createClient, SupabaseClient, User } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function createAdminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

export async function getCaller(admin: SupabaseClient, request: Request): Promise<User | undefined> {
  const jwt = (request.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data } = await admin.auth.getUser(jwt);

  return data.user ?? undefined;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Unclaimed players sign in through their Personal Link with this address (ADR 0002).
export const PLACEHOLDER_DOMAIN = 'players.invalid';

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));

  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function saveLinkToken(admin: SupabaseClient, playerId: string, token: string): Promise<boolean> {
  const { error } = await admin
    .from('player_links')
    .upsert({ player_id: playerId, token_hash: await sha256Hex(token), created_at: new Date().toISOString() });

  return !error;
}
