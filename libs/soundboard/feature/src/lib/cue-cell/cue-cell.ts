import { Component, computed, input, output } from '@angular/core';
import { Player } from '@soundboard/players/data-access';
import { LiveCue } from '../cue-sequence.service';

@Component({
  selector: 'app-cue-cell',
  templateUrl: './cue-cell.html',
  styleUrl: './cue-cell.scss',
})
export class CueCell {
  readonly player = input.required<Player>();
  readonly number = input.required<number>();
  readonly phase = input<LiveCue['phase']>();
  readonly secondsLeft = input<number>();
  readonly disabled = input(false);
  readonly cued = output<void>();

  protected readonly isLive = computed(() => this.phase() !== undefined);
  protected readonly isFading = computed(() => {
    const secondsLeft = this.secondsLeft();

    return secondsLeft !== undefined && secondsLeft <= 1;
  });
  protected readonly isLongName = computed(() => this.player().displayName.length > 8);
  protected readonly hasSong = computed(() => this.player().songChoice !== undefined);
  protected readonly cueLabel = computed(() => `Q${String(this.number()).padStart(2, '0')}`);

  protected readonly statusLabel = computed(() => {
    switch (this.phase()) {
      case 'announcing':
        return 'GO · naam omgeroepen';
      case 'playing':
        return `GO · nog ${this.secondsLeft() ?? ''} s`;
      default:
        return this.hasSong() ? 'klaar' : 'geen nummer';
    }
  });
}
