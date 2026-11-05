import { describe, expect, it } from 'vitest';
import {
  applyAction,
  canPlay,
  cardText,
  clone,
  createCombat,
  hashState,
  heroOf,
  previewAllyDamage,
  previewCardDamage,
  viewFor,
  type CombatState,
  type Op,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fixture(hero: keyof typeof RIFTWALKERS, card: string): CombatState {
  const s = createCombat(db, {
    seed: 'damage-display',
    a: { hero, deck: RIFTWALKERS[hero].starter },
    b: { enemies: ['squire'] },
  }).state;
  s.sides.a.hand = [{ id: 'preview', card }];
  s.sides.a.mana = 20;
  s.sides.b.units[0]!.hp = s.sides.b.units[0]!.maxHp = 10000;
  s.sides.b.units[0]!.barrier = 0;
  s.sides.b.units[0]!.statuses = {};
  return s;
}
const incoming = (s: CombatState, card = 'preview') =>
  applyAction(db, s, { type: 'play', card, target: s.sides.b.units[0]!.id })
    .events.filter((e) => e.type === 'damage' && e.target === s.sides.b.units[0]!.id)
    .reduce((n, e) => n + (e.type === 'damage' ? e.amount : 0), 0);

describe('live card damage and companion calculations', () => {
  it('matches every immediately resolvable damage card in the catalog to accepted damage events', () => {
    const contains = (o: Op): boolean =>
      o.op === 'damage' || ('ops' in o && o.op !== 'power' && o.ops.some(contains));
    let compared = 0;
    for (const card of Object.values(db.cards).filter((c) => c.effects.some(contains))) {
      const hero = (
        card.hero && card.hero in RIFTWALKERS ? card.hero : 'knight'
      ) as keyof typeof RIFTWALKERS;
      const s = fixture(hero, card.id);
      s.sides.a.mana = 10;
      s.sides.a.stars = 12;
      heroOf(s.sides.a)!.statuses.might = 3;
      s.sides.b.units[0]!.statuses.exposed = 1;
      if (!canPlay({ db, s }, 'a', s.sides.a.hand[0]!)) continue;
      const target =
        card.target === 'foe'
          ? s.sides.b.units[0]!.id
          : card.target === 'ally'
            ? s.sides.a.units.find((u) => u.kind === 'ally')?.id
            : card.target === 'friend'
              ? heroOf(s.sides.a)!.id
              : undefined;
      if (card.target !== 'none' && !target) continue;
      const before = hashState(s),
        live = previewCardDamage(db, s, 'preview', target ?? null);
      expect(hashState(s), card.id + ' mutated combat').toBe(before);
      if (card.kind === 'snare') {
        expect(live.size, card.id + ' future trigger').toBe(0);
        continue;
      }
      if (live.get(-1)?.uncertain) {
        expect(cardText(db, card, live), card.id).toContain('can depend');
        continue;
      }
      const damage = [...live.values()].filter((v) => !v.barrier && !v.uncertain);
      expect(damage.length, card.id + ' missing known damage').toBeGreaterThan(0);
      const real = applyAction(db, s, {
        type: 'play',
        card: 'preview',
        ...(target ? { target } : {}),
      });
      if (real.state.pending) continue;
      const observed = real.events
        .filter((e) => e.type === 'damage' && e.target === s.sides.b.units[0]!.id)
        .reduce((n, e) => n + (e.type === 'damage' ? e.amount : 0), 0);
      const shown = damage.reduce((n, v) => n + (v.total?.lo ?? v.lo), 0);
      expect(shown, card.id + ' preview differs from accepted damage').toBe(observed);
      expect(cardText(db, card, live), card.id).not.toMatch(/Infinity|NaN/);
      compared++;
    }
    expect(compared).toBeGreaterThan(500);
  });
  for (const card of ['run-wild', 'reckless-blow', 'run-wild+', 'reckless-blow+'])
    it(`${card} counts both hits, including a preceding HP payment`, () => {
      const s = fixture('hunter', card);
      heroOf(s.sides.a)!.statuses.might = 3;
      s.sides.b.units[0]!.statuses.exposed = 1;
      const before = hashState(s),
        live = previewCardDamage(db, s, 'preview', s.sides.b.units[0]!.id);
      const damage = [...live.values()].find((l) => l.total && !l.barrier)!;
      expect(damage.hits).toBe(2);
      expect(damage.total!.lo).toBe(incoming(s));
      expect(cardText(db, db.cards[card]!, live)).toContain('2 hits');
      expect(cardText(db, db.cards[card]!, live)).toContain(`${damage.total!.lo}]] total`);
      expect(hashState(s)).toBe(before);
    });
  it('counts known hurt-triggered Might before Reckless Blow lands', () => {
    const s = fixture('hunter', 'reckless-blow');
    s.sides.a.powers.push({
      id: 'scar',
      card: 'scar-tissue',
      when: 'hurt',
      ops: [{ op: 'status', status: 'might', amount: 2, to: 'self' }],
    });
    const live = previewCardDamage(db, s, 'preview', s.sides.b.units[0]!.id).get(1)!;
    expect(live.lo).toBe(9);
    expect(live.total!.lo).toBe(incoming(s));
  });
  it('stops before unknown draws instead of using hidden deck order', () => {
    const s = fixture('hunter', 'reckless-blow');
    const custom = {
      ...db,
      cards: {
        ...db.cards,
        'draw-hit': {
          ...db.cards['reckless-blow']!,
          id: 'draw-hit',
          effects: [
            { op: 'draw', amount: 1 },
            { op: 'damage', amount: 7, to: 'target', hits: 2 },
          ],
        },
      },
    } as typeof db;
    s.sides.a.hand[0]!.card = 'draw-hit';
    const a = previewCardDamage(custom, s, 'preview', s.sides.b.units[0]!.id);
    const changed = clone(s);
    changed.sides.a.draw.reverse();
    expect(previewCardDamage(custom, changed, 'preview', changed.sides.b.units[0]!.id)).toEqual(a);
    expect(a.get(1)).toBeUndefined();
    expect(a.get(-1)?.uncertain).toBe(true);
  });
  it('does not disclose a face-down opponent trap in card or minion previews', () => {
    const s = fixture('engineer', 'strike');
    const plain = previewCardDamage(db, s, 'preview', s.sides.b.units[0]!.id);
    s.sides.b.snares = [{ id: 'hidden', card: 'tripwire' }];
    expect(previewCardDamage(db, s, 'preview', s.sides.b.units[0]!.id)).toEqual(plain);
    const ally = s.sides.a.units.find((u) => u.kind === 'ally')!;
    const withTrap = previewAllyDamage(db, s, ally.id);
    s.sides.b.snares = [];
    expect(previewAllyDamage(db, s, ally.id)).toEqual(withTrap);
  });
  it('a summoned minion breakdown matches its real hit and leaves combat untouched', () => {
    const s = fixture('engineer', 'strike'),
      ally = s.sides.a.units.find((u) => u.kind === 'ally')!;
    ally.statuses.might = 2;
    ally.statuses.vigor = 3;
    s.sides.a.allyPct = 25;
    heroOf(s.sides.a)!.statuses.marrow = 2;
    s.sides.b.units[0]!.statuses.exposed = 1;
    const before = hashState(s),
      shown = previewAllyDamage(db, s, ally.id)!;
    expect(shown.how!.join(' ')).toContain('Primed');
    expect(shown.how!.join(' ')).toContain('Calcify');
    expect(shown.how!.join(' ')).toContain('Exposed');
    expect(
      viewFor(db, s, 'a').sides.a.units.find((u) => u.id === ally.id)!.intentView!.damagePreview,
    ).toEqual(shown);
    const damage = applyAction(db, s, { type: 'endTurn' })
      .events.filter((e) => e.type === 'damage' && e.source === ally.id)
      .reduce((n, e) => n + (e.type === 'damage' ? e.amount : 0), 0);
    expect(shown.total!.lo).toBe(damage);
    expect(hashState(s)).toBe(before);
  });
  it('checks every base/upgraded companion attack against its actual end-turn damage', () => {
    for (const def of Object.values(db.units).filter((u) => u.brain.kind === 'ally')) {
      const s = fixture('engineer', 'strike'),
        ally = s.sides.a.units.find((u) => u.kind === 'ally')!;
      Object.assign(ally, {
        def: def.id,
        name: def.name,
        hp: def.maxHp,
        maxHp: def.maxHp,
        statuses: { might: 2, vigor: 3, faltering: 1 },
      });
      s.sides.a.allyPct = 25;
      heroOf(s.sides.a)!.statuses.marrow = 2;
      s.sides.b.units[0]!.statuses.exposed = 1;
      const before = hashState(s),
        shown = previewAllyDamage(db, s, ally.id);
      expect(hashState(s), def.id + ' mutated combat').toBe(before);
      const damage = applyAction(db, s, { type: 'endTurn' })
        .events.filter((e) => e.type === 'damage' && e.source === ally.id)
        .reduce((n, e) => n + (e.type === 'damage' ? e.amount : 0), 0);
      expect(shown?.total?.lo ?? 0, def.id).toBe(damage);
    }
  });
  for (const card of ['spirit-strike', 'twin-talons', 'shattering-call'])
    it(`${card} includes known totem follow-up damage`, () => {
      const s = fixture('shaman', card);
      s.sides.a.stars = 12;
      const live = previewCardDamage(db, s, 'preview', s.sides.b.units[0]!.id);
      expect([...live.values()].reduce((n, v) => n + (v.total?.lo ?? v.lo), 0)).toBe(incoming(s));
      expect(cardText(db, db.cards[card]!, live)).toContain('total damage now');
    });
  it('shows zero cleanly when there is nothing for scaled damage to count', () => {
    const s = fixture('monk', 'burning-litany');
    const text = cardText(db, db.cards['burning-litany']!, previewCardDamage(db, s, 'preview'));
    expect(text).toContain('[[live:calc:0]]');
    expect(text).not.toMatch(/Infinity|NaN/);
  });
});
