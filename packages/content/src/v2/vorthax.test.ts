// Vorthax, the Heart of the Rift (DECISIONS #547): four quarters, each with Wardens' rules, and the Rift closing at the last.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  describeIntent,
  legalActions,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, encounter } from './index';

/** Stress fixture at 1000% HP / 499% damage; the actual Tier XX plan is tested separately. */
function finale(): CombatState {
  const { state } = createCombat(db, {
    seed: 'vorthax',
    a: { hero: 'knight', deck: [...RIFTWALKERS.knight.starter, ...RIFTWALKERS.knight.starter] },
    b: { enemies: encounter('vorthax').units, tier: 1, hpPct: 1000, dmgPct: 499 },
  });
  const s = clone(state);
  const h = s.sides.a.units.find((u) => u.kind === 'hero')!;
  h.hp = h.maxHp = 90000;
  return s;
}
const vx = (s: CombatState): Unit => s.sides.b.units.find((u) => u.def === 'vorthax')!;
const heroOf = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
/** Vorthax at this share of its max HP, with this move next. */
function at(pct: number, move: string): CombatState {
  const s = finale();
  const v = vx(s);
  v.hp = Math.floor((v.maxHp * pct) / 100);
  v.intent = { move, target: heroOf(s).id };
  return s;
}

describe('Vorthax, the Heart of the Rift', () => {
  it('says its rule, and stands behind a Rift Ward that aimed attacks must break', () => {
    expect(encounter('vorthax').rule).toBeTruthy();
    const s = finale();
    const ward = s.sides.b.units.find((u) => u.def === 'rift-ward')!;
    s.sides.a.mana = 9;
    s.sides.a.hand = [{ id: 'V0', card: 'strike' }];
    const aims = legalActions(db, s).filter((a) => a.type === 'play' && a.card === 'V0');
    expect(aims.map((a) => (a as { target?: string }).target)).toEqual([ward.id]);
  });

  it('its Barrier is a share of its max HP, so it counts at Tier XX', () => {
    const s = at(90, 'refract');
    s.sides.b.units = s.sides.b.units.filter((u) => u.def !== 'rift-ward');
    const r = endTurn(s);
    expect(vx(r).barrier).toBe(Math.floor(vx(s).maxHp * 0.02));
    expect(vx(r).maxHp).toBe(3000);
  });

  it('when it falls, its Ward and Shards fall with it', () => {
    // (the Shattering raised two Shards; the Ward is gone, so a Strike can reach it)
    const s = clone(endTurn(at(70, 'shatter')));
    s.sides.b.units = s.sides.b.units.filter((u) => u.def !== 'rift-ward');
    expect(s.sides.b.units.filter((u) => u.def === 'rift-shard').length).toBeGreaterThan(0);
    const v = vx(s);
    v.hp = 1;
    v.barrier = 0;
    delete v.statuses.slippery;
    delete v.statuses.shielded;
    s.sides.a.mana = 9;
    s.sides.a.hand = [{ id: 'V0', card: 'strike' }];
    const r = applyAction(db, s, { type: 'play', card: 'V0', target: v.id }).state;
    expect(r.sides.b.units).toHaveLength(0);
    expect(r.winner).toBe('a');
  });

  it('its intents say whose max HP, and a curse on you shows as one', () => {
    const fate = describeIntent(db, at(24, 'close'), vx(at(24, 'close')))!;
    expect(fate.text).toContain('your max HP');
    expect(fate.icons).toContain('debuff');
    const pull = describeIntent(db, at(49, 'pull'), vx(at(49, 'pull')))!;
    expect(pull.text).toContain('its max HP');
    expect(pull.icons).toContain('debuff');
  });

  it('II: at three quarters it Shatters, two Shards rise, and it is Veiled', () => {
    const s = at(74, 'collapse');
    const r = endTurn(s);
    // (its next move is the quarter's opening one)
    expect(vx(r).intent?.move).toBe('shatter');
    const r2 = endTurn(r);
    expect(r2.sides.b.units.filter((u) => u.def === 'rift-shard').length).toBeGreaterThanOrEqual(2);
    expect(vx(r2).statuses.veiled ?? 0).toBeGreaterThan(0);
  });

  it('II: it feeds on its Shards, or starves Exposed', () => {
    const s = at(70, 'shatter');
    const fed = clone(endTurn(s));
    // (no Ward humming, so only the feeding gives Might)
    fed.sides.b.units = fed.sides.b.units.filter((u) => u.def !== 'rift-ward');
    const v = vx(fed);
    v.intent = { move: 'feed', target: heroOf(fed).id };
    v.hp = v.maxHp - 2000;
    const before = v.statuses.might ?? 0;
    const after = endTurn(fed);
    expect(after.sides.b.units.filter((u) => u.def === 'rift-shard')).toHaveLength(0);
    // (1 Might a Shard)
    expect((vx(after).statuses.might ?? 0) - before).toBe(2);
    expect(vx(after).hp).toBe(v.hp + 2 * Math.floor(v.maxHp * 0.02));
    const lean = clone(fed);
    lean.sides.b.units = lean.sides.b.units.filter((u) => u.def !== 'rift-shard');
    expect(vx(endTurn(lean)).statuses.exposed ?? 0).toBeGreaterThan(0);
  });

  it('III: at half it Pulls: Gravity and Unmaking on you', () => {
    const s = at(49, 'pull');
    const r = endTurn(s);
    expect(heroOf(r).statuses.gravity).toBe(2);
    // (the Unmaking is spent on the hand just drawn)
    expect(heroOf(r).statuses.unmaking ?? 0).toBe(0);
    expect(r.sides.a.exhausted.length).toBeGreaterThan(0);
  });

  it('IV: the Rift closes: Fate on you every move, a share of your max HP, and it grows Slippery', () => {
    // (a Beam first; the quarter's opening move, the Prismatic Core, comes next)
    const s = at(24, 'beam2');
    const r = endTurn(s);
    const max = heroOf(r).maxHp;
    expect(heroOf(r).statuses.doom).toBe(Math.floor(max * 0.08));
    expect(vx(r).intent?.move).toBe('core');
    const r2 = endTurn(r);
    expect(heroOf(r2).statuses.doom).toBe(Math.floor(max * 0.08) + Math.floor(max * 0.1));
    expect(vx(r2).statuses.slippery).toBe(3);
    expect(vx(r2).statuses.shielded).toBe(2);
  });

  it('IV: Fate kills a hero that cannot finish it', () => {
    const s = at(24, 'close');
    const h = heroOf(s);
    h.maxHp = 400;
    h.hp = 340;
    h.statuses.doom = 300;
    s.sides.a.hand = [];
    // (340 is above 300 as the first turn ends; The Rift Closes adds 12% of 400, and 340 is below 348 as the next ends)
    const one = endTurn(s);
    expect(one.winner).toBeFalsy();
    expect(endTurn(one).winner).toBe('b');
  });
});
