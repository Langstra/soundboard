import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Player, PlayerLinksService, PlayersService } from '@soundboard/players/data-access';
import { SpotifyAuthService, SpotifyPlaybackService } from '@soundboard/spotify/data-access';
import { AuthService } from '@soundboard/supabase/data-access';
import { PlayDurationService } from '../play-duration.service';

@Component({
  selector: 'app-settings-page',
  imports: [FormField, RouterLink],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly spotifyAuth = inject(SpotifyAuthService);
  private readonly playback = inject(SpotifyPlaybackService);
  private readonly playDuration = inject(PlayDurationService);
  private readonly links = inject(PlayerLinksService);
  private readonly document = inject(DOCUMENT);

  protected readonly players = inject(PlayersService).players;
  private readonly injector = inject(Injector);
  private readonly linkField = viewChild<ElementRef<HTMLInputElement>>('linkField');

  protected readonly generatedLink = signal<{ playerId: string; playerName: string; url: string } | undefined>(
    undefined,
  );
  protected readonly pendingPlayerId = signal<string | undefined>(undefined);
  protected readonly linkMessage = signal<string | undefined>(undefined);
  protected readonly linkError = signal<string | undefined>(undefined);
  private readonly hasCopied = signal(false);
  private readonly isCloseWarned = signal(false);

  protected readonly closeLabel = computed(() =>
    this.isCloseWarned() && !this.hasCopied() ? 'Toch sluiten' : 'Sluiten',
  );

  protected readonly minSeconds = PlayDurationService.minSeconds;
  protected readonly maxSeconds = PlayDurationService.maxSeconds;

  private readonly settings = signal({ seconds: this.playDuration.seconds() });

  protected readonly settingsForm = form(this.settings, (path) => {
    required(path.seconds, { message: 'Vul een aantal seconden in.' });
    min(path.seconds, PlayDurationService.minSeconds, {
      message: `Kies minstens ${PlayDurationService.minSeconds} seconden.`,
    });
    max(path.seconds, PlayDurationService.maxSeconds, {
      message: `Kies hoogstens ${PlayDurationService.maxSeconds} seconden.`,
    });
  });

  protected readonly isSpotifyConnected = computed(() => this.spotifyAuth.status() === 'signed-in');

  constructor() {
    effect(() => {
      const seconds = this.settings().seconds;

      if (this.settingsForm.seconds().valid() && Number.isInteger(seconds)) {
        this.playDuration.setSeconds(seconds);
      }
    });
  }

  protected onAskNewLink(player: Player): void {
    this.pendingPlayerId.set(player.id);
  }

  protected onCancelNewLink(): void {
    this.pendingPlayerId.set(undefined);
  }

  protected async onNewLink(player: Player): Promise<void> {
    this.pendingPlayerId.set(undefined);
    this.linkMessage.set(undefined);
    this.linkError.set(undefined);

    try {
      const token = await this.links.regenerate(player.id);
      this.hasCopied.set(false);
      this.isCloseWarned.set(false);
      this.generatedLink.set({
        playerId: player.id,
        playerName: player.displayName,
        url: `${this.document.location.origin}/p/${token}`,
      });
      afterNextRender(() => this.linkField()?.nativeElement.focus(), { injector: this.injector });
    } catch {
      this.generatedLink.set(undefined);
      this.linkError.set(`Een nieuwe link voor ${player.displayName} maken is niet gelukt.`);
    }
  }

  protected async onCopyLink(): Promise<void> {
    const link = this.generatedLink();

    if (!link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(link.url);
      this.hasCopied.set(true);
      this.linkError.set(undefined);
      this.linkMessage.set('Link gekopieerd.');
    } catch {
      this.linkMessage.set(undefined);
      this.linkError.set('Kopiëren is niet gelukt. Selecteer de link en kopieer hem zelf.');
    }
  }

  protected onCloseLink(): void {
    if (!this.hasCopied() && !this.isCloseWarned()) {
      this.isCloseWarned.set(true);
      this.linkError.set('Je hebt de link nog niet gekopieerd. Sluiten maakt hem onzichtbaar.');
      return;
    }

    this.generatedLink.set(undefined);
    this.linkMessage.set(undefined);
    this.linkError.set(undefined);
  }

  protected onSelectLink(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected onSpotifyLogin(): void {
    void this.spotifyAuth.login();
  }

  protected onSpotifyLogout(): void {
    this.playback.disconnect();
    this.spotifyAuth.logout();
  }

  protected async onSignOut(): Promise<void> {
    this.playback.disconnect();
    await this.auth.signOut();
    await this.router.navigateByUrl('/inloggen');
  }
}
