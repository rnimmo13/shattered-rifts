// `pnpm fight`: a text-mode Combat v2 fight on the sample ruleset (the real content arrives in milestone C2).
//
//   pnpm fight                       you (Knight) vs a Rift Slime and a Cultist
//   pnpm fight -- --hero tinker      start with a Drone
//   pnpm fight -- --enemies warden   comma-separated: slime,cultist,summoner,warden
//   pnpm fight -- --seed abc         reproducible
//   pnpm fight -- --auto             a simple bot plays it and prints a transcript

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import {
  applyAction,
  cardText,
  createCombat,
  legalActions,
  viewFor,
  type Action,
  type CombatState,
  type UnitView,
} from '@sr/combat';
import { SAMPLE_DB as db, SAMPLE_DECK } from '@sr/combat/sample';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const ICON: Record<string, string> = {
  attack: '⚔',
  defend: '🛡',
  buff: '▲',
  debuff: '▼',
  summon: '✦',
  special: '?',
};

function unitLine(u: UnitView): string {
  const st = Object.entries(u.statuses)
    .map(([k, v]) => `${k}${v}`)
    .join(' ');
  const iv = u.intentView;
  const intent = iv
    ? `  [${iv.icons.map((i) => ICON[i] ?? '?').join('')} ${iv.name}${iv.damage !== null ? ` ${iv.damage}${iv.hits > 1 ? `x${iv.hits}` : ''}` : ''}]`
    : '';
  return `${u.name.padEnd(14)} ${String(u.hp).padStart(3)}/${u.maxHp}${u.barrier ? ` (+${u.barrier} barrier)` : ''}${st ? ` {${st}}` : ''}${intent}`;
}

function render(s: CombatState): string {
  const v = viewFor(db, s, 'a');
  const lines = ['', '── enemies ─────────────────────────────'];
  for (const u of v.sides.b.units) lines.push('  ' + unitLine(u));
  lines.push('── you ─────────────────────────────────');
  for (const u of v.sides.a.units) lines.push('  ' + unitLine(u));
  const me = v.sides.a;
  lines.push(
    `  Mana ${me.mana}/${me.maxMana}  draw ${me.drawCount}  discard ${me.discardCount}  snares set ${me.snares.length}`,
  );
  return lines.join('\n');
}

function describe(s: CombatState, a: Action): string {
  if (a.type === 'endTurn') return 'End turn';
  const inst = s.sides.a.hand.find((c) => c.id === a.card);
  const cd = db.cards[inst?.card ?? ''];
  const target = a.target
    ? [...s.sides.a.units, ...s.sides.b.units].find((u) => u.id === a.target)?.name
    : undefined;
  return `${cd?.name ?? '?'} (${cd?.cost}) - ${cd ? cardText(db, cd) : ''}${target ? `  -> ${target}` : ''}`;
}

/** The bot: attack when it can, otherwise defend, otherwise end the turn. */
function bot(s: CombatState, acts: Action[]): Action {
  const plays = acts.filter((a) => a.type === 'play');
  const score = (a: Action): number => {
    if (a.type !== 'play') return -1;
    const cd = db.cards[s.sides.a.hand.find((c) => c.id === a.card)?.card ?? ''];
    if (!cd) return 0;
    const dmg = cd.effects.reduce(
      (n, o) => n + (o.op === 'damage' ? o.amount * (o.hits ?? 1) : 0),
      0,
    );
    return (
      dmg +
      (cd.kind === 'summon' || cd.kind === 'power' ? 20 : 0) +
      (cd.effects.some((o) => o.op === 'barrier') ? 3 : 0) -
      cd.cost
    );
  };
  const best = plays.reduce<Action | null>((m, a) => (m && score(m) >= score(a) ? m : a), null);
  return best ?? { type: 'endTurn' };
}

async function main(): Promise<void> {
  const heroId = arg('hero', 'knight');
  const enemies = arg('enemies', 'slime,cultist').split(',');
  const seed = arg('seed', `cli-${process.hrtime.bigint().toString(36)}`);
  const auto = process.argv.includes('--auto');
  let { state } = createCombat(db, {
    seed,
    a: { hero: heroId, deck: SAMPLE_DECK },
    b: { enemies },
  });
  console.log(`Seed: ${seed}`);
  const rl = auto ? null : createInterface({ input: stdin, output: stdout });
  let steps = 0;
  while (!state.winner && steps++ < 500) {
    console.log(render(state));
    const acts = legalActions(db, state);
    let choice: Action;
    if (auto) {
      choice = bot(state, acts);
      console.log(`> ${describe(state, choice)}`);
    } else {
      const only = acts.length === 1;
      if (!only) {
        const hand = state.sides.a.hand;
        console.log('Hand: ' + hand.map((c) => db.cards[c.card]?.name).join(', '));
        acts.forEach((a, i) => console.log(`  ${i + 1}. ${describe(state, a)}`));
      }
      const answer = only
        ? '1'
        : (await (rl as NonNullable<typeof rl>).question('Choose: ')).trim();
      const n = Number(answer);
      if (!Number.isInteger(n) || n < 1 || n > acts.length) {
        console.log('Pick a number from the list.');
        continue;
      }
      choice = acts[n - 1] as Action;
    }
    state = applyAction(db, state, choice).state;
  }
  console.log(render(state));
  console.log(
    state.winner === 'a' ? '\nVictory!' : state.winner === 'b' ? '\nDefeat.' : '\nStopped.',
  );
  rl?.close();
}

void main();
