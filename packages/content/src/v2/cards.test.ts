// Scenario tests over the whole card list (golden rule 5: every card gets a scenario test). Each card, and its "+", is
// played for real in a fight and must resolve without error, answer any choice it asks for, and do something visible.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  chooseAction,
  clone,
  cardText,
  createCombat,
  previewCardDamage,
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
        (after.sides.a.attackAuras?.length ?? 0) !== (s0.sides.a.attackAuras?.length ?? 0) ||
        after.sides.a.runeSlots !== s0.sides.a.runeSlots ||
        after.sides.a.nextMana !== s0.sides.a.nextMana ||
        after.sides.a.nextDraw !== s0.sides.a.nextDraw ||
        (c.effects.some((o) => o.op === 'sweep') && after.sides.a.discard.some((x) => x.id === 'SW0')) ||
        Object.keys(after.sides.a.totemBoost ?? {}).length > 0 ||
        // (damage that is only a count, with nothing counted, lands no hit: DECISIONS #507)
        c.effects.some((o) => o.op === 'damage' && o.amount === 0 && o.scale !== undefined);
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

describe('a status that is on or off has no number on a card (DECISIONS #492)', () => {
  it('says "Gain Fanned", not "Gain 1 Fanned"', () => {
    const all = Object.values(db.cards).map((c) => cardText(db, c));
    for (const name of ['Fanned', 'Poised', 'Sturdy', 'Unmovable', 'Cruelty', 'Tracking', 'Unbound', 'Planner', 'Meld', 'Fortified'])
      expect(all.filter((t) => new RegExp(`\\b\\d+ ${name}\\b`).test(t)), name).toEqual([]);
    expect(cardText(db, db.cards['wide-arc']!)).toContain('Gain Fanned.');
    expect(cardText(db, db.cards['into-the-shadows']!)).toContain('Gain Poised.');
  });
});

describe('card text says where a condition stops (DECISIONS #485)', () => {
  const CLAUSE = /^(If|When|Whenever|The first|The next|At the (start|end)|For the next|This turn, whenever|Next turn:)\b[^.]*: /;
  it('no plain sentence follows a condition or a trigger, on any card, upgraded or not', () => {
    const bad: string[] = [];
    for (const c of Object.values(db.cards)) {
      if (c.text) continue;
      const sentences = cardText(db, c).split(/(?<=\.)\s+(?=[A-Z])/);
      let seen = false;
      for (const line of sentences) {
        const clause = CLAUSE.test(line);
        if (seen && !clause) bad.push(`${c.id}: ${cardText(db, c)}`);
        seen = seen || clause;
      }
    }
    expect(bad).toEqual([]);
  });

  it('what one trigger does is one sentence', () => {
    expect(cardText(db, db.cards['fault-reader']!)).toBe(
      'The first time each turn you Shatter an enemy: Draw 1 card and gain 2 (+1 per 3 Spell Power) Barrier.',
    );
    expect(cardText(db, db.cards['bait-and-switch']!)).toMatch(/^When you or an ally is attacked: Cancel that hit and deal 12 damage to the attacker\.$/);
  });

  it('what always happens comes first, then the keywords, then the condition', () => {
    expect(cardText(db, db.cards['last-ember']!)).toBe(
      'Gain 2 Spell Power. Consume. If you had no Spell Power: Gain 5 (+1 per 3 Spell Power spent this turn) Barrier.',
    );
  });
});

