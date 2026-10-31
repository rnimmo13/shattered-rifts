import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatEvent } from '@sr/combat';
import { COMBAT_DB as db } from '@sr/content/v2';
import { Namer, createDescriber, type LogContext } from './logLines';

const names: Record<string, { name: string; side: 'a' | 'b' }> = {
  hero: { name: 'You', side: 'a' },
  sq: { name: 'Gilded Squire', side: 'b' },
};
const ctx: LogContext = {
  db,
  me: 'a',
  nameOf: (id) => names[id]?.name ?? 'Someone',
  sideOf: (id) => names[id]?.side ?? null,
  who: (side) => (side === 'a' ? 'You' : 'Enemy'),
};
const say = (e: CombatEvent) => createDescriber(ctx)(e)?.text ?? null;
/** the lines for a run of events, in order, with one describer remembering as it goes */
const story = (events: CombatEvent[], c: LogContext = ctx): string[] => {
  const d = createDescriber(c);
  return events.flatMap((e) => d(e)?.text ?? []);
};

describe('the battle log', () => {
  it('tells who played what, and what it did', () => {
    expect(say({ type: 'play', side: 'a', card: 'c1', def: 'strike', target: 'sq' })).toBe(
      'You play Strike on Gilded Squire',
    );
    expect(
      say({
        type: 'damage',
        source: 'hero',
        target: 'sq',
        amount: 8,
        blocked: 2,
        lost: 6,
        shielded: false,
        kind: 'attack',
      }),
    ).toBe('You hit Gilded Squire: 6 damage (2 blocked)');
    expect(
      say({
        type: 'damage',
        source: 'sq',
        target: 'hero',
        amount: 5,
        blocked: 0,
        lost: 5,
        shielded: false,
        kind: 'attack',
      }),
    ).toBe('Gilded Squire hits you: 5 damage');
  });

  it('agrees the verb with who is named', () => {
    expect(say({ type: 'barrier', target: 'hero', amount: 5, total: 5 })).toBe(
      'You gain 5 Barrier',
    );
    expect(say({ type: 'barrier', target: 'sq', amount: 5, total: 5 })).toBe(
      'Gilded Squire gains 5 Barrier',
    );
    expect(say({ type: 'died', unit: 'hero' })).toBe('You fall');
    expect(say({ type: 'died', unit: 'sq', released: true })).toBe('Gilded Squire is released');
    expect(say({ type: 'stance', unit: 'hero', stance: 'radiant' })).toBe('You enter Radiant');
  });

  it('leaves the noise out', () => {
    expect(say({ type: 'mana', side: 'a', mana: 2 })).toBeNull();
    expect(say({ type: 'shuffle', side: 'a' })).toBeNull();
    expect(say({ type: 'intent', unit: 'sq', move: 'slash', target: null })).toBeNull();
  });

  it('marks the turns and the end', () => {
    expect(say({ type: 'turnStart', side: 'a', turn: 3 })).toBe('Your turn');
    expect(say({ type: 'turnStart', side: 'b', turn: 4 })).toBe("Enemy's turn");
    expect(say({ type: 'gameOver', winner: 'a' })).toBe('Victory');
  });

  it('says what a Trap did, and that Thorns answered an attack', () => {
    const hit = (
      source: string,
      target: string,
      kind: 'attack' | 'direct',
      lost: number,
    ): CombatEvent => ({
      type: 'damage',
      source,
      target,
      amount: lost,
      blocked: 0,
      lost,
      shielded: false,
      kind,
    });
    expect(
      story([
        { type: 'snareSet', side: 'a', snare: 's1' },
        { type: 'act', unit: 'sq', move: 'slash' },
        { type: 'snareSprung', side: 'a', snare: 's1', card: 'strike' },
        hit('hero', 'sq', 'direct', 8),
      ]),
    ).toEqual([
      'You set a Trap',
      'Gilded Squire uses Slash',
      'Your Trap triggered: Strike',
      'Strike hits Gilded Squire: 8 damage',
    ]);
    expect(story([hit('sq', 'hero', 'attack', 5), hit('hero', 'sq', 'direct', 3)])).toEqual([
      'Gilded Squire hits you: 5 damage',
      'Thorns hurt Gilded Squire: 3 damage',
    ]);
    // an attack of your own is not Thorns
    expect(story([hit('hero', 'sq', 'direct', 3)])).toEqual(['You hit Gilded Squire: 3 damage']);
  });

  it('numbers units that share a name', () => {
    const namer = new Namer('a', null);
    namer.register('h', 'You', 'a');
    namer.register('x1', 'Gilded Squire', 'b');
    expect(namer.nameOf('x1')).toBe('Gilded Squire');
    namer.register('x2', 'Gilded Squire', 'b');
    namer.register('d', 'Drone', 'a');
    expect(namer.nameOf('x1')).toBe('Gilded Squire 1');
    expect(namer.nameOf('x2')).toBe('Gilded Squire 2');
    expect(namer.nameOf('d')).toBe('Drone');
    expect(namer.nameOf('nobody')).toBe('Someone');
  });
});

