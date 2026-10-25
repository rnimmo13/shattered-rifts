// The data-driven events: each is a title, a few sentences and a list of options, every option a list of DealSteps (deals.ts).
// An event is only offered when every option can be taken right now, so none can be unplayable. Labels read "Headline (price): reward".

import { clone } from '@sr/combat';
import { dealFeasible, type EventCtx } from './deals';
import { offerBoon } from './rewards';
import type { EventDef } from './events';
import type { DealStep, EventOption, RunState } from './types';

export type OptSpec = [label: string, steps: DealStep[], say?: string];

export interface DealSpec {
  id: string;
  weight: number;
  title: string;
  text: string;
  /** the event offers a Boon (and is not offered when you own them all) */
  boon?: boolean;
  /** no "walk away" option: every choice is a real one */
  noLeave?: boolean;
  opts: OptSpec[];
  /** only when this is true of the run (a stage, a class, a flag, a state of health) */
  needs?: (r: RunState) => boolean;
  /** options that depend on the run (cards named when the event is built); they replace opts and may lay cards on the table */
  dyn?: (r: RunState) => { opts: OptSpec[]; cards?: string[] };
}

export const hurt = (n: number): DealStep => ({ k: 'hurt', n });
export const hurtPct = (n: number): DealStep => ({ k: 'hurtPct', n });
export const heal = (pct: number): DealStep => ({ k: 'heal', pct });
export const maxHp = (n: number): DealStep => ({ k: 'maxHp', n });
export const shards = (n: number): DealStep => ({ k: 'shards', n });
export const wound = (n = 1): DealStep => ({ k: 'wound', n });
export const potion = (n = 1): DealStep => ({ k: 'potion', n });
export const boon: DealStep = { k: 'boon' };
export const upgrade = (n = 1): DealStep => ({ k: 'upgrade', n });
export const remove = (of: 'wound' | 'basic' | 'any', n = 1): DealStep => ({ k: 'remove', of, n });
export const transform: DealStep = { k: 'transform' };
export const copy: DealStep = { k: 'copy' };
export const gift = (rarity: 'common' | 'uncommon' | 'rare'): DealStep => ({ k: 'gift', rarity });
export const chance = (pct: number, win: DealStep[], lose: DealStep[] = []): DealStep => ({
  k: 'chance',
  pct,
  win,
  lose,
});

/** Build the event for this run (the Boon, if any, is picked here) and its options. */
export function make(spec: DealSpec, r: RunState): EventCtx {
  const boonOffer = spec.boon ? (offerBoon(r.rng, r.boons, 'elite') ?? '') : '';
  const built = spec.dyn ? spec.dyn(r) : { opts: spec.opts, cards: undefined };
  const options: EventOption[] = built.opts.map(([label, deal, say], i) => ({
    id: (['d1', 'd2', 'd3', 'd4'] as const)[i] as EventOption['id'],
    label,
    deal,
    ...(say ? { say } : {}),
  }));
  if (!spec.noLeave) options.push({ id: 'leave', label: 'Walk away' });
  return {
    title: spec.title,
    text: spec.text,
    options,
    cardOffer: '',
    ...(built.cards?.length ? { cardOffers: built.cards } : {}),
    ...(boonOffer ? { boonOffer } : {}),
  };
}

export function def(spec: DealSpec): EventDef {
  return {
    id: spec.id,
    weight: spec.weight,
    // offered only when every option works (on a copy, so the real run's dice are untouched)
    when: (r) => {
      if (spec.needs && !spec.needs(r)) return false;
      const probe = clone(r);
      const ev = make(spec, probe);
      if (spec.boon && !ev.boonOffer) return false;
      // a table of cards that came up empty is not an event
      if (spec.dyn && !ev.options.some((o) => o.deal)) return false;
      return ev.options.every((o) => !o.deal || dealFeasible(probe, o.deal, ev));
    },
    build: (r) => make(spec, r),
  };
}

