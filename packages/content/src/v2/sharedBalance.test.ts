import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  createCombat,
  legalActions,
  type CardDef,
  type CombatDb,
  type CombatState,
  type Op,
  type Side,
} from '@sr/combat';
import { COMBAT_DB as base } from './index';
import { disciplineAttack } from '../../../combat/src/disciplines';
const probe = (id: string, effects: Op[], extra: Partial<CardDef> = {}): CardDef => ({
  id,
  name: id,
  kind: 'skill',
  cost: 0,
  target: 'none',
  effects,
  ...extra,
});
const db: CombatDb = {
  ...base,
  cards: {
    ...base.cards,
    blank: probe('blank', []),
    consume: probe('consume', [], { exhaust: true }),
    grow: probe('grow', [{ op: 'growHp', amount: 48, to: 'allAllies' }]),
    kill: probe('kill', [{ op: 'damage', amount: 10000, to: 'allAllies' }]),
    build: probe('build', [{ op: 'summon', unit: 'war-engine' }]),
    absent: probe('absent', [
      { op: 'power', when: 'play', ops: [{ op: 'summon', unit: 'war-engine', ifAbsent: true }] },
    ]),
    revive: probe('revive', [{ op: 'revive' }]),
    expose: probe('expose', [{ op: 'status', status: 'exposed', amount: 1, to: 'target' }], {
      target: 'foe',
    }),
    scent: probe('scent', [{ op: 'power', when: 'exposeFoe', ops: [{ op: 'draw', amount: 1 }] }]),
    reactive: probe('reactive', [
      {
        op: 'power',
        when: 'hurt',
        ops: [{ op: 'status', status: 'exposed', amount: 1, to: 'attacker' }],
      },
    ]),
    selfExpose: probe('selfExpose', [{ op: 'status', status: 'exposed', amount: 1, to: 'self' }]),
    hit: probe('hit', [{ op: 'damage', amount: 10, to: 'target' }], {
      kind: 'attack',
      target: 'foe',
    }),
    bleed: probe('bleed', [{ op: 'status', status: 'seared', amount: 3, to: 'target' }], {
      target: 'foe',
    }),
    burn: probe('burn', [{ op: 'status', status: 'burn', amount: 3, to: 'target' }], {
      target: 'foe',
    }),
    fate: probe(
      'fate',
      [
        { op: 'status', status: 'doom', amount: 1000, to: 'target' },
        { op: 'doomNow', to: 'target' },
      ],
      { target: 'foe' },
    ),
    draw8: probe('draw8', [{ op: 'draw', amount: 8 }]),
    draw1: probe('draw1', [{ op: 'draw', amount: 1 }]),
    recursive: probe('recursive', [
      { op: 'power', when: 'drawMidTurn', perTurnLimit: 2, ops: [{ op: 'draw', amount: 1 }] },
    ]),
    consumeOnHurt: probe('consumeOnHurt', [
      { op: 'power', when: 'hurt', ops: [{ op: 'exhaustTop', amount: 1 }] },
    ]),
    sword: probe('sword', [], { tags: ['sword', 'spell'] }),
    commands: probe('commands', [{ op: 'totemCommand', spirit: 'front', times: 8 }]),
    plant: probe('plant', [{ op: 'plant', spirit: 'hawk' }]),
  },
};
const hero = (s: CombatState, side: Side = 'a') =>
  s.sides[side].units.find((u) => u.kind === 'hero')!;
function fight(h = 'engineer', asc?: string, b = 'knight', bAsc?: string): CombatState {
  const s = createCombat(db, {
    seed: 'shared-rules',
    a: { hero: h, deck: ['blank'], ...(asc ? { ascendancy: `${h}:${asc}` } : {}) },
    b: { hero: b, deck: ['blank'], ...(bAsc ? { ascendancy: `${b}:${bAsc}` } : {}) },
  }).state;
  for (const side of ['a', 'b'] as const) {
    s.sides[side].mana = 100;
    s.sides[side].draw = Array.from({ length: 60 }, (_, i) => ({
      id: `${side}-draw-${i}`,
      card: 'blank',
    }));
  }
  return s;
}
let serial = 0;
function play(s: CombatState, card: string, target?: string): CombatState {
  const side = s.sides[s.active];
  const id = `play-${serial++}`;
  side.hand = [{ id, card }];
  side.mana = 100;
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || a.target === target),
  );
  expect(act, card).toBeDefined();
  return applyAction(db, s, act!).state;
}
const end = (s: CombatState) => applyAction(db, s, { type: 'endTurn' }).state;
const machine = (s: CombatState) => s.sides.a.units.find((u) => u.def === 'war-engine')!;

