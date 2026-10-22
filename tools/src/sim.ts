// `pnpm sim`: balance simulation (02_CARDS §3 "Simulation gate").
//
//   pnpm sim match  --a maren --b kesh --games 400          one matchup (alternating who goes first)
//   pnpm sim matrix --games 100                             every starter vs every starter
//   pnpm sim card   --card WYL-05 --in kesh --games 600     impact of one card: deck ± the card, mirrored
//   pnpm sim tiers  --character maren --tiers 3,5 --games 300   deck banked after N loops vs after 1
//
// Common flags: --ai heuristic|random   --personality balanced|aggressive|controlling|trappy|novice
//               --rules '{"secondPlayerExtraCards":1}'  (test a rule change; JSON overrides of engine Rules)
//               --seed S   --workers N (default: cores − 1)   --a-deck "AUR-01:3,AUR-02:2" --a-sigil SIG-X
//   pnpm sim enemies --character maren --games 200          a starter vs every enemy of its realm
// Decks: a character id (maren|rivet|kesh|vesper), "enemy:<enemy id>", or "ID:count,ID:count".

import { CARD_DB, CHARACTERS, ENEMIES, character } from '@sr/content';
import { PERSONALITIES, type PersonalityId } from '@sr/ai';
import { DEFAULT_RULES, type Rules } from '@sr/engine';
import { draftDeck, characterIds } from './sim/draft';
import { cardName, isCharacter, parseDeck, swapOutFor } from './sim/decks';
import type { AiSpec, DeckSpec } from './sim/play';
import { defaultWorkers, runMatch, type MatchSummary } from './sim/runner';

const argv = process.argv.slice(2).filter((x) => x !== '--');
const cmd = argv[0] ?? 'help';
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const num = (name: string, d: number): number => {
  const v = flag(name);
  if (v === undefined) return d;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`--${name} must be a positive number`);
  return n;
};

const games = num('games', 200);
const seed = flag('seed') ?? 'sim';
const workers = num('workers', defaultWorkers());
const personality = (flag('personality') ?? 'balanced') as PersonalityId;
if (!(personality in PERSONALITIES)) throw new Error(`Unknown personality "${personality}"`);
const ai: AiSpec = { kind: (flag('ai') ?? 'heuristic') as AiSpec['kind'], personality };
if (ai.kind !== 'heuristic' && ai.kind !== 'random')
  throw new Error('--ai must be heuristic or random');

const rulesFlag = flag('rules');
const rules = rulesFlag ? (JSON.parse(rulesFlag) as Partial<Rules>) : undefined;
for (const k of Object.keys(rules ?? {})) {
  if (!(k in DEFAULT_RULES)) {
    throw new Error(
      `Unknown rule "${k}" in --rules. Known: ${Object.keys(DEFAULT_RULES).join(', ')}`,
    );
  }
}

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const line = (s: MatchSummary) =>
  `${pct(s.aRate)} [${pct(s.ci[0])}–${pct(s.ci[1])}]  (${s.aWins}W ${s.bWins}L ${s.draws}D, avg ${s.avgTurns.toFixed(1)} turns, first-player ${pct(s.aWinsWhenFirst / Math.max(1, s.aGamesFirst))})`;

async function match(a: DeckSpec, b: DeckSpec): Promise<MatchSummary> {
  return runMatch({ a, b, games, seed, aiA: ai, aiB: ai, ...(rules ? { rules } : {}) }, workers);
}

function deckArg(side: 'a' | 'b'): DeckSpec {
  const custom = flag(`${side}-deck`);
  if (custom) return parseDeck(custom, flag(`${side}-sigil`));
  const v = flag(side);
  if (!v) throw new Error(`Missing --${side} <character|deck>`);
  return parseDeck(v);
}

