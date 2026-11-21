// Local Supabase defaults; paste the anon/publishable key from `pnpm db:status`.
export const environment = {
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
  // Spotify requires a loopback IP (not "localhost") as redirect URI; register this exact value in the Spotify dashboard.
  spotifyClientId: '05f05689684841f8aa7010fec4892a1c',
  spotifyRedirectUri: 'http://127.0.0.1:4200/',
};
