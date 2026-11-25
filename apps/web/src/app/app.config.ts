import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideSpotify } from '@soundboard/spotify/data-access';
import { provideSupabase } from '@soundboard/supabase/data-access';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // 'computed' keeps the browser history intact when a guard cancels a back navigation.
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withRouterConfig({ canceledNavigationResolution: 'computed' }),
    ),
    provideSupabase({ url: environment.supabaseUrl, anonKey: environment.supabaseAnonKey }),
    provideSpotify({ clientId: environment.spotifyClientId, redirectUri: environment.spotifyRedirectUri }),
  ],
};
