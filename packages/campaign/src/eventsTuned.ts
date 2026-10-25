// The event pass of 2026-10-25 (DECISIONS #227): events that let you choose the card they work on, engrave keywords on cards,
// start fights, or simply go badly, the way Slay the Spire's do. Each replaces the older event of the same id where there was one.
// Values follow docs/BALANCE.md ("Threshold and Waymarks"): ~100 shards is one solid thing, a chosen upgrade ~60-70, a chosen
// removal ~50-75, a fight is a price of its own (HP and Resolve at risk) and pays like one.

import type { CardMark } from '@sr/content/v2';
import {
  boon,
  chance,
  def,
  gift,
  heal,
  hurt,
  hurtPct,
  maxHp,
  potion,
  remove,
  shards,
  upgrade,
  wound,
  type DealSpec,
} from './eventDeals';
import type { EventDef } from './events';
import type { DealStep, DeckChoice } from './types';

const choose = (act: DeckChoice, mark?: CardMark): DealStep => ({
  k: 'choose',
  act,
  ...(mark ? { mark } : {}),
});
const fight = (kind: 'duel' | 'elite', bonus: DealStep[] = []): DealStep => ({
  k: 'fight',
  kind,
  ...(bonus.length ? { bonus } : {}),
});
const staticCard = (n = 1): DealStep => ({ k: 'static', n });

