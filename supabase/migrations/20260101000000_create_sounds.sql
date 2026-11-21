create table public.sounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

alter table public.sounds enable row level security;

create policy "sounds are readable by everyone" on public.sounds
  for select using (true);
