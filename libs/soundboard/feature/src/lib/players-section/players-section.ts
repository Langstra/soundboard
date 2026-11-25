import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
  signal,
  WritableSignal,
} from '@angular/core';
import { email, form, FormField, FormRoot, maxLength, required } from '@angular/forms/signals';
import { Player, PlayerAdminService, PlayerLinksService, PlayersService } from '@soundboard/players/data-access';
import { FunctionCallError } from '@soundboard/supabase/data-access';

const MANAGE_MESSAGES: Record<string, string> = {
  invalid_name: 'Vul een naam in van hoogstens 40 tekens.',
  invalid_email: 'Dit e-mailadres is ongeldig.',
  name_taken: 'Er is al een speler met deze naam. Maak de naam uniek, bijvoorbeeld met een initiaal.',
  email_taken: 'Dit e-mailadres hoort al bij een andere speler.',
};
const MANAGE_FAILED_MESSAGE = 'Dat is niet gelukt. Controleer je verbinding en probeer het opnieuw.';
const MAX_NAME_LENGTH = 40;

// Only one row is open at a time, in exactly one of these modes.
type OpenRow = { playerId: string; mode: 'actions' | 'name' | 'email' | 'link' | 'delete' };
type PersonalLink = { playerId: string; playerName: string; url: string };
type Busy = 'create' | 'save' | 'link' | 'delete';

