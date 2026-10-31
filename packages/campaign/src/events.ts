// Random events on the map. Each is a small story with a choice: some are generous, some are a gamble, some are a bad deal
// with an upside, and only a few offer a card. rollEvent picks one by weight among those that make sense right now;
// resolveEvent carries out the player's choice and says what happened.

import { nextInt } from '@sr/combat';
import {
  BOONS,
  COMBAT_DB,
  RIFTWALKERS,
  canRoll,
  isSanctified,
  rolledId,
  stripRoll,
  V2_DECK_RULES,
  type HeroId,
} from '@sr/content/v2';
import { MAX_POTIONS, ancestralPool, canAdd, offerBoon, offerCards, offerPotion } from './rewards';
import { offerShows } from './eventBoxes';
import { applyDeal, basics, healBy, nonBasic, upgradable, type EventCtx } from './deals';
import { DEAL_EVENTS } from './eventDeals';
import { MORE_EVENTS } from './eventsMore';
import { TUNED_EVENTS } from './eventsTuned';
import { LEGEND_EVENTS } from './eventsLegend';
import { TRADE_EVENTS } from './eventsTrades';
import { rollElite } from './trials';
import type { EventOption, RunState } from './types';

const leave: EventOption = { id: 'leave', label: 'Walk away' };

/** The hand that weighs and builds an event for this run. */
export interface EventDef {
  id: string;
  weight: number;
  /** can it happen right now? */
  when: (r: RunState) => boolean;
  build: (r: RunState) => EventCtx;
}

/** What the bonfire spirits give for a card: more for a rarer one. */
const bonfireHeal = (id: string): number => {
  const rarity = COMBAT_DB.cards[id]?.rarity;
  return rarity === 'rare' || rarity === 'legendary' ? 20 : rarity === 'uncommon' ? 12 : 6;
};

