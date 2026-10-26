// `pnpm runsim`: whole runs played by a bot, to measure what a player actually faces: how often a run gets through all five
// stages, how far it gets when it fails, how many fights are lost and how hurt the hero is walking into each kind of fight.
// Single fights (pnpm balance) hide HP attrition and Resolve; this does not.
//
//   pnpm runsim -- --n 20 --difficulty easy,normal --heroes knight,drunkard --luck normal
//
// The bot is a decent, not great, player: it drafts the best-rarity card on offer (skipping weak ones in a fat deck), rests when
// hurt, takes elites when healthy, never uses potions, and the fight bot is the greedy 1-ply one in @sr/combat.

import { applyAction, chooseAction, createCombat, heroOf } from '@sr/combat';
import {
  DIFFICULTY,
  availableNodes,
  chooseCard,
  chooseEvent,
  pickEventCard,
  pickDeckCard,
  claimTrialPrize,
  ROLL_COST,
  rollTrial,
  chooseKit,
  choosePrelude,
  duelPlan,
  enterNode,
  finishDuel,
  leaveMerchant,
  newRun,
  nextStage,
  takeShrine,
  leaveShrine,
  upgradable,
  type Difficulty,
  type Luck,
  type RunState,
} from '@sr/campaign';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const N = Number(arg('n', '12'));
const DIFFS = arg('difficulty', 'easy,normal').split(',') as Difficulty[];
const HEROES = (arg('heroes', Object.keys(RIFTWALKERS).join(',')).split(',') as HeroId[]).filter(
  (h) => RIFTWALKERS[h],
);
const LUCK = arg('luck', 'normal') as Luck;
// --hp / --dmg / --resolve try a difficulty setting without editing the table
for (const d of DIFFS) {
  const o: Record<string, number> = {};
  for (const k of ['hp', 'dmg', 'resolve']) {
    const v = arg(k, '');
    if (v !== '') o[k === 'hp' ? 'hpPct' : k === 'dmg' ? 'dmgPct' : 'resolve'] = Number(v);
  }
  Object.assign(DIFFICULTY[d], o);
}
const RANK: Record<string, number> = { basic: 0, common: 1, uncommon: 2, rare: 3, legendary: 4 };

interface Result {
  cleared: boolean;
  stage: number;
  lost: number;
  fights: { kind: string; hpFrac: number; won: boolean; enc: string }[];
  stalled: boolean;
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

function playRun(h: HeroId, d: Difficulty, i: number): Result {
  let run = newRun(h, `runsim-${h}-${d}-${i}`, d, LUCK);
  const res: Result = { cleared: false, stage: 1, lost: 0, fights: [], stalled: true };
  for (let step = 0; step < 4000; step++) {
    const hpFrac = run.hp / run.maxHp;
    switch (run.phase) {
      case 'kit':
        run = chooseKit(run, (['a', 'b', 'c'] as const)[i % 3] as string);
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
          (hpFrac >= 0.7 && run.stage >= 2 ? by('elite') : undefined) ??
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
        const r = fight(run);
        res.fights.push({ kind, hpFrac, won: r.won, enc: duelPlan(run)?.encounterId ?? '?' });
        if (!r.won) res.lost++;
        run = finishDuel(run, r.won, r.won ? r.hp : undefined);
        res.stage = run.stage;
        break;
      }
      case 'reward': {
        const offers = (run.context?.offers ?? []).filter((id) => !!db.cards[id]);
        offers.sort(
          (a, b) =>
            (RANK[db.cards[b]?.rarity ?? 'common'] ?? 1) -
            (RANK[db.cards[a]?.rarity ?? 'common'] ?? 1),
        );
        const best = offers[0];
        const skip =
          !best || (run.deck.length >= 24 && (RANK[db.cards[best]?.rarity ?? 'common'] ?? 1) < 3);
        try {
          run = chooseCard(run, skip ? null : best);
        } catch {
          run = chooseCard(run, null);
        }
        break;
      }
      case 'gift':
        run = chooseCard(run, run.context?.offers?.[0] ?? null);
        break;
      case 'shrine': {
        const ups = upgradable(run.deck);
        run =
          hpFrac < 0.75 || ups.length === 0
            ? takeShrine(run, { kind: 'rest' })
            : takeShrine(run, { kind: 'upgrade', card: ups[i % ups.length] as string });
        // (a Gambler's Shrine stays open for a second blessing: the sim takes one and walks on)
        if (run.phase === 'shrine') run = leaveShrine(run);
        break;
      }
      case 'merchant':
        run = leaveMerchant(run);
        break;
      case 'event': {
        const opts = run.context?.event?.options.map((o) => o.id) ?? [];
        const want =
          hpFrac < 0.6 ? ['heal', 'leave'] : ['upgrade', 'card', 'boon', 'shards', 'leave'];
        if (opts.includes('trial')) {
          // an elite event: the bot spins the Brass Reel once if it can pay for it, and takes what it stops on
          if (run.shards >= ROLL_COST) {
            run = rollTrial(run);
            const t = run.context?.event?.trial;
            const lane = t?.earned?.[0] ?? 0;
            run = claimTrialPrize(run, `p${lane}`, t?.prizes[lane]?.choices ? 0 : undefined);
          } else run = chooseEvent(run, 'leave');
        } else
          run = chooseEvent(
            run,
            (want.find((w) => opts.includes(w as never)) ?? opts[0] ?? 'leave') as 'leave',
          );
        // an event that laid out three cards for a choice: the bot takes the first
        if (run.phase === 'event' && run.context?.event?.choose) run = pickEventCard(run, 0);
        // (or for a card of the deck: the bot takes the first it may)
        const deckPick = run.phase === 'event' ? run.context?.event?.chooseDeck : undefined;
        if (deckPick?.cards[0]) run = pickDeckCard(run, deckPick.cards[0]);
        break;
      }
      case 'stageClear':
        run = nextStage(run);
        res.stage = run.stage;
        break;
      case 'loopCleared':
        res.cleared = true;
        res.stalled = false;
        return res;
      case 'collapsed':
      case 'banked':
        res.stalled = false;
        return res;
    }
  }
  return res;
}

