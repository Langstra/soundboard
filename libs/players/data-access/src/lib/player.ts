export type SongChoice = {
  trackId: string;
  startSeconds: number;
};

export type Player = {
  id: string;
  displayName: string;
  spokenName?: string;
  songChoice?: SongChoice;
};

export type PlayerRow = {
  id: string;
  display_name: string;
  spoken_name: string | null;
  spotify_track_id: string | null;
  start_seconds: number | null;
};

export function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    displayName: row.display_name,
    spokenName: row.spoken_name ?? undefined,
    songChoice:
      row.spotify_track_id !== null && row.start_seconds !== null
        ? { trackId: row.spotify_track_id, startSeconds: row.start_seconds }
        : undefined,
  };
}
