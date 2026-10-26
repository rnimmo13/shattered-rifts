// The deck optimizer: what a player hunting for the strongest deck converges on. Starting from a drafted deck it tries swapping,
// adding and removing cards (upgraded versions from the character's whole reward pool, deck rules respected) and keeps a change when
// the deck deals more damage over the opening rounds (played by the beam bot against a target that cannot die). The result is a
// damage ceiling for the character: if one character's ceiling is far above the others', it has a broken combination.

import { applyAction, chooseSmartAction, createCombat, type CombatEvent } from '@sr/combat';
import { COMBAT_DB as db, rewardPool, V2_DECK_RULES, type HeroId } from '@sr/content/v2';
import { buildDeck, hashSeed, rng, type Level } from './decks';

export interface OptimizeSpec {
  hero: HeroId;
  lane: number;
  level: Level;
  /** rounds of damage that count */
  rounds: number;
  seeds: number;
  iterations: number;
  movesPerIteration: number;
  dmgPct: number;
  /** search without the drafted deck's Boons (the Arena) */
  noBoons?: boolean;
}

function dealt(events: readonly CombatEvent[], foes: Set<string>): number {
  let n = 0;
  for (const e of events) if (e.type === 'damage' && foes.has(e.target)) n += e.lost + e.blocked;
  return n;
}

/** damage over the first `rounds` rounds, per round: the bot plays, the target never dies */
export function openingDamage(
  hero: HeroId,
  deck: string[],
  boons: string[],
  seed: string,
  rounds: number,
  dmgPct: number,
): number[] {
  let { state } = createCombat(db, {
    seed,
    a: { hero, deck, boons },
    b: { enemies: ['seraphine'], hpPct: 4000, dmgPct },
  });
  const per: number[] = [];
  let round = 0;
  for (let g = 0; g < 400 && !state.winner && per.length < rounds; g++) {
    const foes = new Set(state.sides.b.units.map((u) => u.id));
    const a = chooseSmartAction(db, state, { budget: 300 });
    const res = applyAction(db, state, a);
    round += dealt(res.events, foes);
    state = res.state;
    if (a.type === 'endTurn') {
      per.push(round);
      round = 0;
    }
  }
  while (per.length < rounds) per.push(0);
  return per;
}

function legal(deck: string[]): boolean {
  if (deck.length < V2_DECK_RULES.minSize) return false;
  const count = new Map<string, number>();
  let legends = 0;
  for (const id of deck) {
    const base = id.replace(/\+$/, '');
    count.set(base, (count.get(base) ?? 0) + 1);
    const c = db.cards[id];
    if (c?.rarity === 'legendary') legends++;
    const lim =
      c?.rarity === 'legendary' ? 1 : c?.rarity === 'basic' ? 99 : V2_DECK_RULES.maxCopies;
    if ((count.get(base) ?? 0) > lim) return false;
  }
  return legends <= V2_DECK_RULES.maxLegendary;
}

export interface OptimizeResult {
  deck: string[];
  boons: string[];
  /** average total damage over the counted rounds */
  score: number;
  /** average damage per round, round by round */
  perRound: number[];
}

export function optimize(o: OptimizeSpec): OptimizeResult {
  const r = rng(hashSeed(`opt/${o.hero}/${o.lane}/${o.level}`));
  const start = buildDeck(o.hero, o.lane, o.level, hashSeed(`${o.hero}/${o.lane}/${o.level}/0`));
  const boons = o.noBoons ? [] : start.boons;
  const pool = rewardPool(o.hero).map((id) => db.cards[id]?.upgrade ?? id);
  const seeds = Array.from({ length: o.seeds }, (_, i) => `opt-${i}`);
  const evaluate = (deck: string[]): { score: number; perRound: number[] } => {
    const per = Array<number>(o.rounds).fill(0);
    for (const s of seeds)
      openingDamage(o.hero, deck, boons, s, o.rounds, o.dmgPct).forEach(
        (d, i) => (per[i]! += d / seeds.length),
      );
    return { score: per.reduce((a, b) => a + b, 0), perRound: per };
  };
  let deck = [...start.deck];
  let best = evaluate(deck);
  for (let it = 0; it < o.iterations; it++) {
    let bestMove: { deck: string[]; v: { score: number; perRound: number[] } } | null = null;
    for (let m = 0; m < o.movesPerIteration; m++) {
      const next = [...deck];
      const kind = r();
      const card = pool[Math.floor(r() * pool.length)] as string;
      if (kind < 0.6)
        next[Math.floor(r() * next.length)] = card; // swap
      else if (kind < 0.8)
        next.push(card); // add
      else next.splice(Math.floor(r() * next.length), 1); // remove
      if (!legal(next)) continue;
      const v = evaluate(next);
      if (v.score > (bestMove?.v.score ?? best.score)) bestMove = { deck: next, v };
    }
    if (!bestMove) continue;
    deck = bestMove.deck;
    best = bestMove.v;
  }
  return { deck, boons, score: best.score, perRound: best.perRound };
}