console.log(`runsim: ${N} runs per hero, luck ${LUCK}\n`);
for (const d of DIFFS) {
  const cfg = DIFFICULTY[d];
  console.log(
    `== ${d}: enemies ${cfg.hpPct}% HP / ${cfg.dmgPct}% damage, ${cfg.resolve} Resolve ==`,
  );
  console.log(
    'hero'.padEnd(10) +
      'cleared'.padEnd(10) +
      'avg stage'.padEnd(11) +
      'fights lost'.padEnd(13) +
      'HP entering duel/elite/warden',
  );
  let allCleared = 0;
  let stalledRuns = 0;
  let all = 0;
  for (const h of HEROES) {
    const rs = Array.from({ length: N }, (_, i) => playRun(h, d, i));
    const cleared = rs.filter((r) => r.cleared).length;
    allCleared += cleared;
    stalledRuns += rs.filter((r) => r.stalled).length;
    all += rs.length;
    const avg = (f: (r: Result) => number): number => rs.reduce((n, r) => n + f(r), 0) / rs.length;
    const hpOf = (k: string): string => {
      const fs = rs.flatMap((r) => r.fights.filter((f) => f.kind === k));
      return fs.length
        ? `${Math.round((fs.reduce((n, f) => n + f.hpFrac, 0) / fs.length) * 100)}%`
        : '-';
    };
    const losses = new Map<string, number>();
    for (const r of rs)
      for (const x of r.fights) if (!x.won) losses.set(x.enc, (losses.get(x.enc) ?? 0) + 1);
    const worst = [...losses.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([e, n]) => `${e}×${n}`)
      .join(' ');
    console.log(
      h.padEnd(10) +
        `${Math.round((cleared / N) * 100)}%`.padEnd(10) +
        avg((r) => r.stage)
          .toFixed(1)
          .padEnd(11) +
        avg((r) => r.lost)
          .toFixed(1)
          .padEnd(13) +
        `${hpOf('duel')} / ${hpOf('elite')} / ${hpOf('warden')}`.padEnd(22) +
        worst,
    );
  }
  console.log(
    `overall cleared: ${Math.round((allCleared / all) * 100)}%  (${stalledRuns} runs hit the step cap and count as failures)\n`,
  );
}
