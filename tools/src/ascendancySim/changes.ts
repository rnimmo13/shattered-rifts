import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { cardText, type CombatDb } from '@sr/combat';
import { COMBAT_DB, ASCENDANCIES } from '@sr/content/v2';
import { PATCH_NOTES } from '../../../apps/web/src/app/patchNotes';
const dir = fileURLToPath(
  new URL('../../../docs/balance-history/simulations/0.199.0/', import.meta.url),
);
const old = JSON.parse(
  gunzipSync(readFileSync(dir + 'baseline-db.json.gz')).toString(),
) as CombatDb;
const notes = PATCH_NOTES.find((p) => p.version === '0.199.0')!;
const prose = notes.notes.map((n) => `${n.title ?? ''} ${n.text}`).join('\n');
const changes = Object.values(COMBAT_DB.cards)
  .filter((card) => JSON.stringify(card) !== JSON.stringify(old.cards[card.id]))
  .map((card) => {
    if (!prose.includes(card.name.replace(/\+$/, '')))
      throw Error('Missing player note: ' + card.name);
    return {
      id: card.id,
      name: card.name,
      oldCost: old.cards[card.id]?.cost,
      cost: card.cost,
      oldText: cardText(old, old.cards[card.id]!),
      text: cardText(COMBAT_DB, card),
      before: old.cards[card.id],
      after: card,
    };
  });
const heroes = ASCENDANCIES.filter(
  (a) => JSON.stringify(old.ascended?.[a.id]) !== JSON.stringify(COMBAT_DB.ascended?.[a.id]),
);
for (const a of heroes)
  if (!prose.includes(a.name)) throw Error('Missing Ascendancy note: ' + a.name);
writeFileSync(
  dir + 'content-diff.json',
  JSON.stringify(
    {
      version: '0.199.0',
      cards: changes,
      ascendancies: heroes.map((a) => ({
        id: a.id,
        before: old.ascended?.[a.id],
        after: COMBAT_DB.ascended?.[a.id],
      })),
      units: Object.values(COMBAT_DB.units)
        .filter((u) => JSON.stringify(u) !== JSON.stringify(old.units[u.id]))
        .map((u) => ({ id: u.id, before: old.units[u.id], after: u })),
    },
    null,
    2,
  ) + '\n',
);
const changelog = fileURLToPath(new URL('../../../CHANGELOG.md', import.meta.url));
const current = readFileSync(changelog, 'utf8');
const heading = '### 0.199.0 / rules 82 — local, not released';
if (!current.includes(heading))
  writeFileSync(
    changelog,
    current.replace(
      '## [Unreleased]',
      '## [Unreleased]\n\n' +
        heading +
        '\n\n' +
        notes.notes
          .map(
            (n) =>
              '- ' +
              [
                n.title ? `${n.title}:` : '',
                ...(n.changes ?? []).map(
                  (c) => `${c.label} ${c.before} → ${c.after} (${c.direction}).`,
                ),
                n.text,
              ]
                .filter(Boolean)
                .join(' '),
          )
          .join('\n') +
        '\n\n' +
        notes.heads +
        '\n\nExact hand budgets, experiment limitations and local status: `docs/BALANCE_REVISION_2026-11-05.md`. No push/deploy authorization.\n',
    ),
  );
console.log(
  `Verified named player notes for ${changes.length} changed card definitions and ${heroes.length} Ascendancies; saved exact data diff.`,
);
