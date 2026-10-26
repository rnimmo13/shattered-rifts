// `npx tsx src/cardpeek.ts id1 id2 ...`: print cards as data (cost, kind, rarity and effects), for balance work.
import { COMBAT_DB as db } from '@sr/content/v2';
for (const id of process.argv.slice(2)) {
  const c = db.cards[id];
  if (!c) {
    console.log(id, '?');
    continue;
  }
  const { name, cost, kind, rarity, effects, exhaust, retain, innate, onDiscard, onExhaust } = c;
  console.log(
    `${id} | ${name} | ${cost} ${kind} ${rarity}${exhaust ? ' consume' : ''}${retain ? ' hold' : ''}${innate ? ' innate' : ''} | ${JSON.stringify(effects)}${onDiscard ? ' onDiscard ' + JSON.stringify(onDiscard) : ''}${onExhaust ? ' onExhaust ' + JSON.stringify(onExhaust) : ''}`,
  );
}
