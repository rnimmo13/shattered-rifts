// More data-driven events (the second batch): cards from other worlds (chosen, traded for, won on a gamble), things given up
// for something better, a two-part story, and a few that go badly on purpose. Same shape as eventDeals.ts.

import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { crossedOffers } from './rewards';
import {
  boon,
  chance,
  def,
  gift,
  heal,
  hurt,
  hurtPct,
  maxHp,
  remove,
  shards,
  upgrade,
  wound,
  type DealSpec,
  type OptSpec,
} from './eventDeals';
import type { EventDef } from './events';
import type { DealStep, RunState } from './types';

const crossed = (rarity: 'common' | 'uncommon' | 'rare'): DealStep => ({ k: 'crossed', rarity });
/** three Rift-crossed cards are laid out, and the player chooses one */
const crossedPick = (rarity: 'common' | 'uncommon' | 'rare'): DealStep => ({ k: 'crossedPick', rarity });
const card = (id: string): DealStep => ({ k: 'card', id });
const junk = (n = 1): DealStep => ({ k: 'static', n });
const loseBoon: DealStep = { k: 'loseBoon' };
const losePotion = (n = 1): DealStep => ({ k: 'losePotion', n });
const exchange: DealStep = { k: 'exchange' };
const mark = (id: string, off = false): DealStep => ({ k: 'mark', id, ...(off ? { off } : {}) });

const name = (id: string): string => COMBAT_DB.cards[id]?.name ?? 'a card';
/** "a Tinker's card" - whose pool a Rift-crossed card came from */
const whose = (id: string): string => {
  const h = COMBAT_DB.cards[id]?.hero as HeroId | undefined;
  const w = h ? RIFTWALKERS[h] : undefined;
  return w ? `a ${w.role}'s card` : 'a card from another world';
};

/** Three Rift-crossed cards on the table, each an option that costs `cost` and may bring `extra` with it. */
const crossedTable =
  (rarities: string[], cost: DealStep[], price: string) =>
  (r: RunState): { opts: OptSpec[]; cards: string[] } => {
    const cards = crossedOffers(r.rng, r.character, r.deck, rarities, 3);
    return {
      cards,
      opts: cards.map((id) => [`Take ${name(id)} (${price}): ${whose(id)}`, [...cost, card(id)]]),
    };
  };

const lowHp = (r: RunState): boolean => r.hp <= r.maxHp * 0.5;

