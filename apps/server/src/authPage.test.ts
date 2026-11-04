import { describe, expect, it } from 'vitest';
import { desktopPage } from './authPage';
import worker from './worker';
import type { Env } from './env';
describe('browser approval presentation and origin handling', () => {
  it('allows native form origins without enabling scripts, escapes errors, and uses game branding', async () => {
    const response = desktopPage('<script>bad()</script>', '', 401);
    expect(response.headers.get('referrer-policy')).toBe('same-origin');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(response.headers.get('content-security-policy')).toContain("form-action 'self'");
    const html = await response.text();
    expect(html).toContain('/branding/logo-192.png');
    expect(html).toContain('&#60;script&#62;');
    expect(html).not.toContain('<script>');
  });
  it('keeps the origin gate strict while browser approval failures get HTML instead of raw JSON', async () => {
    for (const origin of ['null', 'https://attacker.invalid']) {
      const response = await worker.fetch(
        new Request('https://shatteredrifts.app/auth/desktop/confirm', {
          method: 'POST',
          headers: { origin },
          body: 'id=test',
        }),
        {} as Env,
      );
      expect(response.status).toBe(403);
      expect(response.headers.get('content-type')).toContain('text/html');
      expect(await response.text()).toContain('Sign-in could not finish');
    }
  });
});