export const EVENTS: EventDef[] = [
  {
    id: 'cache',
    weight: 3,
    when: () => true,
    build: (r) => {
      // a card is on the table only now and then
      const card =
        nextInt(r.rng, 100) < 35
          ? (offerCards(r.rng, r.character, r.deck, 'duel', 1)[0] ?? '')
          : '';
      return {
        title: 'A rift cache',
        text: 'A seam in the world has split open, and something glints inside. You can only carry one thing away.',
        options: [
          { id: 'shards', label: 'Take the shards (+40)' },
          { id: 'heal', label: 'Drink from the spring (heal 20% of your HP)' },
          ...(card
            ? [
                {
                  id: 'card' as const,
                  label: `Take the card: ${COMBAT_DB.cards[card]?.name ?? ''}`,
                },
              ]
            : []),
          leave,
        ],
        cardOffer: card,
      };
    },
  },
  {
    id: 'altar',
    weight: 2,
    when: (r) => r.hp > 20,
    build: (r) => {
      const boon = offerBoon(r.rng, r.boons, 'elite') ?? undefined;
      return {
        title: 'The blood altar',
        text: 'An altar drinks what you give it, and gives back. The rift rewards those who bleed for it.',
        options: [
          { id: 'bleed', label: 'Give 10 HP: gain 80 shards' },
          ...(boon ? [{ id: 'boon' as const, label: 'Give 15 HP: take the Boon' }] : []),
          leave,
        ],
        cardOffer: '',
        ...(boon ? { boonOffer: boon } : {}),
      };
    },
  },
  {
    id: 'ancestors',
    weight: 1.5,
    when: (r) => r.hp - 12 >= r.maxHp * 0.25 && ancestralPool(r.deck).length > 0,
    build: (r) => {
      const pool = ancestralPool(r.deck);
      const id = pool[nextInt(r.rng, pool.length)] as string;
      return {
        title: "The Ancestors' Offering",
        text: 'A circle of old stones hums. Something that was a Riftwalker before you left a gift here, and it will cost you some of your own strength to lift.',
        options: [
          { id: 'ancestor', label: `Take ${COMBAT_DB.cards[id]?.name ?? 'the card'}: lose 12 HP` },
          leave,
        ],
        cardOffer: id,
      };
    },
  },
  {
    id: 'stranger',
    weight: 1.5,
    // a gift from another Riftwalker's world: free, but it was not made for your deck
    when: () => true,
    build: (r) => {
      const others = (Object.keys(RIFTWALKERS) as HeroId[]).filter((h) => h !== r.character);
      const from = others[nextInt(r.rng, others.length)] as HeroId;
      let card = '';
      for (let g = 0; g < 30 && !card; g++)
        for (const id of offerCards(r.rng, from, r.deck, 'elite', 3))
          if (
            !card &&
            COMBAT_DB.cards[id]?.hero === from &&
            COMBAT_DB.cards[id]?.rarity !== 'legendary'
          )
            card = id;
      if (!card)
        return {
          title: 'A traveller from another world',
          text: 'Someone passed through here long ago; only footprints are left.',
          options: [leave],
          cardOffer: '',
        };
      return {
        title: 'A traveller from another world',
        text: `The ${RIFTWALKERS[from].hero.name} left a card on the road. It is theirs, not yours: it works in your deck, but it leans on mechanics you may not build around.`,
        options: [
          {
            id: 'cross',
            label: `Take ${COMBAT_DB.cards[card]?.name ?? 'it'} (${/^[AEIOU]/.test(RIFTWALKERS[from].role) ? 'an' : 'a'} ${RIFTWALKERS[from].role}'s card, added to your deck)`,
          },
          leave,
        ],
        cardOffer: card,
      };
    },
  },
  {
    id: 'sanctify',
    weight: 2,
    // once a deck has been through the fire it does not go again (it cannot be undone, and it cannot be done twice)
    when: (r) =>
      !r.sanctified &&
      !r.deck.some(isSanctified) &&
      r.deck.some((id) => canRoll(COMBAT_DB.cards[stripRoll(id)]!)),
    build: () => ({
      title: 'The Sanctum of Change',
      text: 'A basin of white fire. Step in and your whole deck is sanctified: every card with numbers is re-rolled: some are left as they were, about half of the rest become 25% stronger and the others 25% weaker. Costs never change. It cannot be undone, and you do not choose which.',
      options: [
        {
          id: 'sanctify',
          label:
            'Sanctify the whole deck: the numbers on every card are re-rolled, some 25% stronger and some 25% weaker (permanent: a deck is sanctified only once)',
        },
        { id: 'leave', label: 'No: keep the deck as it is' },
      ],
      cardOffer: '',
    }),
  },
  {
    id: 'gambler',
    weight: 2,
    when: (r) => r.shards >= 30,
    build: () => ({
      title: "The gambler's table",
      text: 'A hooded figure rattles three bones. "Thirty shards on the table. Call it right and I pay double. Call it wrong and I keep it."',
      options: [{ id: 'bet', label: 'Bet 30 shards (an even chance to win 60)' }, leave],
      cardOffer: '',
    }),
  },
  {
    id: 'traveller',
    weight: 2,
    when: (r) => r.hp > 12,
    build: () => ({
      title: 'A wounded traveller',
      text: 'Someone sits against a broken wall, their pack open and their eyes closed. They are breathing, barely.',
      options: [
        {
          id: 'help',
          label: 'Help them (lose 8 HP): they give you a potion, or shards if your belt is full',
        },
        { id: 'rob', label: 'Take their goods: +90 shards and a Wound in your deck' },
        leave,
      ],
      cardOffer: '',
    }),
  },
  {
    id: 'idol',
    weight: 1.5,
    when: (r) => BOONS.some((b) => !r.boons.includes(b.id)),
    build: (r) => ({
      title: 'The whispering idol',
      text: 'A small idol of black glass. It wants to be carried. It will pay for it, and so will you.',
      options: [{ id: 'idol', label: 'Take it: gain a Boon and two Wounds in your deck' }, leave],
      cardOffer: '',
      boonOffer: offerBoon(r.rng, r.boons, 'elite') ?? '',
    }),
  },
  {
    id: 'well',
    weight: 1.5,
    when: () => true,
    build: () => ({
      title: 'The whispering well',
      text: 'The water is dark and very still. People say it heals. People also say it does not.',
      options: [{ id: 'drink', label: 'Drink (60% heal 30% of your HP, 40% lose 10%)' }, leave],
      cardOffer: '',
    }),
  },
  {
    id: 'shoal',
    weight: 1.5,
    when: () => true,
    build: () => ({
      title: 'The drowned shoal',
      text: 'Pale fish crowd a rift-pool, unafraid. They are fat, and strange, and they watch you.',
      options: [
        { id: 'heal', label: 'Eat your fill (heal 20% of your HP)' },
        { id: 'maxhp', label: 'Keep a scale: +6 max HP, and a Wound joins your deck' },
        leave,
      ],
      cardOffer: '',
    }),
  },
  {
    id: 'forge',
    weight: 1,
    when: (r) => r.hp > 14 && upgradable(r.deck).length >= 2,
    build: () => ({
      title: 'The hot anvil',
      text: 'A forge still burning with nobody to mind it. The tongs are warm. It will work for you, at a cost to you.',
      options: [
        {
          id: 'temper',
          label: 'Work the bellows (lose 12 HP): two random cards in your deck are upgraded',
        },
        leave,
      ],
      cardOffer: '',
    }),
  },
  {
    id: 'wheel',
    weight: 1.5,
    when: () => true,
    build: () => ({
      title: 'The wheel of the rift',
      text: 'A huge wooden wheel, painted in three colours, turns by itself. Put a hand on it.',
      options: [
        {
          id: 'spin',
          label: 'Spin it: win 105 shards, or heal 30%, or lose 12% HP and gain a Wound',
        },
        leave,
      ],
      cardOffer: '',
    }),
  },
  {
    id: 'gilded',
    weight: 1,
    when: (r) => r.hp > 20,
    build: () => ({
      title: 'The gilded idol',
      text: 'A golden idol on a pedestal, in a room that is far too quiet. The floor under it has a seam.',
      options: [
        {
          id: 'grab',
          label: 'Grab it: +160 shards, and the roof comes down (lose 15% of your max HP)',
        },
        leave,
      ],
      cardOffer: '',
    }),
  },
  {
    id: 'bonfire',
    weight: 1,
    when: (r) => nonBasic(r.deck).length > 0 && r.deck.length > V2_DECK_RULES.minSize,
    // (the card the spirits will take is picked now, shown, and named: DECISIONS #233)
    build: (r) => {
      const pool = nonBasic(r.deck);
      // (offered only when there is one; a build without it names none)
      const pick = pool.length ? (pool[nextInt(r.rng, pool.length)] as string) : '';
      return {
        title: 'The bonfire spirits',
        text: 'Small lights circle a fire that does not need fuel. They will take a card from you and be grateful, in proportion.',
        options: [
          {
            id: 'burn',
            label: `Feed the fire ${COMBAT_DB.cards[pick]?.name ?? 'a card'}: heal ${bonfireHeal(pick)}`,
          },
          leave,
        ],
        cardOffer: pick,
      };
    },
  },
  {
    id: 'alchemist',
    weight: 1.2,
    when: (r) => r.potions.length < MAX_POTIONS,
    build: () => ({
      title: "The alchemist's bench",
      text: 'A bench of cracked glass and steaming dishes. A note: "Help yourself. Mind the green one."',
      options: [{ id: 'lab', label: 'Fill your belt: take two potions' }, leave],
      cardOffer: '',
    }),
  },
  // the data-driven ones (eventDeals.ts)
  ...DEAL_EVENTS,
  ...MORE_EVENTS,
  ...TUNED_EVENTS,
  ...LEGEND_EVENTS,
  ...TRADE_EVENTS,
];

