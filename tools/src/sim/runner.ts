// Runs batches of games, optionally across worker threads, and summarises the results.

import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import type { Rules } from '@sr/engine';
import { playGame, type AiSpec, type DeckSpec, type GameResult, type GameTask } from './play';

export interface MatchSpec {
  a: DeckSpec;
  b: DeckSpec;
  games: number;
  seed: string;
  aiA: AiSpec;
  aiB: AiSpec;
  rules?: Partial<Rules>;
}

export interface MatchSummary {
  games: number;
  aWins: number;
  bWins: number;
  draws: number;
  /** Deck A's win rate, counting a draw as half a win. */
  aRate: number;
  /** 95% Wilson interval on aRate (draws as half). */
  ci: [number, number];
  avgTurns: number;
  aWinsWhenFirst: number;
  aGamesFirst: number;
}

export function defaultWorkers(): number {
  return Math.max(1, Math.min(8, cpus().length - 1));
}

export function tasksFor(m: MatchSpec): GameTask[] {
  return Array.from({ length: m.games }, (_, i) => ({
    seed: `${m.seed}-${i}`,
    a: m.a,
    b: m.b,
    aiA: m.aiA,
    aiB: m.aiB,
    aFirst: i % 2 === 0,
    ...(m.rules ? { rules: m.rules } : {}),
  }));
}

export async function runTasks(tasks: GameTask[], workers: number): Promise<GameResult[]> {
  if (workers <= 1 || tasks.length < 8) return tasks.map((t) => playGame(t));
  const n = Math.min(workers, tasks.length);
  const chunks: GameTask[][] = Array.from({ length: n }, () => []);
  tasks.forEach((t, i) => (chunks[i % n] as GameTask[]).push(t));
  const parts = await Promise.all(
    chunks.map(
      (chunk) =>
        new Promise<GameResult[]>((resolve, reject) => {
          const w = new Worker(new URL('./worker-entry.mjs', import.meta.url));
          w.once('message', (r: GameResult[]) => {
            resolve(r);
            void w.terminate();
          });
          w.once('error', reject);
          w.postMessage(chunk);
        }),
    ),
  );
  // restore the original task order so results are reproducible regardless of worker count
  const out: GameResult[] = new Array<GameResult>(tasks.length);
  parts.forEach((part, w) => part.forEach((r, k) => (out[w + k * n] = r)));
  return out;
}

export function summarise(results: GameResult[]): MatchSummary {
  const aWins = results.filter((r) => r.winner === 'a').length;
  const bWins = results.filter((r) => r.winner === 'b').length;
  const draws = results.length - aWins - bWins;
  const n = results.length;
  const p = n === 0 ? 0 : (aWins + draws / 2) / n;
  // Wilson score interval
  const z = 1.96;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  const first = results.filter((r) => r.aFirst);
  return {
    games: n,
    aWins,
    bWins,
    draws,
    aRate: p,
    ci: [Math.max(0, centre - half), Math.min(1, centre + half)],
    avgTurns: results.reduce((t, r) => t + r.turns, 0) / Math.max(1, n),
    aWinsWhenFirst: first.filter((r) => r.winner === 'a').length,
    aGamesFirst: first.length,
  };
}

export async function runMatch(m: MatchSpec, workers: number): Promise<MatchSummary> {
  return summarise(await runTasks(tasksFor(m), workers));
}
