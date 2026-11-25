-- Players are created by the operator; the email stays null until the player claims one (ADR 0002).
alter table public.players add column email text;

-- Two buttons with the same name would be indistinguishable on the soundboard.
create unique index players_display_name_unique on public.players (lower(display_name));

-- Mirrors the auth email into players; unclaimed players carry a placeholder address, which maps to null.
create function public.sync_player_email() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.players
  set email = case when new.email like '%@players.invalid' then null else new.email end
  where id = new.id;

  return new;
end;
$$;

create trigger sync_player_email
  after update of email on auth.users
  for each row execute function public.sync_player_email();

-- The Edge Functions create, rename and delete players through the service role.
grant select, insert, update, delete on public.players to service_role;
