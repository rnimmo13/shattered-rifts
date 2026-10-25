import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '@sr/combat';
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
      'Your Trap springs: Strike',
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