const SPECS: DealSpec[] = [
  // ---- the old hand-written ones, now with a card of your choice ----
  {
    id: 'smith',
    weight: 2,
    title: 'The wandering smith',
    text: 'A smith with a cart of tools and no forge. "Show me the one you trust most, and I will make it better."',
    opts: [
      [
        'Hand over a card: choose a card to upgrade',
        [choose('upgrade')],
        'Hammer, file, a breath of fire.',
      ],
      [
        'Ask for her best work (pay 60 shards): choose a card to upgrade, and a random card is upgraded too',
        [shards(-60), upgrade(1), choose('upgrade')],
        'She works through the night.',
        'optional',
      ],
    ],
  },
  {
    id: 'scrapyard',
    weight: 1.5,
    title: 'The scrapyard',
    text: 'Heaps of broken things, and a sign: TAKE WHAT YOU NEED, LEAVE WHAT YOU DO NOT.',
    opts: [
      [
        'Leave a card behind: choose a card to remove from your deck',
        [choose('remove')],
        'One less thing to carry.',
      ],
      ['Sell some scrap: +60 shards', [shards(60)], 'Copper wire and old bolts.'],
    ],
  },
  {
    id: 'shifter',
    weight: 1,
    title: 'The shifting wall',
    text: 'A wall of cards, all moving, none the same twice. Press one to it and it comes back different.',
    opts: [
      [
        'Press a card to it: choose a card, and it becomes a random card of your class of the same rarity',
        [choose('transform')],
        'The wall ripples.',
      ],
    ],
  },
  {
    id: 'mirror',
    weight: 1,
    title: 'The mirror pool',
    text: 'Still water that shows your deck instead of your face.',
    opts: [
      [
        'Reach in (lose 10 HP): choose a card to copy',
        [hurt(10), choose('copy')],
        'The water is very cold.',
      ],
      ['Splash your face: heal 15% of your HP', [heal(15)], 'You feel awake.'],
    ],
  },
  {
    id: 'healer',
    weight: 1.5,
    title: 'The rift healer',
    text: 'A healer with gentle hands and a long list of prices.',
    opts: [
      [
        'Be tended (pay 35 shards): heal 35% of your HP',
        [shards(-35), heal(35)],
        'You sleep without dreams.',
        'optional',
      ],
      [
        'Be cleansed (pay 50 shards): choose a card to remove from your deck',
        [shards(-50), choose('remove')],
        'Something heavy lifts.',
        'optional',
      ],
      [
        'Pay in blood (lose 6 HP): a Wound leaves your deck, or a basic card if you have none',
        [hurt(6), remove('wound')],
        'She is not kind.',
        'optional',
      ],
    ],
  },
  // ---- deal events whose card was random, or whose reward was too small ----
  {
    id: 'collector',
    weight: 1,
    title: 'The bone collector',
    text: 'A stooped figure sorts cards into jars by the sound they make. "Spare some? I pay by the piece."',
    opts: [
      [
        'Sell a card of your choice: choose a card to remove, and gain 70 shards',
        [choose('remove'), shards(70)],
      ],
      [
        'Let him pick two (two random cards leave your deck): +170 shards',
        [remove('any', 2), shards(170)],
      ],
    ],
  },
  {
    id: 'moth-shrine',
    weight: 1,
    title: 'The moth shrine',
    text: 'Moths cover a small stone shrine so thickly it seems to breathe.',
    opts: [
      [
        'Offer blood (lose 10 HP): choose a card to upgrade',
        [hurt(10), choose('upgrade')],
        'The moths drink and scatter.',
      ],
      [
        'Offer shards (pay 45 shards): choose a card to upgrade',
        [shards(-45), choose('upgrade')],
        'They settle on the coins.',
        'optional',
      ],
    ],
  },
  {
    id: 'frost-garden',
    weight: 1,
    title: 'The frost garden',
    text: 'Flowers of ice, every one a different colour. Something sleeps under the snow.',
    opts: [
      [
        'Pick a bloom (lose 6 HP): choose a card to upgrade',
        [hurt(6), choose('upgrade')],
        'It does not melt in your hand.',
      ],
      [
        'Dig up a root (pay 25 shards): choose a card to remove from your deck',
        [shards(-25), choose('remove')],
        'The root comes up with it.',
        'optional',
      ],
    ],
  },
  {
    id: 'old-soldiers',
    weight: 1.2,
    title: "The old soldiers' camp",
    text: 'Three old soldiers around a fire, swapping stories and kit.',
    opts: [
      [
        'Share their fire: heal 30% of your HP',
        [heal(30)],
        'They tell the same story three times.',
      ],
      [
        'Swap kit: choose a card, and it becomes a random card of your class of the same rarity',
        [choose('transform')],
        'A fair trade, they say.',
      ],
      [
        'Sell them your spare kit (a random basic card leaves): +75 shards',
        [remove('basic'), shards(75)],
        'They pay in old coin.',
        'optional',
      ],
    ],
  },
  {
    id: 'ash-market',
    weight: 1,
    title: 'The ash market',
    text: 'Stalls of grey cloth, traders with grey faces, and everything for sale.',
    opts: [
      [
        'Trade a card: choose a card to remove, and a random uncommon card of your class joins your deck',
        [choose('remove'), gift('uncommon')],
      ],
      [
        'Sell a Wound (a Wound, else a basic card, goes): +55 shards',
        [remove('wound'), shards(55)],
        '',
        'optional',
      ],
    ],
  },
  {
    id: 'unmaker',
    weight: 1,
    title: 'The unmaker',
    text: 'A figure made of nothing, which takes things apart.',
    opts: [
      [
        'Be unmade (lose 6 HP): choose a card to remove from your deck',
        [hurt(6), choose('remove')],
      ],
      [
        'Let it choose (two random cards leave your deck): +80 shards and heal 10%',
        [remove('any', 2), shards(80), heal(10)],
      ],
    ],
  },
  {
    id: 'twin-pools',
    weight: 1,
    title: 'The twin pools',
    text: 'Two pools side by side, one red and one blue.',
    opts: [
      ['Drink the red (lose 10 HP): +8 max HP', [hurt(10), maxHp(8)], 'It burns going down.'],
      [
        'Drink the blue (pay 20 shards): heal 35% of your HP',
        [shards(-20), heal(35)],
        'Cool and slow.',
        'optional',
      ],
    ],
  },
  {
    id: 'mending-tree',
    weight: 1.2,
    title: 'The mending tree',
    text: 'A white tree grows from a crack in the floor, bearing fruit that glows faintly.',
    opts: [
      ['Rest in its shade: heal 30% of your HP', [heal(30)], 'The leaves hum.'],
      [
        'Climb for the fruit (lose 8% of your HP): +7 max HP',
        [hurtPct(8), maxHp(7)],
        'The fruit is bitter and warm.',
      ],
    ],
  },
  // ---- engraving: keywords cut into a card for good ----
  {
    id: 'engraver',
    weight: 1.2,
    title: 'The engraver',
    text: 'A blind woman taps a chisel on a whetstone. "Bring me a card, and I will cut a word into it that it will never forget."',
    opts: [
      [
        'Hold (pay 50 shards): choose a card; it stays in your hand at the end of the turn',
        [shards(-50), choose('mark', 'hold')],
        'Patience, she cuts. Patience.',
        'optional',
      ],
      [
        'Opening hand (pay 50 shards): choose a card; it is always in your opening hand',
        [shards(-50), choose('mark', 'opening')],
        'First, she cuts. Always first.',
        'optional',
      ],
      [
        'Flare (lose 6 HP): choose a card; it costs 1 less, but is consumed when played',
        [hurt(6), choose('mark', 'flare')],
        'The word glows, and so does your hand.',
      ],
    ],
  },
  {
    id: 'patient-monk',
    weight: 1,
    title: 'The patient monk',
    text: 'A monk sits under a dead tree, a card held loosely in each hand. He has been waiting a long time.',
    opts: [
      [
        'Sit with him (lose 6 HP): choose a card to gain Hold',
        [hurt(6), choose('mark', 'hold')],
        'Neither of you speaks.',
      ],
      [
        'Ask for his secret (a Static card joins your deck): choose a card to gain Opening hand',
        [staticCard(), choose('mark', 'opening')],
        'He tells you. You wish he had not.',
      ],
    ],
  },
  {
    id: 'cold-kiln',
    weight: 1,
    title: 'The cold kiln',
    text: 'A kiln that burns with white, cold fire. Cards fired in it come out lighter, and brittle.',
    opts: [
      [
        'Fire a card: choose a card to gain Flare (it costs 1 less, but is consumed when played)',
        [choose('mark', 'flare')],
        'It comes out ringing.',
      ],
      ['Warm your hands: heal 20% of your HP', [heal(20)], 'It is warmer than it looks.'],
    ],
  },
  // ---- fights ----
  {
    id: 'dead-adventurer',
    weight: 1,
    title: 'The dead adventurer',
    text: 'A body in good armour, face down, pack still full. Whatever did this did not stay to loot it. Or did not go far.',
    opts: [
      [
        'Search the body (an even chance): 110 shards and a potion; or what killed them comes back, an Elite fight (win: a rare card of your class)',
        [chance(50, [shards(110), potion()], [fight('elite', [gift('rare')])])],
        'You turn the body over.',
      ],
    ],
  },
  {
    id: 'bandit-camp',
    weight: 1,
    title: "The bandits' camp",
    text: 'Tents, a fire, and a chest nobody is watching closely enough.',
    opts: [
      [
        'Rush them: a fight (win: 140 shards and a potion)',
        [fight('duel', [shards(140), potion()])],
        'They were waiting.',
      ],
      [
        'Steal the chest quietly (an even chance): 90 shards; or you are caught, a fight with no spoils',
        [chance(50, [shards(90)], [fight('duel')])],
        'You creep closer.',
      ],
    ],
  },
  {
    id: 'guarded-hoard',
    weight: 0.9,
    title: 'The guarded hoard',
    text: 'A Boon glints on a pedestal. Something large is curled around the pedestal, and it is not asleep.',
    boon: true,
    opts: [
      [
        'Take it from the guardian: an Elite fight (win: the Boon and 60 shards)',
        [fight('elite', [boon, shards(60)])],
        'It uncoils.',
      ],
    ],
  },
  {
    id: 'champion',
    weight: 0.9,
    title: "A champion's challenge",
    text: 'A champion of this realm bars the road. "Fight me, and take what I carry. Or go around, the long way."',
    opts: [
      [
        'Accept: an Elite fight (win: a rare card of your class and 80 shards)',
        [fight('elite', [gift('rare'), shards(80)])],
        'You raise your hands.',
      ],
      ['Go the long way (lose 8% of your HP)', [hurtPct(8)], 'It is a long way.'],
    ],
    noLeave: true,
  },
  {
    id: 'nest',
    weight: 1,
    title: 'The nest',
    text: 'A nest the size of a cart, full of warm eggs. The mother is close; you can hear her breathing.',
    opts: [
      [
        'Smash the eggs: a fight (win: +7 max HP and 60 shards)',
        [fight('duel', [maxHp(7), shards(60)])],
        'She is closer than you thought.',
      ],
      [
        'Take one egg and run (lose 10% of your HP): a potion and 40 shards',
        [hurtPct(10), potion(), shards(40)],
        '',
        'optional',
      ],
    ],
  },
  // ---- bad luck: no good way out, only a choice of what it costs ----
  {
    id: 'rift-storm',
    weight: 0.8,
    title: 'Rift storm',
    text: 'The sky splits open and the storm comes down. There is no shelter, only ways to take it.',
    noLeave: true,
    opts: [
      ['Brace yourself (lose 12% of your HP)', [hurtPct(12)], 'It passes over you, slowly.'],
      ['Run through it (a Wound joins your deck)', [wound()], 'Something follows you out.'],
      [
        'Throw shards into it (pay 45 shards)',
        [shards(-45)],
        'The storm swallows the light and moves on.',
        'optional',
      ],
    ],
  },
  {
    id: 'pickpockets',
    weight: 0.8,
    title: 'Pickpockets',
    text: 'Small hands, quick feet. Your purse is lighter before you have turned around.',
    noLeave: true,
    opts: [
      ['Let it go (lose 50 shards)', [shards(-50)], 'Easy come.', 'optional'],
      [
        'Chase them down: a fight (win: 60 of their shards)',
        [fight('duel', [shards(60)])],
        'They do not run far.',
      ],
      [
        'Give them a potion instead (lose a potion)',
        [{ k: 'losePotion', n: 1 }],
        'They drink it on the spot.',
        'optional',
      ],
    ],
  },
  {
    id: 'cave-in',
    weight: 0.8,
    title: 'The cave-in',
    text: 'The tunnel roof groans, then gives. You are under it before you can move.',
    noLeave: true,
    opts: [
      ['Dig yourself out (lose 10 HP)', [hurt(10)], 'Your hands are raw by the end.'],
      [
        'Wriggle free and leave something behind (a random card leaves your deck)',
        [remove('any')],
        'It stays under the rocks.',
      ],
    ],
  },
  {
    id: 'cursed-coin',
    weight: 0.8,
    title: 'The cursed coin',
    text: 'A coin is in your pocket that was not there before. It is warm, and it whispers.',
    noLeave: true,
    opts: [
      [
        'Keep it (a Static card joins your deck): +70 shards',
        [staticCard(), shards(70)],
        'It stops whispering. Mostly.',
      ],
      ['Throw it away (lose 8 HP)', [hurt(8)], 'It burns your hand on the way out.'],
    ],
  },
];

export const TUNED_EVENTS: EventDef[] = SPECS.map(def);
