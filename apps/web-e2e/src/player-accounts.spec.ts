import { APIRequestContext, expect, Page, test } from '@playwright/test';

// Needs the local Supabase stack: the operator and Mailpit (where the codes arrive) come from `pnpm db:start`.
const MAILPIT = 'http://127.0.0.1:54324/api/v1';

// Emptying the mailbox first means the next code that arrives cannot be an earlier one.
async function clearMailbox(request: APIRequest): Promise<void> {
  await request.delete(`${MAILPIT}/messages`);
}

async function latestCodeFor(request: APIRequest, address: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const list = await (await request.get(`${MAILPIT}/search?query=${encodeURIComponent(`to:${address}`)}`)).json();
    const id = list.messages?.[0]?.ID;

    if (id) {
      const message = await (await request.get(`${MAILPIT}/message/${id}`)).json();
      const code = /\b\d{6}\b/.exec(message.HTML)?.[0];

      if (code) {
        return code;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No code arrived for ${address}`);
}

type APIRequest = APIRequestContext;

async function signInAsOperator(page: Page): Promise<void> {
  await page.goto('/operator/inloggen');
  await page.getByLabel('E-mailadres').fill('operator@soundboard.test');
  await page.getByLabel('Wachtwoord').fill('operator');
  await page.getByRole('button', { name: 'Inloggen' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('the operator creates a player who claims an email and signs in with a code', async ({ browser, request }) => {
  const suffix = Date.now().toString(36);
  const name = `E2E ${suffix}`;
  const address = `e2e-${suffix}@example.com`;

  const operatorContext = await browser.newContext();
  const operator = await operatorContext.newPage();
  await signInAsOperator(operator);
  await operator.goto('/instellingen');

  // Create: the Personal Link is shown once.
  await operator.getByLabel('Nieuwe speler').fill(name);
  await operator.getByRole('button', { name: 'Toevoegen' }).click();
  const link = await operator.getByRole('textbox', { name: `Link voor ${name}` }).inputValue();
  expect(link).toContain('/p/');
  // Closing before copying warns first; a second click confirms.
  await operator.getByRole('button', { name: 'Sluiten', exact: true }).click();
  await operator.getByRole('button', { name: 'Toch sluiten' }).click();

  await operator.getByLabel('Nieuwe speler').fill(name.toLowerCase());
  await operator.getByRole('button', { name: 'Toevoegen' }).click();
  await expect(operator.getByText('Er is al een speler met deze naam')).toBeVisible();

  // The player opens the link and must claim an email before choosing a song.
  const playerContext = await browser.newContext();
  const player = await playerContext.newPage();
  await player.goto(link);
  await expect(player).toHaveURL(/\/speler$/);
  await expect(player.getByRole('heading', { level: 1 })).toContainText('koppel je e-mailadres');
  await expect(player.getByLabel('Spotify-link')).toHaveCount(0);

  await clearMailbox(request);
  await player.getByLabel('E-mailadres').fill(address);
  await player.getByRole('button', { name: 'Stuur code' }).click();
  await expect(player.getByText(`We hebben een code gestuurd naar ${address}`)).toBeVisible();

  await player.getByLabel('Code uit je e-mail').fill('000000');
  await player.getByRole('button', { name: 'Bevestig code' }).click();
  await expect(player.getByText('Deze code klopt niet of is verlopen.')).toBeVisible();

  await player.getByLabel('Code uit je e-mail').fill(await latestCodeFor(request, address));
  await player.getByRole('button', { name: 'Bevestig code' }).click();
  await expect(player.getByRole('heading', { level: 1 })).toContainText(`Hoi ${name}, kies je nummer`);

  // The operator sees the claimed address.
  await operator.reload();
  await expect(operator.getByRole('listitem').filter({ hasText: name })).toContainText(address);

  // A fresh browser has no session: the home page leads to the code login.
  const returningContext = await browser.newContext();
  const returning = await returningContext.newPage();
  await returning.goto('/');
  await expect(returning).toHaveURL(/\/speler\/inloggen$/);

  await clearMailbox(request);
  await returning.getByLabel('E-mailadres').fill(address);
  await returning.getByRole('button', { name: 'Stuur code' }).click();
  await returning.getByLabel('Code uit je e-mail').fill(await latestCodeFor(request, address));
  await returning.getByRole('button', { name: 'Bevestig code' }).click();
  await expect(returning).toHaveURL(/\/speler$/);
  await expect(returning.getByRole('heading', { level: 1 })).toContainText(`Hoi ${name}`);

  // An unknown address looks the same as a known one.
  const strangerContext = await browser.newContext();
  const stranger = await strangerContext.newPage();
  await stranger.goto('/speler/inloggen');
  await stranger.getByLabel('E-mailadres').fill(`nobody-${suffix}@example.com`);
  await stranger.getByRole('button', { name: 'Stuur code' }).click();
  await expect(stranger.getByText('We hebben een code gestuurd naar')).toBeVisible();

  // Rename, then delete.
  const row = operator.getByRole('listitem').filter({ hasText: name });
  await row.getByRole('button', { name: `Acties voor ${name}` }).click();
  await row.getByRole('button', { name: `Naam van ${name} wijzigen` }).click();
  await operator.getByLabel('Nieuwe naam').fill(`${name} b`);
  await operator.getByRole('button', { name: 'Opslaan' }).click();
  const renamed = operator.getByRole('listitem').filter({ hasText: `${name} b` });
  await expect(renamed).toBeVisible();

  await renamed.getByRole('button', { name: `Acties voor ${name} b` }).click();
  await renamed.getByRole('button', { name: `${name} b verwijderen` }).click();
  await operator.getByRole('button', { name: 'Ja, verwijder' }).click();
  await expect(operator.getByRole('listitem').filter({ hasText: `${name} b` })).toHaveCount(0);

  await Promise.all([operatorContext, playerContext, returningContext, strangerContext].map((c) => c.close()));
});

test('the player sign-in links to the operator sign-in', async ({ page }) => {
  await page.goto('/speler/inloggen');
  await page.getByRole('link', { name: 'Login als operator' }).click();
  await expect(page).toHaveURL(/\/operator\/inloggen$/);
});