describe('shared balance rules 79', () => {
  it('makes both recycling loops Consume while retaining cost and effects', () => {
    for (const id of ['recycle', 'detonate'])
      for (const suffix of ['', '+']) {
        expect(db.cards[id + suffix]?.exhaust).toBe(true);
        expect(db.cards[id + suffix]?.cost).toBe(0);
      }
  });
  it('banks earned growth once, excludes inherited recovery, and survives JSON restoration', () => {
    let s = play(play(fight('engineer', 'golemancer'), 'build'), 'grow');
    expect(machine(s).investedHp).toBe(48);
    s = play(s, 'kill');
    expect(s.sides.a.discipline?.recovery).toBe(24);
    s = play(JSON.parse(JSON.stringify(s)) as CombatState, 'build');
    expect(machine(s).maxHp).toBe(base.units['war-engine']!.maxHp + 24);
    expect(machine(s).investedHp ?? 0).toBe(0);
    expect(s.sides.a.discipline?.recovery).toBe(0);
    s = play(s, 'kill');
    expect(s.sides.a.discipline?.recovery ?? 0).toBe(0);
  });
  it('caps recovery, keeps it on revival and skipped summons, and revives fresh stats', () => {
    let s = play(fight('engineer', 'golemancer'), 'build');
    machine(s).investedHp = 200;
    s = play(play(s, 'kill'), 'revive');
    expect(s.sides.a.discipline?.recovery).toBe(30);
    expect(machine(s).maxHp).toBe(base.units['war-engine']!.maxHp);
    s = play(play(s, 'absent'), 'blank');
    expect(s.sides.a.discipline?.recovery).toBe(30);
  });
  it('does not treat Salvage or scrapping as earned death growth', () => {
    let s = play(fight('engineer', 'golemancer'), 'build');
    machine(s).investedHp = 48;
    const old = machine(s);
    s.sides.a.hand = [{ id: 'replacement', card: 'build' }];
    s = applyAction(db, s, { type: 'play', card: 'replacement', release: [old.id] }).state;
    expect(s.sides.a.discipline?.recovery ?? 0).toBe(0);
    expect(machine(s).investedHp ?? 0).toBe(0);
  });
  it('Predator Ambush (#693): mid-turn draws add 10% each up to 60%, ignoring the opening hand, and it waits across turns', () => {
    let s = fight('hunter', 'predator');
    expect(s.sides.a.discipline?.progress ?? 0).toBe(0);
    s = play(s, 'draw8');
    expect(s.sides.a.discipline?.progress).toBe(60);
    s = end(end(s));
    expect(s.sides.a.discipline?.progress).toBe(60);
  });
  it('Soulreaper caps round growth separately from Barrier and resets next own turn', () => {
    let s = fight('necromancer', 'soulreaper');
    for (let i = 0; i < 8; i++) s = play(s, 'consume');
    expect(s.sides.a.discipline?.progress).toBe(3);
    expect(hero(s).barrier).toBe(18);
    expect(s.sides.a.exhausted).toHaveLength(8);
    s = JSON.parse(JSON.stringify(s)) as CombatState;
    s = play(s, 'consume');
    expect(s.sides.a.discipline?.progress).toBe(3);
    s = end(end(s));
    s = play(s, 'consume');
    expect(s.sides.a.discipline?.progress).toBe(4);
  });
  it('Fault Lines counts a Sword/Spell only once and stops after six plays', () => {
    let s = play(fight('spellblade'), 'fault-lines');
    for (let i = 0; i < 7; i++) s = play(s, 'sword');
    expect(hero(s, 'b').statuses.fracture).toBe(6);
    s = end(end(s));
    s = play(s, 'sword');
    expect(hero(s, 'b').statuses.fracture).toBe(7);
  });
  it('retains Soulreaper round limits on the opposing turn while other Consume hooks still answer', () => {
    let s = play(fight('necromancer', 'soulreaper'), 'consumeOnHurt');
    for (let i = 0; i < 6; i++) s = play(s, 'consume');
    s = end(s);
    hero(s).barrier = 0;
    const fate = hero(s, 'b').statuses.doom ?? 0;
    s = play(s, 'hit', hero(s).id);
    expect(s.sides.a.discipline?.progress).toBe(3);
    expect(hero(s).barrier).toBe(0);
    expect(hero(s, 'b').statuses.doom).toBeGreaterThan(fate);
    s = play(end(s), 'consume');
    expect(s.sides.a.discipline?.progress).toBe(4);
    expect(hero(s).barrier).toBe(3);
  });
  it('spends trigger counters before nested effects can reenter the same trigger', () => {
    let s = play(fight(), 'recursive');
    const before = s.sides.a.draw.length;
    s = play(s, 'draw1');
    expect(s.sides.a.draw.length).toBe(before - 3);
    s = JSON.parse(JSON.stringify(s)) as CombatState;
    s = play(s, 'draw1');
    expect(s.sides.a.draw.length).toBe(before - 4);
  });
  it('ramps Deathwish continuously across its intended HP band without raising the cap', () => {
    const s = fight('drunkard', 'deathwish');
    const bonus = (pct: number) => {
      hero(s).hp = (hero(s).maxHp * pct) / 100;
      return disciplineAttack(s, s.sides.a, hero(s), db.cards.hit!, hero(s, 'b'), 0);
    };
    // (and on below 40%, to +50% at 10%: DECISIONS #685, #695)
    expect([100, 70, 60, 55, 40, 25, 10, 5].map(bonus)).toEqual([0, 0, 10, 15, 30, 40, 50, 50]);
  });
  it('Storm Sovereign limits Barrier without limiting command damage or counting passives', () => {
    let s = play(fight('shaman'), 'storm-sovereign');
    s.sides.a.totems = ['hawk', 'hawk', 'hawk'];
    for (let i = 0; i < 5; i++) s = play(s, 'plant'); // full row push-outs
    expect(hero(s).barrier).toBe(9);
    const hp = hero(s, 'b').hp;
    s = play(s, 'plant');
    expect(hero(s).barrier).toBe(9);
    expect(hp - hero(s, 'b').hp).toBeGreaterThanOrEqual(3);
    expect(cardText(db, db.cards['storm-sovereign']!)).toContain('command a totem or push one out');
    expect(db.cards['storm-sovereign']!.cost).toBe(2);
  });
  it('applier-owned Exposed triggers on opponent heroes and reactive turns, never self debuffs', () => {
    let s = play(fight('knight'), 'scent-of-weakness');
    const n = s.sides.a.draw.length;
    s = play(s, 'expose', hero(s, 'b').id);
    expect(s.sides.a.draw.length).toBe(n - 1);
    s = play(s, 'selfExpose');
    expect(s.sides.a.draw.length).toBe(n - 1);
    s = play(s, 'reactive');
    s = end(s);
    const before = s.sides.a.draw.length;
    s = play(s, 'hit', hero(s).id);
    expect(s.sides.a.draw.length).toBe(before - 1);
    expect(hero(s, 'b').statuses.exposed).toBeGreaterThan(0);
  });
  it.each(['bleed', 'burn'])(
    'rescues hostile %s once even at the start of the victim turn',
    (card) => {
      let s = fight('knight', undefined, 'drunkard', 'deathwish');
      hero(s, 'b').hp = 1;
      hero(s, 'b').barrier = 0;
      s = play(s, card, hero(s, 'b').id);
      s = end(s);
      expect(hero(s, 'b').hp).toBe(1);
      expect(s.sides.b.discipline?.used).toBe(true);
    },
  );
  it('does not rescue Fate execution', () => {
    let s = fight('knight', undefined, 'drunkard', 'deathwish');
    s = play(s, 'fate', hero(s, 'b').id);
    expect(s.winner).toBe('a');
    expect(s.sides.b.discipline?.used ?? false).toBe(false);
  });
  it.each([70, 149, 151, 420])(
    'Soul Tithe prices max HP %i using ceiling and a three-Fate floor',
    (hp) => {
      let s = fight('necromancer');
      hero(s).maxHp = hero(s).hp = hp;
      s = play(s, 'soul-tithe');
      s = end(end(s));
      expect(hero(s).statuses.doom).toBe(Math.max(3, Math.ceil(hp * 0.02)));
      expect(cardText(db, db.cards['soul-tithe']!)).toContain('at least 3');
    },
  );
});
