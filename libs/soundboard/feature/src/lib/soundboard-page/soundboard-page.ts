import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Player, PlayersService } from '@soundboard/players/data-access';
import { SpotifyAuthService, SpotifyPlaybackService } from '@soundboard/spotify/data-access';
import { CueCell } from '../cue-cell/cue-cell';
import { CueSequenceService } from '../cue-sequence.service';
import { StopBar } from '../stop-bar/stop-bar';

type Stage = 'restoring' | 'connect' | 'activate' | 'connecting' | 'not-premium' | 'unavailable' | 'ready';

type Notice = { text: string; actionLabel?: string };

const NOTICES: Partial<Record<Stage, Notice>> = {
  connect: { text: 'Verbind met Spotify om nummers af te spelen.', actionLabel: 'Verbind met Spotify' },
  activate: { text: 'Spotify is verbonden. Start de speler om geluid toe te staan.', actionLabel: 'Start' },
  connecting: { text: 'De Spotify-speler wordt gestart…' },
  'not-premium': {
    text: 'Dit Spotify-account heeft geen Premium. Log in met een Premium-account.',
    actionLabel: 'Ander account kiezen',
  },
  unavailable: { text: 'De Spotify-speler kon niet starten.', actionLabel: 'Opnieuw proberen' },
};

const SPOTIFY_LABELS: Record<Stage, string> = {
  restoring: 'Spotify controleren…',
  connect: 'Spotify niet verbonden',
  activate: 'Spotify verbonden',
  connecting: 'Spotify start…',
  'not-premium': 'Geen Premium',
  unavailable: 'Spotify-speler niet beschikbaar',
  ready: 'Spotify Premium',
};

@Component({
  selector: 'app-soundboard-page',
  imports: [CueCell, RouterLink, StopBar],
  templateUrl: './soundboard-page.html',
  styleUrl: './soundboard-page.scss',
})
export class SoundboardPage {
  private readonly auth = inject(SpotifyAuthService);
  private readonly playback = inject(SpotifyPlaybackService);

  protected readonly sequence = inject(CueSequenceService);
  protected readonly players = inject(PlayersService).players;

  protected readonly stage = computed<Stage>(() => {
    switch (this.auth.status()) {
      case 'restoring':
        return 'restoring';
      case 'signed-out':
        return 'connect';
      default: {
        const playbackStatus = this.playback.status();

        return playbackStatus === 'inactive' ? 'activate' : playbackStatus;
      }
    }
  });

  protected readonly notice = computed(() => {
    const notice = NOTICES[this.stage()];
    const problem = this.playback.problem();

    return notice && problem && this.stage() === 'unavailable'
      ? { ...notice, text: `${notice.text} ${problem}` }
      : notice;
  });
  protected readonly spotifyLabel = computed(() => SPOTIFY_LABELS[this.stage()]);
  protected readonly isReady = computed(() => this.stage() === 'ready');

  constructor() {
    this.playback.preload();
  }

  protected onCue(player: Player): void {
    void this.sequence.cue(player);
  }

  protected onNoticeAction(): void {
    switch (this.stage()) {
      case 'connect':
        void this.auth.login();
        break;
      case 'not-premium':
        this.playback.disconnect();
        this.auth.logout();
        break;
      default:
        void this.playback.activate();
    }
  }
}
