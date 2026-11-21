import { inject, Service, signal } from '@angular/core';
import { Player } from '@soundboard/players/data-access';
import { SpotifyPlaybackService } from '@soundboard/spotify/data-access';
import { AnnouncerService } from './announcer.service';
import { PlayDurationService } from './play-duration.service';

export type LiveCue = {
  player: Player;
  phase: 'announcing' | 'playing';
  secondsLeft?: number;
};

const FADE_OUT_MILLISECONDS = 1000;
const COUNTDOWN_TICK_MILLISECONDS = 250;

@Service()
export class CueSequenceService {
  private readonly announcer = inject(AnnouncerService);
  private readonly playback = inject(SpotifyPlaybackService);
  private readonly playDuration = inject(PlayDurationService);

  private runId = 0;
  private countdownTimer?: ReturnType<typeof setInterval>;

  private readonly liveSignal = signal<LiveCue | undefined>(undefined);
  readonly live = this.liveSignal.asReadonly();

  private readonly errorSignal = signal<string | undefined>(undefined);
  readonly error = this.errorSignal.asReadonly();

  async cue(player: Player): Promise<void> {
    const run = this.interrupt();
    this.liveSignal.set({ player, phase: 'announcing' });
    await this.announcer.speak(player.spokenName ?? player.displayName);

    if (!this.isCurrent(run)) {
      return;
    }

    if (!player.songChoice) {
      this.liveSignal.set(undefined);
      return;
    }

    await this.playSong(run, player, player.songChoice.trackId, player.songChoice.startSeconds);
  }

  stop(): void {
    this.interrupt();
    this.liveSignal.set(undefined);
  }

  dismissError(): void {
    this.errorSignal.set(undefined);
  }

  private async playSong(run: number, player: Player, trackId: string, startSeconds: number): Promise<void> {
    try {
      await this.playback.play(trackId, startSeconds);
    } catch {
      if (this.isCurrent(run)) {
        this.liveSignal.set(undefined);
        this.errorSignal.set(`Het nummer van ${player.displayName} kon niet afgespeeld worden.`);
      }

      return;
    }

    if (!this.isCurrent(run)) {
      // A stop that arrived while the request was in flight must not leave audio running.
      if (!this.liveSignal()) {
        void this.playback.stop();
      }

      return;
    }

    await this.runPlayWindow(run, player, this.playDuration.seconds());
  }

  private async runPlayWindow(run: number, player: Player, seconds: number): Promise<void> {
    const endsAt = Date.now() + seconds * 1000;
    this.liveSignal.set({ player, phase: 'playing', secondsLeft: seconds });
    this.countdownTimer = setInterval(() => this.updateSecondsLeft(player, endsAt), COUNTDOWN_TICK_MILLISECONDS);

    await new Promise((resolve) => setTimeout(resolve, seconds * 1000 - FADE_OUT_MILLISECONDS));

    if (this.isCurrent(run)) {
      await this.playback.fadeOutAndStop(FADE_OUT_MILLISECONDS);
    }

    if (this.isCurrent(run)) {
      this.interrupt();
      this.liveSignal.set(undefined);
    }
  }

  private updateSecondsLeft(player: Player, endsAt: number): void {
    this.liveSignal.set({
      player,
      phase: 'playing',
      secondsLeft: Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)),
    });
  }

  private interrupt(): number {
    clearInterval(this.countdownTimer);
    this.announcer.cancel();
    void this.playback.stop();
    this.errorSignal.set(undefined);

    return ++this.runId;
  }

  private isCurrent(run: number): boolean {
    return run === this.runId;
  }
}
