import { Service } from '@angular/core';
import { injectSupabase, invokeFunction } from '@soundboard/supabase/data-access';

@Service()
export class PlayerLinksService {
  private readonly supabase = injectSupabase();

  // The token is only returned here once; the server keeps just its hash.
  async regenerate(playerId: string): Promise<string> {
    const { token } = await invokeFunction<{ token: string }>(this.supabase, 'regenerate-link', { playerId });

    return token;
  }
}
