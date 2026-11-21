import { corsHeaders, createAdminClient, getCaller, json } from '../_shared/http.ts';

const TRACK_URL =
  /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2,3}(?:-[a-z]{2,4})?\/)?track\/([A-Za-z0-9]{22})(?:[/?#].*)?$/;

let cachedToken: { value: string; expiresAt: number } | undefined;

async function getAppToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value;
  }

  const credentials = btoa(`${Deno.env.get('SPOTIFY_CLIENT_ID')}:${Deno.env.get('SPOTIFY_CLIENT_SECRET')}`);
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('spotify_auth_failed');
  }

  const { access_token, expires_in } = await response.json();
  cachedToken = { value: access_token, expiresAt: Date.now() + expires_in * 1000 };

  return access_token;
}

// Verifies a pasted Spotify track URL and returns only what the page needs to confirm it.
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!(await getCaller(createAdminClient(), request))) {
    return json({ error: 'unauthorized' }, 401);
  }

  const { url } = await request.json().catch(() => ({}));
  const trackId = typeof url === 'string' ? TRACK_URL.exec(url.trim())?.[1] : undefined;

  if (!trackId) {
    return json({ error: 'not_a_track' }, 400);
  }

  let response: Response;

  try {
    response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${await getAppToken()}` },
    });
  } catch {
    return json({ error: 'spotify_unavailable' }, 502);
  }

  if (response.status === 404 || response.status === 400) {
    return json({ error: 'track_not_found' }, 404);
  }

  if (!response.ok) {
    return json({ error: 'spotify_unavailable' }, 502);
  }

  const track = await response.json();

  return json({
    trackId,
    title: track.name,
    artist: track.artists.map((artist: { name: string }) => artist.name).join(', '),
    durationSeconds: Math.floor(track.duration_ms / 1000),
    coverUrl: track.album.images.at(-1)?.url,
  });
});
