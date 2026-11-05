import { describe, expect, it } from 'vitest';
import { HEARTS, COMBAT_DB } from '@sr/content/v2';
import { seedRng } from '@sr/combat';
import { newRun, chooseHeart, finishDuel, parseRun, serializeRun, type RunState } from './index';
import { changeMaxHp, heartCrossedChance } from './hearts';
import { offerCards } from './rewards';
const gift = (r: RunState): RunState => ({
  ...r,
  phase: 'gift',
  context: {
    nodeId: r.map.nodes.find((n) => n.kind === 'warden')!.id,
    hearts: HEARTS.map((h) => h.id),
    offers: [],
  },
});
const fresh = () => ({ ...newRun('knight', 'heart-economy'), maxHp: 101, hp: 101 });
describe('percentage Hearts and campaign rewards', () => {
  it('withholds exactly 5% across growth and repeated swaps, without swap healing', () => {
    let r = chooseHeart(gift(fresh()), 'gluttons-heart');
    expect(r.maxHp).toBe(95);
    expect(r.hp).toBe(95);
    expect(r.heartMaxHpLoss).toBe(6);
    changeMaxHp(r, 1);
    expect(r.maxHp).toBe(96);
    expect(r.heartMaxHpLoss).toBe(6);
    r = chooseHeart(gift(r), 'blood-heart');
    expect(r.maxHp).toBe(102);
    expect(r.hp).toBe(96);
    expect(r.heartMaxHpLoss).toBeUndefined();
    r = chooseHeart(gift(r), 'gluttons-heart');
    expect(r.maxHp).toBe(96);
    expect(r.hp).toBe(90);
  });
  it('migrates old flat -20 saves once, preserving wounds and stable ids', () => {
    const old = { ...fresh(), heart: 'gluttons-heart', maxHp: 81, hp: 60 };
    const loaded = parseRun(serializeRun(old))!;
    expect(loaded.maxHp).toBe(95);
    expect(loaded.hp).toBe(60);
    expect(loaded.heartMaxHpLoss).toBe(6);
    expect(parseRun(serializeRun(loaded))!.maxHp).toBe(95);
    for (const id of ['ember-heart', 'thorned-heart'])
      expect(parseRun(serializeRun({ ...fresh(), heart: id }))!.heart).toBe(id);
  });
  it('applies reward modifiers to normal victories and selectable Elite shards, excluding Boon income', () => {
    for (const [heart, normal, elite] of [
      ['ember-heart', 11, 27],
      ['thorned-heart', 21, 50],
    ] as const) {
      for (const kind of ['duel', 'elite'] as const) {
        const r = fresh();
        const node = r.map.nodes.find((n) => n.kind === 'duel')!;
        node.kind = kind;
        r.phase = 'duel';
        r.context = { nodeId: node.id };
        r.heart = heart;
        r.shards = 0;
        r.boons = ['coin-purse'];
        const won = finishDuel(r, true, 80);
        if (kind === 'duel') expect(won.shards).toBe(normal + 6);
        else {
          expect(won.shards).toBe(6);
          expect(won.context?.spoils?.shards).toBe(elite);
        }
      }
    }
  });
  it('uses 10%, 0% or default 3% in ordinary card offers', () => {
    expect(heartCrossedChance({ ...fresh(), heart: 'ember-heart' })).toBe(10);
    expect(heartCrossedChance({ ...fresh(), heart: 'thorned-heart' })).toBe(0);
    expect(heartCrossedChance(fresh())).toBe(3);
    for (let seed = 0; seed < 20; seed++)
      for (const id of offerCards(seedRng('heart' + seed), 'knight', [], 'duel', 4, 0))
        expect(COMBAT_DB.cards[id]!.hero).toMatch(/knight|neutral/);
    expect(
      offerCards(seedRng('crossed'), 'knight', [], 'duel', 4, 100).every(
        (id) => !['knight', 'neutral'].includes(COMBAT_DB.cards[id]!.hero ?? ''),
      ),
    ).toBe(true);
  });
});
