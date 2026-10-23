// Starting kits: at the very start of a run the player chooses between two semi-random versions of their Riftwalker's starter
// deck. A kit swaps three plain Slash/Guard cards for three from the Riftwalker's own pool: an anchor card, and two more that
// share a mechanic with it, so each kit leans one way (Snares, Fate, runes, companions...) and the two kits lean differently.
// Uses the run's seeded PRNG, so a seed and the choices made reproduce the same run.

import { nextInt, type RngState } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import type { KitOption } from './types';

/** What a mechanic is called to the player; only mechanics worth leaning on get a label. */
const LABEL: Record<string, string> = {
  snare: 'Snares',
  summon: 'Companions',
  actAllies: 'Allies acting twice',
  sacrifice: 'Sacrifice',
  channel: 'Runes',
  evoke: 'Runes',
  stance: 'Stances',
  stars: 'Lumen',
  forge: 'Sharpening',
  scry: 'Foresee',
  discard: 'Discarding',
  exhaustCards: 'Consuming cards',
  'status:doom': 'Fate',
  'status:seared': 'Bleed',
  'status:thorns': 'Thorns',
  'status:might': 'Might',
  'status:exposed': 'Exposed',
  'status:mantra': 'Fervor',
  'status:resonance': 'Resonance',
  'status:shielded': 'Shielded',
  'status:edge': 'Knives',
  'status:armored': 'Armor',
  'status:bracing': 'Bracing',
};

const GENERIC_OPS = new Set([
  'damage',
  'barrier',
  'draw',
  'heal',
  'loseHp',
  'mana',
  'prevent',
  'scaleStatus',
  'status',
]);

/** The labelled mechanics a card is about. */
export function mechanicsOf(cardId: string): string[] {
  const c = COMBAT_DB.cards[cardId];
  if (!c) return [];
  const keys = new Set<string>();
  const walk = (ops: readonly { op: string; status?: string; ops?: unknown }[]): void => {
    for (const o of ops) {
      if (o.op === 'status' && o.status) keys.add(`status:${o.status}`);
      else if (!GENERIC_OPS.has(o.op)) keys.add(o.op);
      if (o.op === 'scaleStatus' && o.status) keys.add(`status:${o.status}`);
      if (o.op === 'power' && Array.isArray(o.ops)) walk(o.ops as never);
    }
  };
  walk(c.effects);
  if (c.kind === 'snare') keys.add('snare');
  if (c.kind === 'summon') keys.add('summon');
  return [...keys].filter((k) => LABEL[k] !== undefined);
}

const isPlainBasic = (id: string): boolean =>
  COMBAT_DB.cards[id]?.hero === 'neutral' && COMBAT_DB.cards[id]?.rarity === 'basic';

function pick<T>(rng: RngState, list: readonly T[]): T {
  return list[nextInt(rng, list.length)] as T;
}

/** Two different kits for `hero`. */
export function makeKits(rng: RngState, hero: HeroId): KitOption[] {
  const starter = RIFTWALKERS[hero].starter;
  const pool = Object.values(COMBAT_DB.cards)
    .filter(
      (c) =>
        c.hero === hero &&
        (c.rarity === 'common' || c.rarity === 'uncommon') &&
        !c.unplayable &&
        !c.source &&
        !!c.upgrade &&
        mechanicsOf(c.id).length > 0,
    )
    .map((c) => c.id)
    .sort();

  // a mechanic is worth leaning on only if the pool has enough of it to build a kit from
  const freq = new Map<string, number>();
  for (const c of pool) for (const k of mechanicsOf(c)) freq.set(k, (freq.get(k) ?? 0) + 1);
  const themed = (c: string): string[] => mechanicsOf(c).filter((k) => (freq.get(k) ?? 0) >= 2);

  const kits: KitOption[] = [];
  const usedCards = new Set<string>();
  let usedLabel: string | null = null;
  for (const id of ['a', 'b'] as const) {
    // an anchor whose mechanic is not the other kit's, when there is a choice
    let anchors = pool.filter(
      (c) => !usedCards.has(c) && themed(c).some((k) => LABEL[k] !== usedLabel),
    );
    if (!anchors.length) anchors = pool.filter((c) => !usedCards.has(c) && themed(c).length > 0);
    if (!anchors.length) anchors = pool.filter((c) => !usedCards.has(c));
    const anchor = pick(rng, anchors);
    const keys = themed(anchor).filter((k) => LABEL[k] !== usedLabel);
    const key = pick(
      rng,
      keys.length ? keys : themed(anchor).length ? themed(anchor) : mechanicsOf(anchor),
    );
    const mates = pool.filter(
      (c) =>
        c !== anchor && !usedCards.has(c) && mechanicsOf(c).some((k) => LABEL[k] === LABEL[key]),
    );
    const others = pool.filter((c) => c !== anchor && !usedCards.has(c) && !mates.includes(c));
    const added = [anchor];
    for (const source of [mates, others]) {
      const left = [...source];
      while (added.length < 3 && left.length)
        added.push(left.splice(nextInt(rng, left.length), 1)[0] as string);
    }
    const deck = [...starter];
    const removed: string[] = [];
    for (let i = 0; i < 3; i++) {
      const at = deck.findIndex(isPlainBasic);
      if (at < 0) break;
      removed.push(deck.splice(at, 1)[0] as string);
    }
    deck.push(...added);
    for (const c of added) usedCards.add(c);
    usedLabel = LABEL[key] ?? null;
    kits.push({ id, leans: LABEL[key] ?? 'A mix', deck, added, removed });
  }
  return kits;
}
