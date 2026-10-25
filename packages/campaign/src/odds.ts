// What the chances of the game are, worked out from the same tables and events the game uses (so the How to play page can show
// them without ever being out of date): the share of events that offer each kind of thing.

import { newRun } from './run';
import { EVENTS } from './events';
import type { DealStep } from './types';

export type EventTag =
  | 'removal'
  | 'crossed'
  | 'upgrade'
  | 'boon'
  | 'card'
  | 'shards'
  | 'heal'
  | 'maxHp'
  | 'potion'
  | 'risk';

export const EVENT_TAG_LABEL: Record<EventTag, string> = {
  removal: 'Let a card go (a plain Attack or Defend, or a Wound)',
  crossed: 'A Rift-crossed card (from another Riftwalker)',
  upgrade: 'Upgrade a card',
  boon: 'A Boon',
  card: 'A card of your own',
  shards: 'Shards',
  heal: 'Healing',
  maxHp: 'More max HP',
  potion: 'A potion',
  risk: 'Something can go wrong (HP loss, a Wound or Static card)',
};

/** The hand-written events (the first twenty) are not made of steps, so what they offer is listed here. */
const HAND_WRITTEN: Record<string, EventTag[]> = {
  cache: ['shards', 'heal', 'card'],
  smith: ['upgrade'],
  altar: ['shards', 'boon', 'risk'],
  ancestors: ['card', 'risk'],
  stranger: ['crossed'],
  sanctify: [],
  gambler: ['shards', 'risk'],
  traveller: ['potion', 'shards', 'risk'],
  idol: ['boon', 'risk'],
  well: ['heal', 'risk'],
  mirror: ['card', 'risk'],
  scrapyard: ['removal', 'shards'],
  shoal: ['heal', 'maxHp', 'risk'],
  healer: ['heal', 'removal'],
  forge: ['upgrade', 'risk'],
  wheel: ['shards', 'heal', 'risk'],
  gilded: ['shards', 'risk'],
  bonfire: ['removal', 'heal'],
  alchemist: ['potion'],
  shifter: ['card'],
};

function tagsOf(steps: readonly DealStep[], out: Set<EventTag>): void {
  for (const s of steps) {
    switch (s.k) {
      case 'remove':
        // (taking away "any" card at random is a cost, not a way to thin the deck)
        if (s.of !== 'any') out.add('removal');
        break;
      case 'crossed':
      case 'crossedPick':
      case 'exchange':
        out.add('crossed');
        break;
      case 'upgrade':
        out.add('upgrade');
        break;
      case 'boon':
      case 'boonOf':
        out.add('boon');
        break;
      case 'gift':
      case 'card':
      case 'copy':
      case 'transform':
        out.add('card');
        break;
      case 'shards':
        if (s.n > 0) out.add('shards');
        break;
      case 'heal':
        out.add('heal');
        break;
      case 'maxHp':
        if (s.n > 0) out.add('maxHp');
        break;
      case 'potion':
      case 'potionOf':
        out.add('potion');
        break;
      case 'hurt':
      case 'hurtPct':
      case 'wound':
      case 'static':
        out.add('risk');
        break;
      case 'chance':
        tagsOf(s.win, out);
        tagsOf(s.lose, out);
        break;
      default:
        break;
    }
  }
}

/** For every kind of thing an event can offer, the percentage of events (by how often each comes up) that offer it in at least one choice. */
export function eventOffers(): { count: number; share: Record<EventTag, number> } {
  const base = newRun('knight', 'odds');
  const run = { ...base, shards: 500, hp: 80 };
  const totals = {} as Record<EventTag, number>;
  let weight = 0;
  for (const def of EVENTS) {
    weight += def.weight;
    const tags = new Set<EventTag>(HAND_WRITTEN[def.id] ?? []);
    if (!(def.id in HAND_WRITTEN)) {
      const ev = def.build(JSON.parse(JSON.stringify(run)) as typeof run);
      for (const o of ev.options) if (o.deal) tagsOf(o.deal, tags);
    }
    for (const t of tags) totals[t] = (totals[t] ?? 0) + def.weight;
  }
  const share = {} as Record<EventTag, number>;
  for (const t of Object.keys(EVENT_TAG_LABEL) as EventTag[])
    share[t] = Math.round(((totals[t] ?? 0) / weight) * 100);
  return { count: EVENTS.length, share };
}
