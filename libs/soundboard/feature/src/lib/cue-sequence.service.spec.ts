import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Player } from '@soundboard/players/data-access';
import { SpotifyPlaybackService } from '@soundboard/spotify/data-access';
import { AnnouncerService } from './announcer.service';
import { CueSequenceService } from './cue-sequence.service';
import { PlayDurationService } from './play-duration.service';

const withSong: Player = { id: 'a', displayName: 'Daan', songChoice: { trackId: 'track-a', startSeconds: 73 } };
const withoutSong: Player = { id: 'b', displayName: 'Bram' };

describe('CueSequenceService', () => {
  let finishAnnouncement: () => void;
  const announcer = {
    speak: vi.fn(() => new Promise<void>((resolve) => (finishAnnouncement = resolve))),
    cancel: vi.fn(),
  };
  const playback = {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    fadeOutAndStop: vi.fn().mockResolvedValue(undefined),
  };
  let service: CueSequenceService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: AnnouncerService, useValue: announcer },
        { provide: SpotifyPlaybackService, useValue: playback },
        { provide: PlayDurationService, useValue: { seconds: signal(5) } },
      ],
    });
    service = TestBed.inject(CueSequenceService);
  });

  afterEach(() => vi.useRealTimers());

  it('announces the spoken name before the song starts', async () => {
    void service.cue({ ...withSong, spokenName: 'Dahn' });

    expect(announcer.speak).toHaveBeenCalledWith('Dahn');
    expect(service.live()?.phase).toBe('announcing');
    expect(playback.play).not.toHaveBeenCalled();

    finishAnnouncement();
    await vi.advanceTimersByTimeAsync(0);

    expect(playback.play).toHaveBeenCalledWith('track-a', 73);
    expect(service.live()).toMatchObject({ phase: 'playing', secondsLeft: 5 });
  });

  it('fades out near the end of the play duration and clears the live cue', async () => {
    void service.cue(withSong);
    finishAnnouncement();
    await vi.advanceTimersByTimeAsync(5000);

    expect(playback.fadeOutAndStop).toHaveBeenCalledWith(1000);
    expect(service.live()).toBeUndefined();
  });

  it('only announces a player without a song choice', async () => {
    void service.cue(withoutSong);
    finishAnnouncement();
    await vi.advanceTimersByTimeAsync(0);

    expect(playback.play).not.toHaveBeenCalled();
    expect(service.live()).toBeUndefined();
  });

  it('lets the latest cue win over a cue that is still announcing', async () => {
    void service.cue(withSong);
    const finishFirst = finishAnnouncement;
    void service.cue(withoutSong);

    finishFirst();
    await vi.advanceTimersByTimeAsync(0);

    expect(playback.play).not.toHaveBeenCalled();
    expect(service.live()?.player.id).toBe('b');
  });

  it('stops audio and clears the live cue on stop', async () => {
    void service.cue(withSong);
    finishAnnouncement();
    await vi.advanceTimersByTimeAsync(0);

    service.stop();

    expect(playback.stop).toHaveBeenCalled();
    expect(service.live()).toBeUndefined();
  });

  it('reports an error when the song cannot be played', async () => {
    playback.play.mockRejectedValueOnce(new Error('nope'));
    void service.cue(withSong);
    finishAnnouncement();
    await vi.advanceTimersByTimeAsync(0);

    expect(service.error()).toBe('Het nummer van Daan kon niet afgespeeld worden.');
    expect(service.live()).toBeUndefined();
  });
});
