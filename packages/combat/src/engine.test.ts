import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  applyAction,
  createCombat,
  hashState,
  validateDb,
  heroOf,
  legalActions,
  OVERFLOW_PCT,
  viewFor,
  eventsFor,
  cardText,
  tierHp,
  tierMight,
  clone,
  previewCardDamage,
  type Action,
  type CardDef,
  type CombatDb,
  type CombatEvent,
  type CombatSetup,
  type CombatState,
  type Unit,
} from './index';
import { SAMPLE_DB as db, SAMPLE_DECK } from './sample';
import { nextInt, seedRng } from './rng';

// --- helpers --------------------------------------------------------------------------------------------------

function start(
  enemies: string[],
  hand: string[] = [],
  opts: Partial<CombatSetup['a']> = {},
  seed = 't',
) {
  const { state } = createCombat(db, {
    seed,
    a: { hero: 'knight', deck: SAMPLE_DECK, ...opts },
    b: { enemies },
  });
  return withHand(state, hand);
}

/** Replace the hand with exactly these cards (instances are created fresh) and give plenty of mana. */
function withHand(s: CombatState, cards: string[], mana = 3): CombatState {
  const c = clone(s);
  c.sides.a.hand = cards.map((card, i) => ({ id: `t${i}`, card }));
  c.sides.a.mana = mana;
  return c;
}

const hero = (s: CombatState): Unit => heroOf(s.sides.a) as Unit;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i] as Unit;
const play = (s: CombatState, id: string, target?: string) =>
  applyAction(db, s, { type: 'play', card: id, ...(target ? { target } : {}) });
const end = (s: CombatState) => applyAction(db, s, { type: 'endTurn' });
const types = (ev: CombatEvent[]) => ev.map((e) => e.type);

// --- setup & turn flow ---------------------------------------------------------------------------------------------

describe('setup and turn flow', () => {
  it('starts with a full hand, full mana, and enemies showing intents', () => {
    const { state, events } = createCombat(db, {
      seed: 'x',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { enemies: ['slime', 'cultist'] },
    });
    expect(state.sides.a.hand).toHaveLength(5);
    expect(state.sides.a.mana).toBe(3);
    expect(state.active).toBe('a');
    expect(state.sides.b.units.map((u) => u.intent?.move)).toEqual(['smack', 'chant']); // cultist opens with its opening move
    expect(types(events)).toContain('turnStart');
    expect(state.sides.b.units[0]?.intent?.target).toBe(hero(state).id);
  });

  it('is deterministic: same seed and actions give the same state', () => {
    const run = (): string => {
      let s = start(['slime']);
      for (let i = 0; i < 6 && !s.winner; i++) s = end(s).state;
      return hashState(s);
    };
    expect(run()).toBe(run());
  });

  it('does not mutate the state it is given', () => {
    const s0 = start(['slime'], ['strike']);
    const before = JSON.stringify(s0);
    play(s0, 't0', foe(s0).id);
    end(s0);
    expect(JSON.stringify(s0)).toBe(before);
  });

  it('end turn discards the hand, enemies act, then you draw a new hand with full mana', () => {
    const s0 = start(['slime'], ['strike', 'defend']);
    const { state, events } = end(s0);
    expect(types(events)).toContain('discard');
    expect(hero(state).hp).toBe(60 - 6); // slime smacks for 6
    expect(state.sides.a.hand).toHaveLength(5);
    expect(state.sides.a.mana).toBe(3);
    expect(state.turn).toBeGreaterThan(s0.turn);
  });

  it('reshuffles the discard pile into the draw pile when it runs dry', () => {
    let s = start(['slime']);
    let sawShuffle = false;
    for (let i = 0; i < 8 && !s.winner; i++) {
      const r = end(s);
      sawShuffle ||= r.events.some((e) => e.type === 'shuffle');
      s = r.state;
    }
    expect(sawShuffle).toBe(true);
  });

  it('retained cards stay in hand', () => {
    const s0 = start(['slime'], ['brace', 'strike']);
    const { state } = end(s0);
    expect(state.sides.a.hand.some((c) => c.id === 't0')).toBe(true);
    expect(state.sides.a.hand.some((c) => c.id === 't1')).toBe(false);
  });

  it('burns cards drawn with a full hand', () => {
    const s0 = start(['slime']);
    const dq = withHand(s0, [...Array<string>(9).fill('defend'), 'quick-draw']);
    const r2 = play(dq, 't9');
    expect(types(r2.events)).toContain('burn');
    expect(r2.state.sides.a.hand.length).toBe(10);
  });
});

// --- cards & damage -------------------------------------------------------------------------------------------------

describe('playing cards', () => {
  it('pays mana, deals damage, discards the card', () => {
    const s0 = start(['slime'], ['strike']);
    const { state } = play(s0, 't0', foe(s0).id);
    expect(state.sides.a.mana).toBe(2);
    expect(foe(state).hp).toBe(14 - 6);
    expect(state.sides.a.discard.some((c) => c.id === 't0')).toBe(true);
    expect(state.sides.a.hand).toHaveLength(0);
  });

  it('rejects unaffordable cards, wrong targets and unplayable cards', () => {
    const s0 = start(['slime'], ['bash', 'wound', 'strike'], {}, 'r');
    const poor = withHand(s0, ['bash'], 1);
    expect(() => play(poor, 't0', foe(poor).id)).toThrow();
    expect(() => play(s0, 't1')).toThrow();
    expect(() => play(s0, 't2', hero(s0).id)).toThrow(); // cannot Strike yourself
    expect(() => play(s0, 't2')).toThrow(); // needs a target
  });

  it('legalActions offers a target per foe, and nothing for unaffordable cards', () => {
    const s0 = start(['slime', 'cultist'], ['strike', 'cleave'], {}, 'l');
    const acts = legalActions(db, s0);
    expect(acts.filter((a) => a.type === 'play' && a.card === 't0')).toHaveLength(2);
    expect(acts.filter((a) => a.type === 'play' && a.card === 't1')).toHaveLength(1);
    expect(acts.at(-1)).toEqual({ type: 'endTurn' });
    expect(
      legalActions(db, withHand(s0, ['bash'], 1)).filter((a) => a.type === 'play'),
    ).toHaveLength(0);
  });

  it('with a single enemy there is exactly one legal target (the client auto-aims)', () => {
    const s0 = start(['slime'], ['strike']);
    expect(legalActions(db, s0).filter((a) => a.type === 'play')).toHaveLength(1);
  });

  it('cleave hits every enemy; flurry hits randomly but deterministically', () => {
    const s0 = start(['slime', 'cultist'], ['cleave', 'flurry']);
    const c = play(s0, 't0').state;
    expect(foe(c, 0).hp).toBe(10);
    expect(foe(c, 1).hp).toBe(18);
    const f1 = play(s0, 't1').state;
    const f2 = play(s0, 't1').state;
    expect(hashState(f1)).toBe(hashState(f2));
    expect(foe(f1, 0).hp + foe(f1, 1).hp).toBe(14 + 22 - 9);
  });

  it('exhaust and power cards leave the deck for the fight', () => {
    const s0 = start(['slime'], ['quick-draw', 'battle-cry']);
    const a = play(s0, 't0');
    expect(types(a.events)).toContain('exhaust');
    expect(a.state.sides.a.exhausted).toHaveLength(1);
    const b = play(s0, 't1');
    expect(hero(b.state).statuses.might).toBe(2);
    expect(b.state.sides.a.exhausted).toHaveLength(1);
  });
});

