// `pnpm --filter @sr/tools exec tsx src/baselineArchive.ts <out-dir>`: writes a frozen, fully resolved export of the balancing
// baseline classes (and the Monk, for reference) before the 2026-10-29 identity reworks (docs/BASE_CLASS_REWORKS.md): every card with
// its "+" version as plain data and as the rules text players read, each hero's numbers, trait, Sigil and starter, the totems, and
// the companions they start with. Run it only at the commit it documents: it reads the live content, so a later run describes later
// rules. The archive it wrote is never regenerated or edited (see the archive's README).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cardText, type CardDef } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';

const out = process.argv[2];
if (!out) throw new Error('usage: baselineArchive.ts <out-dir>');

const CLASSES: HeroId[] = ['knight', 'shaman', 'assassin', 'spellblade', 'necromancer', 'monk'];

mkdirSync(join(out, 'resolved'), { recursive: true });
mkdirSync(join(out, 'cards'), { recursive: true });

// the whole database: cards (with upgrades), heroes, totems, units, Boons, Potions
writeFileSync(join(out, 'resolved', 'combat-db.json'), JSON.stringify(db, null, 1) + '\n');

const RARITY = { basic: 0, common: 1, uncommon: 2, rare: 3, legendary: 4, ancestral: 5 } as const;
const costOf = (c: CardDef): string =>
  c.x
    ? 'X'
    : String(c.cost) + (c.starCost ? `+${c.starCost} Arcana` : '') + (c.starX ? '+X Arcana' : '');
const flags = (c: CardDef): string =>
  [
    c.exhaust && 'Consume',
    c.retain && 'Hold',
    c.innate && 'Opening hand',
    c.ethereal && 'Fleeting',
    c.sly && 'Sly',
    c.tags?.length && `tags: ${c.tags.join(', ')}`,
    c.source && `source: ${c.source}`,
  ]
    .filter(Boolean)
    .join('; ');

const summary: Record<string, unknown> = {};
for (const hero of CLASSES) {
  const r = RIFTWALKERS[hero];
  const base = Object.values(db.cards)
    .filter((c) => c.hero === hero && !c.id.endsWith('+'))
    .sort(
      (a, b) =>
        (RARITY[a.rarity ?? 'common'] ?? 9) - (RARITY[b.rarity ?? 'common'] ?? 9) ||
        (a.id < b.id ? -1 : 1),
    );
  const cards = base.map((c) => {
    const up = c.upgrade ? db.cards[c.upgrade] : undefined;
    return {
      id: c.id,
      name: c.name,
      kind: c.kind,
      rarity: c.rarity,
      cost: costOf(c),
      text: cardText(db, c),
      def: c,
      upgrade: up ? { id: up.id, cost: costOf(up), text: cardText(db, up), def: up } : null,
    };
  });
  const counts: Record<string, number> = {};
  for (const c of base) {
    const k = c.source ? 'token/special' : (c.rarity ?? '?');
    counts[k] = (counts[k] ?? 0) + 1;
  }
  const startUnits = (r.hero.startUnits ?? []).map((s) => {
    const id = typeof s === 'string' ? s : s.unit;
    return { entry: s, unit: db.units[id] };
  });
  const record = {
    hero: r.hero,
    persona: r.persona,
    role: r.role,
    realm: r.realm,
    trait: r.trait,
    blurb: r.blurb,
    mechanics: r.mechanics,
    howTo: r.howTo,
    starter: r.starter,
    starterText: r.starter.map((id) => ({
      id,
      text: db.cards[id] ? cardText(db, db.cards[id]) : '?',
    })),
    startUnits,
    counts,
    cards,
  };
  summary[hero] = { counts, cards: base.length, starter: r.starter };
  writeFileSync(join(out, 'resolved', `${hero}.json`), JSON.stringify(record, null, 1) + '\n');

  // the same, for people
  const md: string[] = [
    `# ${r.hero.name} (id \`${hero}\`): card list frozen 2026-10-29, before the identity reworks`,
    '',
    `${r.hero.maxHp} HP, ${r.hero.mana} Mana, ${r.hero.handSize} cards a turn. Realm ${r.realm}.`,
    '',
    `**Trait, ${r.trait.name}:** ${r.trait.text}`,
    '',
    r.hero.sigil?.length
      ? `**Sigil (at the start of every fight):** \`${JSON.stringify(r.hero.sigil)}\``
      : '',
    startUnits.length
      ? `**Starts with:** ${startUnits.map((u) => `${u.unit?.name ?? '?'} (${typeof u.entry === 'string' ? u.unit?.maxHp : u.entry.hp} HP)`).join(', ')}`
      : '',
    '',
    `**Starter (${r.starter.length}):** ${r.starter.join(', ')}`,
    '',
    `**Counts:** ${Object.entries(counts)
      .map(([k, n]) => `${k} ${n}`)
      .join(', ')}`,
    '',
    '| Id | Card | Cost | Type | Rarity | Text | Upgrade |',
    '|---|---|---|---|---|---|---|',
    ...cards.map(
      (c) =>
        `| \`${c.id}\` | ${c.name} | ${c.cost} | ${c.kind} | ${c.rarity ?? ''} | ${c.text.replace(/\|/g, '/')}${flags(c.def) ? ` *(${flags(c.def)})*` : ''} | ${c.upgrade ? `${c.upgrade.cost !== c.cost ? `cost ${c.upgrade.cost}: ` : ''}${c.upgrade.text.replace(/\|/g, '/')}` : 'none'} |`,
    ),
    '',
  ];
  writeFileSync(join(out, 'cards', `${hero}.md`), md.filter((l, i, a) => l || a[i - 1]).join('\n'));
}

// the totems (the Shaman's), as plain data
writeFileSync(join(out, 'resolved', 'totems.json'), JSON.stringify(db.runes ?? {}, null, 1) + '\n');
writeFileSync(join(out, 'resolved', 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1));
