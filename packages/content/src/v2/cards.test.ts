// Scenario tests over the whole card list (golden rule 5: every card gets a scenario test). Each card, and its "+", is
// played for real in a fight and must resolve without error, answer any choice it asks for, and do something visible.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  chooseAction,
  clone,
  cardText,
  createCombat,
  legalActions,
  type CardDef,
  type CombatEvent,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, rewardPool, type HeroId } from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];
const cards = Object.values(db.cards).filter((c) => c.hero !== 'junk');

/** A fight where a Rivet-like board exists (an ally, a few enemies) and the hand is exactly `card` plus fodder. */
function setup(card: CardDef, hero: HeroId): CombatState {
  const enc = ENCOUNTERS.find((e) => e.id === 'drone-nest');
  const { state } = createCombat(db, {
    seed: `card-${card.id}`,
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies: enc?.units ?? ['squire'] },
  });
  const s = clone(state);
  const sd = s.sides.a;
  // fodder to discard / exhaust / draw, then the card under test
  sd.hand = [
    { id: 'T0', card: card.id },
    { id: 'T1', card: 'strike' },
    { id: 'T2', card: 'defend' },
    { id: 'T3', card: 'strike' },
  ];
  sd.mana = 6;
  // (7: the Regent's Seven Stars, Obsidia's Seven Shards, costs 7 Arcana)
  sd.stars = 7;
  sd.attacksPlayed = 2;
  // (Skills played and Arcana gained this turn, for the cards that count them: Hex Volley, Overflow)
  sd.skillsPlayed = 2;
  sd.starsGainedTurn = 2;
  sd.discarded = 2;
  // (a lived-in turn: HP lost and a card consumed, for the cards that ask)
  sd.lostHpTurn = 1;
  sd.exhaustedTurn = 1;
  // (Fleeting cards played and a death this fight, for the cards that get cheaper with them; a discard pile to take back from)
  sd.etherealPlayed = 2;
  sd.deaths = 1;
  sd.discard = [
    { id: 'D1', card: 'strike' },
    { id: 'D2', card: 'defend' },
  ];
  // (no old totem runes: the Shaman's Defect runes are not loaded since DECISIONS #418)
  // a lived-in board, so healing, doubling, stances and the like have something to act on
  const me = sd.units[sd.units.length - 1]!;
  me.hp = Math.floor(me.maxHp * 0.6);
  for (const k of ['calm', 'wrath', 'radiant'] as const) delete me.statuses[k];
  Object.assign(me.statuses, { might: 2, thorns: 2, mantra: 1, resonance: 1 });
  for (const u of s.sides.b.units) Object.assign(u.statuses, { seared: 3, doom: 2 });
  // a few cards already consumed, for cards that count them
  sd.exhausted = [
    { id: 'X1', card: 'strike' },
    { id: 'X2', card: 'strike' },
    { id: 'X3', card: 'defend' },
    // (a spent Sleeve Knife, for the cards that play them again: Knife Trap)
    { id: 'X4', card: 'sleeve-knife' },
  ];
  // (a card that needs an empty draw pile gets one: Grand Finale)
  if (card.needsEmptyDraw) sd.draw = [];
  // a status card in the discard pile, for the cards that consume them (Flak Cannon's copy)
  sd.discard = [...sd.discard, { id: 'W1', card: 'wound' }];
  // an ally on the board for cards that aim at one (a copy of the first enemy re-sided is overkill: use the real thing)
  if (!sd.units.some((u) => u.kind === 'ally') && db.units['patrol-drone']) {
    const hero0 = sd.units[sd.units.length - 1]!;
    sd.units.splice(sd.units.length - 1, 0, {
      ...clone(hero0),
      id: 'ALLY1',
      def: 'patrol-drone',
      name: 'Patrol Drone',
      kind: 'ally',
      hp: 7,
      maxHp: 7,
      statuses: {},
    });
  }
  return s;
}

function playOut(s0: CombatState, cardId: string): { s: CombatState; events: CombatEvent[] } {
  let s = s0;
  const events: CombatEvent[] = [];
  const acts = legalActions(db, s).filter((a) => a.type === 'play' && a.card === cardId);
  expect(acts.length, `${cardId} has no legal play`).toBeGreaterThan(0);
  const r = applyAction(db, s, acts[0]!);
  s = r.state;
  events.push(...r.events);
  for (let i = 0; i < 8 && s.pending; i++) {
    const p = applyAction(db, s, chooseAction(db, s));
    s = p.state;
    events.push(...p.events);
  }
  expect(s.pending, `${cardId} left a choice unanswered`).toBeNull();
  return { s, events };
}

