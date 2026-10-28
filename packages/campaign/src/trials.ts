// Elite events: now and then (ELITE_EVENT_CHANCE of the time an event comes up) a place offers the Brass Reel, an optional
// prize machine: thirteen prizes sit on a reel, all of them in plain sight, and for ROLL_COST shards the reel spins and stops on one. You
// may take that prize, or pay again for another spin and a chance at a different prize; or walk away. The spin is drawn by the rules
// from the run's own seeded stream (saved with the run, so reloading does not give another try); the client only animates it
// (apps/web/src/trials). This file builds the offer (which prizes are on the reel, all fixed when the event is rolled) and carries
// out the spin and the taking of a prize.

import { nextInt, type RngState } from '@sr/combat';
import { BOONS, COMBAT_DB, POTIONS, V2_DECK_RULES, rewardPool } from '@sr/content/v2';
import { canAdd, crossedOffers } from './rewards';
import { applyDeal, dealFeasible, removableCards, type DealHelpers, type EventCtx } from './deals';
import type { DealStep, RunState, TrialOffer, TrialPrize } from './types';

/** The chance, in percent, that an event is an elite one (when one can be built). */
export const ELITE_EVENT_CHANCE = 10;
/**
 * Every prize on the reel, by kind (the marks on the reel). All elite events share this one pool and every reel shows all of it;
 * where each prize stands on the reel is shuffled for every event.
 */
export const REEL_KINDS: string[] = [
  'card',
  'rare',
  'boon',
  'boon',
  'crossed',
  'crossed',
  'potion',
  'upgrade',
  'upgrade',
  'shards',
  'heal',
  'hp',
  'thin',
];
/** Prizes on the reel, and what one spin costs (in shards). */
export const REEL_PRIZES = REEL_KINDS.length;
export const ROLL_COST = 25;

/** What the next spin costs: the first spin at a reel is free (Robert, 2026-10-26; DECISIONS #283), every one after it ROLL_COST. */
export function spinCost(trial: { rolls?: number } | undefined): number {
  return (trial?.rolls ?? 0) === 0 ? 0 : ROLL_COST;
}

export interface EliteSpec {
  id: string;
  title: string;
  text: string;
}

export const ELITE_EVENTS: EliteSpec[] = [
  {
    id: 'brass-cascade',
    title: 'Spin To Win',
    text: 'A brass machine with a window of spinning prizes stands against a ruined wall, a slot for coins beside it. A hand-lettered sign: "First spin free, then 25 shards a spin. Take what it stops on, or pay to spin again. Everything on the reel is shown."',
  },
  {
    id: 'brass-pegboard',
    title: 'Spin To Win',
    text: 'A brass reel machine older than the town around it, kept oiled by someone who is never there. Thirteen things behind glass, mostly cards, turning past a pointer. The first pull is free; pull the lever and see what the reel thinks you deserve.',
  },
  {
    id: 'copper-chute',
    title: 'Spin To Win',
    text: 'A brass machine with bottles, cards and trinkets turning in its window, and a tinker asleep on a stool. A note: "Mind the lever. Take what it stops on."',
  },
  {
    id: 'silver-sluice',
    title: 'Spin To Win',
    text: 'A water-run brass machine, its reel turned by a trickle of water, thirteen prizes riding it past a pointer. Something gleams on each. The water does not care what you want, but your hands might.',
  },
  {
    id: 'gilded-drop',
    title: 'Spin To Win',
    text: 'A brass machine in a hall with no roof. Thirteen prizes on velvet turn past a pointer, and a bowl of coins waits on a cushion. An attendant coughs politely: "Whenever you are ready."',
  },
];

/** The Brass Reel that stands in a Gambler's Shrine (DECISIONS #234): the same reel as an elite event's, spun beside the blessings. */
export const GAMBLER_REEL: EliteSpec = {
  id: 'gambler-shrine',
  title: 'Spin To Win',
  text: 'In an alcove of the shrine a brass reel turns slowly, its prizes catching the candlelight. The first spin is free, then 25 shards a spin; take what it stops on, or pay to spin again. One prize to a visit.',
};

const name = (id: string): string => COMBAT_DB.cards[id]?.name ?? 'a card';

/** `n` different picks from a list (fewer if it is short). */
function pick<T>(rng: RngState, list: readonly T[], n: number): T[] {
  const from = [...list];
  const out: T[] = [];
  while (out.length < n && from.length) out.push(from.splice(nextInt(rng, from.length), 1)[0] as T);
  return out;
}

type Maker = () => Omit<TrialPrize, 'id'>;