export const DEAL_EVENTS: EventDef[] = (
  [
    {
      id: 'ferry',
      weight: 1.2,
      title: 'The drowned ferry',
      text: 'A ferryman stands waist-deep in black water, pole in hand. The far bank is only a rope-length away.',
      opts: [
        [
          'Pay the fare (30 shards): heal 40% of your HP',
          [shards(-30), heal(40)],
          'You ride in silence.',
        ],
        [
          'Wade across (lose 8 HP): find 45 shards',
          [hurt(8), shards(45)],
          'The current pulls, and the mud gives something up.',
        ],
      ],
    },
    {
      id: 'collector',
      weight: 1,
      title: 'The bone collector',
      text: 'A stooped figure sorts cards into jars by the sound they make. "Spare some? I pay by the piece."',
      opts: [
        [
          'Sell one card: a random card leaves your deck, and you gain 45 shards',
          [remove('any', 1), shards(45)],
        ],
        [
          'Sell two cards: two random cards leave your deck, and you gain 100 shards',
          [remove('any', 2), shards(100)],
        ],
      ],
    },
    {
      id: 'mending-tree',
      weight: 1.2,
      title: 'The mending tree',
      text: 'A white tree grows from a crack in the floor, bearing fruit that glows faintly.',
      opts: [
        ['Rest in its shade: heal 25% of your HP', [heal(25)], 'The leaves hum.'],
        [
          'Climb for the fruit (lose 8% of your HP): +4 max HP',
          [hurtPct(8), maxHp(4)],
          'The fruit is bitter and warm.',
        ],
      ],
    },
    {
      id: 'hourglass',
      weight: 1,
      title: 'The cracked hourglass',
      text: 'An hourglass taller than you, its sand falling upward. Whoever holds it owns a little time.',
      opts: [
        [
          'Turn it (lose 6 HP): you take a random potion',
          [hurt(6), potion()],
          'The sand reverses.',
        ],
        [
          'Shatter it (an even chance): two random cards in your deck are upgraded, or a Wound is added to it',
          [chance(50, [upgrade(2)], [wound()])],
          'The glass goes everywhere.',
        ],
      ],
    },
    {
      id: 'silent-choir',
      weight: 1,
      title: 'The silent choir',
      text: 'Robed figures stand in rows with their mouths open. No sound comes out, and still the air shakes.',
      opts: [
        ['Listen: +3 max HP', [maxHp(3)], 'The silence settles in your chest.'],
        [
          'Join in (lose 10 HP): an uncommon card of yours',
          [hurt(10), gift('uncommon')],
          'You open your mouth, and something answers.',
        ],
      ],
    },
    {
      id: 'beggar',
      weight: 1.2,
      title: 'The rift beggar',
      text: 'A beggar sits on a crate of broken glass, hand out. Their eyes are far too clever.',
      opts: [
        [
          'Give a little (25 shards): a random common card is added to your deck',
          [shards(-25), gift('common')],
        ],
        [
          'Give a lot (60 shards): a random uncommon card is added to your deck',
          [shards(-60), gift('uncommon')],
        ],
      ],
    },
    {
      id: 'scales',
      weight: 1,
      title: 'The weighing scales',
      text: 'Brass scales hang from a gibbet, one pan heavy with coin, the other empty. "Balance what you carry."',
      opts: [
        ['Take the coin (a Wound joins your deck): +90 shards', [wound(), shards(90)]],
        [
          'Lighten your load (pay 40 shards): a Wound leaves your deck, or a basic card if you have none',
          [shards(-40), remove('wound', 1)],
        ],
      ],
    },
    {
      id: 'reliquary',
      weight: 1,
      title: 'The locked reliquary',
      text: 'A stone casket bound in chain and wax. Something inside has been waiting a long time.',
      boon: true,
      opts: [
        ['Break it open (lose 14 HP): you gain the Boon', [hurt(14), boon]],
        [
          'Pick the lock (an even chance): the Boon, or two Wounds',
          [chance(50, [boon], [wound(2)])],
        ],
      ],
    },
    {
      id: 'hungry-door',
      weight: 1,
      title: 'The hungry door',
      text: 'A door with a mouth where the handle should be. It looks at your pockets and licks its lip.',
      opts: [
        [
          'Feed it a basic card (a random Attack or Defend goes): +60 shards and heal 10%',
          [remove('basic', 1), shards(60), heal(10)],
        ],
        [
          'Feed it your shards (50 shards): a random card in your deck is upgraded',
          [shards(-50), upgrade()],
        ],
      ],
    },
    {
      id: 'twin-pools',
      weight: 1,
      title: 'The twin pools',
      text: 'Two pools side by side, one red and one blue, perfectly still. A tin cup hangs between them.',
      opts: [
        ['Drink the red (lose 10 HP): +5 max HP', [hurt(10), maxHp(5)], 'It tastes of iron.'],
        [
          'Drink the blue (pay 20 shards): heal 30% of your HP',
          [shards(-20), heal(30)],
          'It tastes of nothing at all.',
        ],
      ],
    },
    {
      id: 'wagon',
      weight: 1.2,
      title: "The tinker's wagon",
      text: 'A wagon hung with bottles, and a tinker who has stopped asking where the road goes.',
      opts: [
        ['Buy one potion (35 shards): you take a random potion', [shards(-35), potion(1)]],
        ['Buy two potions (60 shards): you take two random potions', [shards(-60), potion(2)]],
      ],
    },
    {
      id: 'moth-shrine',
      weight: 1,
      title: 'The moth shrine',
      text: 'A tiny shrine alive with pale moths. They land on you, and wait.',
      opts: [
        ['Offer blood (lose 12 HP): a random card in your deck is upgraded', [hurt(12), upgrade()]],
        [
          'Offer shards (pay 50 shards): a random card in your deck is upgraded',
          [shards(-50), upgrade()],
        ],
      ],
    },
    {
      id: 'crossroads',
      weight: 1.2,
      title: 'The lamplit crossroads',
      text: 'Three roads under three lamps. The left one is loud, the right one is quiet, and the middle one has footprints.',
      opts: [
        [
          'Take the left road (an even chance): +90 shards, or lose 15% of your HP',
          [chance(50, [shards(90)], [hurtPct(15)])],
        ],
        ['Take the right road: heal 20% of your HP', [heal(20)]],
        ['Follow the footprints: a random common card is added to your deck', [gift('common')]],
      ],
    },
    {
      id: 'echo-vault',
      weight: 1,
      title: 'The echoing vault',
      text: 'A round chamber where every sound comes back changed. In the middle, a stand holds one card, face down.',
      opts: [
        [
          'Take it (an even chance): a rare card, or lose 20% of your HP and gain a Wound',
          [chance(50, [gift('rare')], [hurtPct(20), wound()])],
        ],
      ],
    },
    {
      id: 'mud-sworn',
      weight: 1,
      title: 'The mud-sworn',
      text: 'A figure made of river-clay blocks the path, arms spread. It wants to wrestle, or to be paid.',
      opts: [
        [
          'Wrestle it (lose 12 HP): +80 shards',
          [hurt(12), shards(80)],
          'It crumbles, and its pockets are full.',
        ],
        ['Bargain (pay 30 shards): you take a random potion', [shards(-30), potion()]],
      ],
    },
    {
      id: 'geyser',
      weight: 1,
      title: 'The shard geyser',
      text: 'Hot spray full of glittering shards leaps from a vent in the floor, every few breaths.',
      opts: [
        ['Fill your pockets (lose 6 HP): +55 shards', [hurt(6), shards(55)]],
        ['Stand in it (lose 20% of your HP): +130 shards', [hurtPct(20), shards(130)]],
      ],
    },
    {
      id: 'gravedigger',
      weight: 1,
      title: 'The gravedigger',
      text: 'A man leans on a spade beside a half-dug hole. "Dig, if you like. They keep their own counsel."',
      opts: [
        [
          'Dig (lose 8 HP): +80 shards, or a Wound in the bargain',
          [hurt(8), chance(60, [shards(80)], [wound()])],
        ],
        ['Pay your respects: heal 10% of your HP', [heal(10)]],
      ],
    },
    {
      id: 'rust-eater',
      weight: 1,
      title: 'The rust-eater',
      text: 'A beast the colour of old iron gnaws a broken gate. It looks up, hopeful.',
      opts: [
        [
          'Feed it a Wound, or a basic card: it leaves your deck, and you gain 25 shards',
          [remove('wound', 1), shards(25)],
        ],
        [
          'Feed it any card: it leaves your deck, and two random cards in your deck are upgraded',
          [remove('any', 1), upgrade(2)],
        ],
      ],
    },
    {
      id: 'brewer',
      weight: 1,
      title: "The salt witch's pot",
      text: 'A pot on a driftwood fire, and a woman stirring it who does not look up. "One cup each. Choose."',
      opts: [
        ['Brew of vigor (lose 4 HP): +3 max HP', [hurt(4), maxHp(3)]],
        ['Brew of calm (pay 25 shards): heal 25% of your HP', [shards(-25), heal(25)]],
      ],
    },
    {
      id: 'pact',
      weight: 1,
      title: 'The pact of the Hollow',
      text: 'A page of black paper, a quill, and a space for a name. The Hollow is generous, and it is patient.',
      boon: true,
      opts: [
        ['Sign (lose 8 max HP): you gain the Boon', [maxHp(-8), boon]],
        [
          'Sign in blood (lose 15 HP and take a Wound): you gain the Boon',
          [hurt(15), wound(), boon],
        ],
      ],
    },
    {
      id: 'purse',
      weight: 1,
      title: 'The cursed purse',
      text: 'A fat purse lies in the road, a thin red thread tied round it. Everyone before you left it there.',
      opts: [
        ['Pocket it (a Wound joins your deck): +100 shards', [wound(), shards(100)]],
        ['Cut the thread first (lose 10 HP): +100 shards', [hurt(10), shards(100)]],
      ],
    },
    {
      id: 'patient-mirror',
      weight: 1,
      title: 'The patient mirror',
      text: 'A tall mirror in an empty hall. Your reflection stands very still and does not blink.',
      opts: [
        [
          'Look closer (lose 8 HP): a random non-basic card in your deck is copied',
          [hurt(8), copy],
        ],
        [
          'Break it (an even chance): a random card in your deck is upgraded, or a Wound is added to it',
          [chance(50, [upgrade()], [wound()])],
        ],
      ],
    },
    {
      id: 'lantern-thief',
      weight: 1,
      title: 'The lantern thief',
      text: 'A small thing with a stolen lantern darts between the pillars, laughing.',
      opts: [
        ['Give chase (lose 6 HP): you take a random potion', [hurt(6), potion()]],
        [
          'Throw a coin (pay 15 shards): it leaves its lantern for you, heal 15%',
          [shards(-15), heal(15)],
        ],
      ],
    },
    {
      id: 'rift-fever',
      weight: 1,
      title: 'The rift fever',
      text: 'You wake hot and shaking in a ruined chapel. The fever will break one way or another.',
      opts: [
        ['Sweat it out (lose 10% of your HP): +4 max HP', [hurtPct(10), maxHp(4)]],
        ['Take a tonic (pay 35 shards): heal 20% of your HP', [shards(-35), heal(20)]],
      ],
    },
    {
      id: 'wishing-stone',
      weight: 1,
      title: 'The wishing stone',
      text: 'A flat stone in a shallow dish of coins. A sign: "Wishes cost what they cost."',
      opts: [
        [
          'Toss a coin (pay 10 shards): a one-in-three chance of an uncommon card',
          [shards(-10), chance(34, [gift('uncommon')])],
        ],
        [
          'Toss a handful (pay 50 shards): an even chance of an uncommon card',
          [shards(-50), chance(50, [gift('uncommon')])],
        ],
      ],
    },
    {
      id: 'old-soldiers',
      weight: 1.2,
      title: "The old soldiers' camp",
      text: 'Three veterans round a small fire, armour hung on a cart. They shift over to make room.',
      opts: [
        ['Share their fire: heal 25% of your HP', [heal(25)]],
        [
          'Swap kit (lose 4 HP): a random basic card becomes a card of your class',
          [hurt(4), transform],
        ],
      ],
    },
    {
      id: 'frost-garden',
      weight: 1,
      title: 'The frost garden',
      text: 'Flowers made of ice, each ringing faintly in the draught. They look like they would be sorry to be picked.',
      opts: [
        ['Pick a bloom (lose 5 HP): a random card in your deck is upgraded', [hurt(5), upgrade()]],
        [
          'Dig up a root (pay 20 shards): a Wound leaves your deck, or a basic card if you have none',
          [shards(-20), remove('wound', 1)],
        ],
      ],
    },
    {
      id: 'bell-tower',
      weight: 1,
      title: 'The bell tower',
      text: 'A crooked tower with a bell as wide as a door. A rope hangs down, frayed to a thread.',
      opts: [
        [
          'Ring the bell (an even chance): +100 shards, or lose 12% of your HP',
          [chance(50, [shards(100)], [hurtPct(12)])],
        ],
        ['Muffle the bell (pay 15 shards): heal 10% of your HP', [shards(-15), heal(10)]],
      ],
    },
    {
      id: 'pilgrims',
      weight: 1,
      title: 'The pilgrims',
      text: 'A line of pilgrims carries a litter of glass bottles up the hill. One offers you a place in the line.',
      opts: [
        [
          'Carry a bottle (lose 6 HP): take a potion and +20 shards',
          [hurt(6), potion(), shards(20)],
        ],
        ['Share your supplies (pay 30 shards): heal 30% of your HP', [shards(-30), heal(30)]],
      ],
    },
    {
      id: 'ash-market',
      weight: 1,
      title: 'The ash market',
      text: 'Stalls of grey cloth in a drifting snow of ash. Every trader sells a single thing, and wants a single thing back.',
      opts: [
        [
          'Trade a card: a random card leaves your deck, and a random uncommon card is added to it',
          [remove('any', 1), gift('uncommon')],
        ],
        [
          'Trade a wound for coin (a Wound, else a basic card, goes): +35 shards',
          [remove('wound', 1), shards(35)],
        ],
      ],
    },
  ] satisfies DealSpec[]
).map(def);
