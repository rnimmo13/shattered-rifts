// `pnpm upaudit`: lists every card's "+" change as text, flagging upgrades that look weak (one stack of a status, a scry of 1,
// a 1-point change on a card that is not cheap, nothing at all). Used to find upgrades worth hand-writing.

import { cardText } from '@sr/combat';
import { COMBAT_DB as db } from '@sr/content/v2';

const weakOps = new Set([
  'status',
  'scry',
  'draw',
  'reclaim',
  'stars',
  'addCard',
  'mana',
  'manaNext',
  'drawNext',
]);
let weak = 0;
let total = 0;
for (const c of Object.values(db.cards)) {
  if (c.id.endsWith('+') || c.id.includes('~') || c.hero === 'junk' || !c.upgrade) continue;
  const u = db.cards[c.upgrade];
  if (!u) continue;
  total++;
  const a = cardText(db, c);
  const b = cardText(db, u);
  const same = a === b && c.cost === u.cost;
  const costOnly = a === b && c.cost !== u.cost;
  const small =
    !same &&
    !costOnly &&
    c.effects.length > 0 &&
    c.effects.every((o, i) => {
      const n = u.effects[i];
      if (!n || JSON.stringify(n) === JSON.stringify(o)) return true;
      return weakOps.has(o.op);
    });
  const flag = same ? 'NONE' : costOnly ? 'COST' : small ? 'SMALL' : '';
  if (flag) weak++;
  console.log(
    `${flag.padEnd(5)} ${c.hero ?? '-'}/${c.rarity ?? ''} ${c.name} [${c.cost}${u.cost !== c.cost ? '->' + u.cost : ''}] ${a}  ==>  ${b}`,
  );
}
console.log(`\n${weak} of ${total} flagged`);
