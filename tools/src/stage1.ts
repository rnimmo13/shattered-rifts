// The stage 1 bot shared by pnpm stage1sim and pnpm kitsearch: a first run's stage 1 (tier 1) played by the runsim bot, either
// drafting (`draft`) or never taking a card (`starter`).

import { applyAction, chooseAction, chooseSmartAction, createCombat, heroOf } from '@sr/combat';
import {
  availableNodes,
  chooseCard,
  chooseEvent,
  chooseStarters,
  choosePrelude,
  duelPlan,
  enterNode,
  finishDuel,
  leaveMerchant,
  leaveShrine,
  newRun,
  pickDeckCard,
  pickEventCard,
  takeShrine,
  upgradable,
  type Difficulty,
  type RunState,
} from '@sr/campaign';
import { COMBAT_DB as db, type HeroId } from '@sr/content/v2';

const RANK: Record<string, number> = { basic: 0, common: 1, uncommon: 2, rare: 3, legendary: 4 };
/** Who plays the fights: the greedy one-card bot, or the smart one that plans a whole turn (fairer to decks that need setup). */
export let pilot: 'greedy' | 'smart' = 'greedy';
export const setPilot = (p: 'greedy' | 'smart'): void => {
  pilot = p;
};
export type Bot = 'draft' | 'starter';

export interface Result {
  cleared: boolean;
  bossReached: boolean;
  bossFirstTry: boolean;
  bossHp: number; // HP share walking into the Warden (first time)
  lost: number;
  cards: number; // cards added to the deck
}

/** Experiment knobs: multiply enemy HP and damage in ordinary fights (duels and elites) and in the Warden fight, on top of the game's. */
export const scale = { duelHp: 1, duelDmg: 1, wardenHp: 1, wardenDmg: 1 };

/** the two uncommon cards a bot run starts with: set `k` takes the k-th pair on offer, so different runs try different pairs */
const startersFor = (run: RunState, k: number): string[] => {
  const o = run.context?.starterPick?.options ?? [];
  return [o[(2 * k) % o.length] as string, o[(2 * k + 1) % o.length] as string];
};

function fight(run: RunState): { won: boolean; hp: number } {
  const plan = duelPlan(run);
  if (!plan) throw new Error('no plan');
  const warden = run.map.nodes.find((n) => n.id === run.context?.nodeId)?.kind === 'warden';
  let { state } = createCombat(db, {
    seed: plan.seed,
    a: {
      hero: run.character,
      deck: plan.deck,
      hp: plan.hp,
      maxHp: plan.maxHp,
      boons: plan.boons,
      statuses: plan.heroStatuses,
    },
    b: {
      enemies: plan.units,
      tier: plan.tier,
      hpPct: Math.round(plan.hpPct * (warden ? scale.wardenHp : scale.duelHp)),
      dmgPct: Math.round(plan.dmgPct * (warden ? scale.wardenDmg : scale.duelDmg)),
      mods: plan.mods,
    },
  });
  for (let t = 0; t < 900 && !state.winner; t++)
    state = applyAction(
      db,
      state,
      pilot === 'smart' ? chooseSmartAction(db, state) : chooseAction(db, state),
    ).state;
  const hp = heroOf(state.sides.a)?.hp ?? 0;
  return { won: state.winner === 'a' && hp >= 1, hp };
}

export function playStage1(
  h: HeroId,
  kit: number,
  bot: Bot,
  i: number,
  diff: Difficulty = 'normal',
): Result {
  let run = newRun(h, `stage1-${h}-${kit}-${i}`, diff);
  const start = run.deck.length;
  const res: Result = {
    cleared: false,
    bossReached: false,
    bossFirstTry: false,
    bossHp: 0,
    lost: 0,
    cards: 0,
  };
  for (let step = 0; step < 3000; step++) {
    const hpFrac = run.hp / run.maxHp;
    switch (run.phase) {
      case 'kit':
        run = chooseStarters(run, startersFor(run, kit));
        break;
      case 'prelude': {
        const opts = run.context?.prelude?.options ?? [];
        run = choosePrelude(run, (opts.find((o) => !o.risky) ?? opts[0])!.id);
        break;
      }
      case 'map': {
        const nodes = availableNodes(run);
        const by = (k: string) => nodes.find((n) => n.kind === k);
        const pick =
          (hpFrac < 0.7 ? by('shrine') : undefined) ??
          by('duel') ??
          by('warden') ??
          by('event') ??
          by('shrine') ??
          nodes[0]!;
        run = enterNode(run, pick.id);
        break;
      }
      case 'duel': {
        const kind = run.map.nodes.find((n) => n.id === run.context?.nodeId)?.kind ?? 'duel';
        const boss = kind === 'warden';
        const first = boss && !res.bossReached;
        if (first) {
          res.bossReached = true;
          res.bossHp = hpFrac;
        }
        const r = fight(run);
        if (first) res.bossFirstTry = r.won;
        if (!r.won) res.lost++;
        run = finishDuel(run, r.won, r.won ? r.hp : undefined);
        break;
      }
      case 'reward': {
        const offers = (run.context?.offers ?? []).filter((id) => !!db.cards[id]);
        offers.sort(
          (a, b) =>
            (RANK[db.cards[b]?.rarity ?? 'common'] ?? 1) -
            (RANK[db.cards[a]?.rarity ?? 'common'] ?? 1),
        );
        const best = bot === 'draft' ? offers[0] : undefined;
        try {
          run = chooseCard(run, best ?? null);
        } catch {
          run = chooseCard(run, null);
        }
        break;
      }
      case 'gift':
        run = chooseCard(run, bot === 'draft' ? (run.context?.offers?.[0] ?? null) : null);
        break;
      case 'shrine': {
        const ups = upgradable(run.deck);
        run =
          hpFrac < 0.75 || ups.length === 0 || bot === 'starter'
            ? takeShrine(run, { kind: 'rest' })
            : takeShrine(run, { kind: 'upgrade', card: ups[i % ups.length] as string });
        if (run.phase === 'shrine') run = leaveShrine(run);
        break;
      }
      case 'merchant':
        run = leaveMerchant(run);
        break;
      case 'event': {
        // events: the bot takes what does not add a card where it can (the starter bot must not pick up cards there)
        const opts = run.context?.event?.options.map((o) => o.id) ?? [];
        const want =
          hpFrac < 0.6 ? ['heal', 'leave', 'shards'] : ['leave', 'shards', 'boon', 'heal'];
        run = chooseEvent(
          run,
          (want.find((w) => opts.includes(w as never)) ?? opts[0] ?? 'leave') as 'leave',
        );
        if (run.phase === 'event' && run.context?.event?.choose) run = pickEventCard(run, 0);
        const deckPick = run.phase === 'event' ? run.context?.event?.chooseDeck : undefined;
        if (deckPick?.cards[0]) run = pickDeckCard(run, deckPick.cards[0]);
        break;
      }
      case 'stageClear':
        res.cleared = true;
        res.cards = run.deck.length - start;
        return res;
      default:
        res.cards = run.deck.length - start;
        return res;
    }
  }
  return res;
}
