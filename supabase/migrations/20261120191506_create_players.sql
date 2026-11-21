create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  spoken_name text,
  spotify_track_id text,
  start_seconds integer check (start_seconds >= 0),
  created_at timestamptz not null default now(),
  constraint players_song_choice_complete check ((spotify_track_id is null) = (start_seconds is null))
);

alter table public.players enable row level security;

-- Only the operator (app_metadata is not user-editable) sees every player.
create policy "operator reads all players" on public.players
  for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

create policy "player reads own row" on public.players
  for select to authenticated
  using (id = (select auth.uid()));

create policy "player updates own row" on public.players
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Players may change only their own song choice and spoken name, never the display name.
revoke update on public.players from authenticated;
grant update (spoken_name, spotify_track_id, start_seconds) on public.players to authenticated;

alter publication supabase_realtime add table public.players;
