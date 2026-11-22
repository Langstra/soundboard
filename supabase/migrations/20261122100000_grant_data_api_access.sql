-- Supabase no longer grants the Data API roles on new public tables, so spell out what each role needs.
-- Row level security still decides which rows those roles can see.
grant select on public.players to authenticated;
grant update (spoken_name, spotify_track_id, start_seconds) on public.players to authenticated;

-- The Edge Functions read and write link hashes through the service role.
grant select, insert, update, delete on public.player_links to service_role;
