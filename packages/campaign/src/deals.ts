// Data-driven event options. An option carries a list of DealSteps (hurt, heal, shards, upgrade, remove...); applyDeal runs
// them in order and says what happened, dealFeasible checks an option can be taken right now. New events are data only.

import { clone, nextInt } from '@sr/combat';
import {
  COMBAT_DB,
  MARK_INFO,
  V2_DECK_RULES,
  canMark,
  markOf,
  markedId,
  rollOf,
  stripRoll,
  type CardMark,
} from '@sr/content/v2';
import {
  MAX_POTIONS,
  canAdd,
  cardOfRarity,
  crossedOffers,
  offerCards,
  offerPotion,
} from './rewards';
import type { DealStep, DeckChoice, EventOption, NodeContext, RunState } from './types';

export type EventCtx = NonNullable<NodeContext['event']>;

export interface DealHelpers {
  gainBoon: (r: RunState, id: string) => void;
  fail: (msg: string) => never;
}

/** The cards of a deck that anything may take out: every card (a sanctified card can be removed too, since DECISIONS #233). */
export const removableCards = (deck: readonly string[]): string[] => [...deck];

/** The plain Attack / Defend cards (Neutral basics): never a Riftwalker's own starter card, never a Wound. */
export const basics = (deck: readonly string[]): string[] =>
  deck.filter(
    (id) =>
      COMBAT_DB.cards[id]?.rarity === 'basic' &&
      COMBAT_DB.cards[id]?.hero === 'neutral' &&
      // (a card you paid to have engraved is never taken as a plain basic)
      markOf(id) === null,
  );
export const nonBasic = (deck: readonly string[]): string[] =>
  deck.filter((id) => {
    const c = COMBAT_DB.cards[id];
    return !!c && c.rarity !== 'basic' && !id.includes('~') && canAdd(deck, id);
  });
export const upgradable = (deck: readonly string[]): string[] => [
  ...new Set(deck.filter((id) => !!COMBAT_DB.cards[id]?.upgrade)),
];
export const healBy = (r: RunState, n: number): void => {
  r.hp = Math.min(r.maxHp, r.hp + Math.ceil(n));
};

