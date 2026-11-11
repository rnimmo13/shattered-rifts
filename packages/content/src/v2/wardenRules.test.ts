// A rule of its own for each of six Wardens (DECISIONS #528).

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  legalActions,
  viewFor,
  type CombatState,
  type Unit,
} from '@sr/combat';
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
  it('every Warden says its rule (DECISIONS #528, #546)', () => {
    const wardens = ENCOUNTERS.filter((e) => e.kind === 'warden');
    expect(wardens.length).toBe(20);
    for (const e of wardens) expect(e.rule, e.id).toBeTruthy();
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

// ---- the other five (DECISIONS #546) ----

const heroOf = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('Gorrmaw: the Hunger', () => {
  it('Gorge eats every Maw Spawn, 6% of its max HP and 2 Might for each', () => {
    // (its loop: Spawn, Bite, Spawn, Gorge; so after the second Spawn there are two, and Gorge is next)
    const t = clone(until(until(fight('gorrmaw'), 'gorrmaw', 'spawn'), 'gorrmaw', 'spawn'));
    expect(t.sides.b.units.filter((u) => u.def === 'maw-spawn')).toHaveLength(2);
    const g = unit(t, 'gorrmaw')!;
    g.hp = g.maxHp - 50;
    g.statuses.might = 0;
    g.intent = { move: 'gorge', target: heroOf(t).id };
    const ate = endTurn(t);
    expect(ate.sides.b.units.filter((u) => u.def === 'maw-spawn')).toHaveLength(0);
    expect(unit(ate, 'gorrmaw')!.statuses.might).toBe(4);
    // (6% of its max HP for each, DECISIONS #547)
    expect(unit(ate, 'gorrmaw')!.hp).toBe(g.maxHp - 50 + 2 * Math.floor(g.maxHp * 0.06));
  });

  it('with none to eat it starves: Exposed, no heal', () => {
    const t = clone(fight('gorrmaw'));
    t.sides.b.units = t.sides.b.units.filter((u) => u.def !== 'maw-spawn');
    const g = unit(t, 'gorrmaw')!;
    g.hp = g.maxHp - 50;
    g.intent = { move: 'gorge', target: heroOf(t).id };
    const starved = endTurn(t);
    expect(unit(starved, 'gorrmaw')!.statuses.exposed ?? 0).toBeGreaterThan(0);
    expect(unit(starved, 'gorrmaw')!.hp).toBe(g.maxHp - 50);
  });
});

describe('The Upside-Down Stag: the Turnover', () => {
  it('takes your Barrier for its own, then strikes you unguarded', () => {
    const t = clone(fight('the-upside-down-stag'));
    const st = unit(t, 'the-upside-down-stag')!;
    st.intent = { move: 'turnover', target: heroOf(t).id };
    // (Barrier raised against it, held through the end of the turn)
    const h = heroOf(t);
    const hp = h.hp;
    t.sides.a.hand = [];
    const r = applyAction(db, t, { type: 'endTurn' }).state;
    // (no Barrier raised: the full blow lands, and it takes none)
    expect(hp - heroOf(r).hp).toBeGreaterThanOrEqual(12);
    const g = clone(t);
    heroOf(g).statuses.blur = 1;
    heroOf(g).barrier = 30;
    const after = applyAction(db, g, { type: 'endTurn' }).state;
    // (all of it, with the Barrier the Knight's held Reserves add as the turn ends)
    expect(unit(after, 'the-upside-down-stag')!.barrier).toBeGreaterThanOrEqual(30);
    expect(heroOf(after).barrier).toBe(0);
    expect(hp - heroOf(after).hp).toBeGreaterThanOrEqual(12);
  });
});

describe('Queen of the Unmade: Unmaking', () => {
  it('the costliest card of your next hand is Consumed, then it clears', () => {
    const t = clone(fight('queen-of-the-unmade'));
    const h = heroOf(t);
    h.statuses.unmaking = 1;
    // (a move of hers that Unmakes nothing, so only the one stack is there)
    unit(t, 'queen-of-the-unmade')!.intent = { move: 'crown', target: h.id };
    // (a draw pile of 1-cost Strikes with one dearer card in it, all drawn next turn)
    const dear = Object.values(db.cards).find(
      (c) => c.cost === 3 && c.hero === 'knight' && !c.unplayable && !c.retain,
    )!;
    t.sides.a.hand = [];
    t.sides.a.discard = [];
    t.sides.a.draw = ['strike', 'strike', dear.id, 'strike', 'strike', 'strike'].map((card, i) => ({
      id: `Q${i}`,
      card,
    }));
    const r = endTurn(t);
    expect(heroOf(r).statuses.unmaking ?? 0).toBe(0);
    expect(r.sides.a.exhausted.map((c) => c.card)).toEqual([dear.id]);
    expect(r.sides.a.hand.some((c) => c.card === dear.id)).toBe(false);
  });

  it('two stacks take two; a card that cannot be played is never chosen', () => {
    const t = clone(fight('queen-of-the-unmade'));
    const h = heroOf(t);
    h.statuses.unmaking = 2;
    unit(t, 'queen-of-the-unmade')!.intent = { move: 'crown', target: h.id };
    const three = Object.values(db.cards).find((c) => c.cost === 3 && !c.unplayable && !c.retain)!;
    const two = Object.values(db.cards).find((c) => c.cost === 2 && !c.unplayable && !c.retain)!;
    const junk = Object.values(db.cards).find((c) => c.unplayable && c.cost >= 3);
    t.sides.a.hand = [];
    t.sides.a.discard = [];
    t.sides.a.draw = ['strike', two.id, three.id, junk?.id ?? 'strike', 'strike', 'strike'].map(
      (card, i) => ({ id: `Q${i}`, card }),
    );
    const r = endTurn(t);
    expect(r.sides.a.exhausted.map((c) => c.card)).toEqual([three.id, two.id]);
    if (junk) expect(r.sides.a.hand.some((c) => c.card === junk.id)).toBe(true);
  });
});

describe('Event Horizon Regent: Gravity', () => {
  it('the costliest unplayed cards fall back on top of the draw pile, one per stack', () => {
    const t = clone(fight('event-horizon-regent'));
    heroOf(t).statuses.gravity = 1;
    const hand = t.sides.a.hand;
    const dearest = [...hand].sort(
      (x, y) => (db.cards[y.card]?.cost ?? 0) - (db.cards[x.card]?.cost ?? 0),
    )[0]!;
    const r = endTurn(t);
    // (back on top, so it is in the new hand; the rest went to the discard pile as ever)
    expect(r.sides.a.hand.some((c) => c.id === dearest.id)).toBe(true);
    const others = hand.filter((c) => c.id !== dearest.id).map((c) => c.id);
    expect(others.every((id) => r.sides.a.discard.some((c) => c.id === id))).toBe(true);
  });

  it('two stacks: costliest on top, judged without this turn’s discount; a held card stays put', () => {
    const t = clone(fight('event-horizon-regent'));
    heroOf(t).statuses.gravity = 2;
    const three = Object.values(db.cards).find((c) => c.cost === 3 && !c.unplayable && !c.retain && !c.ethereal)!;
    const two = Object.values(db.cards).find((c) => c.cost === 2 && !c.unplayable && !c.retain && !c.ethereal)!;
    t.sides.a.hand = [
      { id: 'G0', card: 'strike' },
      // (free this turn only: it is still the costliest)
      { id: 'G1', card: three.id, freeTurn: true },
      { id: 'G2', card: two.id },
      // (held: it stays in hand whatever it costs)
      { id: 'G3', card: three.id, retain: true },
    ];
    const after = endTurn(t);
    // (the two went on top, costliest first, so they are the first drawn; the held one never left)
    const ids = after.sides.a.hand.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['G1', 'G2', 'G3']));
    expect(ids.indexOf('G1')).toBeLessThan(ids.indexOf('G2'));
    expect(after.sides.a.discard.some((c) => c.id === 'G0')).toBe(true);
    expect(after.sides.a.discard.some((c) => c.id === 'G1' || c.id === 'G2')).toBe(false);
  });

  it('every pull adds a stack', () => {
    const s = until(fight('event-horizon-regent'), 'event-horizon-regent', 'gravity');
    expect(heroOf(s).statuses.gravity).toBe(1);
  });
});