@Component({
  selector: 'app-players-section',
  imports: [FormField, FormRoot],
  templateUrl: './players-section.html',
  styleUrl: './players-section.scss',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class PlayersSection {
  private readonly links = inject(PlayerLinksService);
  private readonly admin = inject(PlayerAdminService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly players = inject(PlayersService).players;

  protected readonly openRow = signal<OpenRow | undefined>(undefined);
  protected readonly busy = signal<Busy | undefined>(undefined);
  protected readonly status = signal('');

  protected readonly generatedLink = signal<PersonalLink | undefined>(undefined);
  protected readonly linkMessage = signal<string | undefined>(undefined);
  protected readonly linkError = signal<string | undefined>(undefined);
  private readonly hasCopied = signal(false);
  private readonly isCloseWarned = signal(false);
  private isPendingLeaveWarned = false;

  protected readonly closeLabel = computed(() =>
    this.isCloseWarned() && !this.hasCopied() ? 'Toch sluiten' : 'Sluiten',
  );

  private readonly newPlayer = signal({ name: '' });
  private readonly edit = signal({ value: '' });

  // A server error belongs to the value that was sent, so typing clears it.
  private readonly createError = linkedSignal<string, string | undefined>({
    source: () => this.newPlayer().name,
    computation: () => undefined,
  });
  protected readonly rowError = linkedSignal<string, string | undefined>({
    source: () => this.edit().value,
    computation: () => undefined,
  });

  // Field messages appear after a submit attempt, not when someone only tabs past a field.
  private readonly isCreateAttempted = signal(false);
  private readonly isEditAttempted = signal(false);

  protected readonly newPlayerForm = form(
    this.newPlayer,
    (path) => {
      required(path.name, { message: 'Vul de naam van de speler in.' });
      maxLength(path.name, MAX_NAME_LENGTH, { message: 'Een naam mag hoogstens 40 tekens hebben.' });
    },
    {
      submission: {
        action: () => this.createPlayer(),
        onInvalid: () => {
          this.isCreateAttempted.set(true);
          this.focus('new-player');
        },
      },
    },
  );

  protected readonly editForm = form(
    this.edit,
    (path) => {
      required(path.value, { message: 'Dit veld mag niet leeg zijn.' });
      maxLength(path.value, MAX_NAME_LENGTH, {
        message: 'Een naam mag hoogstens 40 tekens hebben.',
        when: () => this.openRow()?.mode === 'name',
      });
      email(path.value, {
        message: 'Dit e-mailadres is ongeldig.',
        when: () => this.openRow()?.mode === 'email',
      });
    },
    {
      submission: {
        action: () => this.saveEdit(),
        onInvalid: () => {
          this.isEditAttempted.set(true);
          this.focus('row-input');
        },
      },
    },
  );

  protected readonly newPlayerError = computed(() => {
    const fieldError = this.isCreateAttempted() ? this.newPlayerForm.name().errors()[0]?.message : undefined;

    return fieldError ?? this.createError();
  });

  protected readonly editError = computed(() => {
    const fieldError = this.isEditAttempted() ? this.editForm.value().errors()[0]?.message : undefined;

    return fieldError ?? this.rowError();
  });

  // The link cannot be shown again, so leaving takes a second, deliberate attempt.
  confirmLeave(): boolean {
    if (this.isMakingLink() && !this.isPendingLeaveWarned) {
      this.isPendingLeaveWarned = true;
      this.status.set('De link wordt nog gemaakt. Wacht even, of doe dit nog een keer om toch weg te gaan.');
      this.focus('status');

      return false;
    }

    if (!this.hasUncopiedLink() || this.isCloseWarned()) {
      return true;
    }

    this.isCloseWarned.set(true);
    this.linkError.set('Je hebt de link nog niet gekopieerd. Doe dit nog een keer om toch weg te gaan.');
    this.focus('link-field');

    return false;
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUncopiedLink() || this.isMakingLink()) {
      event.preventDefault();
    }
  }

  protected onRetry(): void {
    this.players.reload();
    // The retry button disappears while loading, so focus moves to the heading above it.
    this.focus('players-heading');
  }

  protected onToggleRow(player: Player): void {
    if (this.busy()) {
      return;
    }

    const isOpen = this.openRow()?.playerId === player.id;
    this.rowError.set(undefined);
    this.openRow.set(isOpen ? undefined : { playerId: player.id, mode: 'actions' });
  }

  protected onEdit(player: Player, mode: 'name' | 'email'): void {
    if (this.busy()) {
      return;
    }

    this.isEditAttempted.set(false);
    this.edit.set({ value: mode === 'name' ? player.displayName : (player.email ?? '') });
    this.editForm().reset();
    this.rowError.set(undefined);
    this.openRow.set({ playerId: player.id, mode });
    this.focus('row-input');
  }

  protected onAsk(player: Player, mode: 'link' | 'delete'): void {
    if (this.busy() || (mode === 'link' && this.blockedByOpenLink())) {
      return;
    }

    this.rowError.set(undefined);
    this.openRow.set({ playerId: player.id, mode });
    this.focus('row-cancel');
  }

  protected onCancel(): void {
    const row = this.openRow();

    if (!row || this.busy()) {
      return;
    }

    this.rowError.set(undefined);
    this.openRow.set({ playerId: row.playerId, mode: 'actions' });
    this.focus(`${row.mode}-${row.playerId}`);
  }

  protected async onDelete(player: Player): Promise<void> {
    await this.run('delete', this.rowError, async () => {
      await this.admin.remove(player.id);
      this.players.update((players) => players.filter(({ id }) => id !== player.id));
      this.openRow.set(undefined);

      if (this.generatedLink()?.playerId === player.id) {
        this.clearLink();
      }

      this.status.set(`${player.displayName} is verwijderd.`);
      this.focus('players-heading');
    });
  }

  protected async onNewLink(player: Player): Promise<void> {
    await this.run('link', this.rowError, async () => {
      const token = await this.links.regenerate(player.id);
      this.openRow.set(undefined);
      this.showLink(player.id, player.displayName, token);
    });
  }

  protected async onCopyLink(): Promise<void> {
    const link = this.generatedLink();

    if (!link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(link.url);
      this.hasCopied.set(true);
      this.linkError.set(undefined);
      this.linkMessage.set('Link gekopieerd.');
    } catch {
      this.linkMessage.set(undefined);
      this.linkError.set('Kopiëren is niet gelukt. Selecteer de link en kopieer hem zelf.');
    }
  }

  protected onCloseLink(): void {
    const link = this.generatedLink();

    if (this.hasUncopiedLink() && !this.isCloseWarned()) {
      this.isCloseWarned.set(true);
      this.linkError.set('Je hebt de link nog niet gekopieerd. Sluiten maakt hem onzichtbaar.');
      return;
    }

    this.clearLink();
    this.focus(`row-${link?.playerId}`);
  }

  protected onSelectLink(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  private async createPlayer(): Promise<void> {
    if (this.busy() || this.blockedByOpenLink()) {
      return;
    }

    const displayName = this.newPlayer().name.trim();

    await this.run('create', this.createError, async () => {
      const { playerId, token } = await this.admin.create(displayName);
      this.newPlayer.set({ name: '' });
      this.isCreateAttempted.set(false);
      this.players.reload();
      this.showLink(playerId, displayName, token);
      this.status.set(`${displayName} is toegevoegd.`);
    });
  }

  private async saveEdit(): Promise<void> {
    const row = this.openRow();
    const player = this.players.value().find(({ id }) => id === row?.playerId);

    if (!row || !player) {
      return;
    }

    const value = this.edit().value.trim();
    const isName = row.mode === 'name';

    await this.run('save', this.rowError, async () => {
      await (isName ? this.admin.rename(player.id, value) : this.admin.setEmail(player.id, value));
      const changes: Partial<Player> = isName ? { displayName: value } : { email: value.toLowerCase() };
      // Applied locally first, so the row has its final place before focus returns to it.
      this.players.update((players) =>
        players
          .map((other) => (other.id === player.id ? { ...other, ...changes } : other))
          .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      );
      this.openRow.set(undefined);

      if (isName) {
        this.generatedLink.update((link) => (link?.playerId === player.id ? { ...link, playerName: value } : link));
      }

      this.status.set(isName ? `Naam gewijzigd in ${value}.` : `E-mailadres van ${player.displayName} is opgeslagen.`);
      this.focus(`row-${player.id}`);
    });
  }

  // One request at a time: a second one could replace a link that was never copied.
  private async run(
    busy: Busy,
    failure: WritableSignal<string | undefined>,
    action: () => Promise<void>,
  ): Promise<void> {
    if (this.busy()) {
      return;
    }

    this.busy.set(busy);
    this.isPendingLeaveWarned = false;
    failure.set(undefined);
    this.status.set('');

    try {
      await action();
    } catch (error) {
      this.status.set('');
      failure.set(this.messageFor(error));
    } finally {
      this.busy.set(undefined);
    }
  }

  private isMakingLink(): boolean {
    return this.busy() === 'create' || this.busy() === 'link';
  }

  private hasUncopiedLink(): boolean {
    return this.generatedLink() !== undefined && !this.hasCopied();
  }

  private blockedByOpenLink(): boolean {
    if (!this.hasUncopiedLink()) {
      return false;
    }

    this.linkError.set('Kopieer of sluit eerst deze link. Er kan er maar één tegelijk openstaan.');
    this.focus('link-field');

    return true;
  }

  private showLink(playerId: string, playerName: string, token: string): void {
    this.clearLink();
    this.status.set('');
    this.generatedLink.set({ playerId, playerName, url: `${this.document.location.origin}/p/${token}` });
    this.focus('link-field');
  }

  private clearLink(): void {
    this.generatedLink.set(undefined);
    this.linkMessage.set(undefined);
    this.linkError.set(undefined);
    this.hasCopied.set(false);
    this.isCloseWarned.set(false);
  }

  private focus(target: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(`[data-focus="${target}"]`)?.focus(), {
      injector: this.injector,
    });
  }

  private messageFor(error: unknown): string {
    return (error instanceof FunctionCallError && MANAGE_MESSAGES[error.code]) || MANAGE_FAILED_MESSAGE;
  }
}