const nameOf = (id: string): string => COMBAT_DB.cards[id]?.name ?? 'a card';
const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/** Run one step, adding what it did to `out`. Throws through `fail` when it cannot happen. */
function step(r: RunState, s: DealStep, ev: EventCtx, h: DealHelpers, out: string[]): void {
  const { fail } = h;
  switch (s.k) {
    case 'hurt':
    case 'hurtPct': {
      const n = s.k === 'hurt' ? s.n : Math.ceil((r.maxHp * s.n) / 100);
      if (r.hp <= n) fail('You are too hurt for that');
      r.hp -= n;
      out.push(`You lose ${n} HP.`);
      return;
    }
    case 'heal': {
      const before = r.hp;
      healBy(r, (r.maxHp * s.pct) / 100);
      out.push(`You heal ${r.hp - before} HP.`);
      return;
    }
    case 'maxHp':
      if (s.n < 0 && r.maxHp + s.n < 30) fail('You could not spare that much');
      r.maxHp += s.n;
      r.hp = s.n > 0 ? r.hp + s.n : Math.min(r.hp, r.maxHp);
      out.push(`${s.n > 0 ? '+' : ''}${s.n} max HP.`);
      return;
    case 'shards':
      if (r.shards + s.n < 0) fail(`You need ${-s.n} shards`);
      r.shards += s.n;
      out.push(s.n >= 0 ? `+${s.n} shards.` : `You pay ${-s.n} shards.`);
      return;
    case 'wound':
      for (let i = 0; i < s.n; i++) r.deck.push('wound');
      out.push(`${plural(s.n, 'Wound')} join${s.n === 1 ? 's' : ''} your deck.`);
      return;
    case 'potion': {
      let n = 0;
      while (r.potions.length < MAX_POTIONS && n < s.n) {
        r.potions.push(offerPotion(r.rng));
        n++;
      }
      if (!n) fail('Your belt is full');
      out.push(`You take ${plural(n, 'potion')}.`);
      return;
    }
    case 'boon':
      if (!ev.boonOffer) return fail('There is no Boon here');
      h.gainBoon(r, ev.boonOffer);
      out.push(`You gain ${COMBAT_DB.boons[ev.boonOffer]?.name ?? 'a Boon'}.`);
      return;
    case 'upgrade': {
      const done: string[] = [];
      for (let i = 0; i < s.n; i++) {
        const ups = upgradable(r.deck);
        if (!ups.length) break;
        const pick = ups[nextInt(r.rng, ups.length)] as string;
        r.deck[r.deck.indexOf(pick)] = COMBAT_DB.cards[pick]?.upgrade ?? pick;
        done.push(nameOf(pick));
      }
      if (!done.length) fail('Nothing to upgrade');
      out.push(`${done.join(' and ')} ${done.length === 1 ? 'is' : 'are'} upgraded.`);
      return;
    }
    case 'remove': {
      const gone: string[] = [];
      for (let i = 0; i < s.n; i++) {
        if (r.deck.length <= V2_DECK_RULES.minSize)
          fail('Your deck is too small to part with a card');
        // (the card the option named, if it was picked when the event was built; else one picked now)
        const named = s.ids?.[i];
        if (named !== undefined && !r.deck.includes(named))
          fail('That card is no longer in your deck');
        const pool = removalPool(r.deck, s.of);
        if (named === undefined && !pool.length) fail('There is nothing to take');
        const pick = named ?? pool[nextInt(r.rng, pool.length)];
        if (pick === undefined) return fail('There is nothing to take');
        r.deck.splice(r.deck.indexOf(pick), 1);
        gone.push(nameOf(pick));
      }
      out.push(`${gone.join(' and ')} leave${gone.length === 1 ? 's' : ''} your deck.`);
      return;
    }
    case 'transform': {
      const pool = basics(r.deck).filter((id) => id !== 'wound');
      if (!pool.length) fail('You have no basic card to change');
      const from = pool[nextInt(r.rng, pool.length)] as string;
      let made = '';
      for (let g = 0; g < 20 && !made; g++)
        for (const id of offerCards(r.rng, r.character, r.deck, 'duel', 3))
          if (!made && COMBAT_DB.cards[id]?.hero === r.character && canAdd(r.deck, id)) made = id;
      if (!made) fail('Nothing comes of it');
      r.deck[r.deck.indexOf(from)] = made;
      out.push(`${nameOf(from)} becomes ${nameOf(made)}.`);
      return;
    }
    case 'copy': {
      // a copy still obeys the deck rules (the copy limit, and the Legendary limit)
      const pool = nonBasic(r.deck).filter((id) => canAdd(r.deck, id));
      if (!pool.length) fail('There is nothing to copy');
      const pick = pool[nextInt(r.rng, pool.length)] as string;
      r.deck.push(pick);
      out.push(`${nameOf(pick)} is copied.`);
      return;
    }
    case 'gift': {
      const id = cardOfRarity(r.rng, r.character, r.deck, s.rarity);
      if (!id) fail('There is no card to give');
      r.deck.push(id as string);
      out.push(`${nameOf(id as string)} joins your deck.`);
      return;
    }
    case 'crossed': {
      const id = crossedOffers(r.rng, r.character, r.deck, [s.rarity], 1)[0];
      if (!id) fail('There is no card to give');
      r.deck.push(id as string);
      out.push(`${nameOf(id as string)} joins your deck: a card from another world.`);
      return;
    }
    case 'crossedPick': {
      const cards = crossedOffers(
        r.rng,
        r.character,
        r.deck,
        [s.rarity, s.rarity, s.rarity],
        3,
      ).filter((id) => COMBAT_DB.cards[id]?.rarity === s.rarity);
      if (cards.length < 3) fail('There are not enough cards to choose from');
      ev.choose = { cards };
      out.push('Three cards from other worlds are laid out: choose one.');
      return;
    }
    case 'card':
      if (!canAdd(r.deck, s.id)) fail('That card would break the deck rules');
      r.deck.push(s.id);
      out.push(`${nameOf(s.id)} joins your deck.`);
      return;
    case 'swap': {
      const at = r.deck.indexOf(s.from);
      if (at < 0) fail('That card is not in your deck');
      const rest = r.deck.filter((_, i) => i !== at);
      // a swap never raises the count of a rarity: a Legendary for a Legendary only needs the copy limit (so a deck from before
      // the one-Legendary limit can still trade one of its two)
      const rarity = (id: string): string | undefined =>
        COMBAT_DB.cards[stripRoll(id).replace(/\+$/, '')]?.rarity;
      const like = rarity(s.from) === rarity(s.to);
      if (!canAdd(rest, s.to, !like)) fail('That card would break the deck rules');
      r.deck[at] = s.to;
      out.push(`${nameOf(s.from)} is given up for ${nameOf(s.to)}.`);
      return;
    }
    case 'static':
      for (let i = 0; i < s.n; i++) r.deck.push('static');
      out.push(`${plural(s.n, 'Static card')} join${s.n === 1 ? 's' : ''} your deck.`);
      return;
    case 'loseBoon': {
      if (!r.boons.length) fail('You have no Boon to give');
      const id = r.boons.splice(nextInt(r.rng, r.boons.length), 1)[0] as string;
      const b = COMBAT_DB.boons[id];
      if (b?.maxHp) {
        r.maxHp = Math.max(1, r.maxHp - b.maxHp);
        r.hp = Math.min(r.hp, r.maxHp);
      }
      out.push(`${b?.name ?? 'A Boon'} is gone.`);
      return;
    }
    case 'losePotion': {
      if (r.potions.length < s.n) fail(`You need ${plural(s.n, 'potion')}`);
      r.potions.splice(0, s.n);
      out.push(`You give up ${plural(s.n, 'potion')}.`);
      return;
    }
    case 'exchange': {
      const pool = removableCards(r.deck).filter((id) => {
        const c = COMBAT_DB.cards[id];
        return (
          !!c &&
          c.rarity !== 'basic' &&
          c.rarity !== 'legendary' &&
          c.rarity !== 'ancestral' &&
          !id.includes('~')
        );
      });
      if (!pool.length) fail('You have nothing to trade');
      const from = pool[nextInt(r.rng, pool.length)] as string;
      const rarity = COMBAT_DB.cards[from]?.rarity;
      const want = rarity === 'common' || rarity === 'uncommon' ? rarity : 'rare';
      const without = r.deck.filter((_, i) => i !== r.deck.indexOf(from));
      const to = crossedOffers(r.rng, r.character, without, [want], 1)[0];
      if (!to) fail('Nobody has anything to trade');
      r.deck.splice(r.deck.indexOf(from), 1, to as string);
      out.push(`${nameOf(from)} is traded for ${nameOf(to as string)}, a card from another world.`);
      return;
    }
    case 'boonOf':
      if (r.boons.includes(s.id)) fail('You already have that Boon');
      h.gainBoon(r, s.id);
      out.push(`You gain ${COMBAT_DB.boons[s.id]?.name ?? 'a Boon'}.`);
      return;
    case 'potionOf':
      if (r.potions.length >= MAX_POTIONS) fail('Your belt is full');
      r.potions.push(s.id);
      out.push(`You take ${COMBAT_DB.potions[s.id]?.name ?? 'a potion'}.`);
      return;
    case 'mark': {
      const marks = (r.marks ??= []);
      const at = marks.indexOf(s.id);
      if (s.off) {
        if (at >= 0) marks.splice(at, 1);
      } else if (at < 0) marks.push(s.id);
      return;
    }
    case 'choose': {
      const cards = chooseable(r.deck, s.act, s.mark);
      if (!cards.length) fail(CHOICE_NONE[s.act]);
      if (s.act === 'remove' && r.deck.length <= V2_DECK_RULES.minSize)
        fail('Your deck is too small to part with a card');
      ev.chooseDeck = { act: s.act, ...(s.mark ? { mark: s.mark } : {}), cards };
      return;
    }
    case 'fight':
      ev.fight = { kind: s.kind, ...(s.bonus ? { bonus: s.bonus } : {}) };
      return;
    case 'chance': {
      const win = nextInt(r.rng, 100) < s.pct;
      (r.eventFlips ??= []).push({ pct: s.pct, won: win });
      for (const sub of win ? s.win : s.lose) step(r, sub, ev, h, out);
      return;
    }
  }
}

