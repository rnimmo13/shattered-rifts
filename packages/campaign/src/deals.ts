// Data-driven event options. An option carries a list of DealSteps (hurt, heal, shards, upgrade, remove...); applyDeal runs
// them in order and says what happened, dealFeasible checks an option can be taken right now. New events are data only.

import { clone, nextInt } from '@sr/combat';
import { COMBAT_DB, V2_DECK_RULES, isSanctified } from '@sr/content/v2';
import { MAX_POTIONS, canAdd, cardOfRarity, crossedOffers, offerCards, offerPotion } from './rewards';
import type { DealStep, EventOption, NodeContext, RunState } from './types';

export type EventCtx = NonNullable<NodeContext['event']>;

export interface DealHelpers {
  gainBoon: (r: RunState, id: string) => void;
  fail: (msg: string) => never;
}

/** The cards of a deck that anything may take out: a sanctified card never leaves a deck. */
export const removableCards = (deck: readonly string[]): string[] =>
  deck.filter((id) => !isSanctified(id));

/** The plain Attack / Defend cards (Neutral basics): never a Riftwalker's own starter card, never a Wound. */
export const basics = (deck: readonly string[]): string[] =>
  deck.filter(
    (id) =>
      COMBAT_DB.cards[id]?.rarity === 'basic' &&
      COMBAT_DB.cards[id]?.hero === 'neutral' &&
      !isSanctified(id),
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
        let pool: string[];
        if (s.of === 'wound') {
          const w = r.deck.indexOf('wound');
          pool = w >= 0 ? ['wound'] : basics(r.deck);
        } else if (s.of === 'basic') pool = basics(r.deck);
        else pool = removableCards(r.deck).filter((id) => id !== 'wound');
        if (!pool.length) fail('There is nothing to take');
        const pick = pool[nextInt(r.rng, pool.length)] as string;
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
        for (const id of offerCards(r.rng, r.character, r.deck, 'duel', 3, r.luck))
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
      const cards = crossedOffers(r.rng, r.character, r.deck, [s.rarity, s.rarity, s.rarity], 3).filter(
        (id) => COMBAT_DB.cards[id]?.rarity === s.rarity,
      );
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
        return !!c && c.rarity !== 'basic' && !id.includes('~');
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
