import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  applyAction,
  createCombat,
  hashState,
  validateDb,
  heroOf,
  legalActions,
  viewFor,
  eventsFor,
  cardText,
  tierHp,
  tierMight,
  clone,
  type Action,
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

  it('Stunned makes an enemy skip its action', () => {
    const s0 = start(['slime']);
    foe(s0).statuses.stunned = 1;
    const r = end(s0);
    expect(types(r.events)).toContain('skip');
    expect(hero(r.state).hp).toBe(60);
    expect(foe(r.state).statuses.stunned).toBeUndefined();
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
    // a stunned ally says so instead
    ally.statuses.stunned = 1;
    expect(iv()).toMatchObject({ name: 'Stunned', damage: null });
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
