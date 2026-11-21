import { Component, computed, input, output } from '@angular/core';
import { LiveCue } from '../cue-sequence.service';

@Component({
  selector: 'app-stop-bar',
  templateUrl: './stop-bar.html',
  styleUrl: './stop-bar.scss',
})
export class StopBar {
  readonly live = input<LiveCue>();
  readonly stopped = output<void>();

  protected readonly phaseLabel = computed(() => {
    switch (this.live()?.phase) {
      case 'announcing':
        return 'Naam wordt omgeroepen';
      case 'playing':
        return 'Speelt';
      default:
        return 'Geen cue actief';
    }
  });
}
