import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideSpotify } from '@soundboard/spotify/data-access';
import { provideSupabase } from '@soundboard/supabase/data-access';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideSupabase({ url: environment.supabaseUrl, anonKey: environment.supabaseAnonKey }),
    provideSpotify({ clientId: environment.spotifyClientId, redirectUri: environment.spotifyRedirectUri }),
  ],
};
