import { Service } from '@angular/core';
import { AuthError } from '@supabase/supabase-js';
import { injectSupabase } from '@soundboard/supabase/data-access';

export class AccountError extends Error {
  constructor(readonly code: 'email_taken' | 'rate_limited' | 'invalid_code' | 'unknown') {
    super(code);
  }
}

// Supabase answers this when the address belongs to no player; treated as sent so the page reveals nobody.
const UNKNOWN_ADDRESS_CODE = 'otp_disabled';

function toAccountError(error: AuthError): AccountError {
  switch (error.code) {
    case 'email_exists':
      return new AccountError('email_taken');
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return new AccountError('rate_limited');
    case 'otp_expired':
      return new AccountError('invalid_code');
    default:
      return new AccountError('unknown');
  }
}

@Service()
export class PlayerAccountService {
  private readonly supabase = injectSupabase();

  async requestLoginCode(email: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });

    if (error && error.code !== UNKNOWN_ADDRESS_CODE) {
      throw toAccountError(error);
    }
  }

  async confirmLoginCode(email: string, code: string): Promise<void> {
    const { error } = await this.supabase.auth.verifyOtp({ email, token: code, type: 'email' });

    if (error) {
      throw new AccountError('invalid_code');
    }
  }

  // Email Claim: the address is attached only once the code sent to it is entered.
  async requestEmailClaim(email: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ email });

    if (error) {
      throw toAccountError(error);
    }
  }

  async confirmEmailClaim(email: string, code: string): Promise<void> {
    const { error } = await this.supabase.auth.verifyOtp({ email, token: code, type: 'email_change' });

    if (error) {
      throw new AccountError('invalid_code');
    }
  }
}
