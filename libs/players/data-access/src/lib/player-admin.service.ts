import { Service } from '@angular/core';
import { injectSupabase, invokeFunction } from '@soundboard/supabase/data-access';

export type CreatedPlayer = { playerId: string; token: string };

// Operator only: every call goes through an Edge Function that checks the operator role.
@Service()
export class PlayerAdminService {
  private readonly supabase = injectSupabase();

  create(displayName: string): Promise<CreatedPlayer> {
    return invokeFunction<CreatedPlayer>(this.supabase, 'create-player', { displayName });
  }

  async rename(playerId: string, displayName: string): Promise<void> {
    await invokeFunction(this.supabase, 'update-player', { playerId, displayName });
  }

  async setEmail(playerId: string, email: string): Promise<void> {
    await invokeFunction(this.supabase, 'update-player', { playerId, email });
  }

  async remove(playerId: string): Promise<void> {
    await invokeFunction(this.supabase, 'delete-player', { playerId });
  }
}
