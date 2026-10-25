// Fights for the balance audit. The player side is the beam-search bot (it plans a whole turn, so it finds setups a greedy bot
// misses); the burst oracle searches one turn for the most damage it can deal, which is what a person hunting a combo finds.

import {
  applyAction,
  chooseSmartAction,
  createCombat,
  heroOf,
  legalActions,
  type CombatState,
  type CombatEvent,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';

export interface FightSpec {
  hero: HeroId;
  deck: string[];
  boons: string[];
  enemies: string[];
  hpPct: number;
  dmgPct: number;
  seed: string;
  /** beam budget for the player's bot */
  budget?: number;
}

export interface FightResult {
  won: boolean;
  /** the player's turns until the fight ended */
  turns: number;
  /** share of max HP lost (1 = all of it) */
  hpLost: number;
  /** most damage dealt to the enemy side in one round (the player's turn plus allies, triggers, Thorns) */
  peak: number;
  /** total enemy HP at the start (front line, before summons) */
  enemyHp: number;
  /** damage dealt in the first round */
  first: number;
  stalled: boolean;
}

/** max HP with the Boons that raise it (the campaign applies those; the engine does not) */
const maxHpOf = (hero: HeroId, boons: string[]): number =>
  RIFTWALKERS[hero].hero.maxHp + boons.reduce((n, b) => n + (db.boons?.[b]?.maxHp ?? 0), 0);

function dealt(events: readonly CombatEvent[], foes: Set<string>): number {
  let n = 0;
  for (const e of events) if (e.type === 'damage' && foes.has(e.target)) n += e.lost + e.blocked;
  return n;
}

const foeIds = (s: CombatState): Set<string> => new Set(s.sides.b.units.map((u) => u.id));

export function playFight(f: FightSpec): FightResult {
  const maxHp = maxHpOf(f.hero, f.boons);
  let { state } = createCombat(db, {
    seed: f.seed,
    a: { hero: f.hero, deck: f.deck, boons: f.boons, hp: maxHp, maxHp },
    b: { enemies: f.enemies, hpPct: f.hpPct, dmgPct: f.dmgPct },
  });
  const enemyHp = state.sides.b.units.reduce((s, u) => s + u.hp, 0);
  let turns = 0;
  let round = 0;
  let peak = 0;
  let first = -1;
  let steps = 0;
  for (; steps < 3000 && !state.winner; steps++) {
    const act =
      state.active === 'a' || state.pending
        ? chooseSmartAction(db, state, { budget: f.budget ?? 500 })
        : ({ type: 'endTurn' } as const);
    const foes = foeIds(state);
    const res = applyAction(db, state, act);
    round += dealt(res.events, foes);
    if (act.type === 'endTurn') {
      turns++;
      peak = Math.max(peak, round);
      if (first < 0) first = round;
      round = 0;
    }
    state = res.state;
  }
  peak = Math.max(peak, round);
  if (first < 0) first = round;
  const hp = heroOf(state.sides.a)?.hp ?? 0;
  return {
    won: state.winner === 'a',
    turns: turns + (state.winner === 'a' && round > 0 ? 1 : 0),
    hpLost: Math.max(0, (maxHp - hp) / maxHp),
    peak,
    enemyHp,
    first,
    stalled: !state.winner,
  };
}

/**
 * The most damage the deck can deal in round `turn` (1 = the opening) against an enemy too big to die, searching every order of plays
 * with a wide beam. Rounds before it are played by the smart bot as usual. Counts the end of the turn too (allies, totems, triggers).
 */
export function burst(f: FightSpec, turn = 1, width = 24, budget = 6000): number {
  const maxHp = maxHpOf(f.hero, f.boons);
  let { state } = createCombat(db, {
    seed: f.seed,
    a: { hero: f.hero, deck: f.deck, boons: f.boons, hp: maxHp, maxHp },
    // a target that cannot die, so overkill is never wasted and the whole turn counts
    b: { enemies: f.enemies, hpPct: 4000, dmgPct: f.dmgPct },
  });
  // (in PvE the enemy turn resolves inside the player's End turn, so a round ends when the bot ends its turn)
  for (let t = 1; t < turn && !state.winner; t++) {
    for (let g = 0; g < 200 && !state.winner; g++) {
      const a = chooseSmartAction(db, state);
      state = applyAction(db, state, a).state;
      if (a.type === 'endTurn') break;
    }
  }
  if (state.winner) return 0;
  interface Line {
    s: CombatState;
    d: number;
  }
  let frontier: Line[] = [{ s: state, d: 0 }];
  let best = 0;
  const foes = foeIds(state);
  for (let depth = 0; depth < 25 && frontier.length && budget > 0; depth++) {
    const next: Line[] = [];
    for (const line of frontier) {
      for (const a of legalActions(db, line.s)) {
        if (budget-- <= 0) break;
        let res;
        try {
          res = applyAction(db, line.s, a);
        } catch {
          continue;
        }
        const d = line.d + dealt(res.events, foes);
        if (a.type === 'endTurn' || res.state.active !== 'a' || res.state.winner) {
          // the round ends: allies and end-of-turn effects have resolved in these events
          best = Math.max(best, d);
          continue;
        }
        next.push({ s: res.state, d });
      }
    }
    // keep the most promising lines: damage so far, then Mana and cards still in hand
    next.sort(
      (x, y) =>
        y.d -
        x.d +
        (y.s.sides.a.mana - x.s.sides.a.mana) * 4 +
        (y.s.sides.a.hand.length - x.s.sides.a.hand.length) * 2,
    );
    frontier = next.slice(0, width);
  }
  return best;
}