describe('damage, barrier and statuses', () => {
  it('Barrier soaks first, then HP, and falls away at the start of its owner turn', () => {
    const s0 = start(['slime'], ['defend']);
    const d = play(s0, 't0').state;
    expect(hero(d).barrier).toBe(5);
    const e = end(d); // slime smacks 6: 5 blocked, 1 through
    const hit = e.events.find((x) => x.type === 'damage' && x.target === hero(d).id);
    expect(hit).toMatchObject({ amount: 6, blocked: 5, lost: 1 });
    expect(hero(e.state).hp).toBe(59);
    expect(hero(e.state).barrier).toBe(0);
  });

  it('enemy Barrier lasts through your turn, then falls at the start of their turn', () => {
    // goo = faltering on you + 4 barrier; cycle is smack, smack, goo
    let s = start(['slime']);
    s = end(end(s).state).state; // two smacks done, next intent is goo
    expect(foe(s).intent?.move).toBe('goo');
    s = end(s).state; // goo resolves: slime gains 4 barrier
    expect(foe(s).barrier).toBe(4);
    s = withHand(s, ['strike']);
    const r = play(s, 't0', foe(s).id);
    expect(foe(r.state).barrier).toBe(0);
  });

  it('Might adds, Faltering cuts 25%, Exposed adds 50%', () => {
    const s0 = start(['slime'], ['strike', 'strike']);
    const m = clone(s0);
    hero(m).statuses.might = 2;
    expect(foe(play(m, 't0', foe(m).id).state).hp).toBe(14 - 8);
    const f = clone(s0);
    hero(f).statuses.faltering = 1;
    expect(foe(play(f, 't0', foe(f).id).state).hp).toBe(14 - 4); // floor(6 * 0.75)
    const x = clone(s0);
    foe(x).statuses.exposed = 1;
    expect(foe(play(x, 't0', foe(x).id).state).hp).toBe(14 - 9);
  });

  it('Bash applies Exposed, which ticks down at the end of its owner turn', () => {
    const s0 = start(['slime'], ['bash']);
    const s1 = play(s0, 't0', foe(s0).id).state;
    expect(foe(s1).statuses.exposed).toBe(2);
    const s2 = end(s1).state;
    expect(foe(s2).statuses.exposed).toBe(1);
  });

  it('Seared burns at the start of the turn for its stacks, then shrinks', () => {
    const s0 = start(['summoner']);
    foe(s0).statuses.seared = 3;
    const s1 = end(s0).state; // enemy turn start: 3 damage, seared 2
    const summoner = s1.sides.b.units.find((u) => u.def === 'summoner') as Unit;
    expect(summoner.hp).toBe(30 - 3);
    expect(summoner.statuses.seared).toBe(2);
  });

  it('a Stunned enemy still acts, but as if Faltering, and its Stun wears off at the end of its turn (DECISIONS #310)', () => {
    const plain = end(start(['slime'])).state;
    const full = 60 - hero(plain).hp;
    expect(full).toBeGreaterThan(0);
    const s0 = start(['slime']);
    foe(s0).statuses.stunned = 1;
    const r = end(s0);
    expect(types(r.events)).not.toContain('skip');
    expect(60 - hero(r.state).hp).toBe(Math.floor(full * 0.75));
    expect(foe(r.state).statuses.stunned).toBeUndefined();
  });

  it('Stunned counts as Exposed, Faltering and Brittle once, never on top of them, and keeps the longer countdown', () => {
    const tdb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        jab: {
          id: 'jab',
          name: 'Jab',
          kind: 'attack',
          cost: 0,
          target: 'foe',
          effects: [{ op: 'damage', amount: 10, to: 'target' }],
        } as unknown as CardDef,
        daze: {
          id: 'daze',
          name: 'Daze',
          kind: 'skill',
          cost: 0,
          target: 'foe',
          effects: [{ op: 'status', status: 'stunned', amount: 2, to: 'target' }],
        } as unknown as CardDef,
      },
    };
    const hit = (stunned: number, exposed: number): number => {
      const s = clone(start(['slime'], ['jab']));
      foe(s).statuses.stunned = stunned;
      foe(s).statuses.exposed = exposed;
      foe(s).hp = 999;
      foe(s).maxHp = 999;
      const after = applyAction(tdb, s, { type: 'play', card: 't0', target: foe(s).id }).state;
      return 999 - foe(after).hp;
    };
    expect(hit(0, 0)).toBe(10);
    expect(hit(1, 0)).toBe(15);
    expect(hit(1, 1)).toBe(15);
    // a second Stun keeps the longer countdown instead of adding to it
    let s = clone(start(['slime'], ['daze', 'daze']));
    foe(s).statuses.stunned = 3;
    s = applyAction(tdb, s, { type: 'play', card: s.sides.a.hand[0]!.id, target: foe(s).id }).state;
    expect(foe(s).statuses.stunned).toBe(3);
  });

  it("a Stun that lands during the unit's own turn still covers its next turn", () => {
    const tdb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        reel: {
          id: 'reel',
          name: 'Reel',
          kind: 'skill',
          cost: 0,
          target: 'none',
          effects: [{ op: 'status', status: 'stunned', amount: 1, to: 'self' }],
        } as unknown as CardDef,
      },
    };
    let s = clone(start(['slime'], ['reel']));
    s = applyAction(tdb, s, { type: 'play', card: s.sides.a.hand[0]!.id }).state;
    s = applyAction(tdb, s, { type: 'endTurn' }).state;
    expect(hero(s).statuses.stunned).toBe(1);
    s = applyAction(tdb, s, { type: 'endTurn' }).state;
    expect(hero(s).statuses.stunned ?? 0).toBe(0);
  });

  it('Shielded ignores one attack and pops', () => {
    const s0 = start(['slime'], ['ward']);
    const w = play(s0, 't0', hero(s0).id).state;
    expect(hero(w).statuses.shielded).toBe(1);
    const e = end(w).state;
    expect(hero(e).hp).toBe(60);
    expect(hero(e).statuses.shielded).toBeUndefined();
  });

  it('Thorns hurt the attacker', () => {
    const s0 = start(['slime']);
    hero(s0).statuses.thorns = 3;
    const e = end(s0).state;
    expect(foe(e).hp).toBe(14 - 3);
  });

  it('Faltering from an enemy weakens your next attacks', () => {
    // slime: smack, smack, goo (faltering 1 on you); it lasts through your next turn, then wears off
    let s = start(['slime']);
    s = end(end(end(s).state).state).state;
    expect(hero(s).statuses.faltering).toBe(1);
    s = withHand(s, ['strike']);
    const hit = play(s, 't0', foe(s).id).events.find((e) => e.type === 'damage');
    expect(hit).toMatchObject({ amount: 4 }); // floor(6 * 0.75)
    expect(hero(end(s).state).statuses.faltering).toBeUndefined();
  });
});

// --- allies ------------------------------------------------------------------------------------------------------------