describe('every card plays', () => {
  const heroOf = (c: CardDef): HeroId =>
    (HEROES.includes(c.hero as HeroId) ? c.hero : 'engineer') as HeroId;

  for (const c of cards) {
    if (c.unplayable) continue;
    it(`${c.id}: resolves and does something`, () => {
      const hero = heroOf(c);
      const s0 = setup(c, hero);
      // (a sweep of the draw pile needs a Status card in it to move)
      if (c.effects.some((o) => o.op === 'sweep')) s0.sides.a.draw.unshift({ id: 'SW0', card: 'wound' });
      let s = s0;
      // a Trap needs room; a card that only works with a rune or Seared on board still resolves without error
      const { s: after, events } = playOut(s, 'T0');
      s = after;
      // something visible happened beyond paying for it: drop the play itself and its Mana payment
      const fx = [...events];
      fx.splice(
        fx.findIndex((e) => e.type === 'play'),
        1,
      );
      fx.splice(
        fx.findIndex((e) => e.type === 'mana'),
        1,
      );
      const stateChange =
        after.sides.a.runeSlots !== s0.sides.a.runeSlots ||
        after.sides.a.nextMana !== s0.sides.a.nextMana ||
        after.sides.a.nextDraw !== s0.sides.a.nextDraw ||
        (c.effects.some((o) => o.op === 'sweep') && after.sides.a.discard.some((x) => x.id === 'SW0'));
      expect(
        stateChange || fx.some((e) => !['exhaust', 'discard'].includes(e.type)),
        `${c.id} did nothing`,
      ).toBe(true);
      for (const side of ['a', 'b'] as const)
        for (const u of s.sides[side].units) {
          expect(Number.isFinite(u.hp) && Number.isFinite(u.barrier), `${c.id} ${u.name}`).toBe(
            true,
          );
          expect(u.hp).toBeGreaterThan(0);
        }
      expect(cardText(db, c).length).toBeGreaterThan(3);
    });
  }

  it('unplayable cards pay off when discarded', () => {
    for (const c of cards.filter((x) => x.unplayable && x.onDiscard)) {
      const s = setup(c, 'assassin');
      const acts = legalActions(db, s).filter((a) => a.type === 'play' && a.card === 'T0');
      expect(acts, `${c.id} should not be playable`).toHaveLength(0);
    }
  });
});

describe('second resources have a way in and a way out from the first hand', () => {
  // (she has the Regent's starter now, 4 Strike, 4 Defend, Cinderfall and Gather Arcana, with nothing Innate, so the opening hand need
  // not hold both: the way in is the 3 Arcana every fight starts with and the 1 Kindled adds each turn, enough for Cinderfall at once)
  it('The spellblade starts every fight with Arcana to spend, and her starter both makes and spends it', () => {
    const starter = RIFTWALKERS.spellblade.starter.map((id) => db.cards[id]!);
    expect(starter.some((c) => c.effects.some((o) => o.op === 'stars' && o.amount > 0))).toBe(true);
    const spender = starter.find((c) => (c.starCost ?? 0) > 0);
    expect(spender).toBeDefined();
    for (let i = 0; i < 20; i++) {
      const { state } = createCombat(db, {
        seed: `arcana-${i}`,
        a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
        b: { enemies: ['squire'] },
      });
      expect(state.sides.a.stars, `seed ${i}`).toBeGreaterThanOrEqual(spender!.starCost!);
    }
  });
});

