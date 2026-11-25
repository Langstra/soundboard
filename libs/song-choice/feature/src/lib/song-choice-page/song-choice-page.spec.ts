import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Player, PlayerAccountService, PlayerSongService, TrackSummary } from '@soundboard/players/data-access';
import { SongChoicePage } from './song-choice-page';

const player: Player = { id: 'p1', displayName: 'Daan', email: 'daan@example.com' };
const track: TrackSummary = { trackId: '4cOdK2wGLETKBW3PvgPWqT', title: 'Song', artist: 'Band', durationSeconds: 222 };
const trackUrl = `https://open.spotify.com/track/${track.trackId}?si=x`;

describe('SongChoicePage', () => {
  const songs = {
    loadOwnPlayer: vi.fn(),
    lookupTrack: vi.fn(),
    save: vi.fn(),
  };
  let fixture: ComponentFixture<SongChoicePage>;

  const page = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const field = (label: string): HTMLInputElement => {
    const input = Array.from(page().querySelectorAll('label'))
      .find((element) => element.textContent?.includes(label))
      ?.querySelector('input');

    if (!input) {
      throw new Error(`No field labelled ${label}`);
    }

    return input;
  };
  const button = (label: string): HTMLButtonElement => {
    const found = Array.from(page().querySelectorAll('button')).find((element) => element.textContent?.includes(label));

    if (!found) {
      throw new Error(`No button labelled ${label}`);
    }

    return found;
  };

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function type(input: HTMLInputElement, value: string): Promise<void> {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  async function open(): Promise<void> {
    fixture = TestBed.createComponent(SongChoicePage);
    await settle();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    songs.loadOwnPlayer.mockResolvedValue(player);
    songs.lookupTrack.mockResolvedValue(track);
    songs.save.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: PlayerSongService, useValue: songs },
        { provide: PlayerAccountService, useValue: {} },
      ],
    });
  });

  it('asks a player without an email to claim one first', async () => {
    songs.loadOwnPlayer.mockResolvedValue({ ...player, email: undefined });
    await open();

    expect(page().querySelector('h1')?.textContent).toContain('koppel je e-mailadres');
    expect(page().textContent).not.toContain('Spotify-link');
  });

  it('greets a player who has claimed an email', async () => {
    await open();

    expect(page().querySelector('h1')?.textContent).toContain('Hoi Daan');
  });

  it('explains a short link instead of looking it up', async () => {
    await open();
    await type(field('Spotify-link'), 'https://spotify.link/abc123');
    button('Controleer').click();
    await settle();

    expect(songs.lookupTrack).not.toHaveBeenCalled();
    expect(page().textContent).toContain('korte link');
  });

  it('keeps saving disabled until the track is verified', async () => {
    await open();
    await type(field('Starttijd'), '1:13');

    expect(button('Opslaan').disabled).toBe(true);
  });

  it('rejects a start time beyond the track length', async () => {
    await open();
    await type(field('Spotify-link'), trackUrl);
    button('Controleer').click();
    await settle();
    await type(field('Starttijd'), '5:00');

    expect(page().textContent).toContain('maar 3:42 lang');
    expect(button('Opslaan').disabled).toBe(true);
  });

  it('saves the verified track, the start in seconds and the spoken name', async () => {
    await open();
    await type(field('Spotify-link'), trackUrl);
    button('Controleer').click();
    await settle();
    await type(field('Starttijd'), '1:13');
    await type(field('Hoe spreek je'), 'Dahn');
    button('Opslaan').click();
    await settle();

    expect(songs.lookupTrack).toHaveBeenCalledWith(trackUrl);
    expect(songs.save).toHaveBeenCalledWith('p1', { trackId: track.trackId, startSeconds: 73, spokenName: 'Dahn' });
    expect(page().textContent).toContain('Opgeslagen');
  });
});
