const VERIFIER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export function randomString(length: number): string {
  const values = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(values, (value) => VERIFIER_ALPHABET[value % VERIFIER_ALPHABET.length]).join('');
}

export async function toCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
