import { computed, Service, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { injectSupabase } from './supabase-client';

@Service()
export class AuthService {
  private readonly supabase = injectSupabase();

  private readonly session = signal<Session | undefined>(undefined);

  readonly isSignedIn = computed(() => this.session() !== undefined);
  readonly isOperator = computed(() => this.session()?.user.app_metadata['role'] === 'operator');

  private readonly ready = this.restoreSession();

  whenReady(): Promise<void> {
    return this.ready;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  private async restoreSession(): Promise<void> {
    const { data, error } = await this.supabase.auth.getSession();

    if (error) {
      throw error;
    }

    this.session.set(data.session ?? undefined);
    this.supabase.auth.onAuthStateChange((_event, session) => this.session.set(session ?? undefined));
  }
}
