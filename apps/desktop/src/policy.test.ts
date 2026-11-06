import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { assetPath, byteRange, externalLink, gameNavigation, windowState } from './policy';

describe('media byte ranges', () => {
  it('serves explicit, open-ended and suffix ranges within the file', () => {
    expect(byteRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 });
    expect(byteRange('bytes=500-', 1000)).toEqual({ start: 500, end: 999 });
    expect(byteRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 });
    expect(byteRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 });
  });
  it('rejects absent, malformed, multi-part and unsatisfiable ranges', () => {
    expect(byteRange(null, 1000)).toBeNull();
    expect(byteRange('bytes=-', 1000)).toBeNull();
    expect(byteRange('bytes=0-1,5-6', 1000)).toBeNull();
    expect(byteRange('items=0-1', 1000)).toBeNull();
    expect(byteRange('bytes=1000-', 1000)).toBeNull();
    expect(byteRange('bytes=50-10', 1000)).toBeNull();
  });
});

describe('desktop local content boundary', () => {
  const root = resolve('desktop-test-assets');
  it('resolves the entry, hashed chunks and art beneath the bundle', () => {
    expect(assetPath(root, 'srgame://app/')).toBe(resolve(root, 'index.html'));
    expect(assetPath(root, 'srgame://app/assets/game.js?v=1')).toBe(
      resolve(root, 'assets/game.js'),
    );
    expect(assetPath(root, 'srgame://app/art/cards/a%20b.jpg')).toBe(
      resolve(root, 'art/cards/a b.jpg'),
    );
  });
  it.each([
    'https://app/index.html',
    'srgame://other/index.html',
    'srgame://user@app/index.html',
    'srgame://app/%2e%2e%2fsecret',
    'srgame://app/art/%2e%2e%2f%2e%2e%2fsecret',
    'srgame://app/%5csecret',
    'srgame://app/C%3a/secret',
    'srgame://app/%00',
    'srgame://app/%zz',
  ])('refuses invalid or escaping paths: %s', (url) => expect(assetPath(root, url)).toBeNull());
  it('keeps the window on the game and limits external protocols', () => {
    expect(gameNavigation('srgame://app/index.html#/run')).toBe(true);
    expect(gameNavigation('https://shatteredrifts.app/')).toBe(false);
    expect(gameNavigation('srgame://app/art/data.html')).toBe(false);
    expect(externalLink('https://shatteredrifts.app/')).toBe(true);
    for (const url of [
      'file:///C:/test',
      'javascript:alert(1)',
      'steam://run/1',
      'https://a:b@example.com',
    ])
      expect(externalLink(url)).toBe(false);
  });
  it('recovers from corrupt window settings and bounds sizes', () => {
    expect(windowState(null)).toEqual({
      width: 1440,
      height: 900,
      maximized: false,
      fullscreen: false,
    });
    expect(
      windowState({ width: -1, height: Infinity, fullscreen: 'yes', maximized: true }),
    ).toEqual({
      width: 960,
      height: 900,
      fullscreen: false,
      maximized: true,
    });
  });
});
