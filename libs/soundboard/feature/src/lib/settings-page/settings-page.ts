import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { debounce, form, FormField, max, min, required, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { SpotifyAuthService, SpotifyPlaybackService } from '@soundboard/spotify/data-access';
import { AuthService } from '@soundboard/supabase/data-access';
import { PlayDurationService } from '../play-duration.service';
import { PlayersSection } from '../players-section/players-section';

@Component({
  selector: 'app-settings-page',
  imports: [FormField, PlayersSection, RouterLink],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly spotifyAuth = inject(SpotifyAuthService);
  private readonly playback = inject(SpotifyPlaybackService);
  private readonly playDuration = inject(PlayDurationService);

  private readonly playersSection = viewChild.required(PlayersSection);

  protected readonly minSeconds = PlayDurationService.minSeconds;
  protected readonly maxSeconds = PlayDurationService.maxSeconds;
  protected readonly savedSeconds = this.playDuration.seconds;

  private readonly settings = signal({ seconds: this.playDuration.seconds() });

  protected readonly settingsForm = form(this.settings, (path) => {
    // Waits for a pause in typing, so the first digit of "15" is not judged on its own.
    debounce(path.seconds, 600);
    required(path.seconds, { message: 'Vul een aantal seconden in.' });
    min(path.seconds, PlayDurationService.minSeconds, {
      message: `Kies minstens ${PlayDurationService.minSeconds} seconden.`,
    });
    max(path.seconds, PlayDurationService.maxSeconds, {
      message: `Kies hoogstens ${PlayDurationService.maxSeconds} seconden.`,
    });
    validate(path.seconds, ({ value }) =>
      Number.isFinite(value()) && !Number.isInteger(value())
        ? { kind: 'integer', message: 'Vul een heel aantal seconden in.' }
        : undefined,
    );
  });

  protected readonly durationError = computed(() => this.settingsForm.seconds().errors()[0]?.message);

  protected readonly isSpotifyConnected = computed(() => this.spotifyAuth.status() === 'signed-in');

  constructor() {
    effect(() => {
      const seconds = this.settings().seconds;

      if (this.settingsForm.seconds().valid()) {
        this.playDuration.setSeconds(seconds);
      }
    });
  }

  canLeave(): boolean {
    return this.playersSection().confirmLeave();
  }

  protected onSpotifyLogin(): void {
    void this.spotifyAuth.login();
  }

  protected onSpotifyLogout(): void {
    this.playback.disconnect();
    this.spotifyAuth.logout();
  }

  protected async onSignOut(): Promise<void> {
    if (!this.canLeave()) {
      return;
    }

    this.playback.disconnect();
    await this.auth.signOut();
    await this.router.navigateByUrl('/operator/inloggen');
  }
}
