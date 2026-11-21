import { webcrypto } from 'node:crypto';
import { randomString, toCodeChallenge } from './pkce';

describe('pkce', () => {
  beforeAll(() => vi.stubGlobal('crypto', webcrypto));

  afterAll(() => vi.unstubAllGlobals());

  it('derives the S256 challenge from the RFC 7636 example verifier', async () => {
    const challenge = await toCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');

    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('creates verifiers of the requested length from the allowed alphabet', () => {
    expect(randomString(96)).toMatch(/^[A-Za-z0-9\-._~]{96}$/);
  });
});
