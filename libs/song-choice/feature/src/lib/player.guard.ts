import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@soundboard/supabase/data-access';

// UX only: row-level security is what actually protects the data.
export const playerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();

  return (auth.isSignedIn() && !auth.isOperator()) || router.parseUrl('/speler/inloggen');
};