describe('allies', () => {
  it('summoned allies stand in front of the hero and act when you end your turn', () => {
    const s0 = start(['summoner'], ['call-drone']);
    const s1 = play(s0, 't0').state;
    const ids = s1.sides.a.units.map((u) => u.kind);
    expect(ids).toEqual(['ally', 'hero']);
    const e = end(s1);
    expect(types(e.events)).toContain('act');
    // drone hits the front enemy for 3 before the enemy turn
    expect(e.state.sides.b.units.find((u) => u.def === 'summoner')?.hp).toBe(30 - 3);
  });

  it('an ally shows what it will do at the end of the turn, with the damage as it will land on the front enemy', () => {
    const s1 = play(start(['summoner'], ['call-drone']), 't0').state;
    const iv = () => viewFor(db, c, 'a').sides.a.units.find((u) => u.kind === 'ally')?.intentView;
    const c = clone(s1);
    expect(iv()).toMatchObject({ damage: 3, icons: ['attack'], target: foe(c).id });
    // Might on the ally and Exposed on the enemy both count, as they will when it acts
    const ally = c.sides.a.units.find((u) => u.kind === 'ally')!;
    ally.statuses.might = 2;
    expect(iv()?.damage).toBe(5);
    foe(c).statuses.exposed = 1;
    const before = foe(c).hp + foe(c).barrier;
    const after = end(c).state.sides.b.units.find((u) => u.id === foe(c).id)!;
    expect(iv()?.damage).toBe(before - after.hp - after.barrier);
    // a stunned ally still acts, Faltering (it never stacks with real Faltering)
    delete foe(c).statuses.exposed;
    ally.statuses.stunned = 1;
    expect(iv()?.damage).toBe(Math.floor(5 * 0.75));
    ally.statuses.faltering = 2;
    expect(iv()?.damage).toBe(Math.floor(5 * 0.75));
  });

  it('enemies hit your minions before they hit you, even one summoned after the intent was chosen', () => {
    const s1 = play(start(['slime'], ['call-drone']), 't0').state;
    const c = clone(s1);
    // the slime had chosen to hit the hero; the drone now stands in front
    foe(c).intent = { move: 'smack', target: hero(c).id };
    const ally = c.sides.a.units.find((u) => u.kind === 'ally');
    const hp = ally?.hp ?? 0;
    const heroHp = hero(c).hp;
    const after = end(c).state;
    expect(hero(after).hp).toBe(heroHp);
    const hit = after.sides.a.units.find((u) => u.id === ally?.id);
    expect(!hit || hit.hp + hit.barrier < hp + (ally?.barrier ?? 0)).toBe(true);
  });

  it('max three allies', () => {
    let s = withHand(
      start(['summoner']),
      ['call-drone', 'call-drone', 'call-drone', 'call-drone'],
      10,
    );
    for (let i = 0; i < 3; i++) s = play(s, `t${i}`).state;
    expect(s.sides.a.units.filter((u) => u.kind === 'ally')).toHaveLength(3);
    // with the board full, a summon card can only be played by releasing one of the three
    const fourth = legalActions(db, s).filter((a) => a.type === 'play' && a.card === 't3');
    expect(fourth).toHaveLength(3);
    expect(fourth.every((a) => a.type === 'play' && a.release !== undefined)).toBe(true);
    expect(() => play(s, 't3')).toThrow();
    const allies = s.sides.a.units.filter((u) => u.kind === 'ally');
    const leaving = allies[1]?.id as string;
    const after = applyAction(db, s, { type: 'play', card: 't3', release: leaving }).state;
    const now = after.sides.a.units.filter((u) => u.kind === 'ally');
    expect(now).toHaveLength(3);
    expect(now.some((u) => u.id === leaving)).toBe(false);
    // releasing is not dying: it is not remembered as fallen
    expect(after.sides.a.fallen ?? []).toHaveLength(s.sides.a.fallen?.length ?? 0);
    // it cannot be a foe, or someone who is not there
    expect(() =>
      applyAction(db, s, { type: 'play', card: 't3', release: s.sides.b.units[0]?.id as string }),
    ).toThrow();
  });

  it('a hero can start with allies (Tinker begins with a Drone)', () => {
    const { state } = createCombat(db, {
      seed: 'k',
      a: { hero: 'tinker', deck: SAMPLE_DECK },
      b: { enemies: ['slime'] },
    });
    expect(state.sides.a.units.map((u) => u.def)).toEqual(['drone', 'tinker']);
  });

  it('Rally makes allies act right now', () => {
    const s0 = start(['summoner'], ['call-drone', 'rally']);
    const s1 = play(play(s0, 't0').state, 't1').state;
    expect(foe(s1).hp).toBe(27);
  });

  it('Golem taunts: enemies must hit it, and so must your own aimed cards for the other side', () => {
    const s0 = start(['slime'], ['call-golem']);
    const s1 = play(s0, 't0').state;
    const e = end(s1);
    const golem = s1.sides.a.units[0] as Unit;
    expect(golem.def).toBe('golem');
    const dmg = e.events.find((x) => x.type === 'damage' && x.kind === 'attack');
    expect(dmg).toMatchObject({ target: golem.id });
  });

  it('a dead ally is removed; enemies re-target', () => {
    const s0 = start(['cultist']);
    const c = clone(s0);
    const ally = {
      ...clone(hero(c)),
      id: 'ally1',
      def: 'drone',
      name: 'Drone',
      kind: 'ally' as const,
      hp: 1,
      maxHp: 8,
    };
    c.sides.a.units.unshift(ally);
    foe(c).intent = { move: 'stab', target: 'ally1' };
    const e = end(c);
    expect(types(e.events)).toContain('died');
    expect(e.state.sides.a.units.some((u) => u.id === 'ally1')).toBe(false);
    expect(hero(e.state).hp).toBeLessThan(60); // the second stab found a new target: the hero
  });

  it('an 8x3 attack that kills a minion in two hits spends the third on the hero, for its full damage (plus the overflow of the second)', () => {
    // (the sample cultist, given an 8x3 move for this test)
    const cultist = db.units.cultist!;
    if (cultist.brain.kind !== 'enemy') throw new Error('cultist is an enemy');
    const tdb: CombatDb = {
      ...db,
      units: {
        ...db.units,
        cultist: {
          ...cultist,
          brain: {
            ...cultist.brain,
            moves: {
              ...cultist.brain.moves,
              flurry: {
                id: 'flurry',
                name: 'Flurry',
                effects: [{ op: 'damage', amount: 8, hits: 3, to: 'target' }],
              },
            },
          },
        },
      },
    };
    const c = clone(start(['cultist']));
    c.sides.a.units.unshift({
      ...clone(hero(c)),
      id: 'ally1',
      def: 'drone',
      name: 'Drone',
      kind: 'ally' as const,
      hp: 12,
      maxHp: 12,
      barrier: 0,
      statuses: {},
    });
    hero(c).barrier = 0;
    const before = hero(c).hp;
    foe(c).intent = { move: 'flurry', target: 'ally1' };
    const after = applyAction(tdb, c, { type: 'endTurn' }).state;
    // two hits (8 + 8) kill the 12 HP drone, 4 left over, half of it (2) carrying through; the third finds the hero and lands in full
    expect(after.sides.a.units.some((u) => u.id === 'ally1')).toBe(false);
    expect(hero(after).hp).toBe(before - 8 - Math.floor((4 * OVERFLOW_PCT) / 100));
  });
});

// --- enemies, intents, summoners, phases ------------------------------------------------------------------------

describe('enemies and intents', () => {
  it('follows its cycle and always shows the next intent', () => {
    let s = start(['slime']);
    const seen: string[] = [foe(s).intent?.move ?? ''];
    for (let i = 0; i < 5; i++) {
      s = end(s).state;
      seen.push(foe(s).intent?.move ?? '');
    }
    expect(seen).toEqual(['smack', 'smack', 'goo', 'smack', 'smack', 'goo']);
  });

  it('weighted patterns never repeat a move three times in a row', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        let s = start(['cultist'], [], {}, seed);
        const moves: string[] = [];
        for (let i = 0; i < 12 && !s.winner; i++) {
          moves.push(foe(s).intent?.move ?? '');
          const c = clone(s);
          hero(c).hp = 9999;
          hero(c).maxHp = 9999;
          s = end(c).state;
        }
        for (let i = 2; i < moves.length; i++)
          expect(!(moves[i] === moves[i - 1] && moves[i] === moves[i - 2])).toBe(true);
      }),
      { numRuns: 30 },
    );
  });

  it('shows the damage it will deal, with modifiers', () => {
    const s0 = start(['cultist']);
    const c = clone(s0);
    foe(c).intent = { move: 'stab', target: hero(c).id };
    hero(c).statuses.exposed = 1;
    const v = viewFor(db, c, 'a');
    expect(v.sides.b.units[0]?.intentView).toMatchObject({ damage: 7, hits: 2, icons: ['attack'] });
  });

  it('a summoner adds enemies (up to four) which show intents immediately', () => {
    let s = start(['summoner']);
    const r = end(s); // first move is "call"
    s = r.state;
    expect(s.sides.b.units).toHaveLength(2);
    expect(types(r.events)).toContain('summon');
    expect(s.sides.b.units[0]?.intent).not.toBeNull();
    // the minion stands in front of its summoner
    expect(s.sides.b.units.map((u) => u.def)).toEqual(['slime', 'summoner']);
  });

  it('phase patterns change below the HP threshold', () => {
    const s0 = start(['warden']);
    expect(foe(s0).intent?.move).toBe('slam');
    const c = clone(s0);
    foe(c).hp = 30; // below 50%
    foe(c).moveCount = 0;
    const s1 = end(c).state;
    expect(foe(s1).intent?.move).toBe('rage');
    const s2 = end(s1);
    expect(s2.state.sides.a.discard.some((x) => x.card === 'wound')).toBe(true);
  });

  it('wins when every enemy is defeated and loses when the hero falls', () => {
    const s0 = start(['slime'], ['strike']);
    const c = clone(s0);
    foe(c).hp = 6;
    const w = play(c, 't0', foe(c).id);
    expect(w.state.winner).toBe('a');
    expect(types(w.events)).toContain('gameOver');
    expect(legalActions(db, w.state)).toEqual([]);
    expect(() => end(w.state)).toThrow();

    const l = clone(s0);
    hero(l).hp = 6;
    const lost = end(l);
    expect(lost.state.winner).toBe('b');
  });
});

// --- snares --------------------------------------------------------------------------------------------------------

