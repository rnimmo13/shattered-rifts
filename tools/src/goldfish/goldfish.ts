// One goldfish game (DECISIONS #704, #705): a deck in the Arena against a training opponent. Offline only.
// - passive: the opponent only ends turns, so every point of damage is the deck's own pace.
// - sparring: the opponent plays Strikes at the deck's hero every turn, at a set pace (by default a deck that kills in about ten turns:
//   50 damage on its first turn, 10 more each turn after, in 4 hits). The hits are real card plays, so Barrier, Sapped, Thorns, Riposte,
//   Traps and the rest answer them, and the deck's own HP costs and healing count. The tool sets the opponent's Mana, hand and Might
//   each turn to keep that pace; a Sapped, Exposed or similar the deck puts on it still changes what lands.
import {
  applyAction,
  chooseSmartAction,
  createCombat,
  heroOf,
  legalActions,
  BOT_SEARCH,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { BASELINE_HP } from '@sr/pvp';
import { readFileSync } from 'node:fs';

/**
 * Try proposed card changes without editing the game: a JSON file { "cards": { "<id>": { ...fields to replace } } }, applied once to this
 * worker's copy of the card table (an upgraded card is its own id, "coup-de-grace+"). Text is not rebuilt; only the rules matter here.
 */
const patched = new Set<string>();
export function applyPatch(file: string): void {
  if (patched.has(file)) return;
  patched.add(file);
  const patch = JSON.parse(readFileSync(file, 'utf8')) as { cards?: Record<string, object> };
  for (const [id, fields] of Object.entries(patch.cards ?? {})) {
    const card = db.cards[id];
    if (!card) throw Error(`Patch: no card "${id}"`);
    db.cards[id] = { ...card, ...fields };
  }
}

export interface Sparring {
  /** damage the opponent aims to deal on its first turn */
  start: number;
  /** how much more each turn after */
  step: number;
  /** split into this many Strikes */
  hits: number;
  /** 'kill' (default): a Strike goes at a companion it would kill, else the hero; 'hero': always the hero */
  aim?: 'kill' | 'hero';
}
export const DEFAULT_SPARRING: Sparring = { start: 50, step: 10, hits: 4 };

export interface GoldfishJob {
  deck: { id: string; hero: string; name: string; deck: string[] };
  seed: string;
  /** own turns to play at most (default 15) */
  turns?: number;
  /** missing: the opponent never acts */
  sparring?: Sparring;
  /** a card patch file to apply first (see applyPatch) */
  patch?: string;
}
export interface GoldfishResult {
  name: string;
  seed: string;
  /** HP taken off the opponent on each of the deck's own turns (its companions and end-of-turn effects included) */
  perTurn: number[];
  /** HP the deck's hero lost on each round (its own turn and the opponent's after it; HP costs included, healing taken off) */
  lostPerTurn: number[];
  /** the own turn the opponent fell on, or null */
  killTurn: number | null;
  /** the round the deck's hero fell on, or null */
  diedTurn: number | null;
  /** the deck's own HP at the end */
  hp: number;
  /** HP taken off the opponent, by the card that did it ('end of turn': companions and Auras as the turn ends; 'their turn': Bleed, Thorns, Traps...) */
  bySource: Record<string, number>;
}

/** The training opponent: a Knight whose deck is only Strikes. */
const OPPONENT: HeroId = 'knight';
const STRIKE = 'strike';

function strikeDamage(): number {
  const op = db.cards[STRIKE]!.effects.find((o) => o.op === 'damage') as
    { amount: number } | undefined;
  return op?.amount ?? 6;
}

/** Set up the opponent's turn so its Strikes deal the round's pace, then play them all at the deck's hero. */
function sparTurn(s: CombatState, round: number, spar: Sparring): CombatState {
  const me = s.sides.b;
  const hero = heroOf(me);
  if (!hero) return s;
  const want = spar.start + spar.step * (round - 1);
  const perHit = Math.max(1, Math.round(want / spar.hits));
  hero.statuses.might = Math.max(0, perHit - strikeDamage());
  me.mana = spar.hits;
  me.reserves = 0;
  me.hand = Array.from({ length: spar.hits }, (_, i) => ({
    id: `spar-${round}-${i}`,
    card: STRIKE,
  }));
  for (let i = 0; i < spar.hits && !s.winner && s.active === 'b'; i++) {
    while (s.pending && !s.winner)
      s = applyAction(db, s, chooseSmartAction(db, s, BOT_SEARCH)).state;
    const plays = legalActions(db, s).filter(
      (a) => a.type === 'play' && a.card === `spar-${round}-${i}`,
    );
    const heroId = heroOf(s.sides.a)?.id;
    const unit = (id?: string) => s.sides.a.units.find((u) => u.id === id);
    // (like a player would: finish off a companion this hit kills, the biggest such first; otherwise go at the hero)
    const kill =
      spar.aim === 'hero'
        ? undefined
        : plays
            .filter((a) => a.type === 'play' && a.target && a.target !== heroId)
            .map((a) => ({ a, u: unit(a.type === 'play' ? a.target : undefined)! }))
            .filter(({ u }) => u && u.hp + u.barrier <= perHit)
            .sort((x, y) => y.u.maxHp - x.u.maxHp)[0]?.a;
    const play =
      kill ??
      plays.find((a) => a.type === 'play' && (!a.target || a.target === heroId)) ??
      plays[0];
    if (!play) continue;
    s = applyAction(db, s, play).state;
  }
  return s;
}

export function goldfish(j: GoldfishJob): GoldfishResult {
  if (j.patch) applyPatch(j.patch);
  const limit = j.turns ?? 15;
  let s: CombatState = createCombat(db, {
    seed: j.seed,
    a: {
      hero: j.deck.hero,
      deck: j.deck.deck,
      ascendancy: j.deck.id,
      maxHp: BASELINE_HP,
      hp: BASELINE_HP,
    },
    b: {
      hero: OPPONENT,
      deck: j.sparring ? Array<string>(10).fill(STRIKE) : RIFTWALKERS[OPPONENT].starter,
      maxHp: BASELINE_HP,
      hp: BASELINE_HP,
    },
  }).state;
  const foeHp = (st: CombatState): number => heroOf(st.sides.b)?.hp ?? 0;
  const myHp = (st: CombatState): number => heroOf(st.sides.a)?.hp ?? 0;
  const perTurn: number[] = [];
  const lostPerTurn: number[] = [];
  let turn = 0;
  let start = foeHp(s);
  let mine = myHp(s);
  let sparred = -1;
  const bySource: Record<string, number> = {};
  const credit = (key: string, before: number): void => {
    const d = before - foeHp(s);
    if (d !== 0) bySource[key] = (bySource[key] ?? 0) + d;
  };
  let lastCard = 'start of turn';
  const close = (): void => {
    perTurn.push(start - foeHp(s));
    lostPerTurn.push(mine - myHp(s));
    turn++;
    start = foeHp(s);
    mine = myHp(s);
  };
  for (let steps = 0; steps < 4000 && !s.winner && turn < limit; steps++) {
    if (s.active === 'b') {
      // (the opponent's turn; any damage on it, such as Bleed, belongs to the deck's turn just played)
      const hpThen = foeHp(s);
      if (j.sparring && sparred !== turn && !s.pending) {
        sparred = turn;
        s = sparTurn(s, turn + 1, j.sparring);
        credit('their turn', hpThen);
        if (s.winner) break;
        if (s.active !== 'b') {
          close();
          continue;
        }
      }
      const hpEnd = foeHp(s);
      s = applyAction(
        db,
        s,
        s.pending ? chooseSmartAction(db, s, BOT_SEARCH) : { type: 'endTurn' },
      ).state;
      credit('their turn', hpEnd);
      if (s.active === 'a' || s.winner) close();
      continue;
    }
    const act = chooseSmartAction(db, s, BOT_SEARCH);
    if (act.type === 'play')
      lastCard = s.sides.a.hand.find((c) => c.id === act.card)?.card ?? lastCard;
    const key = act.type === 'endTurn' ? 'end of turn' : lastCard;
    const hpBefore = foeHp(s);
    s = applyAction(db, s, act).state;
    credit(key, hpBefore);
  }
  // (a fight that ended mid-round: count that round)
  if (s.winner && (start !== foeHp(s) || mine !== myHp(s))) close();
  return {
    name: j.deck.name,
    seed: j.seed,
    perTurn,
    lostPerTurn,
    killTurn: s.winner === 'a' ? perTurn.length : null,
    diedTurn: s.winner === 'b' ? perTurn.length : null,
    hp: myHp(s),
    bySource,
  };
}
