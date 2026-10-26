// One audit worker: receives jobs, builds the deck, plays the fight (or runs the burst oracle or the optimizer), posts the numbers back.

import { parentPort } from 'node:worker_threads';
import type { HeroId } from '@sr/content/v2';
import { buildDeck, hashSeed, type Level } from './decks';
import { burst, playFight } from './fight';
import { optimize } from './optimize';

export interface Job {
  id: number;
  kind: 'fight' | 'burst' | 'optimize';
  hero: HeroId;
  path: number;
  level: Level;
  deckSeed: number;
  enemies: string[];
  hpPct: number;
  dmgPct: number;
  seed: string;
  /** burst: which round to search */
  turn?: number;
  budget?: number;
  /** a deck to play as it is (instead of drafting one), with its Boons */
  deck?: string[];
  boons?: string[];
  /** play the drafted deck without its Boons (the Arena, DECISIONS #236) */
  noBoons?: boolean;
  /** optimize: rounds counted, seeds, iterations, moves per iteration */
  opt?: { rounds: number; seeds: number; iterations: number; moves: number };
}

parentPort?.on('message', (jobs: Job[]) => {
  const out = jobs.map((j) => {
    if (j.kind === 'optimize') {
      const o = j.opt ?? { rounds: 3, seeds: 3, iterations: 10, moves: 24 };
      return {
        id: j.id,
        optimize: optimize({
          hero: j.hero,
          path: j.path,
          level: j.level,
          rounds: o.rounds,
          seeds: o.seeds,
          iterations: o.iterations,
          movesPerIteration: o.moves,
          dmgPct: j.dmgPct,
          ...(j.noBoons ? { noBoons: true } : {}),
        }),
      };
    }
    const d = j.deck
      ? { deck: j.deck, boons: j.boons ?? [] }
      : buildDeck(
          j.hero,
          j.path,
          j.level,
          hashSeed(`${j.hero}/${j.path}/${j.level}/${j.deckSeed}`),
        );
    const spec = {
      hero: j.hero,
      deck: d.deck,
      boons: j.noBoons ? [] : d.boons,
      enemies: j.enemies,
      hpPct: j.hpPct,
      dmgPct: j.dmgPct,
      seed: j.seed,
    };
    if (j.kind === 'burst') return { id: j.id, burst: burst(spec, j.turn ?? 1) };
    return {
      id: j.id,
      fight: playFight(j.budget === undefined ? spec : { ...spec, budget: j.budget }),
    };
  });
  parentPort?.postMessage(out);
});
