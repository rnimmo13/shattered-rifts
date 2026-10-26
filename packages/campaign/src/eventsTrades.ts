// Trades (DECISIONS #256): events that work on particular cards of your deck instead of random ones. Two common Attacks of your
// class melt into an uncommon one, two common Skills bind into an uncommon one, a rare is traded for another rare, a card from a
// build path you are not following becomes one for the path you are, an uncommon steps up to a rare. Every card that leaves and
// every card that comes is named when the event is built, so the player sees exactly what the trade is. Same shape as eventsTuned.ts.

import { nextInt } from '@sr/combat';
import { COMBAT_DB, pathName, pathOf, rewardPool, type HeroId } from '@sr/content/v2';
import { canAdd } from './rewards';
import { mainPath } from './synergy';
import { def, shards, type DealSpec, type OptSpec } from './eventDeals';
import type { EventDef } from './events';
import type { DealStep, RunState } from './types';

type Rarity = 'common' | 'uncommon' | 'rare';
type Kind = 'attack' | 'skill';

const card = (id: string): DealStep => ({ k: 'card', id });
const swap = (from: string, to: string): DealStep => ({ k: 'swap', from, to });
/** these exact cards leave the deck */
const giveUp = (ids: string[]): DealStep => ({ k: 'remove', of: 'any', n: ids.length, ids });

const name = (id: string): string => COMBAT_DB.cards[id]?.name ?? 'a card';
const base = (id: string): string => id.replace(/\+$/, '');
const pick = <T>(r: RunState, xs: readonly T[]): T | undefined =>
  xs.length ? xs[nextInt(r.rng, xs.length)] : undefined;

/**
 * Cards of your deck that a trade may take: your own class's, of this rarity (and kind), never a sanctified or engraved one (you
 * paid for those), never a basic.
 */
function mine(r: RunState, rarity: Rarity, kind?: Kind): string[] {
  return r.deck.filter((id) => {
    if (id.includes('~') || id.includes('^')) return false;
    const c = COMBAT_DB.cards[base(id)];
    return !!c && c.hero === r.character && c.rarity === rarity && (!kind || c.kind === kind);
  });
}

/**
 * Up to `n` different cards of your class the deck could take, of a rarity (and kind), none already in the deck. Cards of
 * `path` come first (the build path the deck follows), then the rest.
 */
function offers(
  r: RunState,
  n: number,
  rarity: Rarity,
  kind?: Kind,
  path?: number | null,
): string[] {
  const held = new Set(r.deck.map(base));
  const pool = rewardPool(r.character).filter((id) => {
    const c = COMBAT_DB.cards[id];
    return (
      !!c &&
      c.hero === r.character &&
      c.rarity === rarity &&
      (!kind || c.kind === kind) &&
      !held.has(id) &&
      canAdd(r.deck, id)
    );
  });
  const first = path === null || path === undefined ? [] : pool.filter((id) => pathOf(id) === path);
  const out: string[] = [];
  for (const from of [first, pool]) {
    const left = from.filter((id) => !out.includes(id));
    while (out.length < n && left.length)
      out.push(left.splice(nextInt(r.rng, left.length), 1)[0] as string);
  }
  return out;
}

/** "for your Rites build path", when the card is on the path the deck follows */
const forPath = (r: RunState, id: string): string => {
  const p = pathOf(id);
  const main = mainPath(r.character as HeroId, r.deck);
  return p !== undefined && p === main ? ` (${pathName(r.character as HeroId, p)})` : '';
};

/** Two common cards of a kind melt into your choice of two uncommon ones of that kind. */
const meltTwo =
  (kind: Kind, verb: string) =>
  (r: RunState): { opts: OptSpec[]; cards: string[] } => {
    const pool = [...mine(r, 'common', kind)];
    const a = pool.splice(nextInt(r.rng, Math.max(1, pool.length)), 1)[0];
    const b = pool.splice(nextInt(r.rng, Math.max(1, pool.length)), 1)[0];
    if (!a || !b) return { opts: [], cards: [] };
    const into = offers(r, 2, 'uncommon', kind, mainPath(r.character as HeroId, r.deck));
    return {
      cards: into,
      opts: into.map((id): OptSpec => [
        `${verb} ${name(a)} and ${name(b)} (both go): ${name(id)}${forPath(r, id)} joins your deck`,
        [giveUp([a, b]), card(id)],
        'Two cards go into it. One comes out, better than either.',
      ]),
    };
  };