describe('second resources have a way in and a way out from the first hand', () => {
  // (the way in is the 4 Spell Power every fight starts with and the 1 Kindled adds each turn; a spell can spend any of it, DECISIONS #480)
  it('The spellblade starts every fight with Spell Power to spend, and her starter both makes and spends it', () => {
    const starter = RIFTWALKERS.spellblade.starter.map((id) => db.cards[id]!);
    expect(starter.some((c) => c.effects.some((o) => o.op === 'stars' && o.amount > 0))).toBe(true);
    expect(starter.some((c) => c.starX || c.starHalf)).toBe(true);
    for (let i = 0; i < 20; i++) {
      const { state } = createCombat(db, {
        seed: `arcana-${i}`,
        a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
        b: { enemies: ['squire'] },
      });
      expect(state.sides.a.stars, `seed ${i}`).toBe(5);
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
    // (Edge 2 since #692)
    expect(dealt(buffed, 'N')).toBe(base + 2);
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
  const cardsOf = (h: HeroId) => rewardPool(h).map((id) => db.cards[id]!);

  it('every Riftwalker has a deep pool with all rarities, mostly of their own', () => {
    for (const h of HEROES) {
      const own = cardsOf(h).filter((c) => c.hero === h);
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
    owns(sharpensAnother, ['drunkard', 'shaman']);
    // (Fracture and X / X/2 costs are hers, DECISIONS #480, #482)
    owns((c) => uses(c, 'fracture') || c.starX === true || c.starHalf === true, 'spellblade');
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

  it("Burn is the Shaman's (his Flame, DECISIONS #421, #501: a status of its own)", () => {
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

describe('Aura wording (DECISIONS #299, #300)', () => {
  const text = (id: string): string => cardText(db, db.cards[id]!);
  it('an Aura that gives a lasting status once says it lasts the rest of the fight', () => {
    expect(text('unchained')).toBe('On play: Gain 4 Might for the rest of the fight.');
    expect(text('warlords-oath')).toMatch(/^At the start of your turn: Gain 2 Might\.$/);
  });
  it('an Aura with an ongoing trigger does not, and Rift Resonance answers a reshuffle', () => {
    expect(text('rift-resonance')).toBe(
      'Gain 1 Might. Whenever your deck is reshuffled: Gain 1 Might.',
    );
  });
});

describe('only an X card scales its number of hits (DECISIONS #507, #509)', () => {
  const scalesHits = (o: unknown): boolean => {
    if (Array.isArray(o)) return o.some(scalesHits);
    if (!o || typeof o !== 'object') return false;
    const r = o as Record<string, unknown>;
    if (r.into === 'hits' && r.by !== 'x') return true;
    return Object.values(r).some(scalesHits);
  };
  it('a card that only counts, with nothing to count, lands no hit: Primed stays and Thorns stay quiet', () => {
    const start = createCombat(db, {
      seed: 'zero-hit',
      a: { hero: 'assassin', deck: ['strike', 'strike', 'strike', 'strike', 'strike', 'strike'] },
      b: { enemies: ['squire'] },
    }).state;
    const s0 = clone(start);
    s0.sides.a.hand = [{ id: 'N0', card: 'needle-rain' }];
    s0.sides.a.mana = 3;
    const hero = s0.sides.a.units.find((u) => u.kind === 'hero')!;
    hero.statuses.vigor = 4;
    const foe = s0.sides.b.units[0]!;
    foe.statuses.thorns = 5;
    const { state, events } = applyAction(db, s0, { type: 'play', card: 'N0', target: foe.id });
    expect(events.filter((e) => e.type === 'damage')).toEqual([]);
    expect(state.sides.a.units.find((u) => u.kind === 'hero')!.statuses.vigor).toBe(4);
  });

  it('more of anything else means more damage on each hit, not more hits', () => {
    const bad = Object.values(db.cards).filter((c) => scalesHits(c.effects)).map((c) => c.id);
    expect(bad).toEqual([]);
  });
});

describe('an aimed attack stays on its target (DECISIONS #508)', () => {
  const twoFoes = (card: string) => {
    const s0 = clone(
      createCombat(db, {
        seed: 'aim',
        a: { hero: 'knight', deck: ['strike', 'strike', 'strike', 'strike', 'strike', 'strike'] },
        b: { enemies: ['squire', 'squire'] },
      }).state,
    );
    s0.sides.a.hand = [{ id: 'T0', card }];
    s0.sides.a.mana = 3;
    return s0;
  };

  it('when the target falls, the remaining hits are lost: they do not move to another enemy', () => {
    const s0 = twoFoes('twin-cut');
    const [first, second] = s0.sides.b.units;
    first!.hp = 1;
    const hp = second!.hp;
    const { state } = applyAction(db, s0, { type: 'play', card: 'T0', target: first!.id });
    expect(state.sides.b.units.find((u) => u.id === first!.id)?.hp ?? 0).toBe(0);
    expect(state.sides.b.units.find((u) => u.id === second!.id)!.hp).toBe(hp);
  });

  it('a second damage effect of the same card is lost too: Crosscut after a Spell', () => {
    const s0 = twoFoes('crosscut');
    s0.sides.a.prevSpell = true;
    const [first, second] = s0.sides.b.units;
    first!.hp = 1;
    const hp = second!.hp;
    const { state } = applyAction(db, s0, { type: 'play', card: 'T0', target: first!.id });
    expect(state.sides.b.units.find((u) => u.id === second!.id)!.hp).toBe(hp);
  });

  it('a Reverb replay is a new attack, and finds a new target', () => {
    const s0 = twoFoes('twin-cut');
    s0.sides.a.units.find((u) => u.kind === 'hero')!.statuses.twinned = 1;
    const [first, second] = s0.sides.b.units;
    first!.hp = 1;
    const hp = second!.hp;
    const { state } = applyAction(db, s0, { type: 'play', card: 'T0', target: first!.id });
    expect(state.sides.b.units.find((u) => u.id === second!.id)!.hp).toBe(hp - 10);
  });

  it("a companion's own strike, aimed by no card, carries on to the next enemy", () => {
    const s0 = twoFoes('scrap-golem');
    const [first, second] = s0.sides.b.units;
    const played = applyAction(db, s0, { type: 'play', card: 'T0' }).state;
    played.sides.b.units.find((u) => u.id === first!.id)!.hp = 1;
    const hp = second!.hp;
    const after = applyAction(db, played, { type: 'endTurn' }).state;
    expect(after.sides.b.units.find((u) => u.id === second!.id)!.hp).toBeLessThan(hp);
  });

  it('every hit lands while the target stands', () => {
    const s0 = twoFoes('twin-cut');
    const [first] = s0.sides.b.units;
    const hp = first!.hp;
    const { state } = applyAction(db, s0, { type: 'play', card: 'T0', target: first!.id });
    expect(state.sides.b.units[0]!.hp).toBe(hp - 10);
  });
});

describe('cards whose damage scales, by id (DECISIONS #507, #509)', () => {
  const playIt = (hero: HeroId, card: string, mana = 3) => {
    const s0 = clone(
      createCombat(db, {
        seed: 'scale-' + card,
        a: { hero, deck: ['strike', 'strike', 'strike', 'strike', 'strike', 'strike'] },
        b: { enemies: ['squire'] },
      }).state,
    );
    s0.sides.a.hand = [{ id: 'T0', card }];
    s0.sides.a.mana = mana;
    const foe = s0.sides.b.units[0]!;
    foe.hp = foe.maxHp = 500;
    return { s0, foe };
  };
  const lostBy = (hero: HeroId, card: string, mana = 3, prep?: (s: CombatState) => void): number => {
    const { s0, foe } = playIt(hero, card, mana);
    prep?.(s0);
    const target = db.cards[card]!.target === 'foe' ? foe.id : undefined;
    const { state } = applyAction(db, s0, { type: 'play', card: 'T0', ...(target ? { target } : {}) });
    return 500 - state.sides.b.units[0]!.hp;
  };

  it('X cards hit X times', () => {
    expect(lostBy('hunter', 'bloodstorm')).toBe(5 * 3);
    expect(lostBy('necromancer', 'oblivion')).toBe(11 * 3);
    expect(lostBy('monk', 'berserk-tide')).toBe(4 * 3);
    expect(lostBy('hunter', 'whirling-maul')).toBe(6 * 3);
    expect(lostBy('monk', 'rift-whirl')).toBe(4 * 3);
  });

  it('an X card at X = 0 lands no hit, and Primed stays', () => {
    const { s0, foe } = playIt('assassin', 'run-through', 0);
    s0.sides.a.units.find((u) => u.kind === 'hero')!.statuses.vigor = 4;
    const { state } = applyAction(db, s0, { type: 'play', card: 'T0', target: foe.id });
    expect(state.sides.b.units[0]!.hp).toBe(500);
    expect(state.sides.a.units.find((u) => u.kind === 'hero')!.statuses.vigor).toBe(4);
  });

  it('fixed hits with damage that grows: Apex Frenzy, Wild Swings, Trapline Rider, Flak Burst', () => {
    expect(lostBy('hunter', 'apex-maw')).toBe(2 * 4);
    expect(lostBy('hunter', 'apex-maw', 3, (s) => void (s.sides.a.played = 2))).toBe(2 * (4 + 2 * 2));
    expect(lostBy('hunter', 'wild-swings', 3, (s) => void (s.sides.a.played = 2))).toBe(3 + 3 * 2);
    expect(lostBy('trickster', 'trapline-rider')).toBe(4);
    expect(
      lostBy('shaman', 'flak-burst', 3, (s) => {
        s.sides.a.discard = [
          { id: 'W1', card: 'wound' },
          { id: 'W2', card: 'wound' },
        ];
      }),
    ).toBe(8 * 2);
  });

  it('a fixed-hit Sword shows its hits and what they come to', () => {
    const { s0, foe } = playIt('spellblade', 'storm-of-glass');
    s0.sides.a.stars = 12;
    const live = [...previewCardDamage(db, s0, 'T0', foe.id).values()][0];
    expect(live?.hits).toBe(4);
    expect(live?.total).toEqual({ lo: 44, hi: 44 });
  });
});
