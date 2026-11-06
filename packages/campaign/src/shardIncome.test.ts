import { describe, expect, it } from 'vitest';
import {
  chooseSpoil,
  finishDuel,
  newRun,
  parseRun,
  serializeRun,
  shopPrice,
  type RunState,
} from './index';
import { FIGHT_SHARDS, eliteRewards } from './run';
import { BOON_PRICE, PRICE, REMOVE_PRICE, UPGRADE_PRICE } from './rewards';

function fight(kind: 'duel' | 'elite' | 'warden', tier: number): RunState {
  const r = newRun('knight', `shards-${kind}-${tier}`);
  const node = r.map.nodes.find((n) => n.kind === 'duel')!;
  node.kind = kind;
  r.tier = tier;
  r.phase = 'duel';
  r.context = { nodeId: node.id };
  return r;
}
describe('Campaign shard income', () => {
  it.each([
    [1, 25, 50, 100],
    [6, 19, 32, 74],
    [11, 16, 23, 64],
    [12, 16, 22, 62],
  ])(
    'pays the new bases through existing tier reductions at Tier %i',
    (tier, normal, elite, warden) => {
      expect(FIGHT_SHARDS).toEqual({ duel: 25, elite: 50, warden: 100 });
      for (const [kind, expected] of [
        ['duel', normal],
        ['elite', elite],
        ['warden', warden],
      ] as const) {
        const r = fight(kind, tier);
        r.shards = 7;
        const won = finishDuel(r, true, r.hp);
        if (kind === 'elite') {
          expect(won.shards).toBe(7);
          expect(won.context?.spoils?.shards).toBe(expected);
          expect(chooseSpoil(won, 'shards').shards).toBe(7 + expected);
        } else expect(won.shards).toBe(7 + expected);
      }
    },
  );
  it('keeps shop bases, inflation, Elite fading and HP alternatives intact', () => {
    expect([PRICE.common, PRICE.rare, REMOVE_PRICE, UPGRADE_PRICE, BOON_PRICE]).toEqual([
      30, 95, 50, 75, 70,
    ]);
    expect(eliteRewards(12).shards).toBe(35);
    expect(eliteRewards(19).shards).toBe(25);
    expect(shopPrice(fight('duel', 12), PRICE.rare!)).toBe(162);
    const r = fight('elite', 1);
    r.shards = 7;
    const won = finishDuel(r, true, r.hp);
    expect(chooseSpoil(won, 'maxHp').shards).toBe(7);
  });
  it('does not grant money on defeat or retroactively rewrite a saved spoil offer', () => {
    const r = fight('duel', 1);
    r.shards = 7;
    expect(finishDuel(r, false).shards).toBe(7);
    const elite = fight('elite', 1);
    elite.shards = 7;
    const pending = finishDuel(elite, true, elite.hp);
    pending.context!.spoils = { shards: 36 };
    const restored = parseRun(serializeRun(pending))!;
    expect(restored.context?.spoils?.shards).toBe(36);
    expect(chooseSpoil(restored, 'shards').shards).toBe(43);
  });
  it('retains Drago’s immediate completion with no post-victory shard payout', () => {
    const r = fight('warden', 12);
    r.shards = 7;
    r.map.nodes.find((n) => n.id === r.context!.nodeId)!.enemyId = 'vorthax';
    const won = finishDuel(r, true, r.hp);
    expect(won.won).toBe(true);
    expect(won.shards).toBe(7);
  });
});
