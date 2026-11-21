import { formatTime, parseStartTime, parseTrackUrl } from './song-choice';

describe('parseTrackUrl', () => {
  const id = '4cOdK2wGLETKBW3PvgPWqT';

  it('accepts a plain track link with tracking parameters', () => {
    expect(parseTrackUrl(`https://open.spotify.com/track/${id}?si=abc123`)).toEqual({ kind: 'track', trackId: id });
  });

  it('accepts the localized intl prefix and surrounding whitespace', () => {
    expect(parseTrackUrl(`  https://open.spotify.com/intl-nl/track/${id}  `)).toEqual({ kind: 'track', trackId: id });
  });

  it('recognises spotify.link short links so the page can explain them', () => {
    expect(parseTrackUrl('https://spotify.link/abc123')).toEqual({ kind: 'short-link' });
  });

  it.each([
    `https://open.spotify.com/album/${id}`,
    `https://open.spotify.com/playlist/${id}`,
    `http://open.spotify.com/track/${id}`,
    'spotify:track:4cOdK2wGLETKBW3PvgPWqT',
    'not a url',
    '',
  ])('rejects %s', (text) => {
    expect(parseTrackUrl(text)).toEqual({ kind: 'unsupported' });
  });
});

describe('parseStartTime', () => {
  it.each([
    ['1:13', 73],
    ['0:05', 5],
    ['12:00', 720],
    ['73', 73],
    [' 1:13 ', 73],
  ])('reads %s as %d seconds', (text, seconds) => {
    expect(parseStartTime(text)).toBe(seconds);
  });

  it.each(['', '1:7', '1:75', 'a:bc', '-5', '1:13:00', '1.5'])('rejects %s', (text) => {
    expect(parseStartTime(text)).toBeUndefined();
  });
});

describe('formatTime', () => {
  it('pads seconds', () => {
    expect(formatTime(73)).toBe('1:13');
    expect(formatTime(5)).toBe('0:05');
  });
});
