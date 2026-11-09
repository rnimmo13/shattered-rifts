// Offline: a made-up player export, played by the greedy bot, in the exact shapes the owner's export gives (DECISIONS #714), to check
// `pnpm balance:players -- --input <dir>` end to end before real players arrive. Not player data.
// Usage: tsx src/playerReportSample.ts <dir> [fights per build]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  applyAction,
  chooseAction,
  createCombat,
  type CombatSetup,
  type Side,
  type Action,
} from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { RULES_VERSION, fightStats, setupFor, type Entry } from '@sr/pvp';

const dir = resolve(process.argv[2] ?? 'player-sample');
const per = Number(process.argv[3] ?? 6);
mkdirSync(dir, { recursive: true });

function play(setup: CombatSetup, limit = 3000): { seat: Side; action: Action }[] {
  let s = createCombat(db, setup).state;
  const moves: { seat: Side; action: Action }[] = [];
  for (let i = 0; i < limit && !s.winner; i++) {
    const action = chooseAction(db, s);
    moves.push({ seat: s.active, action });
    s = applyAction(db, s, action).state;
  }
  return moves;
}

const heroes = Object.keys(RIFTWALKERS) as HeroId[];
const regular = ENCOUNTERS.filter((e) => e.kind === 'regular' && e.realm === 'aurelion');
const fights: unknown[] = [];
const campaign: unknown[] = [];
let n = 0;
for (const hero of heroes) {
  const player = hero.padEnd(64, '0').slice(0, 64);
  const deck = [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter.slice(0, 4)];
  for (let i = 0; i < per; i++) {
    const enc = regular[n++ % regular.length]!;
    const tier = 1 + (i % 6);
    const setup: CombatSetup = {
      seed: `sample-${hero}-${i}`,
      a: { hero, deck },
      b: { enemies: enc.units, hpPct: 90 + 40 * (tier - 1), dmgPct: 100 + 5 * (tier - 1) },
    };
    const moves = play(setup);
    const stats = fightStats(db, setup, moves, 'a');
    fights.push({
      player,
      id: `f${n}`,
      at: Date.now(),
      title: enc.name,
      won: stats.won === true,
      rules: RULES_VERSION,
      version: 'sample',
      hero,
      tier,
      encounter: enc.id,
      node: 'duel',
      floor: i + 1,
      stats,
      replay: { setup, moves, title: enc.name, me: 'a' },
    });
  }
  // (one run's snapshot with its deck choices: a reward is offered three cards from the class pool, the first taken)
  const pool = Object.values(db.cards)
    .filter((c) => c.hero === hero && !c.id.endsWith('+'))
    .map((c) => c.id);
  campaign.push({
    schema: 1,
    run: player,
    at: Date.now(),
    hero,
    tier: 3,
    drafts: Array.from({ length: 12 }, (_, k) => {
      const offered = [
        pool[k % pool.length]!,
        pool[(k * 7 + 1) % pool.length]!,
        pool[(k * 13 + 2) % pool.length]!,
      ];
      return { t: 1 + (k >> 2), k: 'reward', took: k % 5 === 4 ? null : offered[0], offered };
    }),
  });
}
// Arena: a few games between starter decks, with their replays as the export carries them
const arena: unknown[] = [];
for (let i = 0; i < heroes.length; i++) {
  const a: Entry = {
    name: 'A',
    hero: heroes[i]!,
    deck: RIFTWALKERS[heroes[i]!].starter,
    boons: [],
    tier: 1,
  };
  const b: Entry = {
    name: 'B',
    hero: heroes[(i + 3) % heroes.length]!,
    deck: RIFTWALKERS[heroes[(i + 3) % heroes.length]!].starter,
    boons: [],
    tier: 1,
  };
  const seed = `sample-arena-${i}`;
  const log = play(setupFor(seed, a, b), 4000);
  let s = createCombat(db, setupFor(seed, a, b)).state;
  for (const m of log) s = applyAction(db, s, m.action).state;
  arena.push({
    schema: 1,
    id: `arena:${seed}`,
    rules: RULES_VERSION,
    source: 'human',
    a: { hero: a.hero },
    b: { hero: b.hero },
    winner: s.winner,
    turns: { a: 0, b: 0 },
    replay: { rules: RULES_VERSION, seed, a, b, log },
  });
}
writeFileSync(join(dir, 'fights.json'), JSON.stringify(fights));
writeFileSync(join(dir, 'campaign.json'), JSON.stringify(campaign));
writeFileSync(join(dir, 'arena.json'), JSON.stringify(arena));
console.log(
  `Wrote ${fights.length} fights, ${campaign.length} runs, ${arena.length} Arena games to ${dir}`,
);
