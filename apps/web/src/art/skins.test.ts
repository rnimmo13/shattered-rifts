import { describe, expect, it } from 'vitest';
import { skinClass, skinName } from './skins';

describe('skin names (DECISIONS #402)', () => {
  it('reads a name from the file name', () => {
    expect(skinName({ id: 'knight-moonlit-regent', hero: 'knight' })).toBe('Moonlit Regent');
    expect(skinName({ id: 'engineer-aether-forgemaster', hero: 'engineer' })).toBe(
      'Aether Forgemaster',
    );
    expect(skinName({ id: 'engineer-gender-female', hero: 'engineer' })).toBe('Female Engineer');
    expect(skinName({ id: 'hunter-gender-male', hero: 'hunter' })).toBe('Male Hunter');
  });

  it('names the class as players see it', () => {
    expect(skinClass('spellblade')).toBe('Spellblade');
    expect(skinClass('nobody')).toBe('nobody');
  });
});

describe('every skin the Store sells has its figure (DECISIONS #406)', () => {
  it('is listed in the art manifest, and its file is there', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const { SKINS } = await import('@sr/content/v2');
    const art = new URL('../../public/art/', import.meta.url);
    const m = JSON.parse(readFileSync(new URL('manifest.json', art), 'utf8')) as {
      skins?: Record<string, string>;
    };
    for (const s of SKINS) {
      expect(m.skins?.[s.id], s.id).toBe(`figures/skins/${s.id}.png`);
      expect(existsSync(new URL(`figures/skins/${s.id}.png`, art)), s.id).toBe(true);
    }
  });
});
