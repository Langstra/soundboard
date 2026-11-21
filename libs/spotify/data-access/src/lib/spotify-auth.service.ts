import { Service, signal } from '@angular/core';
import { randomString, toCodeChallenge } from './pkce';
import { injectSpotifyConfig } from './spotify-config';

export type SpotifyAuthStatus = 'restoring' | 'signed-out' | 'signed-in';

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SCOPES = ['streaming', 'user-read-email', 'user-read-private', 'user-modify-playback-state'];
const REFRESH_TOKEN_KEY = 'soundboard.spotify.refreshToken';
const VERIFIER_KEY = 'soundboard.spotify.verifier';
const STATE_KEY = 'soundboard.spotify.state';
const EXPIRY_MARGIN_MS = 30_000;

@Service()
export class SpotifyAuthService {
  private readonly config = injectSpotifyConfig();

  private accessToken?: string;
  private accessTokenExpiresAt = 0;

  private readonly statusSignal = signal<SpotifyAuthStatus>('restoring');
  readonly status = this.statusSignal.asReadonly();

  constructor() {
    void this.restoreSession();
  }

  async login(): Promise<void> {
    const verifier = randomString(96);
    const state = randomString(24);
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);

    const query = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: SCOPES.join(' '),
      state,
      code_challenge_method: 'S256',
      code_challenge: await toCodeChallenge(verifier),
    });

    window.location.assign(`${AUTHORIZE_URL}?${query}`);
  }

  logout(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.accessToken = undefined;
    this.statusSignal.set('signed-out');
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt - EXPIRY_MARGIN_MS) {
      return this.accessToken;
    }

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      this.logout();
      throw new Error('Spotify is niet verbonden.');
    }

    return this.storeTokens(
      await this.requestTokens({ grant_type: 'refresh_token', refresh_token: refreshToken }, refreshToken),
    );
  }

  private async restoreSession(): Promise<void> {
    try {
      const redirect = new URL(window.location.href).searchParams;
      const code = redirect.get('code');

      if (code) {
        await this.completeLogin(code, redirect.get('state'));
      } else if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
        await this.getAccessToken();
      } else {
        this.statusSignal.set('signed-out');
      }
    } catch {
      this.logout();
    }
  }

  private async completeLogin(code: string, state: string | null): Promise<void> {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    const expectedState = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(STATE_KEY);
    window.history.replaceState({}, '', this.config.redirectUri);

    if (!verifier || state !== expectedState) {
      throw new Error('Spotify-login is ongeldig of verlopen.');
    }

    this.storeTokens(
      await this.requestTokens({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        code_verifier: verifier,
      }),
    );
  }

  private async requestTokens(params: Record<string, string>, previousRefreshToken?: string): Promise<TokenResponse> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.config.clientId, ...params }),
    });

    if (!response.ok) {
      throw new Error(`Spotify gaf status ${response.status} bij het ophalen van de inlogsessie.`);
    }

    const tokens = (await response.json()) as TokenResponse;

    return { ...tokens, refresh_token: tokens.refresh_token ?? previousRefreshToken };
  }

  private storeTokens(tokens: TokenResponse): string {
    this.accessToken = tokens.access_token;
    this.accessTokenExpiresAt = Date.now() + tokens.expires_in * 1000;

    if (tokens.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }

    this.statusSignal.set('signed-in');

    return tokens.access_token;
  }
}
