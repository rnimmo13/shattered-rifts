// A rule of its own for each of six Wardens (DECISIONS #528).

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState, type Unit } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, encounter } from './index';

function fight(id: string): CombatState {
  const { state } = createCombat(db, {
    seed: 'warden-rules',
    a: { hero: 'knight', deck: [...RIFTWALKERS.knight.starter, ...RIFTWALKERS.knight.starter] },
    b: { enemies: encounter(id).units },
  });
  const s = clone(state);
  const h = s.sides.a.units.find((u) => u.kind === 'hero')!;
  h.hp = h.maxHp = 9000;
  return s;
}
const unit = (s: CombatState, def: string): Unit | undefined => s.sides.b.units.find((u) => u.def === def);
const endTurn = (s: CombatState): CombatState => {
  let r = applyAction(db, s, { type: 'endTurn' }).state;
  for (let i = 0; i < 3 && r.active !== 'a' && !r.winner; i++) r = applyAction(db, r, { type: 'endTurn' }).state;
  return r;
};
/** End turns until `def` has just done `move`. */
const until = (s0: CombatState, def: string, move: string): CombatState => {
  let s = s0;
  for (let i = 0; i < 12; i++) {
    const doing = unit(s, def)?.intent?.move;
    s = endTurn(s);
    if (doing === move) return s;
  }
  throw new Error(def + ' never did ' + move);
};
/** A strike in hand, aimed at this enemy. */
function strike(s: CombatState, target: Unit): CombatState {
  const t = clone(s);
  t.sides.a.mana = 9;
  t.sides.a.hand = [{ id: 'W0', card: 'strike' }];
  return applyAction(db, t, { type: 'play', card: 'W0', target: target.id }).state;
}

describe('every rule is told', () => {
  it('the six Wardens say their rule, and only they do for now', () => {
    const ruled = ENCOUNTERS.filter((e) => e.rule).map((e) => e.id).sort();
    expect(ruled).toEqual(['kron', 'mother-of-static', 'seraphine', 'the-applause-below', 'the-hollow-benediction', 'the-mourning-tide']);
  });
});

describe('Kron: the Foundry Hatch', () => {
  it('aimed attacks must break it, and he reopens it at full HP with more Might', () => {
    const s = fight('kron');
    const hatch = unit(s, 'foundry-hatch')!;
    const k = unit(s, 'kron')!;
    const t = clone(s);
    t.sides.a.mana = 9;
    t.sides.a.hand = [{ id: 'W0', card: 'strike' }];
    const aims = legalActions(db, t).filter((a) => a.type === 'play' && a.card === 'W0');
    expect(aims.map((a) => (a as { target?: string }).target)).toEqual([hatch.id]);
    // broken: Kron can be aimed at
    const broken = clone(t);
    unit(broken, 'foundry-hatch')!.hp = 1;
    const open = applyAction(db, broken, { type: 'play', card: 'W0', target: hatch.id }).state;
    expect(unit(open, 'foundry-hatch')).toBeUndefined();
    const before = open.sides.b.units.find((u) => u.id === k.id)!.statuses.might ?? 0;
    const back = until(open, 'kron', 'reopen');
    expect(unit(back, 'foundry-hatch')?.hp).toBe(unit(back, 'foundry-hatch')?.maxHp);
    expect((unit(back, 'kron')!.statuses.might ?? 0) - before).toBe(2);
  });

  it('reopening while it stands brings no second one', () => {
    const back = until(fight('kron'), 'kron', 'reopen');
    expect(back.sides.b.units.filter((u) => u.def === 'foundry-hatch')).toHaveLength(1);
  });
});

describe('The Hollow Benediction: the Acolytes', () => {
  it('each feeds it Might every turn, until they fall', () => {
    const s = endTurn(fight('the-hollow-benediction'));
    expect(unit(s, 'the-hollow-benediction')!.statuses.might).toBe(2);
    const t = clone(s);
    t.sides.b.units = t.sides.b.units.filter((u) => u.def !== 'hollow-acolyte');
    expect(unit(endTurn(t), 'the-hollow-benediction')!.statuses.might).toBe(2);
  });
});

describe('The Mourning Tide: Low Tide and Beckoning', () => {
  it('Low Tide caps hits at 1 through your next turn, then it passes', () => {
    const s = until(fight('the-mourning-tide'), 'the-mourning-tide', 'lowtide');
    const tide = unit(s, 'the-mourning-tide')!;
    expect(tide.statuses.ghostly ?? 0).toBeGreaterThan(0);
    expect(tide.hp - unit(strike(s, tide), 'the-mourning-tide')!.hp).toBe(1);
    const later = endTurn(s);
    expect(unit(later, 'the-mourning-tide')!.statuses.ghostly ?? 0).toBe(0);
  });

  it('Beckoning hurts if it is still in hand, and can be paid away', () => {
    const s = until(fight('the-mourning-tide'), 'the-mourning-tide', 'wave');
    expect(s.sides.a.hand.some((c) => c.card === 'beckoning')).toBe(true);
    const hero = (x: CombatState) => x.sides.a.units.find((u) => u.kind === 'hero')!;
    const only = clone(s);
    only.sides.a.hand = only.sides.a.hand.filter((c) => c.card === 'beckoning').slice(0, 1);
    only.sides.a.mana = 3;
    const held = applyAction(db, only, { type: 'endTurn' }).state;
    expect(hero(only).hp - hero(held).hp).toBeGreaterThanOrEqual(4);
    const paid = applyAction(db, only, { type: 'play', card: only.sides.a.hand[0]!.id }).state;
    expect(paid.sides.a.mana).toBe(2);
    expect(paid.sides.a.hand.some((c) => c.card === 'beckoning')).toBe(false);
    expect(hero(paid).hp).toBe(hero(only).hp);
  });
});