/** Pick a random event, weighted, from those that can happen to this run now. */
export function rollEvent(r: RunState): EventCtx {
  // now and then the place is an elite one: an optional trial for a choice of better rewards
  const elite = rollElite(r);
  if (elite) return elite;
  const live = EVENTS.filter((e) => e.when(r));
  const pool = live.length ? live : [EVENTS[0] as EventDef];
  const total = pool.reduce((n, e) => n + e.weight, 0);
  let x = nextInt(r.rng, Math.round(total * 100)) / 100;
  for (const e of pool) {
    if (x < e.weight) return pinOptions(r, e.build(r));
    x -= e.weight;
  }
  return pinOptions(r, (pool[pool.length - 1] as EventDef).build(r));
}

/**
 * The hand-written options that touch a random card (an upgrade, a copy, a card thrown away, a transform) pick it now, when the event
 * is laid out, so the player sees which card before choosing (DECISIONS #273). resolveEvent then uses exactly those cards.
 */
export function pinOptions(r: RunState, ev: EventCtx): EventCtx {
  const pickOf = (xs: readonly string[]): string | undefined =>
    xs.length ? xs[nextInt(r.rng, xs.length)] : undefined;
  const upOf = (id: string): string => COMBAT_DB.cards[id]?.upgrade ?? id;
  for (const o of ev.options) {
    if (o.deal) continue;
    let shows: EventOption['shows'] | undefined;
    // (the card the event already named goes in the box of the option that takes or gives it, Robert 2026-10-30: the rift cache)
    const named = offerShows(o.id, ev.cardOffer);
    if (named) shows = named;
    // (hand-written options that add Wounds)
    else if (o.id === 'rob' || o.id === 'maxhp') shows = { lose: [], gain: ['wound'] };
    else if (o.id === 'idol') shows = { lose: [], gain: ['wound', 'wound'] };
    else if (o.id === 'upgrade') {
      const pick = pickOf(upgradable(r.deck));
      if (pick) shows = { lose: [pick], gain: [upOf(pick)] };
    } else if (o.id === 'temper') {
      const deck = [...r.deck];
      const lose: string[] = [];
      for (let i = 0; i < 2; i++) {
        const pick = pickOf(upgradable(deck));
        if (!pick) break;
        deck[deck.indexOf(pick)] = upOf(pick);
        lose.push(pick);
      }
      if (lose.length) shows = { lose, gain: lose.map(upOf) };
    } else if (o.id === 'mirror') {
      const pick = pickOf(nonBasic(r.deck).filter((id) => canAdd(r.deck, id)));
      if (pick) shows = { lose: [], gain: [pick] };
    } else if (o.id === 'scrap') {
      const pick = pickOf(basics(r.deck));
      if (pick) shows = { lose: [pick], gain: [] };
    } else if (o.id === 'purge') {
      const pick = r.deck.includes('wound') ? 'wound' : pickOf(basics(r.deck));
      if (pick) shows = { lose: [pick], gain: [] };
    } else if (o.id === 'transform') {
      const from = pickOf(basics(r.deck).filter((id) => id !== 'wound'));
      let made = '';
      for (let g = 0; g < 20 && from && !made; g++)
        for (const id of offerCards(r.rng, r.character, r.deck, 'duel', 3))
          if (!made && COMBAT_DB.cards[id]?.hero === r.character && canAdd(r.deck, id)) made = id;
      if (from && made) shows = { lose: [from], gain: [made] };
    }
    if (shows) o.shows = shows;
  }
  return ev;
}

