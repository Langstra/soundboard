import { Service } from '@angular/core';
import { injectSupabase, invokeFunction } from '@soundboard/supabase/data-access';
import { Player, PlayerRow, toPlayer } from './player';
import { TrackSummary } from './song-choice';

type Session = { access_token: string; refresh_token: string };

export type SongChoiceInput = {
  spokenName?: string;
  trackId: string;
  startSeconds: number;
};

@Service()
export class PlayerSongService {
  private readonly supabase = injectSupabase();

  async signInWithLink(token: string): Promise<void> {
    const session = await invokeFunction<Session>(this.supabase, 'exchange-link', { token });
    const { error } = await this.supabase.auth.setSession(session);

    if (error) {
      throw error;
    }
  }

  async loadOwnPlayer(): Promise<Player> {
    const { data, error } = await this.supabase
      .from('players')
      .select('id, display_name, spoken_name, spotify_track_id, start_seconds')
      .single<PlayerRow>();

    if (error) {
      throw error;
    }

    return toPlayer(data);
  }

  lookupTrack(url: string): Promise<TrackSummary> {
    return invokeFunction<TrackSummary>(this.supabase, 'lookup-track', { url });
  }

  async save(playerId: string, input: SongChoiceInput): Promise<void> {
    const { error } = await this.supabase
      .from('players')
      .update({
        spoken_name: input.spokenName?.trim() || null,
        spotify_track_id: input.trackId,
        start_seconds: input.startSeconds,
      })
      .eq('id', playerId);

    if (error) {
      throw error;
    }
  }
}
