// pnpm tsx src/goldfish/trace.ts <decks.json> "<deck name>" [seed]: one sparring game, turn by turn (Mana, Might, cards, damage). Offline only.
import { readFileSync } from 'node:fs';
import {
  applyAction,
  chooseSmartAction,
  createCombat,
  heroOf,
  BOT_SEARCH,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db } from '@sr/content/v2';
import { ARENA_START_HP } from '@sr/pvp';

const [file, name, seed = 'trace-0'] = process.argv.slice(2);
const d = (
  JSON.parse(readFileSync(file!, 'utf8')) as {
    id: string;
    hero: string;
    name: string;
    deck: string[];
  }[]
).find((x) => x.name === name)!;
let s: CombatState = createCombat(db, {
  seed,
  a: { hero: d.hero, deck: d.deck, ascendancy: d.id, maxHp: ARENA_START_HP, hp: ARENA_START_HP },
  b: { hero: 'knight', deck: [], maxHp: ARENA_START_HP, hp: ARENA_START_HP },
}).state;
const foe = () => heroOf(s.sides.b)!.hp;
for (let turn = 1; turn <= 8 && !s.winner; turn++) {
  const h = heroOf(s.sides.a)!;
  const start = foe();
  const line: string[] = [];
  const m0 = s.sides.a.mana;
  const might0 = h.statuses.might ?? 0;
  while (s.active === 'a' && !s.winner) {
    const act = chooseSmartAction(db, s, BOT_SEARCH);
    const before = foe();
    const mana = s.sides.a.mana;
    const card =
      act.type === 'play' ? s.sides.a.hand.find((c) => c.id === act.card)?.card : act.type;
    s = applyAction(db, s, act).state;
    if (act.type === 'play')
      line.push(`${card}[${mana}M${before - foe() ? ` ${before - foe()}dmg` : ''}]`);
  }
  console.log(
    `T${turn}: Mana ${m0}, Might ${might0}->${heroOf(s.sides.a)!.statuses.might ?? 0}, HP ${heroOf(s.sides.a)!.hp}, dealt ${start - foe()}\n   ${line.join(' ')}`,
  );
  // (the opponent hits for 50 + 10 a turn, as the sparring dummy does)
  if (!s.winner) {
    const me = heroOf(s.sides.a)!;
    me.hp -= Math.max(0, 40 + 10 * turn - me.barrier);
    me.barrier = 0;
    s = applyAction(db, s, { type: 'endTurn' }).state;
  }
}
