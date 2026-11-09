// Check a shared Campaign fight (DECISIONS #697): replay it with the engine and list, turn by turn, every hit each unit dealt, so a
// number a player saw can be checked against the rules. Reads a saved fight record, or fetches a fight by its link or id.
//
//   pnpm fight:check <file.json | https://.../#/campaign-fight/ID | ID> [--all]
//
// By default only hits from the player's side are listed (the hero and companions); --all lists the enemies' too.

import { existsSync, readFileSync } from 'node:fs';
import {
  applyAction,
  createCombat,
  type Action,
  type CombatSetup,
  type CombatEvent,
} from '@sr/combat';
import { COMBAT_DB as db } from '@sr/content/v2';
import { RULES_VERSION } from '@sr/pvp';

const args = process.argv.slice(2);
const all = args.includes('--all');
const src = args.find((a) => !a.startsWith('--'));
if (!src) throw new Error('Usage: pnpm fight:check <file.json | link | id> [--all]');

interface Fight {
  rules: number;
  version?: string;
  title: string;
  replay: { setup: CombatSetup; moves: { seat: 'a' | 'b'; action: Action }[]; me?: 'a' | 'b' };
}

async function load(): Promise<Fight> {
  const id = /([A-Za-z0-9]{10})$/.exec(src!)?.[1];
  if (id && !existsSync(src!)) {
    const res = await fetch(`https://shatteredrifts.app/pvp/fight/${id}`);
    const d = (await res.json()) as { ok?: boolean; fight?: Fight };
    if (!d.ok || !d.fight)
      throw new Error(`No fight ${id} on the server (it may no longer be kept).`);
    return d.fight;
  }
  return JSON.parse(readFileSync(src!, 'utf8')) as Fight;
}

const fight = await load();
console.log(`${fight.title}  (version ${fight.version ?? '?'}, rules ${fight.rules})`);
if (fight.rules !== RULES_VERSION)
  console.log(
    `!! This fight was played under rules ${fight.rules}; this checkout is rules ${RULES_VERSION}. It may not replay the same way.`,
  );
const me = fight.replay.me ?? 'a';
let s = createCombat(db, fight.replay.setup).state;
/** the state after the move being read, so a unit that came or went during it can still be named */
let after = s;
const name = (id: string): string => {
  for (const side of [...Object.values(after.sides), ...Object.values(s.sides)]) {
    const u = side.units.find((x) => x.id === id);
    if (u) return `${u.name ?? u.def}${u.kind === 'ally' ? ` (${u.hp}/${u.maxHp})` : ''}`;
  }
  return id;
};
const sideOf = (id: string): string | null => {
  for (const st of [after, s])
    for (const [k, side] of Object.entries(st.sides))
      if (side.units.some((x) => x.id === id)) return k;
  return null;
};
const cardName = (a: Action): string => {
  if (a.type !== 'play') return a.type;
  const inst = s.sides[s.active].hand.find((c) => c.id === a.card);
  return inst ? (db.cards[inst.card]?.name ?? inst.card) : a.card;
};
let turn = -1;
for (const [i, m] of fight.replay.moves.entries()) {
  if (s.turn !== turn) {
    turn = s.turn;
    console.log(`\n== turn ${turn} (${s.active === me ? 'you' : 'enemies'}) ==`);
  }
  const what = m.seat === me ? cardName(m.action) : m.action.type;
  let out: { state: typeof s; events: CombatEvent[] };
  try {
    out = applyAction(db, s, m.action);
  } catch (err) {
    console.log(`!! move ${i + 1} (${what}) could not be replayed: ${(err as Error).message}`);
    break;
  }
  after = out.state;
  const hits = out.events.filter(
    (e): e is Extract<CombatEvent, { type: 'damage' }> =>
      e.type === 'damage' && (all || sideOf(e.source ?? '') === me),
  );
  if (m.seat === me && m.action.type === 'play') console.log(`  you play ${what}`);
  if (m.action.type === 'endTurn' && m.seat === me) console.log('  you end your turn');
  for (const h of hits)
    console.log(
      `    ${name(h.source ?? '?')} -> ${name(h.target)}: ${h.amount} (${h.lost} HP, ${h.blocked} blocked) [${h.kind}${h.overflow ? ', overflow' : ''}]`,
    );
  s = out.state;
}
console.log(
  `\nResult: ${s.winner ? (s.winner === me ? 'won' : s.winner === 'draw' ? 'draw' : 'lost') : 'unfinished'}`,
);
