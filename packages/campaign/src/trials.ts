// Elite events: now and then (ELITE_EVENT_CHANCE of the time an event comes up) a place offers the Brass Cascade, an optional
// game for better rewards: ten lanes at the bottom of a board of pegs, each with a prize you can see. The player drops three
// balls; every lane a ball lands in is a prize earned, and they choose one of those. The game itself is played by the client
// (apps/web/src/trials); this file builds the offer (which prizes are in which lanes, all fixed when the event is rolled) and
// carries out the result.

import { nextInt, type RngState } from '@sr/combat';
import { BOONS, COMBAT_DB, POTIONS, rewardPool } from '@sr/content/v2';
import { canAdd, crossedOffers } from './rewards';
import { applyDeal, dealFeasible, type DealHelpers, type EventCtx } from './deals';
import type { DealStep, RunState, TrialOffer, TrialPrize } from './types';

/** The chance, in percent, that an event is an elite one (when one can be built). */
export const ELITE_EVENT_CHANCE = 10;
/** Lanes on the board, and balls dropped. */
export const CASCADE_LANES = 10;
export const CASCADE_BALLS = 3;

/** How the ten lanes are filled: the same kinds of prize in a different order, so each place feels different. */
type Layout = 'treasury' | 'armory' | 'apothecary';

interface EliteSpec {
  id: string;
  title: string;
  text: string;
  layout: Layout;
}

export const ELITE_EVENTS: EliteSpec[] = [
  {
    id: 'brass-cascade',
    title: 'The brass cascade',
    text: 'A tall board of brass pegs leans against a ruined wall, a little brass ball in a tray, and ten lanes at the bottom, each with a prize hung over it. A hand-lettered sign: "Three balls. Whatever lanes they land in, you may choose one of. The edges are the hardest to reach, and hold the best."',
    layout: 'treasury',
  },
  {
    id: 'brass-pegboard',
    title: 'The brass pegboard',
    text: 'A pegboard older than the town around it, kept oiled by someone who is never there. Ten lanes, ten things behind glass, mostly cards. Drop a ball, nudge it, and see what lane the board thinks you deserve.',
    layout: 'armory',
  },
  {
    id: 'copper-chute',
    title: 'The copper chute',
    text: 'A copper chute with ten bottles and trinkets lined up beneath it, and a tinker asleep on a stool. A note: "Mind the bounce. Take what you land on."',
    layout: 'apothecary',
  },
  {
    id: 'silver-sluice',
    title: 'The silver sluice',
    text: 'A water-run board of silver pegs, and ten channels where the water pools. Something gleams in each. The water does not care what you want, but your hands might.',
    layout: 'treasury',
  },
  {
    id: 'gilded-drop',
    title: 'The gilded drop',
    text: 'A gilded board in a hall with no roof. Ten prizes on velvet at the foot of it, and three golden balls on a cushion. An attendant coughs politely: "Whenever you are ready."',
    layout: 'armory',
  },
];

const name = (id: string): string => COMBAT_DB.cards[id]?.name ?? 'a card';

/** `n` different picks from a list (fewer if it is short). */
function pick<T>(rng: RngState, list: readonly T[], n: number): T[] {
  const from = [...list];
  const out: T[] = [];
  while (out.length < n && from.length) out.push(from.splice(nextInt(rng, from.length), 1)[0] as T);
  return out;
}

type Maker = () => Omit<TrialPrize, 'id'>;

