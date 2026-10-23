// Random events on the map. Each is a small story with a choice: some are generous, some are a gamble, some are a bad deal
// with an upside, and only a few offer a card. rollEvent picks one by weight among those that make sense right now;
// resolveEvent carries out the player's choice and says what happened.

import { nextInt } from '@sr/combat';
import { COMBAT_DB, canRoll, rolledId, stripRoll, V2_DECK_RULES } from '@sr/content/v2';
import { MAX_POTIONS, ancestralPool, canAdd, offerBoon, offerCards, offerPotion } from './rewards';
import type { EventOption, NodeContext, RunState } from './types';

type EventCtx = NonNullable<NodeContext['event']>;

const leave: EventOption = { id: 'leave', label: 'Walk away' };

/** The hand that weighs and builds an event for this run. */
interface EventDef {
  id: string;
  weight: number;
  /** can it happen right now? */
  when: (r: RunState) => boolean;
  build: (r: RunState) => EventCtx;
}

const basics = (deck: readonly string[]): string[] =>
  deck.filter((id) => COMBAT_DB.cards[id]?.rarity === 'basic');
const nonBasic = (deck: readonly string[]): string[] =>
  deck.filter((id) => {
    const c = COMBAT_DB.cards[id];
    return !!c && c.rarity !== 'basic' && !id.includes('~') && canAdd(deck, id);
  });
const upgradable = (deck: readonly string[]): string[] => [
  ...new Set(deck.filter((id) => !!COMBAT_DB.cards[id]?.upgrade)),
];