/** One rare of yours for your choice of two other rares of your class (upgraded if yours was). */
function fence(r: RunState): { opts: OptSpec[]; cards: string[] } {
  const from = pick(r, mine(r, 'rare'));
  if (!from) return { opts: [], cards: [] };
  const up = from.endsWith('+');
  const to = offers(r, 2, 'rare', undefined, mainPath(r.character as HeroId, r.deck)).map(
    (id) => (up && COMBAT_DB.cards[id]?.upgrade) || id,
  );
  return {
    cards: to,
    opts: to.map((id): OptSpec => [
      `Trade ${name(from)} (it leaves your deck): ${name(id)}${forPath(r, id)} takes its place`,
      [swap(from, id)],
      'The fence turns your card over twice, nods, and slides the other across.',
    ]),
  };
}

/** A card from a build path the deck is not following becomes one of the same rarity for the path it is. */
function specialist(r: RunState): { opts: OptSpec[]; cards: string[] } {
  const hero = r.character as HeroId;
  const main = mainPath(hero, r.deck);
  if (main === null) return { opts: [], cards: [] };
  const stray = pick(
    r,
    [...mine(r, 'common'), ...mine(r, 'uncommon')].filter((id) => {
      const p = pathOf(id);
      return p !== undefined && p !== main;
    }),
  );
  if (!stray) return { opts: [], cards: [] };
  const rarity = COMBAT_DB.cards[base(stray)]?.rarity as Rarity;
  const to = offers(r, 2, rarity, undefined, main).filter((id) => pathOf(id) === main);
  const p = pathOf(stray);
  const strayPath = p === undefined ? '' : ` (${pathName(hero, p)})`;
  return {
    cards: to,
    opts: to.map((id): OptSpec => [
      `Retrain ${name(stray)}${strayPath} (it leaves your deck): ${name(id)} (${pathName(hero, main)}) takes its place`,
      [swap(stray, id)],
      'The old habit is hard to lose. The new one sits right from the first swing.',
    ]),
  };
}

/** An uncommon of yours and some shards for your choice of two rares of the same kind. */
function stepUp(r: RunState): { opts: OptSpec[]; cards: string[] } {
  const from = pick(r, [...mine(r, 'uncommon', 'attack'), ...mine(r, 'uncommon', 'skill')]);
  if (!from) return { opts: [], cards: [] };
  const kind = COMBAT_DB.cards[base(from)]?.kind as Kind;
  const to = offers(r, 2, 'rare', kind, mainPath(r.character as HeroId, r.deck));
  return {
    cards: to,
    opts: to.map((id): OptSpec => [
      `Hand over ${name(from)} and 60 shards (the card leaves your deck): ${name(id)}${forPath(r, id)} takes its place`,
      [shards(-60), swap(from, id)],
      'The master keeps your card as a lesson for the next student.',
    ]),
  };
}

const hasTwo =
  (rarity: Rarity, kind?: Kind) =>
  (r: RunState): boolean =>
    mine(r, rarity, kind).length >= 2;

const SPECS: DealSpec[] = [
  {
    id: 'smelter',
    weight: 1.1,
    title: 'The smelter',
    text: 'A furnace built into a cliff, and a smith with arms like cables. "Two of your weapons, melted down. One better weapon out. I choose which two; you choose what they become."',
    opts: [],
    needs: hasTwo('common', 'attack'),
    dyn: meltTwo('attack', 'Melt'),
  },
  {
    id: 'binders-table',
    weight: 1.1,
    title: "The binder's table",
    text: 'An old woman stitches loose pages into new books. "Two of your tricks are thin. Give them to me and I will bind them into one worth keeping."',
    opts: [],
    needs: hasTwo('common', 'skill'),
    dyn: meltTwo('skill', 'Bind'),
  },
  {
    id: 'the-fence',
    weight: 0.9,
    title: 'The fence',
    text: 'In the back of a tent that should not fit in the alley, a man deals only in the best. "I have taken a liking to one of yours. I have two I could part with."',
    opts: [],
    needs: (r) => mine(r, 'rare').length > 0,
    dyn: fence,
  },
  {
    id: 'the-specialist',
    weight: 1,
    title: 'The specialist',
    text: 'A veteran watches you train and frowns at one move in particular. "That one does not belong in your style. Let me show you something that does."',
    opts: [],
    needs: (r) => mainPath(r.character as HeroId, r.deck) !== null,
    dyn: specialist,
  },
  {
    id: 'step-up',
    weight: 0.8,
    title: 'The master and the student',
    text: 'A master of your own craft offers a lesson, for a price and for one of your cards. "You have outgrown this. Here is what comes after."',
    opts: [],
    needs: (r) => r.shards >= 60,
    dyn: stepUp,
  },
];

export const TRADE_EVENTS: EventDef[] = SPECS.map(def);
