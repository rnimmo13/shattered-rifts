// `pnpm duel`: a text-mode duel in the terminal vs a random-legal-move AI.
//
//   pnpm duel                              you (Maren) vs AI (Kesh), random seed
//   pnpm duel -- --p1 rivet --p2 vesper    pick characters: maren | rivet | kesh | vesper
//   pnpm duel -- --seed abc                reproducible game
//   pnpm duel -- --auto                    AI vs AI, printed as a spectator transcript
//
// Smart auto-pass: when your only legal action is "Pass", it passes for you.

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createEngine, type Action, type GameState, type PlayerId } from '@sr/engine';
import { CARD_DB, CHARACTERS, character, starterDeck, type CharacterId } from '@sr/content';
import { RandomAi } from '@sr/ai';
import { Renderer, type Seat, type Viewer } from './cli/render';

interface Args {
  p1: CharacterId;
  p2: CharacterId;
  seed: string;
  auto: boolean;
  maxTurns: number;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const ids = CHARACTERS.map((c) => c.id) as string[];
  const pickChar = (v: string | undefined, d: CharacterId): CharacterId => {
    if (v === undefined) return d;
    if (!ids.includes(v)) throw new Error(`Unknown character "${v}". Choose: ${ids.join(', ')}`);
    return v as CharacterId;
  };
  return {
    p1: pickChar(get('--p1'), 'maren'),
    p2: pickChar(get('--p2'), 'kesh'),
    // a CLI default seed may use the clock; the engine itself never does
    seed: get('--seed') ?? `cli-${Date.now().toString(36)}`,
    auto: argv.includes('--auto'),
    maxTurns: Number(get('--max-turns') ?? 200),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const engine = createEngine(CARD_DB);
  const c1 = character(args.p1);
  const c2 = character(args.p2);
  const seats: [Seat, Seat] = [
    { name: args.auto ? 'AI 1' : 'You', character: c1.name },
    { name: args.auto ? 'AI 2' : 'AI', character: c2.name },
  ];
  const human: PlayerId | null = args.auto ? null : 0;
  const viewer: Viewer = human ?? 'all';
  const ui = new Renderer(engine, CARD_DB, seats, viewer);
  const ais = [new RandomAi(`${args.seed}:p1`), new RandomAi(`${args.seed}:p2`)];
  const rl = args.auto ? null : createInterface({ input: stdin, output: stdout });

  let state: GameState = engine.createGame({
    seed: args.seed,
    players: [
      { deck: starterDeck(args.p1), sigil: c1.sigil },
      { deck: starterDeck(args.p2), sigil: c2.sigil },
    ],
    rules: { maxTurns: args.maxTurns },
  });

  console.log(`\nSHATTERED RIFTS — CLI duel   seed: ${args.seed}`);
  console.log(
    `P1 ${seats[0].name}: ${c1.name} (${c1.starterName})   vs   P2 ${seats[1].name}: ${c2.name} (${c2.starterName})`,
  );
  console.log(
    `P${state.first + 1} goes first. Replay this game with: pnpm duel -- --seed ${args.seed}${args.auto ? ' --auto' : ''}\n`,
  );

  const apply = (a: Action) => {
    const before = state;
    const r = engine.applyAction(state, a);
    state = r.state;
    for (const line of ui.events(before, state, r.events)) console.log(line);
  };

  try {
    for (let guard = 0; guard < 50_000; guard++) {
      const p = engine.toAct(state);
      if (p === null) break;
      const legal = engine.legalActions(state, p);
      if (p !== human || !rl) {
        apply((ais[p] as RandomAi).choose(engine, state, p));
        continue;
      }
      if (legal.length === 1 && legal[0]?.type === 'pass') {
        apply(legal[0]);
        continue;
      }
      ui.remember(state);
      if (state.pending?.kind === 'mulligan') {
        apply(await askMulligan(rl, ui, state, legal));
        continue;
      }
      console.log(ui.board(state));
      if (state.window) console.log(`Response window — chain: ${ui.chainLine(state)}`);
      if (state.pending) console.log(`Choose (${state.pending.kind}):`);
      legal.forEach((a, i) =>
        console.log(`  ${String(i + 1).padStart(2)}) ${ui.describe(state, a)}`),
      );
      const choice = await askNumber(rl, legal.length);
      if (choice === null) {
        console.log('Bye!');
        return;
      }
      apply(legal[choice] as Action);
    }
  } finally {
    rl?.close();
  }
}

async function askNumber(
  rl: ReturnType<typeof createInterface>,
  n: number,
): Promise<number | null> {
  for (;;) {
    let line: string;
    try {
      line = (await rl.question('> ')).trim();
    } catch {
      return null; // stdin closed
    }
    if (line === 'q' || line === 'quit') return null;
    const k = Number(line);
    if (Number.isInteger(k) && k >= 1 && k <= n) return k - 1;
    console.log(`Enter a number from 1 to ${n} (or q to quit).`);
  }
}

async function askMulligan(
  rl: ReturnType<typeof createInterface>,
  ui: Renderer,
  state: GameState,
  legal: Action[],
): Promise<Action> {
  const hand = state.players[0].hand;
  console.log('Your opening hand:');
  hand.forEach((id, i) => console.log(`  ${i + 1}) ${ui.nameOf(id, state)}`));
  for (;;) {
    let line: string;
    try {
      line = (
        await rl.question('Shuffle back which cards? (numbers, e.g. "1 3"; Enter to keep) > ')
      ).trim();
    } catch {
      line = ''; // stdin closed: keep the hand
    }
    const picks = line ? line.split(/[\s,]+/).map((x) => Number(x) - 1) : [];
    if (picks.every((i) => Number.isInteger(i) && i >= 0 && i < hand.length)) {
      const cards = [...new Set(picks)].sort((a, b) => a - b).map((i) => hand[i] as string);
      const a = legal.find(
        (x) => x.type === 'mulligan' && JSON.stringify(x.cards) === JSON.stringify(cards),
      );
      if (a) return a;
    }
    console.log('Please enter card numbers from the list.');
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
