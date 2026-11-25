import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@soundboard/supabase/data-access';

// UX only: row-level security is what actually protects the data.
export const operatorGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();

  return auth.isOperator() || router.parseUrl('/operator/inloggen');
};

// The home address belongs to the operator; everyone else is sent to their own page or to the player sign-in.
export const homeGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();

  if (auth.isOperator()) {
    return true;
  }

  return router.parseUrl(auth.isSignedIn() ? '/speler' : '/speler/inloggen');
};
