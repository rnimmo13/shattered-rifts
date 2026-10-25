// Elite events: now and then (ELITE_EVENT_CHANCE of the time an event comes up) a place offers a trial, a short puzzle the
// player may choose to play for a choice of better rewards. The puzzle itself is played by the client (apps/web/src/trials);
// this file builds the offer (which game, which prizes, all fixed when the event is rolled), and carries out the result.

import { nextInt, type RngState } from '@sr/combat';
import { BOONS, COMBAT_DB, POTIONS, rewardPool } from '@sr/content/v2';
import { MAX_POTIONS, canAdd, crossedOffers } from './rewards';
import { applyDeal, dealFeasible, type DealHelpers, type EventCtx } from './deals';
import type { DealStep, RunState, TrialGame, TrialOffer, TrialPrize } from './types';

/** The chance, in percent, that an event is an elite one (when one can be built). */
export const ELITE_EVENT_CHANCE = 10;

type Theme = 'legends' | 'potions' | 'boons' | 'crossed' | 'bounty';

interface EliteSpec {
  id: string;
  title: string;
  text: string;
  game: TrialGame;
  theme: Theme;
  /** what the trial is, in the option's words */
  ask: string;
}

export const ELITE_EVENTS: EliteSpec[] = [
  {
    id: 'hall-of-echoes',
    title: 'The hall of echoes',
    text: 'Six great stones ring in turn, each a different note, and a door of pale metal waits at the end. The hall wants to hear you repeat it back. It will not forgive a wrong note twice.',
    game: 'echoes',
    theme: 'legends',
    ask: 'Repeat the song of the stones',
  },
  {
    id: 'mirror-vault',
    title: 'The mirror vault',
    text: 'A hall of glass tiles, face down, each hiding a rune. Somewhere behind them, a vault of old rewards. Find every pair before the glass runs out of patience.',
    game: 'pairs',
    theme: 'boons',
    ask: 'Match every pair of runes',
  },
  {
    id: 'rune-lock',
    title: 'The rune lock',
    text: 'A great door, locked with a grid of runes that light up and go dark. Touch one and its neighbours answer. Only when every rune is dark does the lock give.',
    game: 'runelock',
    theme: 'potions',
    ask: 'Darken every rune in the lock',
  },
  {
    id: 'heartbeat-gate',
    title: 'The heartbeat gate',
    text: 'A gate that opens only on the beat. A needle sweeps a dial, and there is a gold sliver on it. Strike when the needle crosses, and the gate will know you.',
    game: 'rhythm',
    theme: 'crossed',
    ask: 'Strike the beat as the needle crosses',
  },
  {
    id: 'cipher-door',
    title: 'The cipher door',
    text: 'A door with four slots and a handful of runes on a shelf. Every attempt flashes with what you got right and what you got wrong. The door keeps a limited number of attempts.',
    game: 'cipher',
    theme: 'legends',
    ask: 'Crack the four-rune cipher',
  },
  {
    id: 'sleepless-vault',
    title: 'The sleepless vault',
    text: 'A vault that has been awake for a very long time. It opens for anyone who can keep a thing in mind a little longer than it keeps them. Whoever does is rewarded with something truly generous.',
    game: 'echoes',
    theme: 'bounty',
    ask: 'Repeat the song of the stones',
  },
  {
    id: 'glass-hoard',
    title: 'The glass hoard',
    text: 'A dragon made of glass sleeps on a hoard of glass. Every piece is a pair of itself, hidden. Pick them out without waking it.',
    game: 'pairs',
    theme: 'crossed',
    ask: 'Match every pair of runes',
  },
  {
    id: 'forgemasters-lock',
    title: "The forgemaster's lock",
    text: 'A chest of black iron, and a lock of runes that hum when touched. Whoever solves it gets their pick of a forgemaster’s private stock.',
    game: 'runelock',
    theme: 'bounty',
    ask: 'Darken every rune in the lock',
  },
  {
    id: 'trial-of-the-needle',
    title: 'The trial of the needle',
    text: 'A drum, a needle, a dial. The old guardians of this place judged a visitor by whether they could keep time. They were not kind judges, and they gave good gifts.',
    game: 'rhythm',
    theme: 'boons',
    ask: 'Strike the beat as the needle crosses',
  },
  {
    id: 'warden-cipher',
    title: "The warden's cipher",
    text: 'A Warden left a code on this wall for the one who would come after. It is a little vain, and it knew you would try.',
    game: 'cipher',
    theme: 'potions',
    ask: 'Crack the four-rune cipher',
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

type Prizes = Pick<TrialOffer, 'theme' | 'prizes'>;
const give = (
  list: { label: string; deal: DealStep[]; card?: string; boon?: string; potion?: string }[],
): TrialPrize[] =>
  list.map((p, i) => ({ ...p, id: (['d1', 'd2', 'd3'] as const)[i] as TrialPrize['id'] }));

/** The prizes of a theme for this run, or null when the run cannot take any (a full belt, no Boons left...). */
function prizesFor(theme: Theme, r: RunState): Prizes | null {
  switch (theme) {
    case 'legends': {
      const own = rewardPool(r.character).filter(
        (id) =>
          COMBAT_DB.cards[id]?.hero === r.character &&
          COMBAT_DB.cards[id]?.rarity === 'legendary' &&
          canAdd(r.deck, id),
      );
      if (own.length < 2) return null;
      return {
        theme: 'a Legendary card of yours',
        prizes: give(
          pick(r.rng, own, 3).map((id) => ({
            label: `Take ${name(id)}`,
            deal: [{ k: 'card', id }],
            card: id,
          })),
        ),
      };
    }
    case 'crossed': {
      const ids = crossedOffers(r.rng, r.character, r.deck, ['rare'], 3);
      if (ids.length < 2) return null;
      return {
        theme: 'a Rift-crossed rare card',
        prizes: give(
          ids.map((id) => ({
            label: `Take ${name(id)}`,
            deal: [{ k: 'card', id }],
            card: id,
          })),
        ),
      };
    }
    case 'boons': {
      const left = BOONS.filter((b) => !r.boons.includes(b.id));
      if (left.length < 2) return null;
      const good = left.filter((b) => b.rarity !== 'common');
      const ids = pick(r.rng, good.length >= 3 ? good : left, 3).map((b) => b.id);
      return {
        theme: 'a Boon',
        prizes: give(
          ids.map((id) => ({
            label: `Take ${COMBAT_DB.boons[id]?.name ?? 'the Boon'}`,
            deal: [{ k: 'boonOf', id }],
            boon: id,
          })),
        ),
      };
    }
    case 'potions': {
      if (r.potions.length >= MAX_POTIONS) return null;
      const rare = POTIONS.filter((p) => p.rarity === 'rare');
      const ids = pick(r.rng, rare.length >= 3 ? rare : POTIONS, 3).map((p) => p.id);
      return {
        theme: 'an elite potion',
        prizes: give(
          ids.map((id) => ({
            label: `Take ${COMBAT_DB.potions[id]?.name ?? 'the potion'}`,
            deal: [{ k: 'potionOf', id }],
            potion: id,
          })),
        ),
      };
    }
    case 'bounty': {
      const all: { label: string; deal: DealStep[] }[] = [
        {
          label: 'Vitality: +14 max HP, and heal to full',
          deal: [
            { k: 'maxHp', n: 14 },
            { k: 'heal', pct: 100 },
          ],
        },
        { label: 'Masterwork: four random cards in your deck are upgraded', deal: [{ k: 'upgrade', n: 4 }] },
        {
          label: 'A fortune: +260 shards, and two potions',
          deal: [
            { k: 'shards', n: 260 },
            { k: 'potion', n: 2 },
          ],
        },
        {
          label: 'A lighter load: three random cards leave your deck',
          deal: [{ k: 'remove', of: 'any', n: 3 }],
        },
        {
          label: "A champion's card: a rare card of your class, and heal 30%",
          deal: [
            { k: 'gift', rarity: 'rare' },
            { k: 'heal', pct: 30 },
          ],
        },
        {
          label: 'Rift-touched: a Rift-crossed rare card, and +6 max HP',
          deal: [
            { k: 'crossed', rarity: 'rare' },
            { k: 'maxHp', n: 6 },
          ],
        },
      ];
      const ev = { title: '', text: '', cardOffer: '', options: [] } as EventCtx;
      const ok = all.filter((p) => dealFeasible(r, p.deal, ev));
      if (ok.length < 2) return null;
      return { theme: 'a bounty of your choice', prizes: give(pick(r.rng, ok, 3)) };
    }
  }
}

/** Build an elite event for this run, or null when it has nothing to give (then an ordinary event comes up). */
export function buildElite(spec: EliteSpec, r: RunState): EventCtx | null {
  const made = prizesFor(spec.theme, r) ?? prizesFor('bounty', r);
  if (!made) return null;
  const consolation = 25;
  const trial: TrialOffer = {
    game: spec.game,
    seed: nextInt(r.rng, 1_000_000_000),
    state: 'open',
    consolation,
    ...made,
  };
  return {
    title: spec.title,
    text: spec.text,
    options: [
      {
        id: 'trial',
        label: `${spec.ask} (a short puzzle): win, and choose ${made.theme}. Fail, and you get ${consolation} shards for trying`,
      },
      { id: 'leave', label: 'Walk away' },
    ],
    cardOffer: '',
    trial,
  };
}

/** Roll an elite event: null most of the time (and when nothing can be built). */
export function rollElite(r: RunState): EventCtx | null {
  if (nextInt(r.rng, 100) >= ELITE_EVENT_CHANCE) return null;
  const spec = ELITE_EVENTS[nextInt(r.rng, ELITE_EVENTS.length)] as EliteSpec;
  return buildElite(spec, r);
}

/** The player has pressed Begin: from here the trial is spent, whatever happens (it is saved this way). */
export function beginTrial(ev: EventCtx): void {
  const t = ev.trial;
  if (!t || t.state !== 'open') throw new Error('There is no trial to begin');
  t.state = 'playing';
}

/** The trial has been played: a win opens the choice of prizes, a loss pays the consolation. Returns what happened, or null if the prizes are still to pick. */
export function endTrial(r: RunState, ev: EventCtx, won: boolean): string | null {
  const t = ev.trial;
  if (!t || t.state !== 'playing') throw new Error('There is no trial being played');
  if (won) {
    t.state = 'won';
    return null;
  }
  r.shards += t.consolation;
  return `The trial beats you. The place lets you go with ${t.consolation} shards for trying.`;
}

/** Take one of the prizes of a won trial. */
export function takePrize(r: RunState, ev: EventCtx, prize: string, h: DealHelpers): string {
  const t = ev.trial;
  if (!t || t.state !== 'won') h.fail('There is no prize to take');
  const p = t.prizes.find((x) => x.id === prize);
  if (!p) return h.fail('That is not one of the prizes');
  return applyDeal(r, { id: p.id, label: p.label, deal: p.deal }, ev, h);
}