/** The ten prizes of a layout for this run (each is checked to be takeable; one that is not becomes a purse of shards). */
function prizesFor(layout: Layout, r: RunState): TrialPrize[] {
  const ev = { title: '', text: '', cardOffer: '', options: [] } as EventCtx;
  const slot = (
    icon: string,
    short: string,
    label: string,
    deal: DealStep[],
    show: { card?: string; boon?: string; potion?: string; choices?: string[] } = {},
  ): Omit<TrialPrize, 'id'> => ({ icon, short, label, deal, ...show });
  const purse = (n: number): Omit<TrialPrize, 'id'> =>
    slot('shards', `+${n} shards`, `A purse: +${n} shards`, [{ k: 'shards', n }]);

  const own = rewardPool(r.character).filter(
    (id) => COMBAT_DB.cards[id]?.hero === r.character && canAdd(r.deck, id),
  );
  const legends = pick(
    r.rng,
    own.filter((id) => COMBAT_DB.cards[id]?.rarity === 'legendary'),
    2,
  );
  const rares = pick(
    r.rng,
    own.filter((id) => COMBAT_DB.cards[id]?.rarity === 'rare' && !legends.includes(id)),
    2,
  );
  const boons = pick(
    r.rng,
    BOONS.filter((b) => !r.boons.includes(b.id)),
    2,
  ).map((b) => b.id);
  // each Rift-crossed lane is a choice of three different Rift-crossed rares (a layout has at most two such lanes)
  const crossed = crossedOffers(
    r.rng,
    r.character,
    r.deck,
    ['rare', 'rare', 'rare', 'rare', 'rare', 'rare'],
    6,
  ).filter((id) => COMBAT_DB.cards[id]?.rarity === 'rare');
  const potions = pick(
    r.rng,
    POTIONS.filter((p) => p.rarity === 'rare'),
    2,
  );

  const cardSlot = (id: string | undefined, icon: string, again: number): Omit<TrialPrize, 'id'> =>
    id ? slot(icon, name(id), `Take ${name(id)}`, [{ k: 'card', id }], { card: id }) : purse(again);
  const legend =
    (i: number): Maker =>
    () =>
      cardSlot(legends[i] ?? rares[i], 'card', 200);
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
        : purse(150);
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
        : purse(120);
    };
  const upgrade =
    (n: number): Maker =>
    () =>
      slot('upgrade', `Upgrade ×${n}`, `Masterwork: ${n} random cards are upgraded`, [
        { k: 'upgrade', n },
      ]);
  const thin: Maker = () =>
    slot('thin', 'Lose 2 cards', 'A lighter load: two random cards leave your deck', [
      { k: 'remove', of: 'any', n: 2 },
    ]);
  const vitality: Maker = () =>
    slot('hp', '+10 HP, heal', 'Vitality: +10 max HP, and heal 30%', [
      { k: 'maxHp', n: 10 },
      { k: 'heal', pct: 30 },
    ]);
  const heal: Maker = () =>
    slot('heal', 'Heal 40%', 'A rest: heal 40% of your HP', [{ k: 'heal', pct: 40 }]);
  const shards: Maker = () => purse(90);

  const order: Record<Layout, Maker[]> = {
    treasury: [
      legend(0),
      boon(0),
      cross(0),
      upgrade(3),
      shards,
      heal,
      vitality,
      potion(0),
      boon(1),
      legend(1),
    ],
    armory: [
      legend(0),
      cross(0),
      boon(0),
      thin,
      shards,
      upgrade(2),
      vitality,
      boon(1),
      cross(1),
      legend(1),
    ],
    apothecary: [
      legend(0),
      potion(0),
      boon(0),
      vitality,
      heal,
      shards,
      upgrade(3),
      boon(1),
      cross(0),
      legend(1),
    ],
  };
  return order[layout].map((make, i) => {
    const p = make();
    return { ...(dealFeasible(r, p.deal, ev) ? p : purse(100)), id: `p${i}` };
  });
}

/** Build an elite event for this run. */
export function buildElite(spec: EliteSpec, r: RunState): EventCtx {
  const trial: TrialOffer = {
    game: 'cascade',
    tier: r.tier,
    seed: nextInt(r.rng, 1_000_000_000),
    state: 'open',
    consolation: 25,
    theme: 'one of the lanes you land in',
    prizes: prizesFor(spec.layout, r),
  };
  return {
    title: spec.title,
    text: spec.text,
    options: [
      {
        id: 'trial',
        label:
          'Drop three balls down the board: every lane a ball lands in is a prize you have earned, and you choose one of them',
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

/** The player has pressed Begin: from here the game is spent, whatever happens (it is saved this way). */
export function beginTrial(ev: EventCtx): void {
  const t = ev.trial;
  if (!t || t.state !== 'open') throw new Error('There is no trial to begin');
  t.state = 'playing';
}

/**
 * The balls have been dropped: `earned` are the lanes they landed in. Those prizes are the player's to choose from (up to
 * CASCADE_BALLS of them). Returns what happened if nothing was earned, or null when there is a prize to pick.
 */
export function endTrial(
  r: RunState,
  ev: EventCtx,
  won: boolean,
  earned: readonly number[] = [],
): string | null {
  const t = ev.trial;
  if (!t || t.state !== 'playing') throw new Error('There is no trial being played');
  const lanes = [
    ...new Set(earned.filter((i) => Number.isInteger(i) && i >= 0 && i < t.prizes.length)),
  ].sort((a, b) => a - b);
  if (!won || !lanes.length) {
    r.shards += t.consolation;
    return `Nothing landed. The place lets you go with ${t.consolation} shards for trying.`;
  }
  t.earned = lanes.slice(0, CASCADE_BALLS);
  t.state = 'won';
  return null;
}

/** Take one of the prizes the balls earned. */
export function takePrize(
  r: RunState,
  ev: EventCtx,
  prize: string,
  h: DealHelpers,
  pick?: number,
): string {
  const t = ev.trial;
  if (!t || t.state !== 'won') h.fail('There is no prize to take');
  const p = t.prizes.find((x) => x.id === prize);
  if (!p) return h.fail('That is not one of the prizes');
  if (!t.earned?.includes(t.prizes.indexOf(p))) return h.fail('You did not earn that one');
  // a prize that is a choice of cards: the one picked is the one taken
  if (p.choices) {
    const id = pick === undefined ? undefined : p.choices[pick];
    if (!id) return h.fail('Choose one of the three cards');
    return applyDeal(r, { id: 'd1', label: p.label, deal: [{ k: 'card', id }] }, ev, h);
  }
  return applyDeal(r, { id: 'd1', label: p.label, deal: p.deal }, ev, h);
}
