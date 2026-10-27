// The fight recap: a fight played again from its seed and its moves (the engine is deterministic, so it comes out the same), and
// added up. What hurt you most and the blow that ended it (a death recap), your best turns, and the whole battle log in words.
// Pure: no React, no storage. The recap and the replay are both built from the same two things a fight already keeps.

import {
  applyAction,
  createCombat,
  type Action,
  type CombatDb,
  type CombatEvent,
  type CombatSetup,
  type CombatState,
  type Side,
} from '@sr/combat';
import { Namer, createDescriber, type LogLine } from './logLines';
import type { VenueId } from '../duel/scene/venue';

/** One move of a fight, and whose it was (a campaign fight's are all seat a; enemy turns live inside End turn). */
export interface FightMove {
  seat: Side;
  action: Action;
  /** the game's fingerprint after this move, as it was played (an Arena replay): a replay checks it plays out the same */
  hash?: string;
}

/** A fight that can be watched again: what it was set up with, and every move made in it. */
export interface FightReplay {
  setup: CombatSetup;
  moves: FightMove[];
  /** the title it was shown under */
  title: string;
  /** whose side it is seen from */
  me: Side;
  /** PvP: each seat's name (none for a campaign fight) */
  names?: Record<Side, string>;
  /** where it was fought (the Rift arena when missing) */
  venue?: VenueId;
  /** PvP: where each player's deck had got to in the campaign, for their name tags */
  progress?: Record<Side, { tier: number; stage?: number }>;
}

export interface DamageSource {
  name: string;
  amount: number;
  hits: number;
}

export interface BestTurn {
  /** the round (Turn N on screen) */
  round: number;
  dealt: number;
  /** the cards played that turn, in order ("Strike ×2") */
  cards: string[];
}

export interface Recap {
  winner: Side | 'draw' | null;
  rounds: number;
  /** damage your side dealt (Barrier it broke included) and your hero took (HP lost; Barrier soaked is `blocked`) */
  dealt: number;
  taken: number;
  blocked: number;
  healed: number;
  cardsPlayed: number;
  /** what took your hero's HP, most first */
  takenFrom: DamageSource[];
  /** your three biggest turns, biggest first */
  bestTurns: BestTurn[];
  /** the hardest single blow your hero took */
  biggestHit: { name: string; amount: number; round: number } | null;
  /** your hero fell: the blow that did it, and how much it lost in its last round */
  killer: { name: string; amount: number; round: number; lastRound: number } | null;
}

export interface Replayed {
  recap: Recap;
  lines: LogLine[];
  /** the moves could not all be played again (the rules changed since): the recap covers the moves up to there */
  broken: boolean;
}

const pretty = (id: string): string =>
  id.replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** "Strike ×2, Bash" from the cards played in a turn. */
function tally(names: readonly string[]): string[] {
  const out: { name: string; n: number }[] = [];
  for (const n of names) {
    const hit = out.find((x) => x.name === n);
    if (hit) hit.n++;
    else out.push({ name: n, n: 1 });
  }
  return out.map((x) => (x.n > 1 ? `${x.name} ×${x.n}` : x.name));
}

/**
 * Play a fight again from its setup and moves, and add it up, seen from `me`. `foeHero` names the opposing hero in a PvP match
 * (as the live log does).
 */
