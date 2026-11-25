import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PlayerAccountService } from '@soundboard/players/data-access';
import { EmailCodeForm } from '../email-code-form/email-code-form';

@Component({
  selector: 'app-player-sign-in',
  imports: [EmailCodeForm, RouterLink],
  templateUrl: './player-sign-in.html',
  styleUrl: './player-sign-in.scss',
})
export class PlayerSignIn {
  private readonly account = inject(PlayerAccountService);
  private readonly router = inject(Router);

  protected readonly requestCode = (address: string) => this.account.requestLoginCode(address);
  protected readonly confirmCode = (address: string, code: string) => this.account.confirmLoginCode(address, code);

  protected onSignedIn(): void {
    void this.router.navigateByUrl('/speler');
  }
}
