create table public.player_links (
  player_id uuid primary key references public.players (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

-- No policies on purpose: only the service role (edge functions) may read or write link hashes.
alter table public.player_links enable row level security;