describe('snares', () => {
  it('are set face down and spring automatically when an enemy attacks', () => {
    const s0 = start(['slime'], ['tripwire']);
    const s1 = play(s0, 't0').state;
    expect(s1.sides.a.snares).toHaveLength(1);
    const e = end(s1);
    expect(types(e.events)).toContain('snareSprung');
    expect(foe(e.state).hp).toBe(14 - 8);
    expect(hero(e.state).hp).toBe(54); // the attack still lands
    expect(e.state.sides.a.snares).toHaveLength(0);
    expect(e.state.sides.a.discard.some((c) => c.card === 'tripwire')).toBe(true);
  });

  it('Mirror Ward cancels the attack and weakens the attacker', () => {
    const s0 = start(['slime'], ['mirror-ward']);
    const e = end(play(s0, 't0').state);
    expect(types(e.events)).toContain('prevented');
    expect(hero(e.state).hp).toBe(60);
    expect(foe(e.state).statuses.faltering).toBe(2 - 1); // 2, then it ticks down at the end of its turn
  });

  it('at most three set at once', () => {
    const s0 = withHand(start(['slime']), ['tripwire', 'tripwire', 'tripwire', 'tripwire'], 10);
    let s = s0;
    for (let i = 0; i < 3; i++) s = play(s, `t${i}`).state;
    expect(legalActions(db, s).some((a) => a.type === 'play' && a.card === 't3')).toBe(false);
  });

  it('are hidden from the opponent in the view', () => {
    const s1 = play(start(['slime'], ['tripwire']), 't0').state;
    expect(viewFor(db, s1, 'a').sides.a.snares[0]?.card).toBe('tripwire');
    expect(viewFor(db, s1, 'b').sides.a.snares[0]?.card).toBeNull();
    expect(viewFor(db, s1, 'b').sides.a.hand).toBeNull();
  });
});

// --- review fixes (reviews/c1-review.md) ----------------------------------------------------------------

describe('review fixes', () => {
  it('H1: a summoned enemy keeps the intent it chose when it arrived', () => {
    const s0 = start(['summoner']);
    const r = end(s0);
    const slime = r.state.sides.b.units[0] as Unit;
    expect(slime.def).toBe('slime');
    expect(slime.intent?.move).toBe('smack'); // its first move, not its second
    expect(r.events.filter((e) => e.type === 'intent' && e.unit === slime.id)).toHaveLength(1);
  });

  it('H2: Exposed put on the hero by an enemy amplifies the next enemy attack', () => {
    const s0 = start(['slime']);
    hero(s0).statuses.exposed = 2; // as if applied during the enemy turn
    const hit = (st: CombatState) =>
      end(st).events.find((e) => e.type === 'damage' && e.target === hero(st).id);
    expect(hit(s0)).toMatchObject({ amount: 9 }); // 6 * 1.5
    const after = end(s0).state;
    expect(hero(after).statuses.exposed).toBe(1); // still one more enemy turn
  });

  it('H3: a Trap set by the other player is anonymous in their event feed', () => {
    const s0 = start(['slime'], ['tripwire', 'strike']);
    const set = play(s0, 't0').events;
    expect(JSON.stringify(eventsFor(db, set, 'b'))).not.toContain('tripwire');
    expect(JSON.stringify(eventsFor(db, set, 'a'))).toContain('tripwire');
    const dr = createCombat(db, {
      seed: 'e',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { hero: 'tinker', deck: SAMPLE_DECK },
    }).events;
    expect(
      eventsFor(db, dr, 'b')
        .filter((e) => e.type === 'draw' && e.side === 'a')
        .every((e) => e.type === 'draw' && e.def === ''),
    ).toBe(true);
  });

  it('H4: a phase change starts its cycle from the first move', () => {
    const s0 = start(['warden']);
    const c = clone(s0);
    end(c); // nothing to do with the clone; the phase test below uses a fresh state
    let s = end(s0).state; // slam -> guard is next
    expect(foe(s).intent?.move).toBe('guard');
    foe(s).hp = 30; // below 50%: the next choice starts the phase cycle: rage first
    hero(s).hp = 9999;
    hero(s).maxHp = 9999;
    s = end(s).state;
    expect(foe(s).intent?.move).toBe('rage');
  });

  it('an ally whose act repeats Rally cannot loop', () => {
    const looping = {
      ...db,
      units: {
        ...db.units,
        echo: {
          id: 'echo',
          name: 'Echo',
          maxHp: 5,
          brain: { kind: 'ally' as const, act: [{ op: 'actAllies' as const }] },
        },
      },
    };
    const { state } = createCombat(looping, {
      seed: 'z',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { enemies: ['slime'] },
    });
    const c = clone(state);
    c.sides.a.hand = [{ id: 'x', card: 'call-drone' }];
    c.sides.a.units.unshift({
      ...clone(hero(c)),
      id: 'e1',
      def: 'echo',
      name: 'Echo',
      kind: 'ally',
      hp: 5,
      maxHp: 5,
    });
    expect(() => applyAction(looping, c, { type: 'endTurn' })).not.toThrow();
  });
});

// --- PvP -----------------------------------------------------------------------------------------------------------

describe('pvp mode', () => {
  const pvp = (): CombatState =>
    createCombat(db, {
      seed: 'p',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { hero: 'tinker', deck: SAMPLE_DECK },
    }).state;

  it('alternates turns and gives the second player a small first-turn head start', () => {
    const s0 = pvp();
    expect(s0.mode).toBe('pvp');
    expect(s0.active).toBe('a');
    const r = end(s0);
    expect(r.state.active).toBe('b');
    expect(r.state.sides.b.hand).toHaveLength(6);
    expect(r.state.sides.b.mana).toBe(4);
    expect(end(r.state).state.sides.a.hand).toHaveLength(5);
  });

  it('each player can attack the other side', () => {
    let s = pvp();
    s = end(s).state; // now b's turn
    s = {
      ...s,
      sides: { ...s.sides, b: { ...s.sides.b, hand: [{ id: 'z', card: 'strike' }], mana: 3 } },
    };
    const target = heroOf(s.sides.a) as Unit;
    const r = applyAction(db, s, { type: 'play', card: 'z', target: target.id });
    expect(heroOf(r.state.sides.a)?.hp).toBe(54);
  });

  it("a hero's damage percent scales what it deals (a ghost Warden), and only its own", () => {
    let s = createCombat(db, {
      seed: 'p',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { hero: 'tinker', deck: SAMPLE_DECK, dmgPct: 150 },
    }).state;
    expect(heroOf(s.sides.a)?.dmgPct).toBe(100);
    s = end(s).state; // now b's turn
    s = {
      ...s,
      sides: { ...s.sides, b: { ...s.sides.b, hand: [{ id: 'z', card: 'strike' }], mana: 3 } },
    };
    const target = heroOf(s.sides.a) as Unit;
    const r = applyAction(db, s, { type: 'play', card: 'z', target: target.id });
    // Strike deals 6; at 150% it deals 9
    expect(heroOf(r.state.sides.a)?.hp).toBe(target.hp - 9);
  });
});

// --- text ----------------------------------------------------------------------------------------------------------

describe('rules text', () => {
  it('is generated from the effects', () => {
    expect(cardText(db, db.cards.strike!)).toBe('Deal 6 damage.');
    expect(cardText(db, db.cards.bash!)).toBe('Deal 8 damage. Apply 2 Exposed.');
    expect(cardText(db, db.cards['quick-draw']!)).toBe('Draw 2 cards. Consume.');
    expect(cardText(db, db.cards.tripwire!)).toBe(
      'When you or an ally is attacked: Deal 8 damage to the attacker.',
    );
  });
});

// --- property: random legal play never breaks invariants -------------------------------------------------------

function invariants(s: CombatState): void {
  for (const side of [s.sides.a, s.sides.b]) {
    for (const u of side.units) {
      expect(u.hp).toBeGreaterThan(0);
      expect(u.hp).toBeLessThanOrEqual(u.maxHp);
      expect(u.barrier).toBeGreaterThanOrEqual(0);
      for (const v of Object.values(u.statuses)) expect(v).toBeGreaterThan(0);
    }
    expect(side.hand.length).toBeLessThanOrEqual(10);
    expect(side.mana).toBeGreaterThanOrEqual(0);
    expect(side.snares.length).toBeLessThanOrEqual(3);
    if (side.hero !== null) {
      expect(side.units.filter((u) => u.kind === 'hero').length).toBeLessThanOrEqual(1);
      expect(side.units.filter((u) => u.kind !== 'hero').length).toBeLessThanOrEqual(3);
      if (side.units.some((u) => u.kind === 'hero')) expect(side.units.at(-1)?.kind).toBe('hero');
    } else {
      expect(side.units.length).toBeLessThanOrEqual(4);
    }
  }
  // no card is ever duplicated or lost
  const ids = [s.sides.a, s.sides.b].flatMap((sd) =>
    [...sd.hand, ...sd.draw, ...sd.discard, ...sd.exhausted]
      .map((c) => c.id)
      .concat(sd.snares.map((x) => x.id)),
  );
  expect(new Set(ids).size).toBe(ids.length);
}

