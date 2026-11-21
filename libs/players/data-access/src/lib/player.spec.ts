import { toPlayer } from './player';

const row = { id: 'p1', display_name: 'Daan', spoken_name: null, spotify_track_id: null, start_seconds: null };

describe('toPlayer', () => {
  it('maps a row without a song to a player without a song choice', () => {
    expect(toPlayer(row)).toEqual({ id: 'p1', displayName: 'Daan', spokenName: undefined, songChoice: undefined });
  });

  it('maps a complete song choice and the spoken name', () => {
    const player = toPlayer({ ...row, spoken_name: 'Dahn', spotify_track_id: 'abc', start_seconds: 73 });

    expect(player.spokenName).toBe('Dahn');
    expect(player.songChoice).toEqual({ trackId: 'abc', startSeconds: 73 });
  });
});
