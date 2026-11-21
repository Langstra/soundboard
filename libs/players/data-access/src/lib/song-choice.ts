export type TrackUrlResult = { kind: 'track'; trackId: string } | { kind: 'short-link' } | { kind: 'unsupported' };

export type TrackSummary = {
  trackId: string;
  title: string;
  artist: string;
  durationSeconds: number;
  coverUrl?: string;
};

const TRACK_URL =
  /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2,3}(?:-[a-z]{2,4})?\/)?track\/([A-Za-z0-9]{22})(?:[/?#].*)?$/;
const SHORT_LINK = /^https:\/\/spotify\.link\//;
const START_TIME = /^(\d{1,3}):([0-5]\d)$|^(\d{1,4})$/;

export function parseTrackUrl(text: string): TrackUrlResult {
  const url = text.trim();
  const trackId = TRACK_URL.exec(url)?.[1];

  if (trackId) {
    return { kind: 'track', trackId };
  }

  return SHORT_LINK.test(url) ? { kind: 'short-link' } : { kind: 'unsupported' };
}

// Accepts "1:13" or a plain number of seconds ("73").
export function parseStartTime(text: string): number | undefined {
  const match = START_TIME.exec(text.trim());

  if (!match) {
    return undefined;
  }

  return match[3] === undefined ? Number(match[1]) * 60 + Number(match[2]) : Number(match[3]);
}

export function formatTime(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}
