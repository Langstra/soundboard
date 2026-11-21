-- seed data for local development (runs on `supabase db reset`)
insert into public.sounds (name, file_path) values ('Airhorn', 'airhorn.mp3');

-- local operator account: operator@soundboard.test / operator
-- local players: one auth user each, a few without a song choice yet
do $$
declare
  user_id uuid;
  player record;
  tracks text[] := array['4cOdK2wGLETKBW3PvgPWqT', '3n3Ppam7vgaVa1iaRUc9Lp', '7qiZfU4dY1lWllzX7mPBI3'];
begin
  for player in
    select * from (values
      (0, 'operator', null, null),
      (1, 'Sanne', null, true),
      (2, 'Daan', null, true),
      (3, 'Lotte', null, true),
      (4, 'Bram', null, false),
      (5, 'Femke', null, true),
      (6, 'Joost', null, true),
      (7, 'Noor', null, true),
      (8, 'Thijs', 'Tijs', true),
      (9, 'Iris', null, true),
      (10, 'Ruben', null, false),
      (11, 'Maud', null, true),
      (12, 'Gijs', null, true),
      (13, 'Anouk', null, true),
      (14, 'Sem', null, true)
    ) as seed (number, name, spoken_name, has_song)
  loop
    user_id := ('00000000-0000-0000-0000-' || lpad(player.number::text, 12, '0'))::uuid;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated',
      case when player.number = 0 then 'operator@soundboard.test' else 'player-' || player.number || '@soundboard.test' end,
      extensions.crypt(case when player.number = 0 then 'operator' else 'player' end, extensions.gen_salt('bf')),
      now(),
      case when player.number = 0 then '{"provider":"email","providers":["email"],"role":"operator"}'::jsonb
           else '{"provider":"email","providers":["email"]}'::jsonb end,
      '{}'::jsonb, now(), now(), '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), user_id, user_id::text,
      jsonb_build_object('sub', user_id::text, 'email', (select email from auth.users where id = user_id)),
      'email', now(), now(), now()
    );

    if player.number > 0 then
      insert into public.players (id, display_name, spoken_name, spotify_track_id, start_seconds)
      values (
        user_id, player.name, player.spoken_name,
        case when player.has_song then tracks[1 + player.number % 3] end,
        case when player.has_song then 20 + player.number * 7 end
      );
    end if;
  end loop;
end $$;