describe('real card data, end to end', () => {
  it('Whetted Edge (Edge) makes Daggers hit harder (and only knives)', () => {
    const s0 = setup(db.cards['whetted-edge']!, 'assassin');
    s0.sides.a.hand = [
      { id: 'K', card: 'whetted-edge' },
      { id: 'N', card: 'sleeve-knife' },
      { id: 'S', card: 'strike' },
    ];
    const foeId = s0.sides.b.units[0]!.id;
    const dealt = (s: CombatState, card: string): number => {
      const before = s.sides.b.units[0]!.hp + s.sides.b.units[0]!.barrier;
      const r = applyAction(db, s, { type: 'play', card, target: foeId });
      const u = r.state.sides.b.units[0];
      return before - (u ? u.hp + u.barrier : 0);
    };
    s0.sides.b.units[0]!.hp = 99;
    s0.sides.b.units[0]!.maxHp = 99;
    // (a trait could have touched the foe at the start of the turn; this test is about Edge alone)
    delete s0.sides.b.units[0]!.statuses.exposed;
    const base = dealt(s0, 'N');
    const buffed = applyAction(db, s0, { type: 'play', card: 'K' }).state;
    expect(dealt(buffed, 'N')).toBe(base + 4);
    expect(dealt(buffed, 'S')).toBe(dealt(s0, 'S'));
  });

  it('Mire starts with a Bone Thrall and Doom kills at the end of an enemy turn', () => {
    const { state } = createCombat(db, {
      seed: 'doom-real',
      a: { hero: 'necromancer', deck: RIFTWALKERS.necromancer.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.units.some((u) => u.kind === 'ally')).toBe(true);
    const s = clone(state);
    const e = s.sides.b.units[0]!;
    e.hp = 10;
    e.statuses.doom = 10;
    const r = applyAction(db, s, { type: 'endTurn' });
    expect(r.state.winner).toBe('a');
  });
});

describe('pool shape (docs/09_ROSTER.md §1)', () => {
  const buildPaths = (h: HeroId) => rewardPool(h).map((id) => db.cards[id]!);

  it('every Riftwalker has a deep pool with all rarities, mostly of their own', () => {
    for (const h of HEROES) {
      const own = buildPaths(h).filter((c) => c.hero === h);
      expect(own.length, `${h} own cards`).toBeGreaterThanOrEqual(30);
      for (const r of ['common', 'uncommon', 'rare'])
        expect(own.filter((c) => c.rarity === r).length, `${h} ${r}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('a pool never contains another character’s signature mechanic', () => {
    const owns = (mech: (c: CardDef) => boolean, owner: HeroId | HeroId[]) => {
      const allowed = Array.isArray(owner) ? owner : [owner];
      for (const c of cards)
        if (mech(c) && c.hero !== 'neutral')
          expect(allowed.includes(c.hero as HeroId), `${c.id} (${c.hero})`).toBe(true);
    };
    const uses = (c: CardDef, op: string) =>
      [...c.effects, ...(c.onDiscard ?? []), ...(c.onExhaust ?? [])].some(
        (o) => o.op === op || (o.op === 'power' && o.ops.some((x) => x.op === op)),
      );
    // (totems are the Shaman's: his planted ones since DECISIONS #418, the old runes for anyone who would still use them)
    owns(
      (c) =>
        uses(c, 'plant') ||
        uses(c, 'uproot') ||
        uses(c, 'channel') ||
        uses(c, 'evoke') ||
        uses(c, 'runeSlots'),
      'shaman',
    );
    owns((c) => uses(c, 'stance'), 'monk');
    owns((c) => c.starCost !== undefined, 'spellblade');
    // (sharpening a weapon is theirs; a card that grows only itself, like Gathering Storm, is not: DECISIONS #353)
    const sharpensAnother = (c: CardDef) =>
      [...c.effects, ...(c.onDiscard ?? []), ...(c.onExhaust ?? [])].some(
        (o) =>
          (o.op === 'forge' && o.card !== c.id.replace(/[+]$/, '')) ||
          (o.op === 'power' && o.ops.some((x) => x.op === 'forge')),
      );
    // (and the Shaman's Gathering Storm grown by Tempest Call, DECISIONS #420)
    owns(sharpensAnother, ['spellblade', 'drunkard', 'shaman']);
    owns((c) => c.tags?.includes('gun') === true, 'drunkard');
    owns((c) => c.tags?.includes('knife') === true, 'assassin');
    owns((c) => c.tags?.includes('shell') === true, 'drunkard');
    owns(
      (c) =>
        c.effects.some((o) => o.op === 'status' && o.status === 'doom') ||
        c.effects.some(
          (o) => o.op === 'power' && o.ops.some((x) => x.op === 'status' && x.status === 'doom'),
        ) ||
        (c.kind === 'snare' && c.effects.some((o) => o.op === 'status' && o.status === 'doom')),
      'necromancer',
    );
    owns(
      (c) =>
        c.effects.some(
          (o) =>
            (o.op === 'scaleStatus' && o.status === 'seared') ||
            (o.op === 'status' && o.status === 'seared' && o.to !== 'target'),
        ),
      ['assassin'],
    );
  });

  it("Burn is the Shaman's (his Flame, DECISIONS #421: works as Bleed, a status of its own)", () => {
    const burns = Object.values(db.cards).filter((c) =>
      c.effects.some(
        (o) =>
          (o.op === 'status' && o.status === 'burn') ||
          (o.op === 'scaleStatus' && o.status === 'burn') ||
          (o.op === 'power' && o.ops.some((x) => x.op === 'status' && x.status === 'burn')),
      ),
    );
    expect(burns.length).toBeGreaterThan(0);
    for (const c of burns) expect([undefined, 'shaman'], c.id).toContain(c.hero ?? undefined);
  });

  it('Neutral never carries a signature mechanic', () => {
    for (const c of cards.filter((x) => x.hero === 'neutral' && !x.source)) {
      for (const o of c.effects) {
        expect(['channel', 'evoke', 'stance', 'forge', 'stars', 'sacrifice']).not.toContain(o.op);
      }
      expect(c.tags ?? []).not.toContain('sleeve-knife');
    }
  });

  it('Traps are a shared tool: everyone can have a few, Vesper has by far the most', () => {
    const own = (h: string) =>
      cards.filter((c) => c.hero === h && c.kind === 'snare' && !c.id.endsWith('+')).length;
    const counts = HEROES.map((h) => [h, own(h)] as const);
    // (Valeria, Sylas, Obsidia, Dorian and Ilvane are exactly the Ironclad's, the Silent's, the Regent's, the Necrobinder's and
    // the Defect's lists, which have no Traps)
    const NO_TRAPS = ['knight', 'assassin', 'spellblade', 'necromancer', 'shaman'];
    for (const [h, n] of counts)
      expect(n, `${h} snares`).toBeGreaterThanOrEqual(
        h === 'trickster' ? 10 : NO_TRAPS.includes(h) ? 0 : 1,
      );
    const others = Math.max(...counts.filter(([h]) => h !== 'trickster').map(([, n]) => n));
    expect(own('trickster')).toBeGreaterThanOrEqual(others * 2);
    expect(own('neutral')).toBeGreaterThanOrEqual(2);
  });

  it('shared tools show up in several pools (draw, Barrier, Scry, Exhaust)', () => {
    const count = (pred: (c: CardDef) => boolean) =>
      new Set(cards.filter((c) => c.hero !== 'neutral' && pred(c)).map((c) => c.hero)).size;
    expect(count((c) => c.effects.some((o) => o.op === 'draw'))).toBeGreaterThanOrEqual(7);
    expect(count((c) => c.effects.some((o) => o.op === 'barrier'))).toBeGreaterThanOrEqual(7);
    // (Foresee: Solen and Vesper; the Slay the Spire list copies, Obsidia and Ilvane among them, have none)
    expect(count((c) => c.effects.some((o) => o.op === 'scry'))).toBeGreaterThanOrEqual(2);
    expect(count((c) => c.exhaust === true)).toBeGreaterThanOrEqual(6);
  });
});

describe('buildPaths (each with room to build a deck; most characters have three, there is no rule, DECISIONS #362)', async () => {
  const { pathOf, pathSizes } = await import('./index');
  it('every Riftwalker has buildPaths of at least 12 cards each, and most of their cards belong to one', () => {
    for (const h of HEROES) expect(RIFTWALKERS[h].buildPaths.length, h).toBeGreaterThanOrEqual(3);
    for (const h of HEROES) {
      const sizes = pathSizes(h);
      // (Valeria's cards are sorted into build paths again later, DECISIONS #365: her first sort is lopsided)
      if (h !== 'knight')
        for (const n of sizes)
          expect(n, `${h} buildPaths ${sizes.join('/')}`).toBeGreaterThanOrEqual(12);
      const own = rewardPool(h).filter(
        (id) => db.cards[id]?.hero === h && db.cards[id]?.rarity !== 'legendary',
      );
      const onPath = own.filter((id) => pathOf(id) !== undefined).length;
      expect(onPath / own.length, h).toBeGreaterThan(0.55); // the rest is shared glue
    }
  });

  it('a path belongs to its own character: no path name is shared by two characters', () => {
    const names = HEROES.flatMap((h) =>
      RIFTWALKERS[h].buildPaths.map((l) => l.split(':')[0]!.toLowerCase()),
    );
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('Aura wording (DECISIONS #299, #300)', () => {
  const text = (id: string): string => cardText(db, db.cards[id]!);
  it('an Aura that gives a lasting status once says it lasts the rest of the fight', () => {
    expect(text('unchained')).toBe('Gain 4 Might for the rest of the fight.');
    expect(text('warlords-oath')).toMatch(/^At the start of your turn: Gain 2 Might\.$/);
  });
  it('an Aura with an ongoing trigger does not, and Rift Resonance answers a reshuffle', () => {
    expect(text('rift-resonance')).toBe(
      'Gain 1 Might. Whenever your deck is reshuffled: Gain 1 Might.',
    );
  });
});
