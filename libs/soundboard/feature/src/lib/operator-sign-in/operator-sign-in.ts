import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '@soundboard/supabase/data-access';

@Component({
  selector: 'app-operator-sign-in',
  imports: [FormField, FormRoot],
  templateUrl: './operator-sign-in.html',
  styleUrl: './operator-sign-in.scss',
})
export class OperatorSignIn {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly credentials = signal({ email: '', password: '' });

  protected readonly signInError = signal<string | undefined>(undefined);

  protected readonly signInForm = form(
    this.credentials,
    (path) => {
      required(path.email, { message: 'Vul je e-mailadres in.' });
      email(path.email, { message: 'Dit e-mailadres is ongeldig.' });
      required(path.password, { message: 'Vul je wachtwoord in.' });
    },
    { submission: { action: () => this.signIn() } },
  );

  private async signIn(): Promise<void> {
    this.signInError.set(undefined);
    const { email, password } = this.credentials();

    try {
      await this.auth.signIn(email, password);
      await this.router.navigateByUrl('/');
    } catch {
      this.signInError.set('Inloggen is mislukt. Controleer je e-mailadres en wachtwoord.');
    }
  }
}
