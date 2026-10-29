// The Spellblade rebuilt (docs/BASE_CLASS_REWORKS.md §7, DECISIONS #417): her Obsidian Blade holds two enchantments; spells Imbue them
// and blade attacks Discharge them (Ember +3 on the first hit, Glass 2 to every enemy after the attack, Ward 3 Barrier). Her old Regent
// copy (Arcana, Sharpen, Retainers) is archived in reviews/balance-baselines/2026-10-29-pre-identity-reworks/.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  viewFor,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, pathSizes } from './index';

function fight(hand: string[], enemies: string[] = ['squire', 'squire']): CombatState {
  const deck = RIFTWALKERS.spellblade.starter;
  const { state } = createCombat(db, {
    seed: 'spellblade-enchant',
    a: { hero: 'spellblade', deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  s.sides.a.enchants = [];
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
    u.barrier = 0;
  }
  hero(s).statuses = {};
  hero(s).barrier = 0;
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
/** play a card (no choice answered: the state may be waiting on one) */
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const pick = (s: CombatState, id: string): CombatState =>
  applyAction(db, s, { type: 'pick', cards: [id] }).state;

describe('the Spellblade: Imbue and Discharge', () => {
  it('starts with a Ward on her blade; no Arcana, no Sharpen; her starter imbues and discharges', () => {
    const { state } = createCombat(db, {
      seed: 'sb',
      a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.enchants).toEqual(['ward']);
    expect(state.sides.a.stars).toBe(0);
    expect(RIFTWALKERS.spellblade.hero.sigil).toBeUndefined();
    expect(RIFTWALKERS.spellblade.starter).toEqual([
      ...Array<string>(4).fill('strike'),
      ...Array<string>(4).fill('defend'),
      'ember-inscription',
      'obsidian-cut',
    ]);
    expect(pathSizes('spellblade').every((n) => n >= 12)).toBe(true);
    for (const c of Object.values(db.cards).filter((x) => x.hero === 'spellblade'))
      expect(c.starCost ?? 0, c.id).toBe(0);
    for (const gone of ['starforged-blade', 'hollow-form', 'gravity-well', 'rift-gifts'])
      expect(db.cards[gone], gone).toBeUndefined();
  });

  describe('Imbue', () => {
    it('goes into a free position, in order, duplicates allowed; the trait pays the first time each turn', () => {
      let s = fight(['ember-inscription', 'glassward', 'glassward']);
      const hand = s.sides.a.hand.length;
      s = play(s, 'ember-inscription', foe(s).id);
      expect(s.sides.a.enchants).toEqual(['ember']);
      expect(hero(s).barrier).toBe(2);
      expect(s.sides.a.hand.length).toBe(hand - 1 + 1);
      s = play(s, 'glassward');
      expect(s.sides.a.enchants).toEqual(['ember', 'ward']);
      expect(hero(s).barrier).toBe(2 + 5); // no second trait payout this turn
    });

    it('with both positions taken, the player chooses which one it replaces (not a discharge)', () => {
      let s = fight(['fracture-script']);
      s.sides.a.enchants = ['ember', 'ward'];
      s = play(s, 'fracture-script', foe(s).id);
      expect(s.pending?.kind).toBe('enchant');
      const v = viewFor(db, s, 'a').pending!;
      expect(v.charges).toEqual([
        { id: 'e0', kind: 'ember' },
        { id: 'e1', kind: 'ward' },
      ]);
      expect(v.incoming).toBe('glass');
      const barrier = hero(s).barrier;
      s = pick(s, 'e1');
      expect(s.sides.a.enchants).toEqual(['ember', 'glass']);
      expect(hero(s).barrier).toBe(barrier + 2); // the trait's Barrier, not a Ward's
      expect(s.pending).toBeNull();
    });
  });

  describe('Discharge', () => {
    it('with nothing on the blade the attack is only its own damage', () => {
      let s = fight(['obsidian-cut']);
      const hp = foe(s).hp;
      s = play(s, 'obsidian-cut', foe(s).id);
      expect(hp - foe(s).hp).toBe(6);
      expect(s.pending).toBeNull();
    });

    it('one of two different ones: the player chooses; Ember adds 3, only to the first hit', () => {
      let s = fight(['obsidian-flurry']);
      s.sides.a.enchants = ['ward', 'ember'];
      const hp = foe(s).hp;
      s = play(s, 'obsidian-flurry', foe(s).id);
      expect(s.pending?.kind).toBe('discharge');
      s = pick(s, 'e1');
      expect(s.sides.a.enchants).toEqual(['ward']);
      expect(hp - foe(s).hp).toBe(9 + 6 + 6);
    });

    it('two the same, or a single one: no question', () => {
      let s = fight(['obsidian-cut']);
      s.sides.a.enchants = ['ember', 'ember'];
      const hp = foe(s).hp;
      s = play(s, 'obsidian-cut', foe(s).id);
      expect(s.pending).toBeNull();
      expect(s.sides.a.enchants).toEqual(['ember']);
      expect(hp - foe(s).hp).toBe(9);
    });

    it('both: each spent exactly once; Ward is Barrier now, Glass breaks on every enemy after the attack, even one that died', () => {
      let s = fight(['crownfall']);
      s.sides.a.enchants = ['glass', 'ward'];
      foe(s, 0).hp = 10;
      const hp1 = foe(s, 1).hp;
      s = play(s, 'crownfall', foe(s, 0).id);
      expect(s.sides.a.enchants).toEqual([]);
      expect(hero(s).barrier).toBe(3);
      expect(s.sides.b.units).toHaveLength(1);
      expect(hp1 - foe(s, 0).hp).toBe(2);
    });

    it('Glass is a shard, not an attack: no Might, no Exposed', () => {
      let s = fight(['obsidian-cut']);
      s.sides.a.enchants = ['glass'];
      hero(s).statuses.might = 5;
      foe(s, 1).statuses.exposed = 2;
      const hp1 = foe(s, 1).hp;
      s = play(s, 'obsidian-cut', foe(s, 0).id);
      expect(hp1 - foe(s, 1).hp).toBe(2);
    });

    it('a Skill that discharges: Glass breaks at once, Ember is lost (Shatterguard)', () => {
      let s = fight(['shatterguard']);
      s.sides.a.enchants = ['ember', 'glass'];
      const hp = foe(s).hp;
      s = play(s, 'shatterguard');
      expect(hp - foe(s).hp).toBe(2);
      expect(hero(s).barrier).toBe(10);
    });

    it('Twin Edge doubles the first enchantment spent, once', () => {
      let s = fight(['echoing-blade', 'crownfall']);
      s = play(s, 'echoing-blade');
      s.sides.a.enchants = ['ember', 'ward'];
      const hp = foe(s).hp;
      s = play(s, 'crownfall', foe(s).id);
      expect(hp - foe(s).hp).toBe(17 + 6);
      expect(hero(s).barrier).toBe(3 + 3); // Echoing Blade's own 3, then the Ward's 3
      expect(hero(s).statuses.twinedge ?? 0).toBe(0);
    });

    it('a card played twice spends only what is there: the second play finds the blade empty', () => {
      let s = fight(['crownfall']);
      s.sides.a.enchants = ['ember', 'ember'];
      hero(s).statuses.twinned = 1;
      const hp = foe(s).hp;
      s = play(s, 'crownfall', foe(s).id);
      expect(hp - foe(s).hp).toBe(17 + 6 + 17);
    });
  });

  describe('previews', () => {
    it('show Ember exactly when it is certain, a range when the player chooses, and never spend anything', () => {
      const s = fight(['obsidian-cut', 'crownfall', 'obsidian-flurry']);
      s.sides.a.enchants = ['ember', 'ward'];
      const [cut, fall, flurry] = s.sides.a.hand.map((c) => c.id);
      const one = previewCardDamage(db, s, cut!, foe(s).id).get(1)!;
      expect([one.lo, one.hi]).toEqual([6, 9]);
      const both = previewCardDamage(db, s, fall!, foe(s).id).get(1)!;
      expect([both.lo, both.hi]).toEqual([20, 20]);
      const many = previewCardDamage(db, s, flurry!, foe(s).id).get(1)!;
      expect([many.lo, many.hi, many.first]).toEqual([6, 6, { lo: 0, hi: 3 }]);
      expect(s.sides.a.enchants).toEqual(['ember', 'ward']);
      expect(
        cardText(db, db.cards['obsidian-flurry']!, previewCardDamage(db, s, flurry!, foe(s).id)),
      ).toContain('(+0-3 on the first hit)');
    });
  });

  it('Recast the Edge: the newest becomes the kind chosen', () => {
    let s = fight(['recast-the-edge']);
    s.sides.a.enchants = ['ward', 'glass'];
    s = play(s, 'recast-the-edge');
    expect(s.pending?.kind).toBe('recast');
    expect(viewFor(db, s, 'a').pending!.charges!.map((c) => c.kind)).toEqual(['ember', 'ward']);
    s = pick(s, 'ember');
    expect(s.sides.a.enchants).toEqual(['ward', 'ember']);
  });

  it('Emberglass Covenant answers two different kinds spent together, once a turn', () => {
    let s = fight(['emberglass-covenant', 'crownfall']);
    s = play(s, 'emberglass-covenant');
    s.sides.a.enchants = ['ember', 'glass'];
    s = play(s, 'crownfall', foe(s).id);
    expect(s.sides.a.nextMana).toBe(1);
    expect(hero(s).barrier).toBe(6);
  });

  it('in the Arena each side has its own blade, and both are visible', () => {
    const { state } = createCombat(db, {
      seed: 'sb-pvp',
      a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
      b: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
    });
    const v = viewFor(db, state, 'a');
    expect(v.sides.a.enchants).toEqual(['ward']);
    expect(v.sides.b.enchants ?? []).toEqual([]);
  });

  it('reads plainly on the card', () => {
    expect(cardText(db, db.cards['ember-inscription']!)).toBe('Deal 5 damage. Imbue Ember.');
    expect(cardText(db, db.cards['obsidian-cut']!)).toBe(
      'Discharge an enchantment. Deal 6 damage.',
    );
    expect(cardText(db, db.cards['crownfall']!)).toBe(
      'Discharge both enchantments. Deal 17 damage.',
    );
  });
});