function playout(setup: CombatSetup, seed: string, maxSteps = 400): CombatState {
  let { state } = createCombat(db, setup);
  const rng = seedRng(`bot-${seed}`);
  for (let i = 0; i < maxSteps && !state.winner; i++) {
    const acts = legalActions(db, state);
    // prefer playing cards over ending the turn most of the time
    const plays = acts.filter((a) => a.type === 'play');
    const pick: Action =
      plays.length && nextInt(rng, 5) > 0
        ? (plays[nextInt(rng, plays.length)] as Action)
        : { type: 'endTurn' };
    state = applyAction(db, state, pick).state;
    invariants(state);
  }
  return state;
}

describe('property: random play', () => {
  const enemySets = [
    ['slime'],
    ['cultist', 'slime'],
    ['summoner'],
    ['warden'],
    ['slime', 'slime', 'cultist', 'summoner'],
  ];
  it('keeps every invariant over many random fights (PvE)', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 0, max: enemySets.length - 1 }),
        fc.constantFrom('knight', 'tinker'),
        (seed, e, h) => {
          playout(
            { seed, a: { hero: h, deck: SAMPLE_DECK }, b: { enemies: enemySets[e] as string[] } },
            seed,
          );
        },
      ),
      { numRuns: 120 },
    );
  });

  it('keeps every invariant in PvP', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        playout(
          {
            seed,
            a: { hero: 'knight', deck: SAMPLE_DECK },
            b: { hero: 'tinker', deck: SAMPLE_DECK },
          },
          seed,
        );
      }),
      { numRuns: 60 },
    );
  });

  it('replaying the same actions from the same seed gives identical states', () => {
    const setup: CombatSetup = {
      seed: 'replay',
      a: { hero: 'tinker', deck: SAMPLE_DECK },
      b: { enemies: ['cultist', 'slime'] },
    };
    const log: Action[] = [];
    let { state } = createCombat(db, setup);
    const rng = seedRng('log');
    for (let i = 0; i < 60 && !state.winner; i++) {
      const acts = legalActions(db, state);
      const a = acts[nextInt(rng, acts.length)] as Action;
      log.push(a);
      state = applyAction(db, state, a).state;
    }
    let again = createCombat(db, setup).state;
    for (const a of log) again = applyAction(db, again, a).state;
    expect(hashState(again)).toBe(hashState(state));
  });
});

describe('validateDb', () => {
  it('accepts the sample ruleset', () => {
    expect(validateDb(db)).toEqual([]);
  });
  it('flags broken data', () => {
    const bad = clone(db);
    bad.cards.strike!.effects = [{ op: 'summon', unit: 'nope' }];
    bad.units.slime = {
      ...bad.units.slime!,
      brain: { kind: 'enemy', moves: {}, pattern: { kind: 'cycle', order: ['x'] } },
    };
    const errs = validateDb(bad);
    expect(errs.some((e) => e.includes('unknown unit "nope"'))).toBe(true);
    expect(errs.some((e) => e.includes('unknown move "x"'))).toBe(true);
  });
});

describe('phases only move forward', () => {
  it('healing back over the threshold does not restart an earlier phase', () => {
    let s = start(['warden']);
    foe(s).hp = 30; // below 50%
    hero(s).hp = hero(s).maxHp = 9999;
    s = end(s).state;
    expect(foe(s).intent?.move).toBe('rage');
    foe(s).hp = 79; // healed above 50%
    s = end(s).state;
    expect(foe(s).intent?.move).toBe('slam'); // still the second phase's cycle (rage, slam, slam)
  });
});

describe('rift tiers', () => {
  it('every tier is tougher than the last, and the step gets bigger', () => {
    let prevStep = 0;
    for (let t = 2; t <= 20; t++) {
      const step = tierHp(t) - tierHp(t - 1);
      expect(step).toBeGreaterThan(prevStep);
      prevStep = step;
    }
    expect(tierHp(1)).toBe(1);
    expect(tierMight(12)).toBeGreaterThan(tierMight(11));
  });

  it('scale enemy HP and Might, including summoned enemies', () => {
    const { state } = createCombat(db, {
      seed: 'tier',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { enemies: ['summoner'], tier: 3 },
    });
    const boss = state.sides.b.units[0] as Unit;
    expect(boss.maxHp).toBe(Math.round(30 * tierHp(3)));
    expect(boss.statuses.might).toBe(2);
    const after = end(state).state; // the Rift Caller summons a slime
    const slime = after.sides.b.units.find((u) => u.def === 'slime') as Unit;
    expect(slime.maxHp).toBe(Math.round(14 * tierHp(3)));
    expect(slime.statuses.might).toBe(2);
  });
});

describe('difficulty percentages', () => {
  it('scale enemy HP and attack damage, and the intent shows the scaled number', () => {
    const { state } = createCombat(db, {
      seed: 'diff',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { enemies: ['slime'], hpPct: 50, dmgPct: 50 },
    });
    const slime = state.sides.b.units[0] as Unit;
    expect(slime.maxHp).toBe(7);
    expect(viewFor(db, state, 'a').sides.b.units[0]?.intentView?.damage).toBe(3); // smack 6 -> 3
    const after = end(state);
    expect(hero(after.state).hp).toBe(60 - 3);
  });
});

describe('boons', () => {
  const withBoons = (boons: string[]) =>
    createCombat(db, {
      seed: 'boon',
      a: { hero: 'knight', deck: SAMPLE_DECK, boons },
      b: { enemies: ['slime'] },
    });

  it('fight-start effects apply once, turn-start effects every turn', () => {
    const { state, events } = withBoons(['iron-sigil', 'ember-lamp']);
    expect(hero(state).barrier).toBe(8);
    expect(events.some((e) => e.type === 'barrier')).toBe(true);
    const next = end(state).state; // barrier falls, the lamp gives 2 again, the iron sigil does not return
    expect(hero(next).barrier).toBe(2);
  });

  it('mana and hand size bonuses change the turn', () => {
    const { state } = withBoons(['satchel', 'rift-core']);
    expect(state.sides.a.maxMana).toBe(4);
    expect(state.sides.a.mana).toBe(4);
    expect(state.sides.a.hand).toHaveLength(6);
  });

  it('refuses an unknown boon', () => {
    expect(() => withBoons(['nope'])).toThrow();
  });
});

describe('difficulty and max HP details', () => {
  it('a raised max HP reaches the fight', () => {
    const { state } = createCombat(db, {
      seed: 'mh',
      a: { hero: 'knight', deck: SAMPLE_DECK, hp: 70, maxHp: 72 },
      b: { enemies: ['slime'] },
    });
    expect(hero(state).maxHp).toBe(72);
    expect(hero(state).hp).toBe(70);
  });

  it('easy never rounds an enemy hit down to nothing, and scales unblockable damage and Seared', () => {
    const cheap = clone(db);
    cheap.units.slime = {
      ...cheap.units.slime!,
      brain: {
        kind: 'enemy',
        pattern: { kind: 'cycle', order: ['nick'] },
        moves: {
          nick: {
            id: 'nick',
            name: 'Nick',
            effects: [
              { op: 'damage', amount: 1, to: 'target' },
              { op: 'loseHp', amount: 10, to: 'target' },
              { op: 'status', status: 'seared', amount: 4, to: 'target' },
            ],
          },
        },
      },
    };
    const { state } = createCombat(cheap, {
      seed: 'easy',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { enemies: ['slime'], dmgPct: 50 },
    });
    const next = applyAction(cheap, state, { type: 'endTurn' });
    // 1 (never 0) + 5 unblockable, and Seared 2
    expect(hero(next.state).hp).toBe(60 - 1 - 5 - 2);
    expect(hero(next.state).statuses.seared).toBe(1);
  });
});

