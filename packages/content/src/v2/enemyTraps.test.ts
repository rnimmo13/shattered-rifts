// Enemies' Traps (DECISIONS #751): set by a move, face up, flat damage scaled by the tier, broken when their enemy falls.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  viewFor,
  type CombatEvent,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, isDeckCard } from './index';

const ENEMY_UNITS = Object.values(db.units);
import { V2_CARDS } from './cards';
import { ENEMY_TRAPS } from './enemyTraps';

function fight(enemies: string[], dmgPct?: number): CombatState {
  const { state } = createCombat(db, {
    seed: 'enemy-traps',
    a: { hero: 'knight', deck: [...RIFTWALKERS.knight.starter, ...RIFTWALKERS.knight.starter] },
    b: { enemies, ...(dmgPct ? { dmgPct } : {}) },
  });
  const s = clone(state);
  const h = hero(s);
  h.hp = h.maxHp = 500;
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, def: string): Unit => s.sides.b.units.find((u) => u.def === def)!;
/** `def` has set Trap `card` (as its move would) */
function armed(s0: CombatState, def: string, card: string): CombatState {
  const s = clone(s0);
  s.sides.b.snares.push({ id: `T-${card}`, card, owner: foe(s, def).id });
  return s;
}
/** play one card from a fresh hand, with Mana to spare */
function play(
  s0: CombatState,
  card: string,
  target?: Unit,
): { state: CombatState; events: CombatEvent[] } {
  const s = clone(s0);
  s.sides.a.mana = 9;
  s.sides.a.hand = [{ id: 'P0', card }];
  return applyAction(db, s, { type: 'play', card: 'P0', ...(target ? { target: target.id } : {}) });
}
const endTurn = (s: CombatState): CombatState => {
  let r = applyAction(db, s, { type: 'endTurn' }).state;
  for (let i = 0; i < 3 && r.active !== 'a' && !r.winner; i++)
    r = applyAction(db, r, { type: 'endTurn' }).state;
  return r;
};

describe('which enemies set Traps', () => {
  const setters = ENEMY_UNITS.filter(
    (u) =>
      u.brain.kind === 'enemy' &&
      Object.values(u.brain.moves).some((m) => m.effects.some((o) => o.op === 'setTrap')),
  ).map((u) => u.id);

  it('every enemy Trap is set by some move, and they are never anyone’s card', () => {
    const set = new Set(
      ENEMY_UNITS.flatMap((u) =>
        u.brain.kind === 'enemy'
          ? Object.values(u.brain.moves).flatMap((m) =>
              m.effects.flatMap((o) => (o.op === 'setTrap' ? [o.card] : [])),
            )
          : [],
      ),
    );
    for (const t of ENEMY_TRAPS) {
      expect(set.has(t.id), t.id).toBe(true);
      expect(t.source).toBe('enemy');
      expect(isDeckCard(t.id), t.id).toBe(false);
      expect(
        V2_CARDS.some((c) => c.id === t.id),
        t.id,
      ).toBe(false);
    }
  });

  it('the Umbral Veil sets the most, but not every one of its enemies does; other realms have a few', () => {
    const umbral = [
      'hooded-acolyte',
      'whisperer',
      'lost-courtier',
      'lamplighter',
      'choir-of-silence',
      'nyxara',
      'velvet-lamprey',
      'keyhole-imp',
      'umbrella-widow',
      'mirror-moth',
      'inkbound-usher',
      'puppet-of-knots',
      'the-borrowed-face',
      'midnight-seamstress',
      'the-applause-below',
    ];
    const inVeil = umbral.filter((id) => setters.includes(id));
    expect(inVeil.length).toBe(9);
    expect(inVeil.length).toBeLessThan(umbral.length);
    expect(setters.filter((id) => !umbral.includes(id)).sort()).toEqual([
      'clockwork-guillotine',
      'ember-chessman',
      'lantern-angler',
      'orchid-maw',
    ]);
  });

  it('they vary: three triggers, and no two do the same thing', () => {
    const on = new Set(ENEMY_TRAPS.map((t) => t.trigger?.on));
    expect([...on].sort()).toEqual(['attacked', 'foeDefends', 'foeSummons']);
    const effects = ENEMY_TRAPS.map((t) => JSON.stringify(t.effects));
    expect(new Set(effects).size).toBe(effects.length);
  });
});

describe('setting one', () => {
  it("Keyhole Imp's Lock Up sets Lockjaw, face up, and its intent says so", () => {
    let s = fight(['keyhole-imp']);
    for (let i = 0; i < 6 && foe(s, 'keyhole-imp').intent?.move !== 'lock'; i++) s = endTurn(s);
    const before = viewFor(db, s, 'a').sides.b.units[0]!.intentView!;
    expect(before.icons).toContain('trap');
    expect(before.text).toContain('Lockjaw');
    expect(before.text).toContain('When you attack one of them');
    const after = endTurn(s);
    const v = viewFor(db, after, 'a').sides.b;
    expect(v.snares).toHaveLength(1);
    expect(v.snares[0]).toMatchObject({
      card: 'enemy-lockjaw',
      owner: foe(after, 'keyhole-imp').id,
    });
    expect(v.snares[0]!.text).toBe('When you attack one of them: Deal 6 damage to the attacker.');
  });

  it('a full row loses its oldest Trap', () => {
    let s = fight(['keyhole-imp']);
    for (let i = 0; i < 6 && foe(s, 'keyhole-imp').intent?.move !== 'lock'; i++) s = endTurn(s);
    const t = clone(s);
    const imp = foe(t, 'keyhole-imp').id;
    for (const id of ['T1', 'T2', 'T3'])
      t.sides.b.snares.push({ id, card: 'enemy-lockjaw', owner: imp });
    const out = applyAction(db, t, { type: 'endTurn' });
    const broke = out.events.filter((e) => e.type === 'snareBroken');
    expect(broke.map((e) => (e as { snare: string }).snare)).toEqual(['T1']);
    expect(out.state.sides.b.snares.map((x) => x.id).slice(0, 2)).toEqual(['T2', 'T3']);
    expect(out.state.sides.b.snares).toHaveLength(3);
  });
});