/** The prizes of the reel for this run (each is checked to be takeable; one that is not becomes a purse of shards). */
function prizesFor(r: RunState): { prizes: TrialPrize[] } {
  const ev = { title: '', text: '', cardOffer: '', options: [] } as EventCtx;
  const slot = (
    icon: string,
    short: string,
    label: string,
    deal: DealStep[],
    show: {
      card?: string;
      boon?: string;
      potion?: string;
      choices?: string[];
      removeUpTo?: number;
    } = {},
  ): Omit<TrialPrize, 'id'> => ({ icon, short, label, deal, ...show });
  const purse = (n: number): Omit<TrialPrize, 'id'> =>
    slot('shards', `+${n} shards`, `A purse: +${n} shards`, [{ k: 'shards', n }]);

  const own = rewardPool(r.character).filter(
    (id) => COMBAT_DB.cards[id]?.hero === r.character && canAdd(r.deck, id),
  );
  const rares = pick(
    r.rng,
    own.filter((id) => COMBAT_DB.cards[id]?.rarity === 'rare'),
    6,
  );
  const boons = pick(
    r.rng,
    // (never a Legendary Boon: those come from Elites, rarely, and from clearing a loop)
    BOONS.filter((b) => !r.boons.includes(b.id) && b.rarity !== 'legendary'),
    4,
  ).map((b) => b.id);
  // each Rift-crossed lane is a choice of three different Rift-crossed rares (the reel has two such prizes)
  const crossed = crossedOffers(
    r.rng,
    r.character,
    r.deck,
    Array.from({ length: 12 }, () => 'rare'),
    12,
  ).filter((id) => COMBAT_DB.cards[id]?.rarity === 'rare');
  const potions = pick(
    r.rng,
    POTIONS.filter((p) => p.rarity === 'rare'),
    4,
  );

  const cardSlot = (id: string | undefined, icon: string, again: number): Omit<TrialPrize, 'id'> =>
    id ? slot(icon, name(id), `Take ${name(id)}`, [{ k: 'card', id }], { card: id }) : purse(again);
  // the top prize: a rare of yours (it was a Legendary card until Legendary was put away, DECISIONS #363)
  const legend =
    (k: number): Maker =>
    () =>
      cardSlot(rares[4 + k / 2], 'card', 260);
  // a rare card of your class (a lane of its own)
  const rareCard =
    (k: number): Maker =>
    () =>
      cardSlot(rares[k], 'rare', 195);
  const cross =
    (i: number): Maker =>
    () => {
      const three = crossed.slice(i * 3, i * 3 + 3);
      return three.length === 3
        ? slot(
            'crossed',
            'Pick 1 of 3 Rift-crossed rares',
            'Choose one of three Rift-crossed rare cards',
            [{ k: 'card', id: three[0] as string }],
            { card: three[0] as string, choices: three },
          )
        : purse(195);
    };
  const boon =
    (i: number): Maker =>
    () => {
      const id = boons[i];
      const bname = id ? (COMBAT_DB.boons[id]?.name ?? 'Boon') : '';
      return id
        ? slot('boon', bname, `Take ${bname}`, [{ k: 'boonOf', id }], { boon: id })
        : slot('hp', '+12 max HP', 'Vitality: +12 max HP', [{ k: 'maxHp', n: 12 }]);
    };
  const potion =
    (i: number): Maker =>
    () => {
      const p = potions[i];
      return p
        ? slot('potion', p.name, `Take ${p.name}`, [{ k: 'potionOf', id: p.id }], { potion: p.id })
        : purse(155);
    };
  const upgrade =
    (n: number): Maker =>
    () =>
      slot('upgrade', `Upgrade ×${n}`, `Masterwork: ${n} random cards are upgraded`, [
        { k: 'upgrade', n },
      ]);
  // (the cards are chosen when it is taken, and none is fine: see takePrize)
  const thin: Maker = () =>
    r.deck.length <= V2_DECK_RULES.minSize || !removableCards(r.deck).length
      ? purse(130)
      : slot(
          'thin',
          'Remove up to 2 cards',
          'A lighter load: remove up to two cards of your choice',
          [],
          { removeUpTo: 2 },
        );
  const vitality: Maker = () =>
    slot('hp', '+10 HP, heal', 'Vitality: +10 max HP, and heal 30%', [
      { k: 'maxHp', n: 10 },
      { k: 'heal', pct: 30 },
    ]);
  const heal: Maker = () =>
    slot('heal', 'Heal 40%', 'A rest: heal 40% of your HP', [{ k: 'heal', pct: 40 }]);
  const shards: Maker = () => purse(115);

  const makers: Maker[] = [
    legend(0),
    rareCard(0),
    boon(0),
    boon(1),
    cross(0),
    cross(1),
    potion(0),
    upgrade(3),
    upgrade(2),
    shards,
    heal,
    vitality,
    thin,
  ];
  const first: TrialPrize[] = makers.map((m, i) => {
    const p = m();
    return { ...(dealFeasible(r, p.deal, ev) ? p : purse(130)), id: String(i) };
  });
  // where each prize stands on the reel is shuffled for every event, so the same prize is not in the same place twice
  const lanes = first.map((_, i) => i);
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = nextInt(r.rng, i + 1);
    [lanes[i], lanes[j]] = [lanes[j] as number, lanes[i] as number];
  }
  return {
    prizes: lanes.map((from, lane) => ({ ...(first[from] as TrialPrize), id: `p${lane}` })),
  };
}

