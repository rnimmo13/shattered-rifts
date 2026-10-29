// The Spellblade's pool expansion (DECISIONS #425): single discharges that keep the other charge (kind-specific discharges), mixed and
// matching pairs ("they take effect again"), Ward weaving, Recast, holding a full blade and recovering an empty one. The cards as they
// stood before it are frozen in reviews/balance-baselines/2026-10-29-spellblade-expansion/.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  type CombatState,
  type Enchant,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, rewardPool } from './index';

function fight(hand: string[], blade: Enchant[] = [], enemies = ['squire', 'squire']): CombatState {
  const deck = RIFTWALKERS.spellblade.starter;
  const { state } = createCombat(db, {
    seed: 'spellblade-expansion',
    a: { hero: 'spellblade', deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  s.sides.a.enchants = [...blade];
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
    u.barrier = 0;
  }
  hero(s).statuses = {};
  hero(s).barrier = 0;
  return s;
}
const hero = (s: CombatState, side: 'a' | 'b' = 'a'): Unit =>
  s.sides[side].units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const lost = (s: CombatState): number[] => s.sides.b.units.map((u) => u.maxHp - u.hp);
/** play a card; a choice it asks is left open */
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides[s.active].hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const pick = (s: CombatState, id: string): CombatState =>
  applyAction(db, s, { type: 'pick', cards: [id] }).state;
/** answer every open choice the way the bot would */
const settle = (s: CombatState): CombatState => {
  let r = s;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};
/** the trait's first Imbue each turn: 2 Barrier and a card */
const TRAIT_BARRIER = 2;

describe('the Spellblade expansion (DECISIONS #425)', () => {
  it('87 reward-eligible Spellblade cards (89 with the two basics) and 12 Auras', () => {
    const own = Object.values(db.cards).filter(
      (c) => c.hero === 'spellblade' && !c.id.endsWith('+') && !c.id.includes('~'),
    );
    expect(own).toHaveLength(89);
    expect(
      rewardPool('spellblade').filter((id) => db.cards[id]?.hero === 'spellblade'),
    ).toHaveLength(87);
    expect(own.filter((c) => c.kind === 'power')).toHaveLength(12);
  });

  describe('single discharges that keep the other charge', () => {
    it('Measured Release draws while a charge is left; not when the blade is empty after it', () => {
      let s = fight(['measured-release'], ['ember', 'glass']);
      s = pick(play(s, 'measured-release', foe(s).id), 'e0');
      expect(lost(s)).toEqual([10, 0]);
      expect(s.sides.a.enchants).toEqual(['glass']);
      expect(s.sides.a.hand).toHaveLength(1);
      let t = fight(['measured-release'], ['ember']);
      t = play(t, 'measured-release', foe(t).id);
      expect(t.sides.a.hand).toHaveLength(0);
    });

    it('Spark Thrust is free and spends one charge', () => {
      let s = fight(['spark-thrust'], ['ember']);
      s.sides.a.mana = 0;
      s = play(s, 'spark-thrust', foe(s).id);
      expect(lost(s)).toEqual([8, 0]);
      expect(db.cards['spark-thrust+']!.effects[1]).toMatchObject({ op: 'damage', amount: 7 });
    });

    it('Glass Fang spends only a Glass (no choice) and Saps every enemy; with no Glass it spends nothing', () => {
      let s = fight(['glass-fang'], ['ember', 'glass']);
      s = play(s, 'glass-fang', foe(s).id);
      expect(s.pending).toBeFalsy();
      expect(s.sides.a.enchants).toEqual(['ember']);
      expect(lost(s)).toEqual([7 + 2, 2]);
      expect(s.sides.b.units.map((u) => u.statuses.sapped)).toEqual([2, 2]);
      let t = fight(['glass-fang'], ['ember', 'ward']);
      t = play(t, 'glass-fang', foe(t).id);
      expect(t.sides.a.enchants).toEqual(['ember', 'ward']);
      expect(lost(t)).toEqual([7, 0]);
      expect(foe(t).statuses.sapped ?? 0).toBe(0);
    });

    it('Searing Edge spends only an Ember: 14 + 3 and 2 Exposed; the Glass stays', () => {
      let s = fight(['searing-edge'], ['glass', 'ember']);
      s = play(s, 'searing-edge', foe(s).id);
      expect(lost(s)).toEqual([17, 0]);
      expect(foe(s).statuses.exposed).toBe(2);
      expect(s.sides.a.enchants).toEqual(['glass']);
    });

    it('Double Release: each discharge lands on its own hit, and each answers Glass Guard', () => {
      let s = fight(['parry', 'double-release'], ['ember', 'glass']);
      s = play(s, 'parry');
      s = pick(play(s, 'double-release', foe(s).id), 'e0');
      // 4 + 3 Ember, then 4 and the Glass's 2 on every enemy
      expect(lost(s)).toEqual([4 + 3 + 4 + 2, 2]);
      expect(hero(s).barrier).toBe(3 + 3);
      expect(s.sides.a.enchants).toEqual([]);
    });

    it('Warding Strike spends only a Ward: 6 + 4 and its Barrier; the Ember stays', () => {
      let s = fight(['warding-strike', 'warding-strike'], ['ember', 'ward']);
      s = play(s, 'warding-strike', foe(s).id);
      expect(lost(s)).toEqual([10, 0]);
      expect(hero(s).barrier).toBe(3);
      expect(s.sides.a.enchants).toEqual(['ember']);
      s = play(s, 'warding-strike', foe(s).id);
      expect(lost(s)).toEqual([16, 0]);
      expect(s.sides.a.enchants).toEqual(['ember']);
    });

    it('Edge Discipline draws (and 1 Barrier) on a discharge that leaves a charge, and not on the one that empties the blade', () => {
      let s = fight(['edge-discipline', 'spark-thrust', 'spark-thrust'], ['ember', 'ember']);
      s = play(s, 'edge-discipline');
      s = play(s, 'spark-thrust', foe(s).id);
      expect(s.sides.a.hand).toHaveLength(2);
      expect(hero(s).barrier).toBe(1);
      s = play(s, 'spark-thrust', foe(s).id);
      expect(s.sides.a.hand).toHaveLength(1);
      expect(hero(s).barrier).toBe(1);
    });
  });

  describe('Recast and recovery', () => {
    it('Shift the Grain changes the newest charge; Living Glass pays for the first Recast each turn only', () => {
      let s = fight(['living-glass', 'shift-the-grain', 'shift-the-grain'], ['ember']);
      s = play(s, 'living-glass');
      s = pick(play(s, 'shift-the-grain'), 'glass');
      expect(s.sides.a.enchants).toEqual(['glass']);
      expect(hero(s).barrier).toBe(4 + 3);
      expect(s.sides.a.hand).toHaveLength(2);
      s = pick(play(s, 'shift-the-grain'), 'ward');
      expect(s.sides.a.enchants).toEqual(['ward']);
      expect(hero(s).barrier).toBe(7 + 4);
      expect(s.sides.a.hand).toHaveLength(1);
    });

    it('Adaptive Strike: Recast first, then the discharge choice', () => {
      let s = fight(['adaptive-strike'], ['ward', 'ember']);
      s = pick(play(s, 'adaptive-strike', foe(s).id), 'glass');
      expect(s.sides.a.enchants).toEqual(['ward', 'glass']);
      s = pick(s, 'e1');
      expect(lost(s)).toEqual([8 + 2, 2]);
      expect(s.sides.a.enchants).toEqual(['ward']);
    });

    it('Obsidian Insight finds a card, Recasts and Consumes', () => {
      let s = fight(['obsidian-insight'], ['ember']);
      s.sides.a.mana = 0;
      s = settle(play(s, 'obsidian-insight'));
      expect(s.sides.a.enchants).not.toEqual(['ember']);
      expect(s.sides.a.exhausted.map((c) => c.card)).toContain('obsidian-insight');
      expect(s.sides.a.hand.length).toBeGreaterThanOrEqual(2);
    });

    it('Rekindle refills an empty blade (Ember and Glass, a card); with a charge left it is only Barrier', () => {
      let s = fight(['rekindle'], []);
      s = play(s, 'rekindle');
      expect(s.sides.a.enchants).toEqual(['ember', 'glass']);
      expect(hero(s).barrier).toBe(5 + TRAIT_BARRIER);
      expect(s.sides.a.hand).toHaveLength(2);
      let t = fight(['rekindle'], ['ward']);
      t = play(t, 'rekindle');
      expect(t.sides.a.enchants).toEqual(['ward']);
      expect(hero(t).barrier).toBe(5);
      expect(t.sides.a.hand).toHaveLength(0);
    });

    it('Spell-Etched Steel: 3 to a random enemy for every Imbue', () => {
      let s = fight(['spell-etched-steel', 'kindle-the-blade'], []);
      s = play(s, 'spell-etched-steel');
      s = play(s, 'kindle-the-blade');
      expect(lost(s).reduce((n, x) => n + x, 0)).toBe(6);
      expect(s.sides.a.enchants).toEqual(['ember', 'ember']);
    });
  });

  describe('mixed and matching pairs', () => {
    it('Split the Light draws 2 on a mixed pair, not on a matching one', () => {
      let s = fight(['split-the-light'], ['ember', 'glass']);
      s = play(s, 'split-the-light', foe(s).id);
      expect(lost(s)).toEqual([5 + 3 + 2, 2]);
      expect(s.sides.a.hand).toHaveLength(2);
      let t = fight(['split-the-light'], ['ember', 'ember']);
      t = play(t, 'split-the-light', foe(t).id);
      expect(lost(t)).toEqual([5 + 6, 0]);
      expect(t.sides.a.hand).toHaveLength(0);
    });

    it('Fault Line: 11 to all, and 1 Exposed on all on a mixed pair', () => {
      let s = fight(['fault-line'], ['glass', 'ward']);
      s = play(s, 'fault-line');
      expect(lost(s)).toEqual([13, 13]);
      expect(s.sides.b.units.map((u) => u.statuses.exposed)).toEqual([1, 1]);
      expect(hero(s).barrier).toBe(3);
    });

    it('Prism Break: 13, and a 10 more on a mixed pair', () => {
      let s = fight(['prism-break'], ['ember', 'ward']);
      s = play(s, 'prism-break', foe(s).id);
      expect(lost(s)).toEqual([13 + 3 + 10, 0]);
      let t = fight(['prism-break'], ['ember', 'ember']);
      t = play(t, 'prism-break', foe(t).id);
      expect(lost(t)).toEqual([13 + 6, 0]);
    });

    it('Kindle the Blade and Glaze the Edge make a matching pair', () => {
      let s = fight(['kindle-the-blade', 'glaze-the-edge'], []);
      s = play(s, 'kindle-the-blade');
      expect(s.sides.a.enchants).toEqual(['ember', 'ember']);
      expect(hero(s).barrier).toBe(4 + TRAIT_BARRIER);
      s.sides.a.enchants = [];
      s = play(s, 'glaze-the-edge');
      expect(s.sides.a.enchants).toEqual(['glass', 'glass']);
    });

    it('Resonant Pair: a matching pair takes effect again (Ember 6 more, Glass 4 more to all, Ward 6 Barrier); a mixed one does not', () => {
      let e = fight(['resonant-pair'], ['ember', 'ember']);
      e = play(e, 'resonant-pair', foe(e).id);
      expect(lost(e)).toEqual([6 + 6 + 6, 0]);
      let g = fight(['resonant-pair'], ['glass', 'glass']);
      g = play(g, 'resonant-pair', foe(g).id);
      expect(lost(g)).toEqual([6 + 8, 8]);
      let w = fight(['resonant-pair'], ['ward', 'ward']);
      w = play(w, 'resonant-pair', foe(w).id);
      expect(hero(w).barrier).toBe(12);
      let m = fight(['resonant-pair'], ['ember', 'glass']);
      m = play(m, 'resonant-pair', foe(m).id);
      expect(lost(m)).toEqual([6 + 3 + 2, 2]);
    });

    it('the echo is not a discharge: Cleaving Edge answers Resonant Pair once, and nothing goes back on the blade', () => {
      let s = fight(['cleaving-edge', 'resonant-pair'], ['ember', 'ember']);
      s = play(s, 'cleaving-edge');
      s = play(s, 'resonant-pair', foe(s).id);
      expect(lost(s)).toEqual([4 + 18, 4]);
      expect(s.sides.a.enchants).toEqual([]);
    });

    it('Kindred Shards: 15, a matching pair again and a card', () => {
      let s = fight(['kindred-shards'], ['ward', 'ward']);
      s = play(s, 'kindred-shards', foe(s).id);
      expect(lost(s)).toEqual([15, 0]);
      expect(hero(s).barrier).toBe(12);
      expect(s.sides.a.hand).toHaveLength(1);
    });

    it('Matched Set: Barrier whenever an Imbue leaves a matching pair', () => {
      let s = fight(['matched-set', 'forged-in-fury', 'fracture-script'], ['ember']);
      s = play(s, 'matched-set');
      s = play(s, 'forged-in-fury', foe(s).id);
      expect(hero(s).barrier).toBe(3 + TRAIT_BARRIER);
      s = pick(play(s, 'fracture-script', foe(s).id), 'e0');
      // (Ember, Glass: no pair)
      expect(hero(s).barrier).toBe(3 + TRAIT_BARRIER);
    });
  });

  describe('holding a full blade', () => {
    it('Bide the Blade draws 2 with a full blade and is Held; Glass Sight draws one a kind', () => {
      let s = fight(['bide-the-blade', 'glass-sight'], ['ember', 'glass']);
      s = play(s, 'bide-the-blade');
      expect(s.sides.a.hand).toHaveLength(3);
      s = play(s, 'glass-sight');
      expect(s.sides.a.hand).toHaveLength(4);
      expect(hero(s).barrier).toBe(12);
      expect(db.cards['bide-the-blade']!.retain && db.cards['glass-sight']!.retain).toBe(true);
    });

    it('Tempered Wait: 1 Mana next turn while an Ember is held', () => {
      let s = fight(['tempered-wait'], ['ember']);
      s = play(s, 'tempered-wait');
      s = applyAction(db, s, { type: 'endTurn' }).state;
      expect(s.sides.a.mana).toBe(RIFTWALKERS.spellblade.hero.mana + 1);
    });

    it('Stored Light: a full blade at the start of the turn gives 1 Mana and 2 Barrier', () => {
      let s = fight(['stored-light'], ['glass', 'ward']);
      s = play(s, 'stored-light');
      for (const u of s.sides.b.units) u.intent = { move: 'guard', target: null };
      s = applyAction(db, s, { type: 'endTurn' }).state;
      expect(s.sides.a.mana).toBe(RIFTWALKERS.spellblade.hero.mana + 1);
      let t = fight(['stored-light'], ['glass']);
      t = play(t, 'stored-light');
      t = applyAction(db, t, { type: 'endTurn' }).state;
      expect(t.sides.a.mana).toBe(RIFTWALKERS.spellblade.hero.mana);
    });

    it('Obsidian Resonance gives Twin Edge every turn: the first charge discharged counts twice', () => {
      let s = fight(['obsidian-resonance'], ['ember']);
      s = play(s, 'obsidian-resonance');
      for (const u of s.sides.b.units) u.intent = { move: 'guard', target: null };
      s = applyAction(db, s, { type: 'endTurn' }).state;
      for (const u of s.sides.b.units) u.barrier = 0;
      expect(hero(s).statuses.twinedge).toBe(1);
      s.sides.a.hand.push({ id: 'Z', card: 'obsidian-cut' });
      const hp = foe(s).hp;
      s = play(s, 'obsidian-cut', foe(s).id);
      expect(hp - foe(s).hp).toBe(6 + 6);
    });
  });

  describe('Ward weaving, utility and defence', () => {
    it('Wardbreak turns every Ward into 5 to all; Hold the Glass grows with Wards', () => {
      let s = fight(['hold-the-glass', 'wardbreak'], ['ward', 'ward']);
      s = play(s, 'hold-the-glass');
      expect(hero(s).barrier).toBe(9);
      s = play(s, 'wardbreak');
      expect(lost(s)).toEqual([10, 10]);
      expect(hero(s).barrier).toBe(9 + 6);
      let t = fight(['wardbreak'], ['ember']);
      t = play(t, 'wardbreak');
      expect(lost(t)).toEqual([0, 0]);
      expect(t.sides.a.enchants).toEqual(['ember']);
    });

    it('Sentinel Glass: 4 to every enemy at the end of a turn a Ward is held', () => {
      let s = fight(['sentinel-glass'], ['ward']);
      s = play(s, 'sentinel-glass');
      for (const u of s.sides.b.units) u.intent = { move: 'guard', target: null };
      s = applyAction(db, s, { type: 'endTurn' }).state;
      expect(lost(s)).toEqual([4, 4]);
    });

    it('Glass and Guard, Blunting Ward, Glimpse Through Glass, Blade Recall, Scatter Glass', () => {
      let s = fight(['glass-and-guard'], []);
      s = play(s, 'glass-and-guard');
      expect(s.sides.a.enchants).toEqual(['glass', 'ward']);
      let b = fight(['blunting-ward'], []);
      b = play(b, 'blunting-ward', foe(b).id);
      expect(foe(b).statuses.faltering).toBe(1);
      expect(b.sides.a.enchants).toEqual(['ward']);
      let g = fight(['glimpse-through-glass'], ['ward']);
      g = settle(play(g, 'glimpse-through-glass'));
      expect(g.sides.a.hand).toHaveLength(1);
      expect(hero(g).barrier).toBe(4);
      let r = fight(['blade-recall'], ['ember']);
      r.sides.a.discard = [
        { id: 'D0', card: 'obsidian-cut' },
        { id: 'D1', card: 'defend' },
      ];
      r = play(r, 'blade-recall');
      // (the blade Attack, and the trait's card for the first Imbue of the turn)
      expect(r.sides.a.hand.map((c) => c.card)[0]).toBe('obsidian-cut');
      expect(r.sides.a.hand).toHaveLength(2);
      let c = fight(['scatter-glass'], []);
      c = play(c, 'scatter-glass');
      expect(lost(c)).toEqual([4, 4]);
      expect(c.sides.a.enchants).toEqual(['glass']);
    });

    it('Purifying Shard lessens her debuffs; Shattering Rebuke breaks a Glass at once and Falters its target', () => {
      let s = fight(['purifying-shard'], []);
      hero(s).statuses.faltering = 3;
      s = play(s, 'purifying-shard');
      expect(hero(s).statuses.faltering).toBe(1);
      expect(s.sides.a.enchants).toEqual(['glass']);
      let t = fight(['shattering-rebuke'], ['glass']);
      t = play(t, 'shattering-rebuke', foe(t).id);
      expect(lost(t)).toEqual([2, 2]);
      expect(foe(t).statuses.faltering).toBe(2);
      expect(hero(t).barrier).toBe(3);
    });
  });

  describe('the Arena', () => {
    it('kind-specific discharges and pairs work against the other hero; Sentinel Glass hits a lone hero', () => {
      const deck = RIFTWALKERS.spellblade.starter;
      const { state } = createCombat(db, {
        seed: 'sb-arena',
        a: { hero: 'spellblade', deck: [...deck, ...deck], hp: 480, maxHp: 480 },
        b: { hero: 'knight', deck: [...RIFTWALKERS.knight.starter], hp: 540, maxHp: 540 },
      });
      let s = clone(state);
      s.sides.a.hand = [
        { id: 'A0', card: 'kindle-the-blade' },
        { id: 'A1', card: 'resonant-pair+' },
        { id: 'A2', card: 'sentinel-glass' },
      ];
      s.sides.a.enchants = [];
      s.sides.a.mana = 3;
      const b = hero(s, 'b');
      b.barrier = 0;
      const hp = b.hp;
      s = play(s, 'kindle-the-blade');
      s = play(s, 'resonant-pair+', hero(s, 'b').id);
      expect(hp - hero(s, 'b').hp).toBe(9 + 12);
      s = play(s, 'sentinel-glass');
      expect(s.sides.a.mana).toBe(0);
    });
  });

  it('the new cards read plainly', () => {
    const t = (id: string): string => cardText(db, db.cards[id]!);
    expect(t('glass-fang')).toBe(
      'Discharge a Glass. Deal 7 damage. If it did: Apply 2 Sapped to ALL enemies until the end of their next turn.',
    );
    expect(t('resonant-pair')).toBe(
      'Discharge both enchantments. If they were the same kind: They take effect again. Deal 6 damage.',
    );
    expect(t('wardbreak')).toContain('Discharge every Ward.');
  });

  it('every new card upgrades into something different', () => {
    for (const c of Object.values(db.cards).filter(
      (x) => x.hero === 'spellblade' && !x.id.endsWith('+'),
    )) {
      const up = db.cards[c.upgrade ?? '']!;
      expect(up, c.id).toBeDefined();
      expect(JSON.stringify(up) !== JSON.stringify({ ...c, id: up.id, name: up.name }), c.id).toBe(
        true,
      );
    }
  });
});