describe('potions', () => {
  const start = () =>
    createCombat(db, {
      seed: 'potion',
      a: { hero: 'knight', deck: SAMPLE_DECK, potions: ['fire-flask', 'guard-draught'] },
      b: { enemies: ['slime', 'cultist'] },
    }).state;

  it('are offered as free actions, aimed when they need a target', () => {
    const s = start();
    const acts = legalActions(db, s).filter((a) => a.type === 'potion');
    expect(acts.filter((a) => a.type === 'potion' && a.index === 0)).toHaveLength(2); // one per enemy
    expect(acts.filter((a) => a.type === 'potion' && a.index === 1)).toHaveLength(1);
  });

  it('cost no Mana, apply their effect, and are used up', () => {
    const s = start();
    const target = foe(s, 1);
    const r = applyAction(db, s, { type: 'potion', index: 0, target: target.id });
    expect(r.events.some((e) => e.type === 'potion')).toBe(true);
    expect(foe(r.state, 1).hp).toBe(22 - 12);
    expect(r.state.sides.a.mana).toBe(s.sides.a.mana);
    expect(r.state.sides.a.potions).toEqual(['guard-draught']);
    const g = applyAction(db, r.state, { type: 'potion', index: 0 });
    expect(hero(g.state).barrier).toBe(12);
    expect(g.state.sides.a.potions).toEqual([]);
  });

  it('refuse bad targets and unknown potions', () => {
    const s = start();
    expect(() => applyAction(db, s, { type: 'potion', index: 0, target: hero(s).id })).toThrow();
    expect(() => applyAction(db, s, { type: 'potion', index: 5 })).toThrow();
    expect(() =>
      createCombat(db, {
        seed: 'p',
        a: { hero: 'knight', deck: SAMPLE_DECK, potions: ['nope'] },
        b: { enemies: ['slime'] },
      }),
    ).toThrow();
  });

  it('a potion can win the fight', () => {
    const c = clone(start());
    foe(c, 0).hp = 5;
    foe(c, 1).hp = 5;
    const first = applyAction(db, c, { type: 'potion', index: 0, target: foe(c, 0).id }).state;
    expect(first.winner).toBeNull();
    const solo = clone(start());
    solo.sides.b.units = [solo.sides.b.units[0] as Unit];
    foe(solo, 0).hp = 5;
    const won = applyAction(db, solo, { type: 'potion', index: 0, target: foe(solo, 0).id });
    expect(won.state.winner).toBe('a');
    expect(won.events.some((e) => e.type === 'gameOver')).toBe(true);
  });

  it('names the potion, so a shifted belt never drinks the wrong one', () => {
    const s = start(); // belt: fire-flask, guard-draught
    const r = applyAction(db, s, { type: 'potion', index: 0, potion: 'guard-draught' });
    expect(r.state.sides.a.potions).toEqual(['fire-flask']);
    expect(hero(r.state).barrier).toBe(12);
    expect(() => applyAction(db, s, { type: 'potion', index: 0, potion: 'mana-vial' })).toThrow();
  });
});

describe('the damage a card in hand shows (previewCardDamage)', () => {
  it('counts Might, a target’s Exposed, and gives a range over enemies for a card that hits them all', () => {
    const c = clone(start(['slime', 'cultist'], ['strike', 'cleave']));
    const strikeAt = (t: string | null) => previewCardDamage(db, c, 't0', t).get(0);
    expect(strikeAt(null)).toMatchObject({ lo: 6, hi: 6, printed: 6 });
    hero(c).statuses.might = 2;
    expect(strikeAt(null)).toMatchObject({ lo: 8, hi: 8 });
    // aimed at an Exposed enemy: half again
    foe(c, 1).statuses.exposed = 1;
    expect(strikeAt(foe(c, 1).id)).toMatchObject({ lo: 12, hi: 12 });
    // not yet aimed: from the plain enemy to the Exposed one
    expect(strikeAt(null)).toMatchObject({ lo: 8, hi: 12 });
    expect(previewCardDamage(db, c, 't1').get(0)).toMatchObject({ lo: 6, hi: 9, printed: 4 });
    // it only reads the state
    const before = hashState(c);
    previewCardDamage(db, c, 't0', foe(c, 1).id);
    expect(hashState(c)).toBe(before);
  });

  it('shows the number the card would really deal: the preview matches playing it', () => {
    const c = clone(start(['cultist'], ['strike']));
    hero(c).statuses.might = 3;
    foe(c).statuses.exposed = 1;
    const shown = previewCardDamage(db, c, 't0', foe(c).id).get(0)!;
    const hp = foe(c).hp + foe(c).barrier;
    const after = play(c, 't0', foe(c).id).state;
    const f = after.sides.b.units[0]!;
    expect(shown.lo).toBe(hp - f.hp - f.barrier);
  });
});

describe('live damage in card text', () => {
  it('a sharpened weapon shows its sharpened total in place of the printed number and the formula', () => {
    const weapon = {
      id: 'w',
      name: 'W',
      kind: 'attack',
      cost: 1,
      target: 'foe',
      effects: [{ op: 'damage', amount: 9, to: 'target', scale: { by: 'bonus' } }],
    } as unknown as CardDef;
    const live = new Map([[0, { lo: 14, hi: 14, printed: 9, calc: false }]]);
    expect(cardText(db, weapon)).toBe('Deal 9 (+1 per point of sharpening) damage.');
    expect(cardText(db, weapon, live)).toBe('Deal [[live:up:14]] damage.');
    // lower than printed (Faltering), and a range over several enemies
    expect(cardText(db, weapon, new Map([[0, { lo: 6, hi: 6, printed: 9, calc: false }]]))).toBe(
      'Deal [[live:down:6]] damage.',
    );
    expect(cardText(db, weapon, new Map([[0, { lo: 9, hi: 13, printed: 9, calc: false }]]))).toBe(
      'Deal [[live:up:9-13]] damage.',
    );
  });
});

describe('the damage preview, as the card will see it', () => {
  it('a card that counts your hand does not count itself, and one that counts Mana counts it after paying', () => {
    const base = {
      kind: 'attack',
      cost: 1,
      target: 'foe',
    } as const;
    const tdb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        handy: {
          ...base,
          id: 'handy',
          name: 'Handy',
          effects: [{ op: 'damage', amount: 0, to: 'target', scale: { by: 'hand' } }],
        } as unknown as CardDef,
        manaish: {
          ...base,
          id: 'manaish',
          name: 'Manaish',
          effects: [{ op: 'damage', amount: 0, to: 'target', scale: { by: 'mana' } }],
        } as unknown as CardDef,
      },
    };
    const c = clone(start(['cultist'], ['handy', 'manaish', 'strike', 'strike'], {}, 't'));
    c.sides.a.mana = 3;
    // the hand holds 4: the other 3 count
    expect(previewCardDamage(tdb, c, 't0').get(0)?.lo).toBe(3);
    // 3 Mana, 1 paid: 2
    expect(previewCardDamage(tdb, c, 't1').get(0)?.lo).toBe(2);
    // and they agree with playing it
    const hp = foe(c).hp;
    const after = applyAction(tdb, c, { type: 'play', card: 't0', target: foe(c).id }).state;
    expect(hp - after.sides.b.units[0]!.hp).toBe(3);
  });

  it('shows nothing it cannot know: a damage effect after another effect keeps the printed number', () => {
    const tdb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        braced: {
          id: 'braced',
          name: 'Braced',
          kind: 'attack',
          cost: 1,
          target: 'foe',
          effects: [
            { op: 'barrier', amount: 10, to: 'self' },
            { op: 'damage', amount: 0, to: 'target', scale: { by: 'barrier' } },
          ],
        } as unknown as CardDef,
      },
    };
    const c = clone(start(['cultist'], ['braced']));
    expect(previewCardDamage(tdb, c, 't0').size).toBe(0);
  });
});

