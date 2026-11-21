import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export type SpotifyConfig = {
  clientId: string;
  redirectUri: string;
};

const SPOTIFY_CONFIG = new InjectionToken<SpotifyConfig>('SPOTIFY_CONFIG');

export function provideSpotify(config: SpotifyConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SPOTIFY_CONFIG, useValue: config }]);
}

export function injectSpotifyConfig(): SpotifyConfig {
  return inject(SPOTIFY_CONFIG);
}
