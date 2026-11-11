import { afterEach, describe, expect, it, vi } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import { HERO_SHEETS, SHEET_PREFIX, VIDEO_PREFIX, heroRigFor } from './heroRigs';

function storage(items: Record<string, string>): void {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => items[k] ?? null,
    setItem: (k: string, v: string) => void (items[k] = v),
    removeItem: (k: string) => void delete items[k],
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('two model modes (DECISIONS #755)', () => {
  it('draws every Riftwalker in its pose-sheet model by default', () => {
    storage({});
    for (const hero of Object.keys(RIFTWALKERS)) {
      expect(HERO_SHEETS.has(hero), hero).toBe(true);
      expect(heroRigFor(hero)).toBe(`${SHEET_PREFIX}${hero}`);
    }
  });

  it('uses the video clips when the beta setting is on', () => {
    storage({ 'sr.animatedModels': 'on' });
    expect(heroRigFor('knight')).toBe(`${VIDEO_PREFIX}knight`);
  });
});

describe('every pose-sheet model ships with the game (DECISIONS #755)', () => {
  it('has its manifest, its atlas pages, the five clips and their moments', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const dir = new URL('../../public/art/heroes-sheets/', import.meta.url);
    for (const hero of HERO_SHEETS) {
      const man = JSON.parse(readFileSync(new URL(`${hero}/sprites.json`, dir), 'utf8')) as {
        pages: string[];
        clips: Record<
          string,
          { count: number; frames: number[][]; events?: { name: string; frame: number }[] }
        >;
      };
      for (const p of man.pages) expect(existsSync(new URL(`${hero}/${p}`, dir)), p).toBe(true);
      const strike = man.clips['attack'] ?? man.clips['slash'];
      const moment = (c: typeof strike, name: string): boolean =>
        !!c?.events?.some((e) => e.name === name && e.frame < c.count);
      expect(man.clips['idle']?.count, hero).toBeGreaterThan(0);
      expect(moment(strike, 'hit'), `${hero} strike`).toBe(true);
      expect(moment(man.clips['aura'], 'aura'), `${hero} aura`).toBe(true);
      expect(moment(man.clips['death'], 'land'), `${hero} death`).toBe(true);
      expect(man.clips['hit']?.count, hero).toBeGreaterThan(0);
      for (const c of Object.values(man.clips)) {
        expect(c.frames.length).toBe(c.count);
        for (const f of c.frames) expect(f[0]!).toBeLessThan(man.pages.length);
      }
    }
  });
});

describe('Riftwalker looks are hidden for now (DECISIONS #755)', () => {
  it('draws the default look whatever was worn, and the Store and Collection have no looks tab', async () => {
    storage({
      'sr-cosmetics': JSON.stringify({
        owned: ['knight-gender-female'],
        worn: { knight: { skin: 'knight-gender-female', at: 1 } },
      }),
    });
    const { SKINS_SHOWN, mySkin, shownSkin, cosmetics } = await import('../cosmetics/cosmetics');
    const { SHOP_TABS, FIRST_TAB } = await import('../app/shopTabs');
    expect(SKINS_SHOWN).toBe(false);
    expect(mySkin('knight')).toBeUndefined();
    expect(shownSkin(cosmetics(), 'knight')).toBeUndefined();
    expect(SHOP_TABS.some((t) => t.id === 'looks')).toBe(false);
    expect(FIRST_TAB).toBe('backs');
  });
});