export function replayFight(
  db: CombatDb,
  setup: CombatSetup,
  moves: readonly FightMove[],
  me: Side,
  foeHero: string | null = null,
): Replayed {
  const namer = new Namer(me, foeHero);
  const describe = createDescriber({
    db,
    me,
    nameOf: (id) => namer.nameOf(id),
    sideOf: (id) => namer.sideOf(id),
    defOf: (id) => namer.defOf(id),
    who: (side) => (side === me ? 'You' : (foeHero ?? 'Enemy')),
  });
  const lines: LogLine[] = [];
  const recap: Recap = {
    winner: null,
    rounds: 0,
    dealt: 0,
    taken: 0,
    blocked: 0,
    healed: 0,
    cardsPlayed: 0,
    takenFrom: [],
    bestTurns: [],
    biggestHit: null,
    killer: null,
  };
  const sources = new Map<string, DamageSource>();
  const turns = new Map<number, BestTurn>();
  const lostIn = new Map<number, number>();
  let round = 1;
  let active: Side = 'a';
  /** what is acting now (a card being played, a unit's move), for naming the damage it does */
  let cause: { label: string; unit?: string; side?: Side } | null = null;
  let trap: string | null = null;
  let heroId: string | null = null;
  let heroDied = false;
  let lastBlow: { name: string; amount: number; round: number } | null = null;

  const heroOf = (s: CombatState): string | null =>
    s.sides[me].units.find((u) => u.kind === 'hero')?.id ?? null;

  const feed = (events: readonly CombatEvent[], after: CombatState): void => {
    namer.learn(after);
    for (const e of events) {
      if (e.type === 'summon') namer.register(e.unit, db.units[e.def]?.name ?? e.def, e.side, e.def);
      const line = describe(e);
      if (line) lines.push({ id: lines.length, ...line });
      switch (e.type) {
        case 'turnStart':
          round = Math.max(1, Math.ceil(e.turn / 2));
          active = e.side;
          recap.rounds = Math.max(recap.rounds, round);
          cause = null;
          trap = null;
          break;
        case 'play': {
          trap = null;
          const name = db.cards[e.def]?.name ?? pretty(e.def);
          cause = { label: name, side: e.side };
          if (e.side === me) {
            recap.cardsPlayed++;
            const t = turns.get(round) ?? { round, dealt: 0, cards: [] };
            t.cards.push(name);
            turns.set(round, t);
          }
          break;
        }
        case 'act':
          trap = null;
          cause = {
            label: e.move ? `${namer.nameOf(e.unit)}'s ${pretty(e.move)}` : namer.nameOf(e.unit),
            unit: e.unit,
          };
          break;
        case 'snareSprung':
          trap = `${db.cards[e.card]?.name ?? 'A Trap'} (Trap)`;
          break;
        case 'heal':
          if (e.target === heroId) recap.healed += e.amount;
          break;
        case 'damage': {
          if (e.shielded) break;
          const by = e.source ? namer.sideOf(e.source) : null;
          const onMine = namer.sideOf(e.target) === me;
          // damage your side does to theirs (a Trap of yours that springs on their turn counts too)
          if (!onMine && (by === me || (by === null && active === me))) {
            const hurt = e.lost + e.blocked;
            recap.dealt += hurt;
            if (active === me) {
              const t = turns.get(round) ?? { round, dealt: 0, cards: [] };
              t.dealt += hurt;
              turns.set(round, t);
            }
          }
          if (e.target !== heroId) break;
          recap.blocked += e.blocked;
          if (e.lost <= 0) break;
          recap.taken += e.lost;
          lostIn.set(round, (lostIn.get(round) ?? 0) + e.lost);
          // named for what did it: a Trap, the unit's move, the card being played, or (no source) a status ticking
          const src = e.source;
          const name =
            trap ??
            (src === heroId
              ? `${cause?.side === me ? cause.label : 'Your own cards'} (your own)`
              : src
                ? cause &&
                  (cause.unit === src ||
                    (cause.side !== undefined && cause.side === namer.sideOf(src)))
                  ? cause.label
                  : namer.nameOf(src)
                : (cause?.label ?? 'Statuses and other effects'));
          const s = sources.get(name) ?? { name, amount: 0, hits: 0 };
          s.amount += e.lost;
          s.hits++;
          sources.set(name, s);
          if (!recap.biggestHit || e.lost > recap.biggestHit.amount)
            recap.biggestHit = { name, amount: e.lost, round };
          lastBlow = { name, amount: e.lost, round };
          break;
        }
        case 'died':
          if (e.unit === heroId && !e.released) heroDied = true;
          break;
        case 'gameOver':
          recap.winner = e.winner === 'draw' ? 'draw' : e.winner;
          break;
        default:
          break;
      }
    }
  };

  let broken = false;
  let state: CombatState;
  try {
    const start = createCombat(db, setup);
    state = start.state;
    heroId = heroOf(state);
    feed(start.events, state);
    for (const m of moves) {
      if (state.winner) break;
      const r = applyAction(db, state, m.action);
      state = r.state;
      feed(r.events, state);
    }
  } catch {
    broken = true;
  }

  recap.takenFrom = [...sources.values()].sort((x, y) => y.amount - x.amount);
  recap.bestTurns = [...turns.values()]
    .filter((t) => t.dealt > 0)
    .sort((x, y) => y.dealt - x.dealt || x.round - y.round)
    .slice(0, 3)
    .map((t) => ({ ...t, cards: tally(t.cards) }));
  const blow = lastBlow as { name: string; amount: number; round: number } | null;
  if (heroDied && blow)
    recap.killer = { ...blow, lastRound: lostIn.get(blow.round) ?? blow.amount };
  return { recap, lines, broken };
}
