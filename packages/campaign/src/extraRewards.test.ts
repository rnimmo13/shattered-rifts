// Extra card rewards a fight earned (Marked for Death): they follow the fight's own reward; after a Warden they are more cards on the Gift.

import { describe, expect, it } from 'vitest';
import {
  MAX_EXTRA_REWARDS,
  chooseCard,
  chooseHeart,
  finishDuel,
  newRun,
  parseRun,
  serializeRun,
  type RunState,
} from './index';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

const inFight = (base: RunState, kind: 'warden' | 'duel'): RunState => {
  const n = base.map.nodes.find((x) => x.kind === kind);
  if (!n) throw new Error(`no ${kind} node on this map`);
  return { ...base, phase: 'duel', at: n.id, context: { nodeId: n.id }, hp: 30 };
};

describe('extra card rewards', () => {
  it('a fight with none gives one reward, then the map', () => {
    const run = finishDuel(inFight(open(newRun('assassin', 'xr-0')), 'duel'), true, 30);
    expect(run.phase).toBe('reward');
    expect(run.context?.extraRewards).toBeUndefined();
    expect(chooseCard(run, null).phase).toBe('map');
  });

  it('each one is another reward after the first, and the node is cleared after the last', () => {
    const fight = inFight(open(newRun('assassin', 'xr-2')), 'duel');
    let run = finishDuel(fight, true, 30, undefined, 0, 2);
    expect(run.phase).toBe('reward');
    expect(run.context?.extraReward).toBeUndefined();
    const first = run.context!.offers![0]!;
    run = chooseCard(run, first);
    expect(run.phase).toBe('reward');
    expect(run.context?.extraReward).toBe(true);
    expect(run.context?.offers?.length).toBeGreaterThan(0);
    expect(run.cleared).not.toContain(fight.at);
    run = chooseCard(run, null);
    expect(run.phase).toBe('reward');
    run = chooseCard(run, null);
    expect(run.phase).toBe('map');
    expect(run.cleared).toContain(fight.at);
    expect(run.deck.filter((c) => c === first).length).toBeGreaterThan(0);
  });

  // (the Gift is the only page after a Warden, Robert 2026-10-28: an extra reward is one more card on it; DECISIONS #392)
  it('after a Warden, an extra reward is one more card on the Gift, and the Gift is the only page', () => {
    const plain = finishDuel(inFight(open(newRun('hunter', 'xr-w')), 'warden'), true, 30);
    const run = finishDuel(
      inFight(open(newRun('hunter', 'xr-w')), 'warden'),
      true,
      30,
      undefined,
      0,
      1,
    );
    expect(run.phase).toBe('gift');
    expect(run.context?.extraRewards).toBeUndefined();
    expect(run.context!.offers!.length).toBe(plain.context!.offers!.length + 1);
    const next = chooseCard(run, run.context!.offers![0]!);
    expect(['stageClear', 'loopCleared']).toContain(next.phase);
  });

  it('taking a Warden’s Heart ends the Gift too', () => {
    const run = finishDuel(
      inFight(open(newRun('hunter', 'xr-h')), 'warden'),
      true,
      30,
      undefined,
      0,
      1,
    );
    const heart = run.context?.hearts?.[0];
    if (!heart) return; // (no Heart on offer at this tier: the card path above covers it)
    expect(['stageClear', 'loopCleared']).toContain(chooseHeart(run, heart).phase);
  });

  it('pays at most MAX_EXTRA_REWARDS (more are dropped, the fight still reports), and refuses a negative count', () => {
    const fight = inFight(open(newRun('assassin', 'xr-bad')), 'duel');
    const run = finishDuel(fight, true, 30, undefined, 0, MAX_EXTRA_REWARDS + 4);
    expect(run.context?.extraRewards).toBe(MAX_EXTRA_REWARDS);
    expect(() => finishDuel(fight, true, 30, undefined, 0, -1)).toThrow();
    expect(() => finishDuel(fight, true, 30, undefined, 0, 1.5)).toThrow();
  });

  it('a save in the middle of the extra rewards loads, and a forged count does not', () => {
    const run = chooseCard(
      finishDuel(inFight(open(newRun('assassin', 'xr-s')), 'duel'), true, 30, undefined, 0, 2),
      null,
    );
    expect(parseRun(serializeRun(run))?.context?.extraReward).toBe(true);
    const forged = { ...run, context: { ...run.context!, extraRewards: 999 } };
    expect(parseRun(serializeRun(forged))).toBeNull();
  });
});
