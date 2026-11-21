import { Service, signal } from '@angular/core';

const STORAGE_KEY = 'soundboard.playDurationSeconds';

@Service()
export class PlayDurationService {
  static readonly minSeconds = 3;
  static readonly maxSeconds = 30;
  static readonly defaultSeconds = 10;

  private readonly secondsSignal = signal(PlayDurationService.readStoredSeconds());
  readonly seconds = this.secondsSignal.asReadonly();

  setSeconds(seconds: number): void {
    this.secondsSignal.set(seconds);
    localStorage.setItem(STORAGE_KEY, String(seconds));
  }

  private static readStoredSeconds(): number {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    const isValid = Number.isInteger(stored) && stored >= this.minSeconds && stored <= this.maxSeconds;

    return isValid ? stored : this.defaultSeconds;
  }
}