export const EVENTS: EventDef[] = [
  {
    id: 'cache',
    weight: 3,
    when: () => true,
    build: (r) => {
      // a card is on the table only now and then
      const card =
        nextInt(r.rng, 100) < 35
          ? (offerCards(r.rng, r.character, r.deck, 'duel', 1, r.luck)[0] ?? '')
          : '';
      return {
        title: 'A rift cache',
        text: 'A seam in the world has split open, and something glints inside. You can only carry one thing away.',
        options: [
          { id: 'shards', label: 'Take the shards (+30)' },
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
    id: 'smith',
    weight: 2,
    when: (r) => upgradable(r.deck).length > 0,
    build: () => ({
      title: 'The wandering smith',
      text: 'A smith has set up a forge in the ruins. "One piece of yours, tempered free. I choose."',
      options: [{ id: 'upgrade', label: 'Let the smith temper a random card' }, leave],
      cardOffer: '',
    }),
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
          { id: 'bleed', label: 'Give 10 HP: gain 60 shards' },
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
    id: 'sanctify',
    weight: 2,
    when: (r) => r.deck.some((id) => canRoll(COMBAT_DB.cards[stripRoll(id)]!)),
    build: () => ({
      title: 'The Sanctum of Change',
      text: 'A basin of white fire. Step in and your whole deck is sanctified: every card is re-rolled, about half of them 25% stronger and the rest 25% weaker. It cannot be undone, and you do not choose which.',
      options: [
        { id: 'sanctify', label: 'Sanctify the whole deck' },
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
        { id: 'rob', label: 'Take their goods: +70 shards and a Wound in your deck' },
        leave,
      ],
      cardOffer: '',
    }),
  },
  {
    id: 'idol',
    weight: 1.5,
    when: (r) => Object.keys(COMBAT_DB.boons).some((id) => !r.boons.includes(id)),
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
    id: 'mirror',
    weight: 1,
    when: (r) => r.hp > 25 && nonBasic(r.deck).length > 0,
    build: () => ({
      title: 'The mirror pool',
      text: 'Your reflection moves a moment late, and holds out its hand.',
      options: [
        { id: 'mirror', label: 'Reach in (lose 15 HP): a random card of yours is copied' },
        leave,
      ],
      cardOffer: '',
    }),
  },
  {
    id: 'scrapyard',
    weight: 1.5,
    when: (r) => basics(r.deck).length > 0 && r.deck.length > V2_DECK_RULES.minSize,
    build: () => ({
      title: 'The scrapyard',
      text: 'Heaps of broken armour and rusted blades. Whatever you leave here, someone will pay for.',
      options: [
        { id: 'scrap', label: 'Leave a basic card behind (a random Slash or Guard goes)' },
        { id: 'sell', label: 'Sell some scrap: +25 shards' },
        leave,
      ],
      cardOffer: '',
    }),
  },
];

/** Pick a random event, weighted, from those that can happen to this run now. */
export function rollEvent(r: RunState): EventCtx {
  const live = EVENTS.filter((e) => e.when(r));
  const pool = live.length ? live : [EVENTS[0] as EventDef];
  const total = pool.reduce((n, e) => n + e.weight, 0);
  let x = nextInt(r.rng, Math.round(total * 100)) / 100;
  for (const e of pool) {
    if (x < e.weight) return e.build(r);
    x -= e.weight;
  }
  return (pool[pool.length - 1] as EventDef).build(r);
}

const healBy = (r: RunState, n: number): void => {
  r.hp = Math.min(r.maxHp, r.hp + Math.ceil(n));
};

/** Carry out one option; returns what happened, in a sentence. Throws (via `fail`) when the option is not allowed right now. */
export function resolveEvent(
  r: RunState,
  option: EventOption['id'],
  ev: EventCtx,
  helpers: { gainBoon: (r: RunState, id: string) => void; fail: (msg: string) => never },
): string {
  const { fail } = helpers;
  switch (option) {
    case 'shards':
      r.shards += 30;
      return 'You pocket 30 shards.';
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
      const pick = ups[nextInt(r.rng, ups.length)] as string;
      r.deck[r.deck.indexOf(pick)] = COMBAT_DB.cards[pick]?.upgrade ?? pick;
      return `The smith tempers ${COMBAT_DB.cards[pick]?.name ?? 'a card'}.`;
    }
    case 'ancestor':
      if (!ev.cardOffer) return fail('There is nothing to take');
      if (r.hp <= 12) fail('You are too hurt for that');
      if (!canAdd(r.deck, ev.cardOffer)) fail('That card would break the deck rules');
      r.hp -= 12;
      r.deck.push(ev.cardOffer);
      return `The stones go quiet. You carry away ${COMBAT_DB.cards[ev.cardOffer]?.name ?? 'the card'}.`;
    case 'bleed':
      if (r.hp <= 10) fail('You are too hurt for that');
      r.hp -= 10;
      r.shards += 60;
      return 'The altar drinks, and pays: 60 shards.';
    case 'boon':
      if (!ev.boonOffer) return fail('There is no boon here');
      if (r.hp <= 15) fail('You are too hurt for that');
      r.hp -= 15;
      helpers.gainBoon(r, ev.boonOffer);
      return `The altar gives up ${COMBAT_DB.boons[ev.boonOffer]?.name ?? 'a Boon'}.`;
    case 'sanctify': {
      let up = 0;
      let down = 0;
      r.deck = r.deck.map((id) => {
        const base = COMBAT_DB.cards[stripRoll(id)];
        if (!base || !canRoll(base)) return id;
        // slightly kind to the player: 55% of rolls go up
        const dir = nextInt(r.rng, 100) < 55 ? 1 : -1;
        if (dir > 0) up++;
        else down++;
        return rolledId(id, dir);
      });
      return `The fire takes your deck: ${up} cards rise 25%, ${down} fall 25%.`;
    }
    case 'bet':
      if (r.shards < 30) fail('You need 30 shards to bet');
      if (nextInt(r.rng, 2) === 0) {
        r.shards += 30;
        return 'You call it right. The gambler pays 60 shards (you net 30).';
      }
      r.shards -= 30;
      return 'Wrong call. The gambler keeps your 30 shards.';
    case 'help': {
      if (r.hp <= 8) fail('You are too hurt for that');
      r.hp -= 8;
      if (r.potions.length < MAX_POTIONS) {
        const p = offerPotion(r.rng);
        r.potions.push(p);
        return `They press ${COMBAT_DB.potions[p]?.name ?? 'a potion'} into your hand.`;
      }
      r.shards += 50;
      return 'Your belt is full, so they give you 50 shards instead.';
    }
    case 'rob':
      r.shards += 70;
      r.deck.push('wound');
      return 'You take 70 shards. Something about it stays with you: a Wound joins your deck.';
    case 'idol':
      if (!ev.boonOffer) return fail('The idol is silent');
      helpers.gainBoon(r, ev.boonOffer);
      r.deck.push('wound', 'wound');
      return `You carry the idol. It gives you ${COMBAT_DB.boons[ev.boonOffer]?.name ?? 'a Boon'}, and two Wounds.`;
    case 'drink':
      if (nextInt(r.rng, 100) < 60) {
        healBy(r, r.maxHp * 0.3);
        return 'The water is sweet. You heal 30% of your HP.';
      }
      r.hp = Math.max(1, r.hp - Math.ceil(r.maxHp * 0.1));
      return 'The water burns going down. You lose 10% of your HP.';
    case 'mirror': {
      if (r.hp <= 15) fail('You are too hurt for that');
      const pool = nonBasic(r.deck);
      if (!pool.length) fail('There is nothing to copy');
      const pick = pool[nextInt(r.rng, pool.length)] as string;
      r.hp -= 15;
      r.deck.push(pick);
      return `Your reflection hands you a copy of ${COMBAT_DB.cards[pick]?.name ?? 'a card'}.`;
    }
    case 'scrap': {
      const pool = basics(r.deck);
      if (!pool.length || r.deck.length <= V2_DECK_RULES.minSize)
        fail('Your deck is too small to part with a card');
      const pick = pool[nextInt(r.rng, pool.length)] as string;
      r.deck.splice(r.deck.indexOf(pick), 1);
      return `You leave ${COMBAT_DB.cards[pick]?.name ?? 'a card'} on the heap.`;
    }
    case 'sell':
      r.shards += 25;
      return 'You sell some scrap for 25 shards.';
    case 'leave':
      return 'You walk on.';
  }
  return 'You walk on.';
}
