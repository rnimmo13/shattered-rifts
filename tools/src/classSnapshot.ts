// `npx tsx src/classSnapshot.ts <hero> <dir> <yyyy-mm-dd> [note...]` (from tools/): a dated, frozen record of a class's cards and rules
// before a balance pass, so the earlier numbers stay available for comparison. It writes the resolved card and totem data as JSON (every base card and its "+",
// with their effects), the card text as the player reads it, the reward-eligible count, and the commit it was taken from. Never rerun
// it into a directory that already exists: a snapshot is not updated.

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { cardText } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, rewardPool, type HeroId } from '@sr/content/v2';

const hero = process.argv[2] as HeroId;
const dir = process.argv[3];
const date = process.argv[4] ?? '';
const notes = process.argv.slice(5);
if (!hero || !dir || !RIFTWALKERS[hero] || !/^\d{4}-\d{2}-\d{2}$/.test(date))
  throw new Error('usage: classSnapshot.ts <hero> <dir> <yyyy-mm-dd> [rule notes...]');
if (existsSync(dir)) throw new Error(`${dir} exists: a snapshot is never overwritten`);
mkdirSync(dir, { recursive: true });

const cards = Object.values(db.cards).filter((c) => c.hero === hero && !c.id.includes('~'));
const eligible = rewardPool(hero).filter((id) => db.cards[id]?.hero === hero);
const commit = execSync('git rev-parse HEAD').toString().trim();
const dirty = execSync('git status --short').toString().trim();

writeFileSync(
  `${dir}/${hero}.json`,
  JSON.stringify(
    {
      takenAt: date,
      commit,
      dirty: dirty.split('\n').filter(Boolean),
      hero: RIFTWALKERS[hero].hero,
      trait: RIFTWALKERS[hero].trait,
      starter: RIFTWALKERS[hero].starter,
      ...(hero === 'shaman' ? { totems: db.totems } : {}),
      rewardEligible: eligible.length,
      cards,
    },
    null,
    2,
  ),
);

const base = cards.filter((c) => !c.id.endsWith('+')).sort((a, b) => (a.id < b.id ? -1 : 1));
const lines = [
  `# ${RIFTWALKERS[hero].hero.name} before the balance pass of ${date} (frozen; commit ${commit.slice(0, 7)})`,
  '',
  `Reward-eligible ${RIFTWALKERS[hero].hero.name} cards: **${eligible.length}** (rewardPool, the class's own cards; basics and tokens excluded). All cards: ${base.length}.`,
  '',
  `Trait: **${RIFTWALKERS[hero].trait?.name}**: ${RIFTWALKERS[hero].trait?.text}`,
  '',
  `Starter: ${RIFTWALKERS[hero].starter.join(', ')}`,
  '',
  ...(hero === 'shaman'
    ? [
        '## Totems',
        '',
        ...Object.values(db.totems ?? {}).map((t) => `- **${t.name}** (${t.id}): ${t.text}`),
        '',
      ]
    : []),
  '## Rules as they stood',
  '',
  ...notes.map((n) => `- ${n}`),
  '',
  '## Cards',
  '',
  '| Id | Name | Rarity | Cost | Text | Upgrade |',
  '|---|---|---|---|---|---|',
  ...base.map((c) => {
    const up = c.upgrade ? db.cards[c.upgrade] : undefined;
    const cell = (s: string) => s.replace(/\|/g, '/');
    return `| \`${c.id}\` | ${c.name} | ${c.rarity} | ${c.x ? 'X' : c.cost} | ${cell(cardText(db, c))} | ${up ? cell(cardText(db, up)) : ''} |`;
  }),
  '',
];
writeFileSync(`${dir}/README.md`, lines.join('\n'));
console.log(`${dir}: ${base.length} cards, ${eligible.length} reward-eligible`);
