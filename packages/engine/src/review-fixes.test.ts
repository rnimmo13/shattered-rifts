// Regression tests for the M1 review findings (reviews/m1-review.md).
import { describe, expect, it } from 'vitest';
import { createEngine } from './engine';
import { FIXTURE_DB, scenario } from './testkit';
import { eventsFor, viewFor } from './view';
import { RulesError } from './util';
import type { CardDb } from './types';

const DB: CardDb = {
  ...FIXTURE_DB,
  'TST-LIFEPIERCE': {
    id: 'TST-LIFEPIERCE',
    name: 'TST-LIFEPIERCE',
    realm: 'neutral',
    type: 'unit',
    rarity: 'common',
    cost: 3,
    power: 3,
    guard: 3,
    keywords: ['lifebind', 'pierce'],
    abilities: [],
    text: '',
    collectible: true,
  },
  'TST-GROW': {
    id: 'TST-GROW',
    name: 'TST-GROW',
    realm: 'neutral',
    type: 'spell',
    rarity: 'common',
    cost: 1,
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          { op: 'buff', target: { pick: 'chosen' }, power: 2, guard: 3, duration: 'permanent' },
        ],
      },
    ],
    text: '',
    collectible: true,
  },
};

describe('M1 review fixes', () => {
  it('H1: a face-down unit never leaks its stats through events', () => {
    const t = scenario(DB).p1.hand('TST-GROW').p2.ambush('TST-AMBUSH');
    t.p1.play('TST-GROW', { targets: ['p2:TST-AMBUSH'] }).resolve();
    expect(t.events.some((e) => e.type === 'statsChanged')).toBe(false);
    const v = viewFor(t.state, 0, () => ({ power: 99, guard: 99, maxGuard: 99, keywords: [] }));
    expect(v.stats[t.id('p2:TST-AMBUSH')]).toBeUndefined();
  });

  it('H2: the viewer sees the cards their own Scry prompt is about', () => {
    const t = scenario(DB).p1.hand('TST-SCRY').deck('TST-2-2', 'TST-3-3');
    t.p1.play('TST-SCRY').resolve();
    const v = viewFor(t.state, 0);
    for (const id of t.state.pending?.kind === 'scry' ? t.state.pending.cards : []) {
      expect(v.cards[id]?.cardId).toMatch(/^TST-/);
    }
    expect(viewFor(t.state, 1).cards[t.id('p1:TST-2-2')]).toBeUndefined();
  });

  it('M2: no action is accepted after the game is over (not even concede)', () => {
    const t = scenario(DB).p2.essence(2).p1.board('TST-3-3');
    t.p1.attack('TST-3-3', 'face').resolve();
    expect(t.state.winner).toBe(0);
    expect(() => t.act({ type: 'concede', player: 0 })).toThrow(RulesError);
  });

  it('M3: an Echoed unit that leaves the field for the hand goes Beyond instead', () => {
    const t = scenario(DB)
      .p1.voidCards('TST-ECHO')
      .hand('TST-RECALL')
      .mana(5, 5)
      .deck('TST-FILLER');
    t.p1.play('TST-ECHO', { echo: true }).resolve();
    t.p1.play('TST-RECALL', { targets: ['p1:TST-ECHO'] }).resolve();
    expect(t.beyond(1)).toEqual(['TST-ECHO']);
    expect(t.handCards(1)).toEqual(['TST-FILLER']);
  });

  it('M4: views carry layered stats for visible units (auras included)', () => {
    const engine = createEngine(DB);
    const t = scenario(DB).p1.board('TST-2-2').relic('TST-AURA');
    const v = engine.viewFor(t.state, 1);
    expect(v.stats[t.id('p1:TST-2-2')]).toMatchObject({ power: 3, guard: 2 });
  });

  it('L1: Lifebind + Pierce heals once for the full hit, not again for the carry-over', () => {
    const t = scenario(DB).p1.board('TST-LIFEPIERCE').essence(20).p2.board('TST-FILLER');
    t.p1.attack('TST-LIFEPIERCE', 'p2:TST-FILLER').resolve();
    expect(t.essenceOf(2)).toBe(28);
    expect(t.essenceOf(1)).toBe(23);
  });

  it('L3: trapSet keeps the slot id for the opponent but hides the card', () => {
    const t = scenario(DB).p1.hand('TST-PIT');
    t.p1.setTrap('TST-PIT');
    const ev = eventsFor(t.lastEvents, 1).find((e) => e.type === 'trapSet');
    expect(ev).toMatchObject({ id: t.id('p1:TST-PIT'), cardId: '?' });
  });

  it('L9: Overclock is only offered when it has something to do', () => {
    const DB2: CardDb = {
      ...DB,
      'TST-OC-TARGET': {
        ...(DB['TST-OVERCLOCK'] as NonNullable<CardDb[string]>),
        id: 'TST-OC-TARGET',
        abilities: [
          {
            kind: 'onSummon',
            overclock: true,
            effects: [
              {
                op: 'buff',
                target: { pick: 'chosen', side: 'friendly', filter: { tribe: 'Construct' } },
                power: 2,
                duration: 'permanent',
              },
            ],
          },
        ],
      },
    };
    const t = scenario(DB2).p1.hand('TST-OC-TARGET');
    expect(t.legal().filter((a) => a.type === 'play' && a.overclock)).toHaveLength(0);
  });
});
