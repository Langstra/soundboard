import { Component, inject, output } from '@angular/core';
import { PlayerAccountService } from '@soundboard/players/data-access';
import { EmailCodeForm } from '../email-code-form/email-code-form';

// Email Claim: a player registers their own address once, confirmed with a code, before choosing a song.
@Component({
  selector: 'app-email-claim',
  imports: [EmailCodeForm],
  templateUrl: './email-claim.html',
})
export class EmailClaim {
  private readonly account = inject(PlayerAccountService);

  readonly claimed = output<void>();

  protected readonly requestCode = (address: string) => this.account.requestEmailClaim(address);
  protected readonly confirmCode = (address: string, code: string) => this.account.confirmEmailClaim(address, code);
}