describe('Lifesteal, companions that grow, and Might shared with the pack (DECISIONS #285)', () => {
  const card = (id: string, effects: unknown[], target = 'none'): CardDef =>
    ({ id, name: id, kind: 'attack', cost: 0, target, effects }) as unknown as CardDef;
  const tdb: CombatDb = {
    ...db,
    cards: {
      ...db.cards,
      bite: card('bite', [{ op: 'damage', amount: 10, to: 'target', lifesteal: 50 }], 'foe'),
      grow: card('grow', [{ op: 'growHp', amount: 5, to: 'allFriends' }]),
      roar: card('roar', [{ op: 'status', status: 'might', amount: 2, to: 'self' }]),
    },
    heroes: {
      ...db.heroes,
      knight: {
        ...db.heroes.knight!,
        trait: { name: 'Pack', text: 'shares Might', shareMight: 1 },
      },
    },
  };
  const at = (cards: string[]) => {
    const c = clone(start(['cultist'], cards));
    hero(c).hp = 40;
    return c;
  };

  it('Lifesteal heals a share of the HP the attack took off, and nothing for what Barrier stopped', () => {
    const c = at(['bite']);
    const after = applyAction(tdb, c, { type: 'play', card: 't0', target: foe(c).id }).state;
    expect(hero(after).hp).toBe(40 + 5);
    const shielded = at(['bite']);
    foe(shielded).barrier = 6;
    const after2 = applyAction(tdb, shielded, {
      type: 'play',
      card: 't0',
      target: foe(shielded).id,
    }).state;
    // 10 damage, 6 into Barrier, 4 HP taken: heals 2
    expect(hero(after2).hp).toBe(40 + 2);
  });

  it('a companion gains max HP and heals as much; the hero never does', () => {
    let c = at(['call-drone', 'grow']);
    c = applyAction(tdb, c, { type: 'play', card: 't0' }).state;
    const drone = c.sides.a.units.find((u) => u.kind === 'ally')!;
    const max = drone.maxHp;
    c = applyAction(tdb, c, { type: 'play', card: 't1' }).state;
    const grown = c.sides.a.units.find((u) => u.id === drone.id)!;
    expect(grown.maxHp).toBe(max + 5);
    expect(grown.hp).toBe(drone.hp + 5);
    expect(hero(c).maxHp).toBe(hero(at([])).maxHp);
  });

  it('"Might to all friends" on a side that shares it reaches a companion once, not twice', () => {
    const t2: CombatDb = {
      ...tdb,
      cards: {
        ...tdb.cards,
        rally: card('rally', [{ op: 'status', status: 'might', amount: 2, to: 'allFriends' }]),
      },
    };
    let c = at(['call-drone', 'rally']);
    c = applyAction(t2, c, { type: 'play', card: 't0' }).state;
    c = applyAction(t2, c, { type: 'play', card: 't1' }).state;
    expect(c.sides.a.units.find((u) => u.kind === 'ally')!.statuses.might).toBe(2);
    expect(hero(c).statuses.might).toBe(2);
  });

  it('a Lifesteal hit that wins the fight still heals', () => {
    const c = at(['bite']);
    foe(c).hp = 4;
    const after = applyAction(tdb, c, { type: 'play', card: 't0', target: foe(c).id }).state;
    expect(after.winner).toBe('a');
    expect(hero(after).hp).toBe(40 + 2);
  });

  it('a hero who shares Might passes it to the pack, and a new companion arrives with it', () => {
    let c = at(['call-drone', 'roar', 'call-drone']);
    c = applyAction(tdb, c, { type: 'play', card: 't0' }).state;
    c = applyAction(tdb, c, { type: 'play', card: 't1' }).state;
    const might = hero(c).statuses.might ?? 0;
    const first = c.sides.a.units.find((u) => u.kind === 'ally')!;
    expect(first.statuses.might ?? 0).toBe(2);
    c = applyAction(tdb, c, { type: 'play', card: 't2' }).state;
    const second = c.sides.a.units.filter((u) => u.kind === 'ally')[1]!;
    expect(second.statuses.might ?? 0).toBe(might);
  });

  it('a half share passes on half the Might, rounded down, step by step (DECISIONS #298)', () => {
    const half: CombatDb = {
      ...tdb,
      cards: {
        ...tdb.cards,
        flex: card('flex', [{ op: 'status', status: 'might', amount: 1, to: 'self' }]),
        drain: card('drain', [{ op: 'status', status: 'might', amount: -3, to: 'self' }]),
      },
      heroes: {
        ...tdb.heroes,
        knight: {
          ...tdb.heroes.knight!,
          trait: { name: 'Pack', text: 'half', shareMight: 0.5 },
        },
      },
    };
    let c = at(['call-drone', 'flex', 'flex', 'flex', 'call-drone', 'drain']);
    const pet = (): number => c.sides.a.units.find((u) => u.kind === 'ally')!.statuses.might ?? 0;
    c = applyAction(half, c, { type: 'play', card: 't0' }).state;
    c = applyAction(half, c, { type: 'play', card: 't1' }).state;
    expect(hero(c).statuses.might).toBe(1);
    expect(pet()).toBe(0);
    c = applyAction(half, c, { type: 'play', card: 't2' }).state;
    expect(pet()).toBe(1);
    c = applyAction(half, c, { type: 'play', card: 't3' }).state;
    expect(pet()).toBe(1);
    // a new companion arrives with half of the hero's 3, rounded down
    c = applyAction(half, c, { type: 'play', card: 't4' }).state;
    expect(c.sides.a.units.filter((u) => u.kind === 'ally')[1]!.statuses.might ?? 0).toBe(1);
    // 3 -> 0: the share goes from 1 to 0
    c = applyAction(half, c, { type: 'play', card: 't5' }).state;
    expect(pet()).toBe(0);
  });

  it('at a half share, "Might to all friends" still gives every companion exactly that much', () => {
    const half: CombatDb = {
      ...tdb,
      cards: {
        ...tdb.cards,
        rally: card('rally', [{ op: 'status', status: 'might', amount: 1, to: 'allFriends' }]),
      },
      heroes: {
        ...tdb.heroes,
        knight: { ...tdb.heroes.knight!, trait: { name: 'Pack', text: 'half', shareMight: 0.5 } },
      },
    };
    let c = at(['call-drone', 'rally', 'rally']);
    const pet = (): number => c.sides.a.units.find((u) => u.kind === 'ally')!.statuses.might ?? 0;
    c = applyAction(half, c, { type: 'play', card: 't0' }).state;
    // hero 0 -> 1 passes nothing on, so the card gives the companion its 1
    c = applyAction(half, c, { type: 'play', card: 't1' }).state;
    expect(hero(c).statuses.might).toBe(1);
    expect(pet()).toBe(1);
    // hero 1 -> 2 passes 1 on: the companion gets 1 in all, not 2
    c = applyAction(half, c, { type: 'play', card: 't2' }).state;
    expect(hero(c).statuses.might).toBe(2);
    expect(pet()).toBe(2);
  });
});

describe('Overflow: what is left of a hit that kills a companion carries through (DECISIONS #321)', () => {
  /** an enemy's one attack, with a companion of the given HP and Barrier standing in front: the HP the hero loses */
  const heroLoss = (
    hp: number,
    barrier: number,
  ): { loss: number; plain: number; companionDead: boolean } => {
    const plainRun = start(['slime'], ['call-drone']);
    const plain = 60 - hero(end(clone(plainRun)).state).hp;
    let s = clone(start(['slime'], ['call-drone']));
    s = applyAction(db, s, {
      type: 'play',
      card: s.sides.a.hand.find((c) => c.card === 'call-drone')!.id,
    }).state;
    const drone = s.sides.a.units.find((u) => u.kind === 'ally')!;
    drone.hp = hp;
    drone.maxHp = Math.max(drone.maxHp, hp);
    drone.barrier = barrier;
    s.sides.a.units.find((u) => u.kind === 'hero')!.barrier = 0;
    const after = end(s).state;
    return {
      loss: 60 - hero(after).hp,
      plain,
      companionDead: !after.sides.a.units.some((u) => u.kind === 'ally' && u.hp > 0),
    };
  };

  it('a frail companion lets half of the rest of the hit through; a sturdy one lets none', () => {
    const { plain } = heroLoss(1000, 0);
    expect(plain).toBeGreaterThan(3);
    const frail = heroLoss(1, 0);
    expect(frail.companionDead).toBe(true);
    expect(frail.loss).toBe(Math.floor(((plain - 1) * OVERFLOW_PCT) / 100));
    // its Barrier soaks first
    const shielded = heroLoss(1, 2);
    expect(shielded.loss).toBe(Math.floor(((plain - 3) * OVERFLOW_PCT) / 100));
    // a companion that survives, or dies with nothing left over, lets nothing through
    expect(heroLoss(1000, 0).loss).toBe(0);
    expect(heroLoss(plain, 0).loss).toBe(0);
  });
});

