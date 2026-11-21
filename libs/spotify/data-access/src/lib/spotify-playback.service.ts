import { inject, Service, signal } from '@angular/core';
import { SpotifyAuthService } from './spotify-auth.service';
import { loadSpotifySdk, SpotifySdkPlayer } from './spotify-sdk';

export type SpotifyPlaybackStatus = 'inactive' | 'connecting' | 'ready' | 'not-premium' | 'unavailable';

const API_URL = 'https://api.spotify.com/v1';
const READY_TIMEOUT_MS = 10_000;
const FADE_STEP_MS = 50;

@Service()
export class SpotifyPlaybackService {
  private readonly auth = inject(SpotifyAuthService);

  private player?: SpotifySdkPlayer;
  private deviceId?: string;
  private fadeRun = 0;

  private readonly statusSignal = signal<SpotifyPlaybackStatus>('inactive');
  readonly status = this.statusSignal.asReadonly();

  private readonly problemSignal = signal<string | undefined>(undefined);
  readonly problem = this.problemSignal.asReadonly();

  preload(): void {
    loadSpotifySdk().catch(() => undefined);
  }

  // Must run inside a user gesture so the browser allows audio.
  async activate(): Promise<void> {
    this.statusSignal.set('connecting');
    this.problemSignal.set(undefined);

    try {
      const player = await this.createPlayer();
      await player.activateElement();

      if (!(await this.hasPremium())) {
        this.statusSignal.set('not-premium');
        return;
      }

      this.deviceId = await this.connect(player);
      this.statusSignal.set('ready');
    } catch (error) {
      if (this.statusSignal() !== 'not-premium') {
        this.problemSignal.set(error instanceof Error ? error.message : 'Onbekende fout.');
        this.statusSignal.set('unavailable');
      }
    }
  }

  async play(trackId: string, startSeconds: number): Promise<void> {
    this.fadeRun++;
    await this.player?.setVolume(1);

    const response = await fetch(`${API_URL}/me/player/play?device_id=${this.deviceId}`, {
      method: 'PUT',
      headers: await this.authHeaders(),
      body: JSON.stringify({ uris: [`spotify:track:${trackId}`], position_ms: startSeconds * 1000 }),
    });

    if (!response.ok) {
      throw new Error('Het nummer kon niet afgespeeld worden.');
    }
  }

  async fadeOutAndStop(fadeMilliseconds: number): Promise<void> {
    const run = ++this.fadeRun;
    const steps = Math.max(1, Math.round(fadeMilliseconds / FADE_STEP_MS));

    for (let step = 1; step <= steps; step++) {
      await this.player?.setVolume(1 - step / steps);
      await new Promise((resolve) => setTimeout(resolve, FADE_STEP_MS));

      if (run !== this.fadeRun) {
        return;
      }
    }

    await this.stop();
  }

  async stop(): Promise<void> {
    this.fadeRun++;
    await this.player?.pause();
    await this.player?.setVolume(1);
  }

  disconnect(): void {
    this.player?.disconnect();
    this.player = undefined;
    this.deviceId = undefined;
    this.statusSignal.set('inactive');
  }

  private async hasPremium(): Promise<boolean> {
    const response = await fetch(`${API_URL}/me`, { headers: await this.authHeaders() });

    if (!response.ok) {
      const hint = response.status === 403 ? ' Staat dit account onder Gebruikersbeheer in het Spotify-dashboard?' : '';
      throw new Error(`Spotify gaf status ${response.status} bij het lezen van het account.${hint}`);
    }

    return ((await response.json()) as { product: string }).product === 'premium';
  }

  private async createPlayer(): Promise<SpotifySdkPlayer> {
    const sdk = await loadSpotifySdk();
    this.player = new sdk.Player({
      name: 'Soundboard',
      getOAuthToken: (callback) => void this.auth.getAccessToken().then(callback),
      volume: 1,
    });

    return this.player;
  }

  private connect(player: SpotifySdkPlayer): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('De Spotify-speler kwam niet online binnen 10 seconden.')),
        READY_TIMEOUT_MS,
      );

      player.addListener('ready', ({ device_id }) => {
        clearTimeout(timeout);
        resolve(device_id);
      });
      player.addListener('initialization_error', () => {
        clearTimeout(timeout);
        reject(new Error('Deze browser kan Spotify niet afspelen (DRM ontbreekt). Gebruik Chrome of Firefox.'));
      });
      player.addListener('authentication_error', () => {
        clearTimeout(timeout);
        reject(new Error('Spotify weigerde de inlogsessie. Log uit en opnieuw in.'));
      });
      player.addListener('account_error', () => {
        clearTimeout(timeout);
        this.statusSignal.set('not-premium');
        reject(new Error('Geen Spotify Premium.'));
      });
      void player.connect();
    });
  }

  private async authHeaders(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.auth.getAccessToken()}`, 'Content-Type': 'application/json' };
  }
}