export const MORE_EVENTS: EventDef[] = (
  [
    // ---- cards from other worlds ----
    {
      id: 'open-rift',
      weight: 0.8,
      title: 'The open rift',
      text: 'A tear in the air, wide as a door, and three shapes on the far side. Each is a card some other Riftwalker lost. You can reach for one, and the rift bites on the way back.',
      opts: [],
      dyn: crossedTable(['rare', 'rare', 'uncommon'], [hurt(8)], 'lose 8 HP'),
    },
    {
      id: 'walkers-cairn',
      weight: 1,
      title: "The walker's cairn",
      text: 'Stones piled by travellers from many worlds, and under each stone a card, left as a marker. Take one and the cairn takes something back: a scrap of static that clings to your deck.',
      opts: [],
      dyn: crossedTable(['uncommon', 'common', 'common'], [junk(1)], 'a Static card joins your deck'),
    },
    {
      id: 'rift-broker',
      weight: 1,
      title: 'The rift broker',
      text: 'A figure with a card in every pocket, none of them from here. "Give me yours. I will give you something nobody around here knows how to play."',
      opts: [
        [
          'Trade one card (a random card leaves): a Rift-crossed uncommon',
          [remove('any', 1), crossed('uncommon')],
        ],
        [
          'Trade two cards (two random cards leave): your choice of three Rift-crossed rares',
          [remove('any', 2), crossedPick('rare')],
        ],
      ],
    },
    {
      id: 'card-swap',
      weight: 1,
      title: 'The card swapper',
      text: 'A woman sits cross-legged on a rug of playing cards, each from a different deck. "Not a gift. A swap. Same weight, different hands."',
      opts: [
        [
          'Swap (a random non-basic card goes): a Rift-crossed card of the same rarity comes back',
          [exchange],
        ],
        ['Swap twice (lose 6 HP): two cards are traded the same way', [hurt(6), exchange, exchange]],
      ],
    },
    {
      id: 'tithe-stone',
      weight: 0.8,
      title: 'The tithe stone',
      text: 'A flat black stone, worn into a bowl. Whatever is laid in it is gone by morning, and what comes back was never made for you.',
      needs: (r) => r.boons.length > 0,
      opts: [
        ['Give your strength (lose 6 max HP): your choice of three Rift-crossed rares', [maxHp(-6), crossedPick('rare')]],
        [
          'Give a Boon (a random Boon is lost): your choice of three Rift-crossed rares, and 40 shards',
          [loseBoon, crossedPick('rare'), shards(40)],
        ],
      ],
    },
    {
      id: 'torn-grimoire',
      weight: 1,
      title: 'The torn grimoire',
      text: 'Pages of a book from somewhere else, the writing running the wrong way. Some of it is a card waiting to be learned. Some of it is just noise.',
      opts: [
        [
          'Read it through (45% your choice of three Rift-crossed rares, else lose 6 HP and take a Static card)',
          [chance(45, [crossedPick('rare')], [hurt(6), junk()])],
        ],
        ['Copy out one page (pay 40 shards): a Rift-crossed common', [shards(-40), crossed('common')]],
      ],
    },
    // ---- a story in two parts ----
    {
      id: 'buried-map',
      weight: 0.9,
      title: 'The buried map',
      text: 'A map is half out of the mud, an X on it and a note: "Not here. Further in." A dealer two steps away is already counting what it might fetch.',
      needs: (r) => !(r.marks ?? []).includes('map'),
      opts: [
        [
          'Keep it: it may lead somewhere later',
          [mark('map')],
          'You fold the map into your coat. It is a long way to the X.',
        ],
        ['Sell it: +45 shards', [shards(45)]],
      ],
    },
    {
      id: 'treasure-dig',
      weight: 6,
      title: 'The X on the map',
      text: 'The ground here matches the map. Someone dug before you, and stopped just short. The spade is still in the hole.',
      needs: (r) => (r.marks ?? []).includes('map'),
      noLeave: true,
      opts: [
        [
          'Dig deep: your choice of three Rift-crossed rares, and 80 shards',
          [mark('map', true), crossedPick('rare'), shards(80)],
        ],
        [
          'Dig carefully: +8 max HP and heal 25% of your HP',
          [mark('map', true), maxHp(8), heal(25)],
        ],
      ],
    },
    // ---- bad ones ----
    {
      id: 'hollow-feast',
      weight: 1,
      title: 'The hollow feast',
      text: 'A table laid for twelve in a ruined hall, every dish steaming. Nobody has come to eat. Nobody who ate here ever went anywhere else.',
      opts: [
        ['Feast (two Static cards join your deck): heal to full', [heal(100), junk(2)]],
        ['Fast (lose 15% of your HP): +5 max HP', [hurtPct(15), maxHp(5)]],
      ],
    },
    {
      id: 'tax-collector',
      weight: 0.9,
      title: 'The tax collector',
      text: 'A desk in the middle of the road, a ledger, and a very tired man who does not look up. "Everybody pays. The only choice is how."',
      noLeave: true,
      opts: [
        ['Pay the tax (60 shards)', [shards(-60)], 'He stamps the ledger. You walk on, lighter.'],
        [
          'Refuse (lose 12 HP): a Wound joins your deck',
          [hurt(12), wound()],
          'He nods, and the road argues with you.',
        ],
        [
          'Pay in kind (a random card leaves your deck)',
          [remove('any', 1)],
          'He takes it, and seems almost sorry.',
        ],
      ],
    },
    {
      id: 'sundered-bridge',
      weight: 1,
      title: 'The sundered bridge',
      text: 'The span is gone and the wind is up. You can jump the gap with your pack on your back, or lower yourself down on a rope that has seen better years.',
      opts: [
        [
          'Jump (a random card slips out of your pack)',
          [remove('any', 1)],
          'You clear it. Something rattles loose behind you.',
        ],
        [
          'Climb down (55% +30 shards, else lose a card and 8 HP)',
          [chance(55, [shards(30)], [remove('any', 1), hurt(8)])],
        ],
      ],
    },
    {
      id: 'parasite',
      weight: 0.9,
      title: 'The warm parasite',
      text: 'Something small and pink has made a home in your pack, and it purrs. You would be tempted to keep it if it were not so clearly eating.',
      opts: [
        ['Let it feed (two Static cards join your deck): +10 max HP', [junk(2), maxHp(10)]],
        ['Pull it out (lose 12 HP): a random card in your deck is upgraded', [hurt(12), upgrade()]],
      ],
    },
    {
      id: 'cursed-forge',
      weight: 0.9,
      title: 'The cursed forge',
      text: 'The hammer is already swinging. The smith is not here, and the coals are the colour of something else. It does good work, and it does not do it kindly.',
      opts: [
        [
          'Let it work (two Wounds join your deck): three random cards are upgraded',
          [wound(2), upgrade(3)],
        ],
        ['Hold the tongs (lose 6 HP): a random card is upgraded', [hurt(6), upgrade()]],
      ],
    },
    {
      id: 'deep-spring',
      weight: 0.9,
      title: 'The deep spring',
      text: 'A well at the bottom of a stair, going down much farther than a well should. The water is thick and warm. You can feel it asking.',
      needs: (r) => r.stage >= 2,
      opts: [
        ['Drink deep (two Wounds join your deck): +8 max HP', [maxHp(8), wound(2)]],
        ['Pour a potion in (a potion is lost): heal to full', [losePotion(1), heal(100)]],
      ],
    },
    // ---- gambles and big swings ----
    {
      id: 'pale-dealer',
      weight: 0.9,
      title: 'The pale dealer',
      text: 'A dealer in white gloves shuffles a deck with no backs. "Cut it. One card. If it is the right one, you will not forget it."',
      opts: [
        [
          'Cut for the rare (pay 80 shards): 40% a rare of yours and 60 shards back, else a Static card',
          [shards(-80), chance(40, [gift('rare'), shards(60)], [junk()])],
        ],
        [
          'Cut for a stranger (pay 30 shards): one chance in four of your choice of three Rift-crossed rares',
          [shards(-30), chance(25, [crossedPick('rare')])],
        ],
      ],
    },
    {
      id: 'dying-lamp',
      weight: 2,
      title: 'The dying lamp',
      text: 'A lantern on a hook, the last of its oil going. You are hurt, and it can tell. The lamp would do something for you, if you gave it something to burn.',
      needs: lowHp,
      opts: [
        ['Warm yourself: heal 35% of your HP', [heal(35)]],
        [
          'Burn a card (a random card leaves your deck): heal to full',
          [remove('any', 1), heal(100)],
        ],
      ],
    },
    {
      id: 'tollkeeper',
      weight: 1.2,
      title: 'The tollkeeper of the high pass',
      text: 'A gate of black iron, and a keeper with a very big purse and a very small door. "The rich get the good road. Pay, and I will not remember your name."',
      boon: true,
      needs: (r) => r.shards >= 200,
      opts: [
        ['The good road (150 shards): you gain the Boon', [shards(-150), boon]],
        [
          'The quiet road (100 shards): two random cards in your deck are upgraded',
          [shards(-100), upgrade(2)],
        ],
      ],
    },
    {
      id: 'unmaker',
      weight: 1,
      title: 'The unmaker',
      text: 'A figure in a hood draws a line through the air and a thing that was never there is gone. "I only take what you will not miss," it says. It is wrong about that, sometimes.',
      opts: [
        ['Be unmade twice (lose 10 HP): two random cards leave your deck', [hurt(10), remove('any', 2)]],
        ['Be unmade once: a random card leaves your deck, and you heal 10%', [remove('any', 1), heal(10)]],
      ],
    },
    {
      id: 'class-shrine',
      weight: 0.9,
      title: 'The shrine of your own path',
      text: 'A small, plain shrine to the way you fight, built by someone who walked it before you and did not walk it far. It is not sure you are worthy, and says so.',
      needs: (r) => r.stage >= 2,
      opts: [
        ['Kneel (lose 20% of your HP): a rare card of your class', [hurtPct(20), gift('rare')]],
        ['Listen (lose 8 HP): two random cards in your deck are upgraded', [hurt(8), upgrade(2)]],
      ],
    },
    {
      id: 'potion-trade',
      weight: 1,
      title: "The potion hoarder's cellar",
      text: 'Shelves to the ceiling, every one of them empty. A man in the corner polishes a Boon and sighs. "Bring me bottles. I do not care what is in them."',
      boon: true,
      needs: (r) => r.potions.length >= 2,
      opts: [
        ['Trade two potions: you gain the Boon', [losePotion(2), boon]],
        ['Trade one potion: +40 shards', [losePotion(1), shards(40)]],
      ],
    },
  ] satisfies DealSpec[]
).map(def);