async function main(): Promise<void> {
  const started = Date.now();
  console.log(
    `\nSHATTERED RIFTS sim — ${cmd}   ${games} games, AI ${ai.kind}${ai.kind === 'heuristic' ? ` (${ai.personality})` : ''}, ${workers} worker${workers === 1 ? '' : 's'}, seed "${seed}"\n`,
  );

  if (cmd === 'match') {
    const a = deckArg('a');
    const b = deckArg('b');
    console.log(`${a.label}  vs  ${b.label}\n  ${a.label} wins: ${line(await match(a, b))}`);
  } else if (cmd === 'matrix') {
    const ids = characterIds();
    const head = ''.padEnd(10) + ids.map((i) => i.padEnd(9)).join('');
    console.log(`Row deck's win rate against the column deck:\n${head}`);
    for (const r of ids) {
      let row = r.padEnd(10);
      for (const c of ids) {
        row += (r === c ? '—' : pct((await match(parseDeck(r), parseDeck(c))).aRate)).padEnd(9);
      }
      console.log(row);
    }
  } else if (cmd === 'card') {
    const target = flag('card');
    if (!target || !CARD_DB[target]) throw new Error('--card <card id> is required');
    const inChar =
      flag('in') ?? CHARACTERS.find((c) => c.realm === CARD_DB[target]?.realm)?.id ?? 'maren';
    if (!isCharacter(inChar)) throw new Error('--in must be a character id');
    const base = parseDeck(inChar);
    const out = flag('replace') ?? swapOutFor(base.cards, target);
    const cards = [...base.cards];
    const at = cards.indexOf(out);
    if (at < 0) throw new Error(`${out} is not in the ${inChar} deck`);
    cards[at] = target;
    const withCard: DeckSpec = { ...base, label: `${base.label} + ${cardName(target)}`, cards };
    const s = await match(withCard, base);
    const rarity = CARD_DB[target]?.rarity ?? 'common';
    const limit = rarity === 'legendary' || rarity === 'mythic' ? 0.1 : 0.06;
    const delta = s.aRate - 0.5;
    console.log(`Swap one ${cardName(out)} for ${cardName(target)} (${rarity}) in ${base.label}:`);
    console.log(`  deck with the card wins ${line(s)}`);
    console.log(
      `  shift ${(100 * delta).toFixed(1)} points; gate ±${100 * limit} → ${Math.abs(delta) <= limit ? 'OK' : 'OUTSIDE THE GATE (or noise: rerun with more games)'}`,
    );
  } else if (cmd === 'tiers') {
    const id = flag('character') ?? 'maren';
    if (!isCharacter(id)) throw new Error('--character must be a character id');
    const tiers = (flag('tiers') ?? '2,3,5').split(',').map(Number);
    const t1 = draftDeck(id, 1, seed);
    console.log(
      `${character(id).name}: decks drafted by a bot that picks 1-of-3 with the campaign's rarity odds.`,
    );
    console.log(
      `(A model, not the campaign. Goal: a Tier I deck must still beat deeper decks often. See DECISIONS #12.)\n`,
    );
    console.log(`  Tier I deck: ${t1.cards.length} cards`);
    const starter = parseDeck(id);
    console.log(`  Tier I deck vs plain starter: ${line(await match(t1, starter))}\n`);
    for (const t of tiers) {
      // average over several different drafts so one lucky draft doesn't decide it
      const drafts = num('drafts', 6);
      let total = 0;
      let size = 0;
      let wins = 0;
      for (let d = 0; d < drafts; d++) {
        const deep = draftDeck(id, t, `${seed}-d${d}`);
        const shallow = draftDeck(id, 1, `${seed}-s${d}`);
        const r = await runMatch(
          {
            a: deep,
            b: shallow,
            games: Math.ceil(games / drafts),
            seed: `${seed}-t${t}-${d}`,
            aiA: ai,
            aiB: ai,
          },
          workers,
        );
        total += r.games;
        wins += r.aWins + r.draws / 2;
        size += deep.cards.length;
      }
      const rate = wins / total;
      console.log(
        `  Tier ${t} deck (${(size / drafts).toFixed(0)} cards avg) vs Tier I deck: ${pct(rate)} over ${total} games / ${drafts} drafts  → Tier I wins ${pct(1 - rate)}`,
      );
    }
  } else if (cmd === 'enemies') {
    const id = flag('character') ?? 'maren';
    if (!isCharacter(id)) throw new Error('--character must be a character id');
    const realm = character(id).realm;
    const me = parseDeck(id);
    console.log(`${me.label} (${me.cards.length} cards, 30 Essence) vs the ${realm} enemies, who play with their own Essence and personality:
`);
    for (const e of ENEMIES.filter((x) => x.realm === realm)) {
      const s = await match(me, parseDeck(`enemy:${e.id}`));
      console.log(
        `  ${e.kind.padEnd(8)} ${e.name.padEnd(34)} ${e.essence} Essence, ${e.personality.padEnd(11)} starter wins ${pct(s.aRate)}  (avg ${s.avgTurns.toFixed(1)} turns)`,
      );
    }
  } else {
    console.log(
      'Commands: match | matrix | card | tiers | enemies   (see the header of tools/src/sim.ts)',
    );
  }
  console.log(`\n${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