describe('The Applause Below: Slippery', () => {
  it('each stack makes one hit deal 1, then hits land in full', () => {
    const s = until(fight('the-applause-below'), 'the-applause-below', 'curtain');
    const a = clone(s);
    const u = unit(a, 'the-applause-below')!;
    u.barrier = 0;
    u.statuses.slippery = 1;
    const one = strike(a, u);
    expect(u.hp - unit(one, 'the-applause-below')!.hp).toBe(1);
    expect(unit(one, 'the-applause-below')!.statuses.slippery ?? 0).toBe(0);
    const two = strike(one, unit(one, 'the-applause-below')!);
    expect(unit(one, 'the-applause-below')!.hp - unit(two, 'the-applause-below')!.hp).toBeGreaterThan(1);
  });

  it('every move leaves it more, 2 at a time from half HP', () => {
    const s = endTurn(fight('the-applause-below'));
    expect(unit(s, 'the-applause-below')!.statuses.slippery).toBe(1);
    const low = clone(s);
    const u = unit(low, 'the-applause-below')!;
    u.hp = Math.floor(u.maxHp / 2);
    const clap = until(low, 'the-applause-below', 'clap');
    expect(unit(clap, 'the-applause-below')!.statuses.slippery).toBeGreaterThanOrEqual(3);
  });

  it('a Shatter gets through, and keeps its stacks', () => {
    const { state } = createCombat(db, {
      seed: 'slip-shatter',
      a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
      b: { enemies: ['the-applause-below'] },
    });
    const s = clone(state);
    s.sides.a.mana = 9;
    s.sides.a.stars = 0;
    s.sides.a.hand = [{ id: 'W0', card: 'hairline-crack' }];
    const u = unit(s, 'the-applause-below')!;
    u.statuses.fracture = 6;
    u.statuses.slippery = 2;
    const r = applyAction(db, s, { type: 'play', card: 'W0', target: u.id }).state;
    expect(u.hp - unit(r, 'the-applause-below')!.hp).toBe(20);
    expect(unit(r, 'the-applause-below')!.statuses.slippery).toBe(2);
  });
});

describe('Seraphine: the Kneeling', () => {
  it('an Omen\u2019s phase at an odd Max HP stops her low enough to kneel next', () => {
    const { state } = createCombat(db, {
      seed: 'odd-rise',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['seraphine'], mods: [{ rise: [{ atPct: 50, barrierPct: 0, might: 0 }] }] },
    });
    const s = clone(state);
    const h = s.sides.a.units.find((u) => u.kind === 'hero')!;
    h.hp = h.maxHp = 9000;
    const u = unit(s, 'seraphine')!;
    u.maxHp = 293;
    const low = clone(s);
    const v = unit(low, 'seraphine')!;
    v.hp = 148;
    const stopped = strike(low, v);
    expect(unit(stopped, 'seraphine')!.hp).toBe(146);
    expect(unit(endTurn(stopped), 'seraphine')!.intent?.move).toBe('kneel');
  });

  it('at half HP she kneels once: Might gone, Exposed, no blow; and never again', () => {
    const s = clone(fight('seraphine'));
    const u = unit(s, 'seraphine')!;
    u.hp = Math.floor(u.maxHp / 2);
    u.statuses.might = 5;
    // (her next intent is chosen when her turn ends)
    const a = endTurn(s);
    expect(unit(a, 'seraphine')!.intent?.move).toBe('kneel');
    const heroHp = a.sides.a.units.find((x) => x.kind === 'hero')!.hp;
    const b = endTurn(a);
    expect(unit(b, 'seraphine')!.statuses.might ?? 0).toBe(0);
    expect(unit(b, 'seraphine')!.statuses.exposed ?? 0).toBeGreaterThan(0);
    // (the Vigilant Omen's Steadfast does not stop it)
    const guarded = clone(a);
    unit(guarded, 'seraphine')!.statuses.steadfast = 1;
    expect(unit(endTurn(guarded), 'seraphine')!.statuses.exposed ?? 0).toBeGreaterThan(0);
    expect(b.sides.a.units.find((x) => x.kind === 'hero')!.hp).toBe(heroHp);
    let c = b;
    for (let i = 0; i < 8; i++) {
      expect(unit(c, 'seraphine')!.intent?.move).not.toBe('kneel');
      c = endTurn(c);
    }
  });
});

describe('Mother of Static: Jamming', () => {
  it('Power Cut takes a Mana from your next turn', () => {
    const s = until(fight('mother-of-static'), 'mother-of-static', 'cut');
    expect(s.sides.a.mana).toBe(s.sides.a.maxMana - 1);
  });
  it('Signal Jam takes a card from your next hand', () => {
    const s = until(fight('mother-of-static'), 'mother-of-static', 'jam');
    expect(s.sides.a.hand.length).toBe(s.sides.a.handSize - 1);
  });
});