describe('Nyxara: the Veil', () => {
  /** her first move, Weave the Web, sets the Veiled Web (DECISIONS #751): these tests are about the Veil, so it is cleared */
  const unwebbed = (s: CombatState): CombatState => {
    const t = clone(s);
    t.sides.b.snares = [];
    return t;
  };

  it('her intent is hidden from you until you hit her', () => {
    const s = unwebbed(endTurn(fight('nyxara')));
    const n = unit(s, 'nyxara')!;
    expect(n.statuses.veiled ?? 0).toBeGreaterThan(0);
    const seen = viewFor(db, s, 'a').sides.b.units.find((u) => u.id === n.id)!;
    expect(seen.intentView?.move).toBe('veiled');
    expect(seen.intent).toBeNull();
    const hit = strike(s, n);
    expect(unit(hit, 'nyxara')!.statuses.veiled ?? 0).toBe(0);
    const shown = viewFor(db, hit, 'a').sides.b.units.find((u) => u.id === n.id)!;
    expect(shown.intentView?.move).toBe(unit(hit, 'nyxara')!.intent?.move);
  });

  it('nothing else in the view tells the hidden move; her own side sees it', () => {
    const s = endTurn(endTurn(fight('nyxara')));
    const n = unit(s, 'nyxara')!;
    const seen = viewFor(db, s, 'a').sides.b.units.find((u) => u.id === n.id)!;
    expect(seen.lastMoves).toEqual(n.lastMoves.slice(0, -1));
    expect([seen.pat, seen.patCount, seen.moveCount]).toEqual(['', 0, 0]);
    const own = viewFor(db, s, 'b').sides.b.units.find((u) => u.id === n.id)!;
    expect(own.intentView?.move).toBe(n.intent?.move);
  });

  it('a hit that is blocked still lifts the Veil', () => {
    const s = unwebbed(endTurn(fight('nyxara')));
    const n = unit(s, 'nyxara')!;
    n.statuses.shielded = 1;
    const hit = strike(s, n);
    expect(unit(hit, 'nyxara')!.hp).toBe(n.hp);
    expect(unit(hit, 'nyxara')!.statuses.veiled ?? 0).toBe(0);
  });

  it('a hit her Veiled Web cancels never reached her: the Veil holds until the next (DECISIONS #751)', () => {
    const s = endTurn(fight('nyxara'));
    expect(s.sides.b.snares.map((x) => x.card)).toEqual(['enemy-veiled-web']);
    const n = unit(s, 'nyxara')!;
    const first = strike(s, n);
    expect(unit(first, 'nyxara')!.statuses.veiled ?? 0).toBeGreaterThan(0);
    expect(first.sides.b.snares).toHaveLength(0);
    const second = strike(first, unit(first, 'nyxara')!);
    expect(unit(second, 'nyxara')!.statuses.veiled ?? 0).toBe(0);
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
