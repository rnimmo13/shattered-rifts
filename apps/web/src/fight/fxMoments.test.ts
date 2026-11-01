import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '@sr/combat';
import { ASCENDANCIES, COMBAT_DB } from '@sr/content/v2';
import {
  BIG_INTENT,
  CRIT_HIT,
  FX_IDS,
  HEAVY_HIT,
  crestPic,
  hitFx,
  intentPic,
  potionFx,
  potionHitsAllFoes,
  statusFx,
  tickOf,
} from './fxMoments';

const inPublic = (path: string): boolean =>
  existsSync(fileURLToPath(new URL(`../../public/art/${path}`, import.meta.url)));

describe('the painted effects and pictures are there', () => {
  it('every effect has its strip', () => {
    for (const id of FX_IDS) expect(inPublic(`fx/${id}.png`), id).toBe(true);
  });
  it('every Ascendancy has its crest', () => {
    for (const a of ASCENDANCIES) expect(inPublic(`icons/${crestPic(a.id)}.png`), a.id).toBe(true);
    expect(inPublic('icons/ascend-banner.png')).toBe(true);
  });
  it('every potion has its bottle', () => {
    for (const id of Object.keys(COMBAT_DB.potions))
      expect(inPublic(`icons/potion-${id}.png`), id).toBe(true);
  });
  it('every intent and map stop has its picture', () => {
    for (const i of ['attack', 'defend', 'buff', 'debuff', 'summon', 'special'])
      expect(inPublic(`icons/${intentPic(i, 1, 1)}.png`), i).toBe(true);
    for (const n of 'duel elite event shrine merchant warden ghost here done crossed'.split(' '))
      expect(inPublic(`icons/map-${n}.png`), n).toBe(true);
  });
});

describe('which effect a moment plays', () => {
  it('a blow by its weight, then by how it was struck', () => {
    expect(hitFx(3, 'slash')).toBe('hit-slash');
    expect(hitFx(3, 'shoot')).toBe('hit-pierce');
    expect(hitFx(HEAVY_HIT, 'shoot')).toBe('hit-heavy');
    expect(hitFx(CRIT_HIT)).toBe('hit-crit');
  });
  it('Fracture is a crack, until it reaches a Shatter', () => {
    expect(statusFx('fracture', 3, 9)).toBe('fracture');
    expect(statusFx('fracture', 3, 11)).toBe('shatter');
    expect(statusFx('fracture', 3, 13)).toBe('fracture');
  });
  it('a status with no effect of its own plays none', () => {
    expect(statusFx('exposed', 1, 1)).toBe('debuff-exposed');
    expect(statusFx('vigor', 1, 1)).toBe('buff-primed');
    expect(statusFx('ritual', 1, 1)).toBeNull();
  });
  it('a potion is drunk, broken on its target, or explodes if it deals damage', () => {
    const { potions } = COMBAT_DB;
    expect(potionFx(potions['fire-flask'], true)).toBe('potion-explode');
    expect(potionFx(potions['healing-philtre'], false)).toBe('potion-drink');
    expect(potionFx(potions['ember-bomb'], false)).toBe('potion-explode');
    expect(potionFx(potions['frost-phial'], false)).toBe('potion-shatter');
    expect(potionHitsAllFoes(potions['frost-phial'])).toBe(true);
    expect(potionHitsAllFoes(potions['healing-philtre'])).toBe(false);
  });
  it('a tick is told from other damage by its stack going down beside it', () => {
    const hit = (source: string | null): CombatEvent => ({
      type: 'damage',
      source,
      target: 'u',
      amount: 3,
      blocked: 0,
      lost: 3,
      shielded: false,
      kind: 'direct',
    });
    const down = (status: 'seared' | 'burn' | 'hangover'): CombatEvent => ({
      type: 'status',
      target: 'u',
      status,
      amount: -1,
      total: 0,
    });
    expect(tickOf([hit(null), down('seared')], 0)?.fx).toBe('tick-bleed');
    expect(tickOf([hit(null), down('burn')], 0)?.fx).toBe('tick-burn');
    expect(tickOf([down('hangover'), hit(null)], 1)?.fx).toBe('tick-hangover');
    expect(tickOf([hit('a'), down('seared')], 0)).toBeNull();
    expect(tickOf([hit(null)], 0)).toBeNull();
    // (a trigger set off by the loss comes between them)
    const stars: CombatEvent = { type: 'stars', side: 'a', stars: 1 };
    expect(tickOf([hit(null), stars, down('burn')], 0)?.fx).toBe('tick-burn');
    expect(tickOf([hit(null), hit(null), down('burn')], 0)).toBeNull();
  });
  it('an attack intent says how it comes', () => {
    expect(intentPic('attack', 6, 1)).toBe('intent-attack');
    expect(intentPic('attack', 3, 3)).toBe('intent-multi');
    expect(intentPic('attack', BIG_INTENT, 1)).toBe('intent-big');
    expect(intentPic('attack', 7, 3)).toBe('intent-big');
    expect(intentPic('debuff', null, 1)).toBe('intent-debuff');
  });
});