describe('the battle log shows how hard a move hits and how HP moved', () => {
  const withDefs: LogContext = { ...ctx, defOf: (id) => (id === 'sq' ? 'squire' : null) };
  it('names an enemy move by its name with its damage: "Slash (9)", "(4×3)" for several hits', () => {
    const d = createDescriber(withDefs);
    expect(d({ type: 'act', unit: 'sq', move: 'slash', damage: 9, hits: 1 })?.text).toBe(
      'Gilded Squire uses Slash (9)',
    );
    expect(d({ type: 'act', unit: 'sq', move: 'slash', damage: 4, hits: 3 })?.text).toBe(
      'Gilded Squire uses Slash (4×3)',
    );
    // a move with no attack says only its name
    expect(d({ type: 'act', unit: 'sq', move: 'guard' })?.text).toBe(
      'Gilded Squire uses Raise Shield',
    );
  });
  it('a hit and a heal say the HP before and after', () => {
    expect(
      say({
        type: 'damage',
        source: 'sq',
        target: 'hero',
        amount: 9,
        blocked: 3,
        lost: 6,
        shielded: false,
        kind: 'attack',
        hp: 34,
      }),
    ).toBe('Gilded Squire hits you: 6 damage (3 blocked) (HP 40 → 34)');
    expect(say({ type: 'heal', target: 'hero', amount: 5, hp: 39 })).toBe(
      'You heal 5 (HP 34 → 39)',
    );
    // nothing lost: no HP note
    expect(
      say({
        type: 'damage',
        source: 'sq',
        target: 'hero',
        amount: 4,
        blocked: 4,
        lost: 0,
        shielded: false,
        kind: 'attack',
        hp: 34,
      }),
    ).toBe('Gilded Squire hits you: no damage (4 blocked)');
  });
});