/** The card an option picked when the event was laid out if it is still in `pool`, else one from `pool` now (an older save). */
function pinnedOr(
  r: RunState,
  o: EventOption | undefined,
  side: 'lose' | 'gain',
  i: number,
  pool: readonly string[],
): string {
  return (
    pinned(o, side, i, (id) => pool.includes(id)) ?? (pool[nextInt(r.rng, pool.length)] as string)
  );
}

/** The card an option picked when the event was laid out, if it is still where it was (an older save picks one now). */
function pinned(
  o: EventOption | undefined,
  side: 'lose' | 'gain',
  i: number,
  ok: (id: string) => boolean,
): string | undefined {
  const id = o?.shows?.[side][i];
  return id !== undefined && ok(id) ? id : undefined;
}

/** Carry out one option; returns what happened, in a sentence. Throws (via `fail`) when the option is not allowed right now. */
export function resolveEvent(
  r: RunState,
  option: EventOption['id'],
  ev: EventCtx,
  helpers: { gainBoon: (r: RunState, id: string) => void; fail: (msg: string) => never },
): string {
  const { fail } = helpers;
  const chosen = ev.options.find((o) => o.id === option);
  if (option === 'trial') return fail('Spin the reel for that');
  if (chosen?.deal) return applyDeal(r, chosen, ev, helpers);
  switch (option) {
    case 'shards':
      r.shards += 40;
      return 'You pocket 40 shards.';
    case 'heal':
      healBy(r, r.maxHp * 0.2);
      return 'The water is cold and clean. You feel better.';
    case 'card':
      if (!ev.cardOffer || !canAdd(r.deck, ev.cardOffer))
        return 'You cannot take that card: your deck already holds all it can.';
      r.deck.push(ev.cardOffer);
      return `You take ${COMBAT_DB.cards[ev.cardOffer]?.name ?? 'the card'}.`;
    case 'upgrade': {
      const ups = upgradable(r.deck);
      if (!ups.length) fail('Nothing to upgrade');
      const pick = pinnedOr(r, chosen, 'lose', 0, ups);
      r.deck[r.deck.indexOf(pick)] = COMBAT_DB.cards[pick]?.upgrade ?? pick;
      return `The smith upgrades ${COMBAT_DB.cards[pick]?.name ?? 'a card'}.`;
    }
    case 'ancestor':
      if (!ev.cardOffer) return fail('There is nothing to take');
      if (r.hp <= 12) fail('You are too hurt for that');
      if (!canAdd(r.deck, ev.cardOffer)) fail('That card would break the deck rules');
      r.hp -= 12;
      r.deck.push(ev.cardOffer);
      return `The stones go quiet. You carry away ${COMBAT_DB.cards[ev.cardOffer]?.name ?? 'the card'}.`;
    case 'cross':
      if (!ev.cardOffer) return fail('There is nothing to take');
      if (!canAdd(r.deck, ev.cardOffer)) return fail('That card would break the deck rules');
      r.deck.push(ev.cardOffer);
      return `You take ${COMBAT_DB.cards[ev.cardOffer]?.name ?? 'the card'}: not your class's card, but yours now.`;
    case 'bleed':
      if (r.hp <= 10) fail('You are too hurt for that');
      r.hp -= 10;
      r.shards += 80;
      return 'The altar drinks, and pays: 80 shards.';
    case 'boon':
      if (!ev.boonOffer) return fail('There is no boon here');
      if (r.hp <= 15) fail('You are too hurt for that');
      r.hp -= 15;
      helpers.gainBoon(r, ev.boonOffer);
      return `The altar gives up ${COMBAT_DB.boons[ev.boonOffer]?.name ?? 'a Boon'}.`;
    case 'sanctify': {
      if (r.sanctified) fail('The fire has already taken this deck');
      r.sanctified = true;
      let up = 0;
      let down = 0;
      let same = 0;
      r.deck = r.deck.map((id) => {
        const base = COMBAT_DB.cards[stripRoll(id)];
        if (!base || !canRoll(base)) return id;
        // a fifth of the cards are untouched; of the rest, slightly kind to the player: 55% go up
        // (only numbers change: a card's cost is never rolled)
        if (nextInt(r.rng, 100) < 20) {
          same++;
          return id;
        }
        const dir = nextInt(r.rng, 100) < 55 ? 1 : -1;
        if (dir > 0) up++;
        else down++;
        return rolledId(id, dir);
      });
      return `The fire takes your deck: ${up} cards rise 25%, ${down} fall 25%, ${same} are left as they were.`;
    }
    case 'bet': {
      if (r.shards < 30) fail('You need 30 shards to bet');
      const win = nextInt(r.rng, 2) === 0;
      r.eventFlips = [{ pct: 50, won: win }];
      if (win) {
        r.shards += 30;
        return 'You call it right. The gambler pays 60 shards (you net 30).';
      }
      r.shards -= 30;
      return 'Wrong call. The gambler keeps your 30 shards.';
    }
    case 'help': {
      if (r.hp <= 8) fail('You are too hurt for that');
      r.hp -= 8;
      if (r.potions.length < MAX_POTIONS) {
        const p = offerPotion(r.rng);
        r.potions.push(p);
        return `They press ${COMBAT_DB.potions[p]?.name ?? 'a potion'} into your hand.`;
      }
      r.shards += 65;
      return 'Your belt is full, so they give you 65 shards instead.';
    }
    case 'rob':
      r.shards += 90;
      r.deck.push('wound');
      return 'You take 90 shards. Something about it stays with you: a Wound joins your deck.';
    case 'idol':
      if (!ev.boonOffer) return fail('The idol is silent');
      helpers.gainBoon(r, ev.boonOffer);
      r.deck.push('wound', 'wound');
      return `You carry the idol. It gives you ${COMBAT_DB.boons[ev.boonOffer]?.name ?? 'a Boon'}, and two Wounds.`;
    case 'drink': {
      const win = nextInt(r.rng, 100) < 60;
      r.eventFlips = [{ pct: 60, won: win }];
      if (win) {
        healBy(r, r.maxHp * 0.3);
        return 'The water is sweet. You heal 30% of your HP.';
      }
      r.hp = Math.max(1, r.hp - Math.ceil(r.maxHp * 0.1));
      return 'The water burns going down. You lose 10% of your HP.';
    }
    case 'mirror': {
      if (r.hp <= 15) fail('You are too hurt for that');
      // a copy still obeys the deck rules (a Legendary is one of a kind, and the Legendary limit)
      const pool = nonBasic(r.deck).filter((id) => canAdd(r.deck, id));
      if (!pool.length) fail('There is nothing to copy');
      const pick = pinnedOr(r, chosen, 'gain', 0, pool);
      r.hp -= 15;
      r.deck.push(pick);
      return `Your reflection hands you a copy of ${COMBAT_DB.cards[pick]?.name ?? 'a card'}.`;
    }
    case 'scrap': {
      const pool = basics(r.deck);
      if (!pool.length || r.deck.length <= V2_DECK_RULES.minSize)
        fail('Your deck is too small to part with a card');
      const pick = pinnedOr(r, chosen, 'lose', 0, pool);
      r.deck.splice(r.deck.indexOf(pick), 1);
      return `You leave ${COMBAT_DB.cards[pick]?.name ?? 'a card'} on the heap.`;
    }
    case 'sell':
      r.shards += 35;
      return 'You sell some scrap for 35 shards.';
    case 'maxhp':
      r.maxHp += 6;
      r.hp += 6;
      r.deck.push('wound');
      return 'The scale is cold in your pocket. +6 max HP, and a Wound joins your deck.';
    case 'tend':
      if (r.shards < 35) fail('You need 35 shards');
      r.shards -= 35;
      healBy(r, r.maxHp * 0.3);
      return 'Salt, then warmth. You heal 30% of your HP.';
    case 'purge': {
      if (r.shards < 50) fail('You need 50 shards');
      const wound = r.deck.indexOf('wound');
      const pool = basics(r.deck);
      if (wound < 0 && (!pool.length || r.deck.length <= V2_DECK_RULES.minSize))
        fail('There is nothing to cleanse');
      r.shards -= 50;
      if (wound >= 0) {
        r.deck.splice(wound, 1);
        return 'The healer draws out a Wound. It leaves your deck.';
      }
      const pick = pinnedOr(r, chosen, 'lose', 0, pool);
      r.deck.splice(r.deck.indexOf(pick), 1);
      return `The healer lifts ${COMBAT_DB.cards[pick]?.name ?? 'a card'} out of your deck.`;
    }
    case 'temper': {
      if (r.hp <= 12) fail('You are too hurt for that');
      const done: string[] = [];
      for (let i = 0; i < 2; i++) {
        const ups = upgradable(r.deck);
        if (!ups.length) break;
        const pick = pinnedOr(r, chosen, 'lose', i, ups);
        r.deck[r.deck.indexOf(pick)] = COMBAT_DB.cards[pick]?.upgrade ?? pick;
        done.push(COMBAT_DB.cards[pick]?.name ?? 'a card');
      }
      if (!done.length) fail('Nothing to upgrade');
      r.hp -= 12;
      return `The bellows roar. ${done.join(' and ')} ${done.length === 1 ? 'is' : 'are'} upgraded.`;
    }
    case 'spin': {
      const roll = nextInt(r.rng, 3);
      if (roll === 0) {
        r.shards += 105;
        return 'The wheel stops on gold: +105 shards.';
      }
      if (roll === 1) {
        healBy(r, r.maxHp * 0.3);
        return 'The wheel stops on green: you heal 30% of your HP.';
      }
      r.hp = Math.max(1, r.hp - Math.ceil(r.maxHp * 0.12));
      r.deck.push('wound');
      return 'The wheel stops on black: you lose 12% of your HP, and a Wound joins your deck.';
    }
    case 'grab': {
      if (r.hp <= 20) fail('You are too hurt for that');
      r.shards += 160;
      r.hp = Math.max(1, r.hp - Math.ceil(r.maxHp * 0.15));
      return 'You snatch the idol and run. The roof does not forgive: +160 shards, and you lose 15% of your max HP in bruises.';
    }
    case 'burn': {
      const pool = nonBasic(r.deck);
      if (!pool.length || r.deck.length <= V2_DECK_RULES.minSize) fail('There is nothing to burn');
      // (the card the option named; an event saved by an older build picks one now)
      const pick =
        ev.cardOffer && r.deck.includes(ev.cardOffer)
          ? ev.cardOffer
          : (pool[nextInt(r.rng, pool.length)] as string);
      const heal = bonfireHeal(pick);
      r.deck.splice(r.deck.indexOf(pick), 1);
      healBy(r, heal);
      return `The spirits take ${COMBAT_DB.cards[pick]?.name ?? 'a card'} and warm you: heal ${heal}.`;
    }
    case 'lab': {
      let n = 0;
      while (r.potions.length < MAX_POTIONS && n < 2) {
        r.potions.push(offerPotion(r.rng));
        n++;
      }
      if (!n) fail('Your belt is full');
      return `You fill your belt: ${n} potion${n > 1 ? 's' : ''}.`;
    }
    case 'transform': {
      const pool = basics(r.deck).filter((id) => id !== 'wound');
      if (!pool.length) fail('You have no basic card to press');
      const out = pinnedOr(r, chosen, 'lose', 0, pool);
      let made = pinned(chosen, 'gain', 0, (id) => canAdd(r.deck, id)) ?? '';
      for (let g = 0; g < 20 && !made; g++)
        for (const id of offerCards(r.rng, r.character, r.deck, 'duel', 3))
          if (!made && COMBAT_DB.cards[id]?.hero === r.character && canAdd(r.deck, id)) made = id;
      if (!made) fail('The wall stays grey');
      r.deck[r.deck.indexOf(out)] = made;
      return `${COMBAT_DB.cards[out]?.name ?? 'A card'} comes back as ${COMBAT_DB.cards[made]?.name ?? 'something new'}.`;
    }
    case 'leave':
      return 'You walk on.';
  }
  return 'You walk on.';
}