describe('springing one', () => {
  it('Lockjaw bites back the first hit: flat, whatever the Imp’s Might, and the hit still lands', () => {
    const s = armed(fight(['keyhole-imp']), 'keyhole-imp', 'enemy-lockjaw');
    foe(s, 'keyhole-imp').statuses.might = 5;
    const hp = hero(s).hp;
    const impHp = foe(s, 'keyhole-imp').hp;
    const out = play(s, 'strike', foe(s, 'keyhole-imp'));
    expect(out.events.some((e) => e.type === 'snareSprung' && e.side === 'b')).toBe(true);
    expect(hero(out.state).hp).toBe(hp - 6);
    expect(foe(out.state, 'keyhole-imp').hp).toBeLessThan(impHp);
    expect(out.state.sides.b.snares).toHaveLength(0);
  });

  it('its damage follows the tier’s damage percent, and the tile says the number that will land', () => {
    const s = armed(fight(['keyhole-imp'], 200), 'keyhole-imp', 'enemy-lockjaw');
    expect(viewFor(db, s, 'a').sides.b.snares[0]!.text).toContain('Deal 12 damage');
    const hp = hero(s).hp;
    const out = play(s, 'strike', foe(s, 'keyhole-imp'));
    expect(hero(out.state).hp).toBe(hp - 12);
  });

  it('a Trap’s damage is no attack: it does not set off your own Traps', () => {
    const s = armed(fight(['keyhole-imp']), 'keyhole-imp', 'enemy-lockjaw');
    s.sides.a.snares.push({ id: 'mine', card: 'trip-line' });
    const out = play(s, 'strike', foe(s, 'keyhole-imp'));
    expect(out.events.filter((e) => e.type === 'snareSprung').map((e) => e.side)).toEqual(['b']);
    expect(out.state.sides.a.snares.map((x) => x.id)).toEqual(['mine']);
  });

  it('Masquerade cancels the hit and the Courtier gains Barrier', () => {
    const s = armed(fight(['lost-courtier']), 'lost-courtier', 'enemy-masquerade');
    const c = foe(s, 'lost-courtier');
    const out = play(s, 'strike', c);
    expect(out.events.some((e) => e.type === 'prevented')).toBe(true);
    expect(foe(out.state, 'lost-courtier').hp).toBe(c.hp);
    expect(foe(out.state, 'lost-courtier').barrier).toBeGreaterThan(c.barrier);
  });

  it('Cut Strings answers your Barrier, before it lands', () => {
    const s = armed(fight(['puppet-of-knots']), 'puppet-of-knots', 'enemy-cut-strings');
    const hp = hero(s).hp;
    const out = play(s, 'defend');
    expect(hero(out.state).hp).toBe(hp - 7);
    expect(hero(out.state).barrier).toBeGreaterThan(0);
  });

  it('Whispered Doubt puts a Wound in your hand', () => {
    const s = armed(fight(['whisperer']), 'whisperer', 'enemy-whispered-doubt');
    const out = play(s, 'strike', foe(s, 'whisperer'));
    expect(out.state.sides.a.hand.some((c) => c.card === 'wound')).toBe(true);
  });
});

describe('breaking one', () => {
  it('a Trap breaks when the enemy that set it falls, and the others no longer meet it', () => {
    const t = armed(fight(['velvet-lamprey', 'keyhole-imp']), 'keyhole-imp', 'enemy-lockjaw');
    // (the Imp has fallen to something else; a strike on the Lamprey finds its Trap broken, not waiting)
    foe(t, 'keyhole-imp').hp = 0;
    const hp = hero(t).hp;
    const out = play(t, 'strike', foe(t, 'velvet-lamprey'));
    expect(out.events.some((e) => e.type === 'snareBroken')).toBe(true);
    expect(out.events.some((e) => e.type === 'snareSprung')).toBe(false);
    expect(hero(out.state).hp).toBe(hp);
    expect(out.state.sides.b.snares).toHaveLength(0);
  });

  it('killing the setter with the hit that springs its own Trap still lets the Trap answer that hit', () => {
    const s = armed(fight(['keyhole-imp']), 'keyhole-imp', 'enemy-lockjaw');
    foe(s, 'keyhole-imp').hp = 1;
    foe(s, 'keyhole-imp').barrier = 0;
    const hp = hero(s).hp;
    const out = play(s, 'strike', foe(s, 'keyhole-imp'));
    expect(hero(out.state).hp).toBe(hp - 6);
    expect(out.state.winner).toBe('a');
  });
});
