// Shared seeds (DECISIONS #698): a run's randomness starts afresh at each stop and each tier's map, from the seed, so two players on one
// seed meet the same maps and the same offers at the same stop, whatever route they took to it.

import { describe, expect, it } from 'vitest';
import { nextInt, seedRng } from '@sr/combat';
import { availableNodes, duelPlan, enterNode, finishDuel, newRun, type RunState } from './index';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

/** The run's first stop, made a merchant (whose stock is all randomness). */
function merchantAt(r: RunState): RunState {
  const node = availableNodes(r)[0]!;
  return enterNode(
    {
      ...r,
      map: {
        ...r.map,
        nodes: r.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'merchant' } : n)),
      },
    },
    node.id,
  );
}

describe('shared seeds', () => {
  it('a new run keeps the seed it was made from', () => {
    expect(newRun('necromancer', 'K7QM2XRP').seedCode).toBe('K7QM2XRP');
    expect(newRun('necromancer', 'run-1', 'normal', 'K7QM2XRP').seedCode).toBe('K7QM2XRP');
  });

  it('two runs on one shared seed have the same maps and Wardens, but are two runs', () => {
    const a = newRun('necromancer', 'run-1', 'normal', 'K7QM2XRP');
    const b = newRun('necromancer', 'run-2', 'normal', 'K7QM2XRP');
    expect(b.seed).not.toBe(a.seed);
    expect(b.wardenOrder).toEqual(a.wardenOrder);
    expect(b.realmOrder).toEqual(a.realmOrder);
    expect(b.map).toEqual(a.map);
  });

  it('a stop offers the same whatever randomness was used before it', () => {
    const a = open(newRun('necromancer', 'K7QM2XRP'));
    // (another route: the run's stream has moved on before this stop)
    const moved = seedRng('another route');
    for (let i = 0; i < 25; i++) nextInt(moved, 100);
    const b = { ...a, rng: moved };
    expect(merchantAt(b).context).toEqual(merchantAt(a).context);
  });

  it('a run saved before shared seeds keeps its one stream', () => {
    const { seedCode: _, ...legacy } = open(newRun('necromancer', 'K7QM2XRP'));
    const moved = seedRng('another route');
    for (let i = 0; i < 25; i++) nextInt(moved, 100);
    const a = merchantAt(legacy);
    const b = merchantAt({ ...legacy, rng: moved });
    expect(b.context).not.toEqual(a.context);
  });

  it('a fight is dealt from the seed and the losses at its stop, not the run’s', () => {
    const a = open(newRun('necromancer', 'run-1', 'normal', 'K7QM2XRP'));
    const fightNode = availableNodes(a).find((n) => n.kind === 'duel')!;
    const fresh = enterNode({ ...a, map: { ...a.map } }, fightNode.id);
    // (a player who lost fights earlier on)
    const scarred = enterNode(
      { ...a, stats: { ...a.stats, duelsLost: 3 }, resolve: 9 },
      fightNode.id,
    );
    expect(duelPlan(scarred)!.seed).toBe(duelPlan(fresh)!.seed);
    // a retry at this stop is dealt differently
    const retry = finishDuel({ ...fresh, resolve: 9 }, false, 0);
    expect(retry.phase).toBe('duel');
    expect(duelPlan(retry)!.seed).not.toBe(duelPlan(fresh)!.seed);
  });
});
