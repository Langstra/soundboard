import { DestroyRef, inject, resource, Service } from '@angular/core';
import { injectSupabase } from '@soundboard/supabase/data-access';
import { Player, toPlayer } from './player';

const PLAYER_COLUMNS = 'id, display_name, email, spoken_name, spotify_track_id, start_seconds';

@Service()
export class PlayersService {
  private readonly supabase = injectSupabase();
  private readonly destroyRef = inject(DestroyRef);

  readonly players = resource<Player[], void>({
    defaultValue: [],
    loader: () => this.loadPlayers(),
  });

  constructor() {
    this.reloadOnChange();
  }

  private async loadPlayers(): Promise<Player[]> {
    const { data, error } = await this.supabase.from('players').select(PLAYER_COLUMNS).order('display_name');

    if (error) {
      throw error;
    }

    return data.map(toPlayer);
  }

  private reloadOnChange(): void {
    const channel = this.supabase
      .channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => this.players.reload())
      .subscribe();

    this.destroyRef.onDestroy(() => void this.supabase.removeChannel(channel));
  }
}
