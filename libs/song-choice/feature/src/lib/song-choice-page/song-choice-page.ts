import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import {
  formatTime,
  parseStartTime,
  parseTrackUrl,
  Player,
  PlayerSongService,
  TrackSummary,
} from '@soundboard/players/data-access';
import { FunctionCallError } from '@soundboard/supabase/data-access';
import { EmailClaim } from '../email-claim/email-claim';

type PageState = 'loading' | 'failed' | 'claim' | 'ready';

const LOOKUP_MESSAGES: Record<string, string> = {
  not_a_track: 'Dit is geen link naar een nummer. Kopieer in Spotify de link van een nummer.',
  track_not_found: 'Dit nummer is niet gevonden op Spotify.',
};
const SHORT_LINK_MESSAGE =
  'Dit is een korte link. Tik in Spotify bij het nummer op "Delen" en kies "Link kopiëren". Plak die link hier.';
const EMPTY_URL_MESSAGE = 'Plak de Spotify-link van je nummer.';
const UNSUPPORTED_MESSAGE = 'Dit is geen link naar een nummer. Kopieer in Spotify de link van een nummer.';
const LOOKUP_FAILED_MESSAGE = 'Spotify is nu niet bereikbaar. Probeer het zo nog eens.';
const SHORT_REMAINDER_SECONDS = 30;

@Component({
  selector: 'app-song-choice-page',
  imports: [EmailClaim, FormField, FormRoot],
  templateUrl: './song-choice-page.html',
  styleUrl: './song-choice-page.scss',
})
export class SongChoicePage {
  private readonly songs = inject(PlayerSongService);

  protected readonly pageState = signal<PageState>('loading');
  protected readonly player = signal<Player | undefined>(undefined);
  protected readonly track = signal<TrackSummary | undefined>(undefined);
  protected readonly lookupError = signal<string | undefined>(undefined);
  protected readonly isLookingUp = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly saveMessage = signal<string | undefined>(undefined);

  private readonly verifiedUrl = signal('');
  private readonly choice = signal({ url: '', startTime: '', spokenName: '' });

  protected readonly choiceForm = form(
    this.choice,
    (path) => {
      required(path.startTime, { message: 'Vul in waar het nummer moet beginnen.' });
    },
    { submission: { action: () => this.save() } },
  );

  protected readonly isTrackVerified = computed(
    () => this.track() !== undefined && this.choice().url.trim() === this.verifiedUrl(),
  );
  protected readonly durationLabel = computed(() => formatTime(this.track()?.durationSeconds ?? 0));
  private readonly startSeconds = computed(() => parseStartTime(this.choice().startTime));

  protected readonly startError = computed(() => {
    const text = this.choice().startTime.trim();
    const track = this.track();
    const start = this.startSeconds();

    if (text === '') {
      return undefined;
    }

    if (start === undefined) {
      return 'Vul de starttijd in als minuten:seconden, bijvoorbeeld 1:13.';
    }

    return track && this.isTrackVerified() && start >= track.durationSeconds
      ? `Het nummer is maar ${formatTime(track.durationSeconds)} lang.`
      : undefined;
  });

  protected readonly startWarning = computed(() => {
    const track = this.track();
    const start = this.startSeconds();
    const isShort =
      track !== undefined && start !== undefined && track.durationSeconds - start < SHORT_REMAINDER_SECONDS;

    return isShort && !this.startError()
      ? 'Vanaf hier is er minder dan 30 seconden nummer over. Dat kan eerder stoppen.'
      : undefined;
  });

  protected readonly canSave = computed(
    () => this.isTrackVerified() && this.startSeconds() !== undefined && !this.startError() && !this.isSaving(),
  );

  protected readonly saveHint = computed(() => {
    if (this.canSave() || this.isSaving() || this.startError()) {
      return undefined;
    }

    return this.isTrackVerified() ? 'Vul een geldige starttijd in.' : 'Controleer eerst je nummer.';
  });

  constructor() {
    void this.loadPlayer();
  }

  protected onRetry(): void {
    void this.loadPlayer();
  }

  protected onClaimed(): void {
    void this.loadPlayer();
  }

  protected onUrlBlurred(): void {
    if (this.choice().url.trim() !== '' && !this.isTrackVerified() && !this.isLookingUp()) {
      void this.onCheckTrack();
    }
  }

  protected async onCheckTrack(): Promise<void> {
    const url = this.choice().url.trim();
    const parsed = parseTrackUrl(url);
    this.saveMessage.set(undefined);

    if (url === '') {
      this.track.set(undefined);
      this.lookupError.set(EMPTY_URL_MESSAGE);
      return;
    }

    if (parsed.kind !== 'track') {
      this.track.set(undefined);
      this.lookupError.set(parsed.kind === 'short-link' ? SHORT_LINK_MESSAGE : UNSUPPORTED_MESSAGE);
      return;
    }

    await this.lookUp(url);
  }

  private async lookUp(url: string): Promise<void> {
    this.isLookingUp.set(true);
    this.lookupError.set(undefined);

    try {
      this.track.set(await this.songs.lookupTrack(url));
      this.verifiedUrl.set(url);
    } catch (error) {
      this.track.set(undefined);
      this.lookupError.set(
        (error instanceof FunctionCallError && LOOKUP_MESSAGES[error.code]) || LOOKUP_FAILED_MESSAGE,
      );
    } finally {
      this.isLookingUp.set(false);
    }
  }

  private async save(): Promise<void> {
    const player = this.player();
    const track = this.track();
    const startSeconds = this.startSeconds();

    if (!player || !track || startSeconds === undefined || !this.canSave()) {
      return;
    }

    this.isSaving.set(true);
    this.saveMessage.set(undefined);

    try {
      await this.songs.save(player.id, { trackId: track.trackId, startSeconds, spokenName: this.choice().spokenName });
      this.saveMessage.set('Opgeslagen. Je nummer staat klaar.');
    } catch {
      this.saveMessage.set('Opslaan is niet gelukt. Probeer het opnieuw.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadPlayer(): Promise<void> {
    this.pageState.set('loading');

    try {
      const player = await this.songs.loadOwnPlayer();
      this.player.set(player);

      if (!player.email) {
        this.pageState.set('claim');
        return;
      }

      this.choice.set({
        url: player.songChoice ? `https://open.spotify.com/track/${player.songChoice.trackId}` : '',
        startTime: player.songChoice ? formatTime(player.songChoice.startSeconds) : '',
        spokenName: player.spokenName ?? '',
      });
      this.pageState.set('ready');

      if (player.songChoice) {
        await this.lookUp(this.choice().url);
      }
    } catch {
      this.pageState.set('failed');
    }
  }
}
