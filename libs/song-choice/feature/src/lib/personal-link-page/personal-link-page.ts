import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerSongService } from '@soundboard/players/data-access';
import { FunctionCallError } from '@soundboard/supabase/data-access';

type LinkState = 'checking' | 'invalid' | 'failed';

@Component({
  selector: 'app-personal-link-page',
  templateUrl: './personal-link-page.html',
  styleUrl: './personal-link-page.scss',
})
export class PersonalLinkPage {
  private readonly songs = inject(PlayerSongService);
  private readonly router = inject(Router);

  readonly token = input.required<string>();

  protected readonly linkState = signal<LinkState>('checking');

  constructor() {
    effect(() => {
      const token = this.token();
      untracked(() => void this.openLink(token));
    });
  }

  protected onRetry(): void {
    void this.openLink(this.token());
  }

  private async openLink(token: string): Promise<void> {
    this.linkState.set('checking');

    try {
      await this.songs.signInWithLink(token);
      await this.router.navigateByUrl('/speler', { replaceUrl: true });
    } catch (error) {
      this.linkState.set(error instanceof FunctionCallError && error.code === 'invalid_link' ? 'invalid' : 'failed');
    }
  }
}
