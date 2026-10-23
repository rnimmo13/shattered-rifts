// `pnpm balance`: one line per Riftwalker, averaged over every encounter: win rate and HP lost on wins, for starter decks and
// for decks with N drafted cards. Use it to spot a character that is far from the others (see docs/BALANCE.md).
//   pnpm balance -- --n 12 --draft 10 --hp 100 --dmg 100

import { applyAction, chooseAction, createCombat, heroOf } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, rewardPool, type HeroId } from '@sr/content/v2';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1] ?? fallback) : fallback;
}
const N = arg('n', 12);
const DRAFT = arg('draft', 10);
const HP = arg('hp', 100);
const DMG = arg('dmg', 100);
// --only snare / --only nosnare: draft only (or never) Snares, to see how strong a card type is on its own
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

function deckFor(h: HeroId, seed: number): string[] {
  const deck = [...RIFTWALKERS[h].starter];
  const pool = rewardPool(h)
    .filter((id) => db.cards[id]?.hero === h || seed % 5 === 0)
    .filter((id) =>
      ONLY === 'snare'
        ? db.cards[id]?.kind === 'snare'
        : ONLY === 'nosnare'
          ? db.cards[id]?.kind !== 'snare'
          : true,
    );
  let x = seed * 2654435761 + 1;
  for (let i = 0; i < DRAFT; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    deck.push(pool[x % pool.length] as string);
  }
  return deck;
}

const kinds = ['regular', 'elite', 'warden'] as const;
console.log(
  `balance: ${N} fights per encounter, +${DRAFT} drafted cards, enemies ${HP}% HP / ${DMG}% damage\n`,
);
console.log('hero'.padEnd(10) + kinds.map((k) => k.padEnd(18)).join('') + 'overall');
for (const h of Object.keys(RIFTWALKERS) as HeroId[]) {
  let row = h.padEnd(10);
  let totalWins = 0;
  let totalFights = 0;
  for (const k of kinds) {
    let wins = 0;
    let fights = 0;
    let lost = 0;
    for (const e of ENCOUNTERS.filter((x) => x.kind === k)) {
      for (let i = 0; i < N; i++) {
        let { state } = createCombat(db, {
          seed: `${h}-${e.id}-${i}`,
          a: { hero: h, deck: deckFor(h, i) },
          b: { enemies: e.units, hpPct: HP, dmgPct: DMG },
        });
        const maxHp = heroOf(state.sides.a)?.maxHp ?? 0;
        for (let t = 0; t < 800 && !state.winner; t++)
          state = applyAction(db, state, chooseAction(db, state)).state;
        fights++;
        if (state.winner === 'a') {
          wins++;
          lost += maxHp - (heroOf(state.sides.a)?.hp ?? 0);
        }
      }
    }
    totalWins += wins;
    totalFights += fights;
    row +=
      `${Math.round((wins / fights) * 100)}% / -${wins ? Math.round(lost / wins) : '-'}`.padEnd(18);
  }
  row += `${Math.round((totalWins / totalFights) * 100)}%`;
  console.log(row);
}