/** Carry out an option's steps; returns what happened in a few short sentences. */
export function applyDeal(r: RunState, o: EventOption, ev: EventCtx, h: DealHelpers): string {
  const out: string[] = o.say ? [o.say] : [];
  for (const s of o.deal ?? []) step(r, s, ev, h, out);
  return out.join(' ');
}

/** Can this option be taken right now (every branch of every chance)? Works on copies; `r` is untouched. */
export function dealFeasible(r: RunState, steps: DealStep[], ev: EventCtx): boolean {
  const h: DealHelpers = {
    gainBoon: () => undefined,
    fail: (m) => {
      throw new Error(m);
    },
  };
  const walk = (run: RunState, list: DealStep[]): boolean => {
    for (const s of list) {
      if (s.k === 'chance') {
        if (!walk(clone(run), s.win) || !walk(clone(run), s.lose)) return false;
        continue;
      }
      try {
        step(run, s, ev, h, []);
      } catch {
        return false;
      }
    }
    return true;
  };
  return walk(clone(r), steps);
}

const CHOICE_NONE: Record<DeckChoice, string> = {
  upgrade: 'You have nothing to upgrade',
  remove: 'You have nothing to part with',
  transform: 'You have nothing to change',
  copy: 'You have nothing worth copying',
  mark: 'None of your cards can take that',
};

