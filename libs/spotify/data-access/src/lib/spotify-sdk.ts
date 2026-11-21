export type SpotifyPlayerEvent =
  'ready' | 'not_ready' | 'initialization_error' | 'authentication_error' | 'account_error';

export type SpotifySdkPlayer = {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(event: SpotifyPlayerEvent, listener: (payload: { device_id: string; message: string }) => void): void;
  activateElement(): Promise<void>;
  pause(): Promise<void>;
  setVolume(volume: number): Promise<void>;
};

type SpotifySdk = {
  Player: new (options: {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume: number;
  }) => SpotifySdkPlayer;
};

declare global {
  interface Window {
    Spotify?: SpotifySdk;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js';

let sdkPromise: Promise<SpotifySdk> | undefined;

export function loadSpotifySdk(): Promise<SpotifySdk> {
  sdkPromise ??= requestSpotifySdk();
  sdkPromise.catch(() => (sdkPromise = undefined));

  return sdkPromise;
}

function requestSpotifySdk(): Promise<SpotifySdk> {
  return new Promise((resolve, reject) => {
    if (window.Spotify) {
      resolve(window.Spotify);
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify as SpotifySdk);

    const script = document.createElement('script');
    script.src = SDK_URL;
    script.onerror = () =>
      reject(new Error('Het Spotify-script kon niet geladen worden. Blokkeert een adblocker het?'));
    document.head.append(script);
  });
}
