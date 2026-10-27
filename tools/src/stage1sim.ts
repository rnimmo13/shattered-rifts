// `pnpm stage1sim`: a first run's stage 1 (tier 1) for every Riftwalker and each of their three starting kits, played by the
// runsim bot. Two bots: `draft` takes the best-rarity card on offer (as runsim does), `starter` never takes a card, so it shows
// how far the starting deck alone gets. The goal (Robert, 2026-10-27): every kit in the same ball park, and a starter-only deck
// should have a hard time with the stage 1 Warden.
//
//   pnpm stage1sim -- --n 40 --difficulty normal --heroes knight,drunkard

import { applyAction, chooseAction, createCombat, heroOf } from '@sr/combat';
import {
  availableNodes,
  chooseCard,
  chooseEvent,
  chooseKit,
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
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const N = Number(arg('n', '40'));
const DIFF = arg('difficulty', 'normal') as Difficulty;
const HEROES = (arg('heroes', Object.keys(RIFTWALKERS).join(',')).split(',') as HeroId[]).filter(
  (h) => RIFTWALKERS[h],
);
const RANK: Record<string, number> = { basic: 0, common: 1, uncommon: 2, rare: 3, legendary: 4 };
type Bot = 'draft' | 'starter';

interface Result {
  cleared: boolean;
  bossReached: boolean;
  bossFirstTry: boolean;
  bossHp: number; // HP share walking into the Warden (first time)
  lost: number;
  cards: number; // cards added to the deck
}

function fight(run: RunState): { won: boolean; hp: number } {
  const plan = duelPlan(run);
  if (!plan) throw new Error('no plan');
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
      hpPct: plan.hpPct,
      dmgPct: plan.dmgPct,
      mods: plan.mods,
    },
  });
  for (let t = 0; t < 900 && !state.winner; t++)
    state = applyAction(db, state, chooseAction(db, state)).state;
  const hp = heroOf(state.sides.a)?.hp ?? 0;
  return { won: state.winner === 'a' && hp >= 1, hp };
}

function playStage1(h: HeroId, kit: number, bot: Bot, i: number): Result {
  let run = newRun(h, `stage1-${h}-${kit}-${i}`, DIFF);
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
        run = chooseKit(run, (['a', 'b', 'c'] as const)[kit] as string);
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

const pct = (x: number): string => `${Math.round(x * 100)}%`.padStart(5);
console.log(`stage1sim: ${N} runs per kit, ${DIFF}, tier 1, stage 1 only\n`);
console.log(
  'hero        kit  path               | draft: clear  boss1st  HP@boss lost cards | starter: clear  boss1st  HP@boss lost',
);
for (const h of HEROES) {
  for (let k = 0; k < 3; k++) {
    const row = (bot: Bot) => {
      const rs = Array.from({ length: N }, (_, i) => playStage1(h, k, bot, i));
      const at = rs.filter((r) => r.bossReached);
      const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
      return {
        clear: rs.filter((r) => r.cleared).length / N,
        boss: at.length ? at.filter((r) => r.bossFirstTry).length / at.length : 0,
        hp: avg(at.map((r) => r.bossHp)),
        lost: avg(rs.map((r) => r.lost)),
        cards: avg(rs.map((r) => r.cards)),
      };
    };
    const d = row('draft');
    const s = row('starter');
    const path = (RIFTWALKERS[h].buildPaths[k] ?? '').split(':')[0] ?? '';
    console.log(
      `${h.padEnd(12)}${String.fromCharCode(97 + k).padEnd(5)}${path.padEnd(19)}|       ${pct(d.clear)}   ${pct(d.boss)}   ${pct(d.hp)} ${d.lost.toFixed(1).padStart(4)} ${d.cards.toFixed(1).padStart(5)} |          ${pct(s.clear)}   ${pct(s.boss)}   ${pct(s.hp)} ${s.lost.toFixed(1).padStart(4)}`,
    );
  }
}