/** The cards of a deck (each card once) a "choose a card" step may be used on. */
export function chooseable(deck: readonly string[], act: DeckChoice, mark?: CardMark): string[] {
  const all = [...new Set(deck)];
  switch (act) {
    case 'upgrade':
      return all.filter((id) => !!COMBAT_DB.cards[id]?.upgrade);
    case 'remove':
      return [...new Set(removableCards(deck))];
    case 'transform':
      return [...new Set(removableCards(deck))].filter((id) => id !== 'wound' && id !== 'static');
    case 'copy':
      // (a copy obeys the deck rules: the copy limit and the Legendary limit)
      return nonBasic(deck as string[]).filter(
        (id, i, a) => a.indexOf(id) === i && canAdd(deck, id),
      );
    case 'mark':
      return all.filter((id) => {
        const c = COMBAT_DB.cards[id];
        // one tag per card: a tagged card is not tagged again; and a sanctified card is final, it takes no tag (DECISIONS #327)
        return !!c && !!mark && markOf(id) === null && rollOf(id) === 0 && canMark(c, mark);
      });
  }
}

/** Do what a "choose a card" step promised to the card picked. Returns what happened, in a sentence. */
export function applyChoice(
  r: RunState,
  choice: NonNullable<EventCtx['chooseDeck']>,
  id: string,
  fail: (msg: string) => never,
): string {
  if (!choice.cards.includes(id)) fail('That card cannot be chosen');
  const at = r.deck.indexOf(id);
  if (at < 0) fail('That card is not in your deck');
  const name = nameOf(id);
  switch (choice.act) {
    case 'upgrade': {
      const up = COMBAT_DB.cards[id]?.upgrade;
      if (!up) fail('That card cannot be upgraded');
      r.deck[at] = up;
      return `${name} is upgraded.`;
    }
    case 'remove':
      if (r.deck.length <= V2_DECK_RULES.minSize)
        fail('Your deck is too small to part with a card');
      r.deck.splice(at, 1);
      return `${name} leaves your deck.`;
    case 'transform': {
      // a card of your class, of the same rarity (a basic card becomes a common one)
      const was = COMBAT_DB.cards[stripRoll(id)]?.rarity ?? 'common';
      const rarity = was === 'basic' ? 'common' : was === 'ancestral' ? 'rare' : was;
      const without = r.deck.filter((_, i) => i !== at);
      const made = cardOfRarity(r.rng, r.character, without, rarity);
      if (!made) fail('Nothing comes of it');
      r.deck[at] = made;
      return `${name} becomes ${nameOf(made)}.`;
    }
    case 'copy':
      if (!canAdd(r.deck, id)) fail('That card would break the deck rules');
      r.deck.push(id);
      return `${name} is copied.`;
    case 'mark': {
      const mark = choice.mark as CardMark;
      if (rollOf(id) !== 0) fail('A sanctified card cannot be changed again');
      r.deck[at] = markedId(id, mark);
      return `${name} gains ${MARK_INFO[mark].name}: it ${MARK_INFO[mark].text}.`;
    }
  }
}