/** Build an elite event for this run. */
export function buildElite(spec: EliteSpec, r: RunState): EventCtx {
  const trial: TrialOffer = {
    game: 'reel',
    tier: r.tier,
    seed: nextInt(r.rng, 1_000_000_000),
    state: 'open',
    consolation: 25,
    theme: 'whatever the reel stops on',
    ...prizesFor(r),
  };
  return {
    title: spec.title,
    text: spec.text,
    options: [
      {
        id: 'trial',
        label: `Spin the reel, the first spin free: take what it stops on, or pay ${ROLL_COST} shards to spin again`,
      },
      { id: 'leave', label: 'Walk away' },
    ],
    cardOffer: '',
    trial,
  };
}

/** Roll an elite event: null most of the time. */
export function rollElite(r: RunState): EventCtx | null {
  if (nextInt(r.rng, 100) >= ELITE_EVENT_CHANCE) return null;
  const spec = ELITE_EVENTS[nextInt(r.rng, ELITE_EVENTS.length)] as EliteSpec;
  return buildElite(spec, r);
}

/**
 * Pay for a spin: the reel stops on one of the prizes, drawn from the run's own stream (so a reload cannot spin again for free).
 * Every prize is equally likely, except that it never stops on the prize already on the table (paying to spin and getting the same
 * thing would be no spin at all). Returns the number of the prize it stopped on. The prize on the table is `earned`, and is taken
 * with `takePrize`; spinning again lets it go.
 */
export function spinReel(r: RunState, ev: EventCtx, fail: (msg: string) => never): number {
  const t = ev.trial;
  if (!t || (t.state !== 'open' && t.state !== 'won')) return fail('There is no reel to spin');
  const cost = spinCost(t);
  if (r.shards < cost) return fail(`A spin costs ${cost} shards`);
  const here = t.earned?.[0];
  const from = t.prizes.map((_, i) => i).filter((i) => i !== here);
  const got = from[nextInt(r.rng, from.length)] as number;
  r.shards -= cost;
  t.earned = [got];
  t.state = 'won';
  t.rolls = (t.rolls ?? 0) + 1;
  return got;
}

/** Take the prize the reel stopped on. */
export function takePrize(
  r: RunState,
  ev: EventCtx,
  prize: string,
  h: DealHelpers,
  pick?: number,
  cards?: readonly string[],
): string {
  const t = ev.trial;
  if (!t || t.state !== 'won') h.fail('There is no prize to take');
  const p = t.prizes.find((x) => x.id === prize);
  if (!p) return h.fail('That is not one of the prizes');
  // only the prize the reel stopped on can be taken
  if (!(t.earned ?? []).includes(t.prizes.indexOf(p)))
    return h.fail('The reel did not stop on that one');
  // a lighter load: the cards named (none, one or two) leave the deck
  if (p.removeUpTo) {
    const given: unknown = cards ?? [];
    if (!Array.isArray(given)) return h.fail('Choose which cards to remove');
    const gone = given as string[];
    if (gone.length > p.removeUpTo) return h.fail(`You can remove up to ${p.removeUpTo} cards`);
    const left = [...r.deck];
    for (const id of gone) {
      const at = left.indexOf(id);
      if (at < 0) return h.fail('That card is not in your deck');
      left.splice(at, 1);
    }
    if (left.length < V2_DECK_RULES.minSize)
      return h.fail('Your deck is too small to part with that many cards');
    r.deck = left;
    return gone.length
      ? `${gone.map(name).join(' and ')} leave${gone.length === 1 ? 's' : ''} your deck.`
      : 'You keep your deck as it is.';
  }
  // a prize that is a choice of cards: the one picked is the one taken
  if (p.choices) {
    const id = pick === undefined ? undefined : p.choices[pick];
    if (!id) return h.fail('Choose one of the three cards');
    return applyDeal(r, { id: 'd1', label: p.label, deal: [{ k: 'card', id }] }, ev, h);
  }
  return applyDeal(r, { id: 'd1', label: p.label, deal: p.deal }, ev, h);
}
