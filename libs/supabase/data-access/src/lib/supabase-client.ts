import { EnvironmentProviders, inject, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export type AppSupabaseClient = SupabaseClient<Database>;

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const SUPABASE_CLIENT = new InjectionToken<AppSupabaseClient>('SUPABASE_CLIENT');

export function provideSupabase(config: SupabaseConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SUPABASE_CLIENT, useFactory: () => createClient<Database>(config.url, config.anonKey) },
  ]);
}

export function injectSupabase(): AppSupabaseClient {
  return inject(SUPABASE_CLIENT);
}
