// `npx tsx src/shamanSnapshot.ts <dir>` (from tools/): a dated, frozen record of the Shaman's cards and rules before a balance pass, so
// the earlier numbers stay available for comparison. It writes the resolved card and totem data as JSON (every base card and its "+",
// with their effects), the card text as the player reads it, the reward-eligible count, and the commit it was taken from. Never rerun
// it into a directory that already exists: a snapshot is not updated.

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { cardText } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, rewardPool } from '@sr/content/v2';

const dir = process.argv[2];
if (!dir) throw new Error('usage: shamanSnapshot.ts <dir>');
if (existsSync(dir)) throw new Error(`${dir} exists: a snapshot is never overwritten`);
mkdirSync(dir, { recursive: true });

const cards = Object.values(db.cards).filter((c) => c.hero === 'shaman' && !c.id.includes('~'));
const eligible = rewardPool('shaman').filter((id) => db.cards[id]?.hero === 'shaman');
const commit = execSync('git rev-parse HEAD').toString().trim();
const dirty = execSync('git status --short').toString().trim();

writeFileSync(
  `${dir}/shaman.json`,
  JSON.stringify(
    {
      takenAt: '2026-10-29',
      commit,
      dirty: dirty.split('\n').filter(Boolean),
      hero: RIFTWALKERS.shaman.hero,
      trait: RIFTWALKERS.shaman.trait,
      starter: RIFTWALKERS.shaman.starter,
      totems: db.totems,
      rewardEligible: eligible.length,
      cards,
    },
    null,
    2,
  ),
);

const base = cards.filter((c) => !c.id.endsWith('+')).sort((a, b) => (a.id < b.id ? -1 : 1));
const lines = [
  `# The Shaman before the balance pass of 2026-10-29 (frozen; commit ${commit.slice(0, 7)})`,
  '',
  `Reward-eligible Shaman cards: **${eligible.length}** (rewardPool, his own cards; basics and tokens excluded). All cards: ${base.length}.`,
  '',
  `Trait: **${RIFTWALKERS.shaman.trait?.name}**: ${RIFTWALKERS.shaman.trait?.text}`,
  '',
  `Starter: ${RIFTWALKERS.shaman.starter.join(', ')}`,
  '',
  '## Totems',
  '',
  ...Object.values(db.totems ?? {}).map((t) => `- **${t.name}** (\`${t.id}\`): ${t.text}`),
  '',
  '## Rules as they stood',
  '',
  '- A totem\'s help (TotemDef.boost) was added to every damage and Barrier op of the first spell of its element each turn: every hit, every enemy, and the ops inside an "If ...:" condition too. Any spell of the element used it up, even one with no damage or Barrier.',
  '- "Command your Hawks" commanded every totem of the kind; Hawk Call commanded every Hawk after planting one.',
  '- Call Again (0 Mana, a random totem) did not Consume.',
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