/** The cards a random removal of this kind could take from the deck now. */
function removalPool(deck: readonly string[], of: 'wound' | 'basic' | 'any'): string[] {
  if (of === 'wound') return deck.includes('wound') ? ['wound'] : basics(deck);
  if (of === 'basic') return basics(deck);
  return removableCards(deck).filter((id) => id !== 'wound');
}

/**
 * Pick now the cards an option's random removals will take, so it can say which (DECISIONS #233): every `remove` step, in chance
 * branches too, gets its `ids`. Returns the steps and the names of the cards, in order (a chance's branches each from the same deck).
 */
export function pinRemovals(
  r: RunState,
  steps: readonly DealStep[],
): { steps: DealStep[]; names: string[]; shows: { lose: string[]; gain: string[] } } {
  const names: string[] = [];
  // the cards the option would take and give, for the player to see before choosing (the sure ones: not those behind a chance)
  const shows = { lose: [] as string[], gain: [] as string[] };
  const walk = (list: readonly DealStep[], deck: string[], sure: boolean): DealStep[] =>
    list.map((st): DealStep => {
      if (st.k === 'chance')
        return {
          ...st,
          win: walk(st.win, [...deck], false),
          lose: walk(st.lose, [...deck], false),
        };
      // every other random card is picked now too, so the option can show it (DECISIONS #273); a step with nothing to pick is
      // left as it was, and refused as before
      const pinned = pinCard(r, st, deck);
      if (pinned) {
        if (sure) {
          shows.lose.push(...pinned.lose);
          shows.gain.push(...pinned.gain);
        }
        for (const id of pinned.lose) deck.splice(deck.indexOf(id), 1);
        deck.push(...pinned.gain);
        return pinned.step;
      }
      if (st.k !== 'remove' || st.ids) return st;
      const ids: string[] = [];
      for (let i = 0; i < st.n && deck.length > V2_DECK_RULES.minSize; i++) {
        const pool = removalPool(deck, st.of);
        if (!pool.length) break;
        const pick = pool[nextInt(r.rng, pool.length)] as string;
        deck.splice(deck.indexOf(pick), 1);
        ids.push(pick);
        names.push(nameOf(pick));
      }
      // (not enough to take: left unpinned, and the option is refused as before)
      if (ids.length !== st.n) return st;
      if (sure) shows.lose.push(...ids);
      return { ...st, ids };
    });
  return { steps: walk(steps, [...r.deck], true), names, shows };
}