describe('Overflow in the Arena works both ways (DECISIONS #321)', () => {
  it('an attack that kills a companion of the other player carries through to that hero', () => {
    const { state } = createCombat(db, {
      seed: 'arena-overflow',
      a: { hero: 'knight', deck: SAMPLE_DECK },
      b: { hero: 'knight', deck: SAMPLE_DECK },
    });
    expect(state.mode).toBe('pvp');
    const c = withHand(state, ['strike']);
    const theirHero = heroOf(c.sides.b) as Unit;
    theirHero.barrier = 0;
    c.sides.b.units.unshift({
      ...clone(theirHero),
      id: 'their-ally',
      def: 'drone',
      name: 'Drone',
      kind: 'ally' as const,
      hp: 1,
      maxHp: 1,
      barrier: 0,
      statuses: {},
    });
    const before = theirHero.hp;
    const plainDamage = 6;
    const after = play(c, 't0', 'their-ally').state;
    const hero2 = heroOf(after.sides.b) as Unit;
    expect(after.sides.b.units.some((u) => u.id === 'their-ally')).toBe(false);
    expect(before - hero2.hp).toBe(plainDamage - 1);
  });
});

describe('a Riftwalker with a smaller pack (DECISIONS #315)', () => {
  it('can have only maxAllies companions; a summon past it asks for one to be released', () => {
    const tdb: CombatDb = {
      ...db,
      heroes: { ...db.heroes, knight: { ...db.heroes.knight!, maxAllies: 2 } },
    };
    let s = clone(start(['slime'], ['call-drone', 'call-drone', 'call-drone', 'strike', 'strike']));
    const calls = s.sides.a.hand.filter((c) => c.card === 'call-drone');
    s.sides.a.mana = 10;
    s = applyAction(tdb, s, { type: 'play', card: calls[0]!.id }).state;
    s = applyAction(tdb, s, { type: 'play', card: calls[1]!.id }).state;
    expect(s.sides.a.units.filter((u) => u.kind === 'ally')).toHaveLength(2);
    const plays = legalActions(tdb, s).filter((x) => x.type === 'play' && x.card === calls[2]!.id);
    expect(plays.length).toBeGreaterThan(0);
    expect(plays.every((x) => x.type === 'play' && x.release !== undefined)).toBe(true);
  });
});

describe('a Stun from a Trap that springs as the enemy turn begins (DECISIONS #314)', () => {
  it('lasts exactly as many enemy turns as it says', () => {
    const tdb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        ambush: {
          id: 'ambush',
          name: 'Ambush',
          kind: 'snare',
          cost: 0,
          target: 'none',
          trigger: { on: 'foeTurn' },
          effects: [{ op: 'status', status: 'stunned', amount: 2, to: 'allFoes' }],
        } as unknown as CardDef,
      },
    };
    let s = clone(start(['slime'], ['ambush', 'strike', 'strike', 'strike', 'strike']));
    s = applyAction(tdb, s, {
      type: 'play',
      card: s.sides.a.hand.find((c) => c.card === 'ambush')!.id,
    }).state;
    s = applyAction(tdb, s, { type: 'endTurn' }).state;
    expect(foe(s).statuses.stunned).toBe(1);
    s = applyAction(tdb, s, { type: 'endTurn' }).state;
    expect(foe(s).statuses.stunned ?? 0).toBe(0);
  });
});

describe('an Aura that answers the deck being reshuffled (DECISIONS #299)', () => {
  it('fires each time the discard pile becomes the draw pile, and not before', () => {
    const tdb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        echo: {
          id: 'echo',
          name: 'Echo',
          kind: 'power',
          cost: 0,
          target: 'none',
          effects: [
            {
              op: 'power',
              when: 'shuffle',
              ops: [{ op: 'status', status: 'might', amount: 1, to: 'self' }],
            },
          ],
        } as unknown as CardDef,
      },
    };
    let c = clone(
      start(['cultist'], ['echo', 'strike', 'strike', 'strike', 'strike', 'strike', 'strike']),
    );
    const echo =
      c.sides.a.hand.find((x) => x.card === 'echo') ??
      c.sides.a.draw.find((x) => x.card === 'echo');
    // put the Aura in hand and play it, then empty the draw pile into the discard and draw once
    c.sides.a.hand = [echo!, ...c.sides.a.hand.filter((x) => x !== echo)];
    c.sides.a.draw = c.sides.a.draw.filter((x) => x !== echo);
    c = applyAction(tdb, c, { type: 'play', card: echo!.id }).state;
    expect(hero(c).statuses.might ?? 0).toBe(0);
    c.sides.a.discard = [...c.sides.a.discard, ...c.sides.a.draw];
    c.sides.a.draw = [];
    c = applyAction(tdb, c, { type: 'endTurn' }).state;
    while (!c.winner && c.active !== 'a') c = applyAction(tdb, c, { type: 'endTurn' }).state;
    expect(hero(c).statuses.might ?? 0).toBe(1);
  });
});

describe('an Aura that answers Arcana being spent (DECISIONS #288)', () => {
  it('fires when a card is paid for in Arcana, and not for a card that costs none', () => {
    const tdb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        ward: {
          id: 'ward',
          name: 'Ward',
          kind: 'power',
          cost: 0,
          target: 'none',
          effects: [
            { op: 'power', when: 'arcana', ops: [{ op: 'barrier', amount: 4, to: 'self' }] },
          ],
        } as unknown as CardDef,
        bolt: {
          id: 'bolt',
          name: 'Bolt',
          kind: 'attack',
          cost: 0,
          starCost: 2,
          target: 'foe',
          effects: [{ op: 'damage', amount: 1, to: 'target' }],
        } as unknown as CardDef,
      },
    };
    let c = clone(start(['cultist'], ['ward', 'bolt', 'strike']));
    c.sides.a.stars = 5;
    hero(c).barrier = 0;
    c = applyAction(tdb, c, { type: 'play', card: 't0' }).state;
    c = applyAction(tdb, c, { type: 'play', card: 't2', target: foe(c).id }).state;
    expect(hero(c).barrier).toBe(0);
    c = applyAction(tdb, c, { type: 'play', card: 't1', target: foe(c).id }).state;
    expect(c.sides.a.stars).toBe(3);
    expect(hero(c).barrier).toBe(4);
  });
});

describe('events carry what the battle log needs', () => {
  it('an enemy attack says its damage per hit, and every hit and heal says the HP after', () => {
    let c = clone(start(['cultist'], ['strike', 'strike', 'strike', 'strike', 'strike']));
    // (Vigor adds to the next attack: the logged number counts it)
    foe(c).statuses.vigor = 3;
    let seen = false;
    for (let turn = 0; turn < 4 && !seen && !c.winner; turn++) {
      const out = applyAction(db, c, { type: 'endTurn' });
      c = out.state;
      for (const e of out.events)
        if (e.type === 'damage' || e.type === 'heal') expect(typeof e.hp).toBe('number');
      const attack = out.events.find((e) => e.type === 'act' && e.damage !== undefined);
      if (attack?.type !== 'act') continue;
      const hit = out.events.find((e) => e.type === 'damage' && e.source === attack.unit);
      expect(hit?.type === 'damage' ? hit.amount : null).toBe(attack.damage);
      seen = true;
    }
    expect(seen).toBe(true);
  });
});

describe('more maximum Mana starts next turn (DECISIONS #302)', () => {
  it('pays nothing on the turn it is played, then one more every turn', () => {
    const tdb: CombatDb = {
      ...db,
      cards: {
        ...db.cards,
        pockets: {
          id: 'pockets',
          name: 'Pockets',
          kind: 'power',
          cost: 0,
          target: 'none',
          effects: [{ op: 'maxMana', amount: 1 }],
        } as unknown as CardDef,
      },
    };
    let c = clone(start(['cultist'], ['pockets', 'strike', 'strike', 'strike', 'strike']));
    const pockets = c.sides.a.hand.find((x) => x.card === 'pockets')!;
    const mana = c.sides.a.mana;
    const max = c.sides.a.maxMana;
    c = applyAction(tdb, c, { type: 'play', card: pockets.id }).state;
    expect(c.sides.a.mana).toBe(mana);
    expect(c.sides.a.maxMana).toBe(max + 1);
    c = applyAction(tdb, c, { type: 'endTurn' }).state;
    while (!c.winner && c.active !== 'a') c = applyAction(tdb, c, { type: 'endTurn' }).state;
    expect(c.sides.a.mana).toBe(max + 1);
  });
});
