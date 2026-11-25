import { Component, input, output, signal } from '@angular/core';
import { email, form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { AccountError } from '@soundboard/players/data-access';

const ERROR_MESSAGES: Record<AccountError['code'], string> = {
  email_taken: 'Dit e-mailadres is al in gebruik. Neem contact op met de organisator.',
  rate_limited: 'Je hebt te vaak een code gevraagd. Wacht even en probeer het opnieuw.',
  invalid_code: 'Deze code klopt niet of is verlopen.',
  unknown: 'Dat is niet gelukt. Controleer je verbinding en probeer het opnieuw.',
};

// Asks for an email address, then for the 6-digit code sent to it; the parent decides what the code does.
@Component({
  selector: 'app-email-code-form',
  imports: [FormField, FormRoot],
  templateUrl: './email-code-form.html',
  styleUrl: './email-code-form.scss',
})
export class EmailCodeForm {
  readonly requestCode = input.required<(address: string) => Promise<void>>();
  readonly confirmCode = input.required<(address: string, code: string) => Promise<void>>();
  readonly completed = output<void>();

  protected readonly sentTo = signal<string | undefined>(undefined);
  protected readonly failure = signal<string | undefined>(undefined);

  private readonly address = signal({ email: '' });
  private readonly code = signal({ code: '' });

  protected readonly addressForm = form(
    this.address,
    (path) => {
      required(path.email, { message: 'Vul je e-mailadres in.' });
      email(path.email, { message: 'Dit e-mailadres is ongeldig.' });
    },
    { submission: { action: () => this.sendCode() } },
  );

  protected readonly codeForm = form(
    this.code,
    (path) => {
      required(path.code, { message: 'Vul de code in.' });
      pattern(path.code, /^\d{6}$/, { message: 'De code bestaat uit 6 cijfers.' });
    },
    { submission: { action: () => this.checkCode() } },
  );

  protected onChangeAddress(): void {
    this.sentTo.set(undefined);
    this.failure.set(undefined);
    this.code.set({ code: '' });
  }

  private async sendCode(): Promise<void> {
    const address = this.address().email.trim();
    this.failure.set(undefined);

    try {
      await this.requestCode()(address);
      this.sentTo.set(address);
    } catch (error) {
      this.failure.set(ERROR_MESSAGES[error instanceof AccountError ? error.code : 'unknown']);
    }
  }

  private async checkCode(): Promise<void> {
    const address = this.sentTo();
    this.failure.set(undefined);

    if (!address) {
      return;
    }

    try {
      await this.confirmCode()(address, this.code().code.trim());
      this.completed.emit();
    } catch (error) {
      this.failure.set(ERROR_MESSAGES[error instanceof AccountError ? error.code : 'unknown']);
    }
  }
}