/**
 * A random card step, its card picked now from the deck as it will stand then (`deck`): a trade or a transform becomes a `swap`, a
 * gift, a Rift-crossed card or a copy becomes a `card`. The same rules as when the step was rolled on the spot. Null for any other
 * step, or when there is nothing to pick.
 */
function pinCard(
  r: RunState,
  st: DealStep,
  deck: readonly string[],
): { step: DealStep; lose: string[]; gain: string[] } | null {
  switch (st.k) {
    case 'exchange': {
      const pool = removableCards(deck).filter((id) => {
        const c = COMBAT_DB.cards[id];
        return (
          !!c &&
          c.rarity !== 'basic' &&
          c.rarity !== 'legendary' &&
          c.rarity !== 'ancestral' &&
          !id.includes('~')
        );
      });
      if (!pool.length) return null;
      const from = pool[nextInt(r.rng, pool.length)] as string;
      const rarity = COMBAT_DB.cards[from]?.rarity;
      const want = rarity === 'common' || rarity === 'uncommon' ? rarity : 'rare';
      const without = deck.filter((_, i) => i !== deck.indexOf(from));
      const to = crossedOffers(r.rng, r.character, without, [want], 1)[0];
      return to ? { step: { k: 'swap', from, to }, lose: [from], gain: [to] } : null;
    }
    case 'transform': {
      const pool = basics(deck).filter((id) => id !== 'wound');
      if (!pool.length) return null;
      const from = pool[nextInt(r.rng, pool.length)] as string;
      let made = '';
      for (let g = 0; g < 20 && !made; g++)
        for (const id of offerCards(r.rng, r.character, deck, 'duel', 3))
          if (!made && COMBAT_DB.cards[id]?.hero === r.character && canAdd(deck, id)) made = id;
      return made ? { step: { k: 'swap', from, to: made }, lose: [from], gain: [made] } : null;
    }
    case 'copy': {
      const pool = nonBasic(deck).filter((id) => canAdd(deck, id));
      if (!pool.length) return null;
      const pick = pool[nextInt(r.rng, pool.length)] as string;
      return { step: { k: 'card', id: pick }, lose: [], gain: [pick] };
    }
    case 'gift': {
      const id = cardOfRarity(r.rng, r.character, deck, st.rarity);
      return id ? { step: { k: 'card', id }, lose: [], gain: [id] } : null;
    }
    case 'crossed': {
      const id = crossedOffers(r.rng, r.character, deck, [st.rarity], 1)[0];
      return id ? { step: { k: 'card', id }, lose: [], gain: [id] } : null;
    }
    default:
      return null;
  }
}

/** "a random card leaves your deck" with the cards named ("Strike leaves your deck"). */
export function nameRemovals(label: string, names: readonly string[]): string {
  if (!names.length) return label;
  const one = names[0] as string;
  const both =
    names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : one;
  const swaps: [RegExp, string][] = [
    [/two random cards leave your deck/i, `${both} leave your deck`],
    [/a random card leaves your deck/i, `${one} leaves your deck`],
    [/a random basic card leaves/i, `${one} leaves`],
    [/a random (?:Strike|Attack) or Defend goes/i, `${one} goes`],
    [/a Wound leaves your deck, or a basic card if you have none/i, `${one} leaves your deck`],
    [/a Wound, else a basic card, goes/i, `${one} goes`],
    [/a Wound, or a basic card: it leaves your deck/i, `${one}: it leaves your deck`],
    [/any card: it leaves your deck/i, `${one}: it leaves your deck`],
    [/lose a card and/i, `lose ${one} and`],
  ];
  for (const [re, to] of swaps) if (re.test(label)) return label.replace(re, to);
  // (a wording not foreseen: the card is still named)
  return `${label} (${both} would go)`;
}