describe('where cards went, in the log (DECISIONS #476)', () => {
  const inst = { side: 'a' as const, card: 'c1', def: 'strike' };
  it('names a discard from an effect, a Defer and Premeditate', () => {
    expect(say({ type: 'discard', ...inst })).toBe('You discard Strike');
    expect(say({ type: 'discard', ...inst, defer: true })).toBe('You defer Strike: back next turn, 1 cheaper');
    expect(say({ type: 'premeditate', ...inst })).toBe('Premeditate: Strike comes back next turn at 0 Mana');
    expect(say({ type: 'exhaust', ...inst })).toBe('You consume Strike');
  });
  it('leaves out the end-of-turn sweep and an Aura leaving the deck', () => {
    expect(say({ type: 'discard', ...inst, routine: true })).toBeNull();
    expect(say({ type: 'exhaust', ...inst, routine: true })).toBeNull();
  });
  it('never names a card the opponent is hiding', () => {
    const foe = { side: 'b' as const, card: 'c2', def: '' };
    expect(say({ type: 'discard', ...foe })).toBe('Enemy discards a card');
    expect(say({ type: 'premeditate', ...foe })).toBeNull();
    expect(say({ type: 'addCard', ...foe, to: 'hand' })).toBeNull();
    expect(say({ type: 'draw', ...foe })).toBeNull();
    expect(say({ type: 'burn', ...foe })).toBeNull();
    expect(say({ type: 'transform', ...foe })).toBeNull();
  });
  it('tells a draw or Mana from an effect, not the start of the turn', () => {
    const turn: CombatEvent = { type: 'turnStart', side: 'a', turn: 1 };
    const draw: CombatEvent = { type: 'draw', ...inst };
    const mana = (n: number): CombatEvent => ({ type: 'mana', side: 'a', mana: n });
    const play: CombatEvent = { type: 'play', ...inst, target: null };
    expect(story([turn, mana(3), draw, play, mana(2), draw, mana(4)])).toEqual([
      'Your turn',
      'You play Strike',
      'You draw Strike',
      'You gain 2 Mana',
    ]);
  });
  it('tells Reserves gained and spent, once each', () => {
    const r = (n: number): CombatEvent => ({ type: 'reserves', side: 'a', reserves: n, max: 3 });
    expect(story([r(2), r(2), r(1)])).toEqual(['You gain 2 Reserves (now 2)', 'You spend 1 Reserve (now 1)']);
  });
});

describe('the log of a real discard', () => {
  const realEvents = (): CombatEvent[] => {
    const { state } = createCombat(db, {
      seed: 'log',
      a: { hero: 'assassin', deck: Array<string>(10).fill('strike') },
      b: { enemies: ['squire'] },
    });
    const s = clone(state);
    s.sides.a.hand = [
      { id: 'T0', card: 'duck-and-weave' },
      { id: 'T1', card: 'glancing-knives' },
      { id: 'T2', card: 'strike' },
    ];
    s.sides.a.mana = 3;
    const play = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'T0')!;
    const first = applyAction(db, s, play);
    const second = applyAction(db, first.state, { type: 'pick', cards: ['T1'] });
    const third = applyAction(db, second.state, { type: 'endTurn' });
    return [...first.events, ...second.events, ...third.events];
  };
  const quiet: LogContext = { ...ctx, nameOf: () => 'Someone' };

  it('names the card, says it will come back, and leaves out the end-of-turn sweep', () => {
    const lines = story(realEvents(), quiet);
    expect(lines).toContain('You discard Glancing Knives');
    expect(lines).toContain('Premeditate: Glancing Knives comes back next turn at 0 Mana');
    expect(lines).toContain('Glancing Knives goes to your hand');
    // (the Strike left in hand is swept at the end of the turn, with no line)
    expect(lines).not.toContain('You discard Strike');
  });

  it('never names the hidden cards of the other side, or of the seat being watched', () => {
    const other = story(realEvents(), {
      ...quiet,
      me: 'b',
      who: (side) => (side === 'b' ? 'You' : 'Enemy'),
    });
    expect(other).toContain('Enemy discards a card');
    expect(other.join(' ')).not.toContain('Glancing Knives');
    const watching = story(realEvents(), { ...quiet, blind: true });
    expect(watching.join(' ')).not.toContain('Glancing Knives');
  });

  it('a change to a card is not called a new card, and a Foresee gives no count', () => {
    const inst = { side: 'a' as const, card: 'c1', def: 'strike' };
    expect(say({ type: 'transform', ...inst })).toBeNull();
    expect(say({ type: 'transform', ...inst, changed: true })).toBe('A card becomes Strike');
    expect(say({ type: 'scry', side: 'a', cards: ['x'] })).toBe('You foresee');
  });

  it('a card consuming itself as it is played is no second line', () => {
    const inst = { side: 'a' as const, card: 'c1', def: 'strike' };
    expect(story([{ type: 'play', ...inst, target: null }, { type: 'exhaust', ...inst }])).toEqual([
      'You play Strike',
    ]);
  });
});