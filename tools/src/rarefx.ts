// `pnpm fxprompts:rare`: image prompts for a painted effect animation of every Rare card (DECISIONS #567), so the Rares stop all
// looking alike when played. Each card's effect is described in docs/card-art/rare-fx.json (`at`: where it plays, `row`: what the six
// frames show); this lays them out four to a sheet, by Riftwalker, in the same frame-strip layout as docs/animation-prompts.md, and writes
// docs/rare-fx-prompts.md and docs/card-art/rare-fx-sheets.json (which card is on which row, for cutting). A Rare with no description is
// listed at the top of the prompts file, and the run fails, so a new Rare is never left without one.

import { readFileSync, writeFileSync } from 'node:fs';
import { COMBAT_DB as db, RIFTWALKERS } from '@sr/content/v2';
import { REALM_STYLE } from './cardArtStyle';

interface Fx {
  at: 'target' | 'self' | 'all';
  row: string;
}
interface Sheet {
  name: string;
  hero: string;
  ids: string[];
}

const PER_SHEET = 4;
const DATA = new URL('../../docs/card-art/rare-fx.json', import.meta.url);
const OUT = new URL('../../docs/rare-fx-prompts.md', import.meta.url);
const SHEETS = new URL('../../docs/card-art/rare-fx-sheets.json', import.meta.url);
const fx = JSON.parse(readFileSync(DATA, 'utf8')) as Record<string, Fx>;

// every Rare a player can meet: no upgrades or rolls (they play their base card's effect)
const rares = Object.values(db.cards).filter(
  (c) => c.rarity === 'rare' && !c.id.endsWith('+') && !c.id.includes('~') && !c.id.includes('^'),
);
const ORDER = [...Object.keys(RIFTWALKERS), 'neutral'];
const heroOf = (c: (typeof rares)[number]): string => c.hero ?? 'neutral';
const missing = rares.filter((c) => !fx[c.id]).map((c) => c.id);
const unknown = Object.keys(fx).filter((id) => !rares.some((c) => c.id === id));

const WHERE: Record<Fx['at'], string> = {
  target: 'on one enemy',
  self: 'on the hero who played it',
  all: 'over the whole enemy line (keep it wide and low)',
};
const className = (hero: string): string =>
  hero === 'neutral' ? 'Neutral' : (RIFTWALKERS[hero as keyof typeof RIFTWALKERS]?.hero.name ?? hero);
const realmOf = (hero: string): string =>
  RIFTWALKERS[hero as keyof typeof RIFTWALKERS]?.realm ?? 'neutral';

const sheets: Sheet[] = [];
for (const hero of ORDER) {
  const mine = rares
    .filter((c) => heroOf(c) === hero && fx[c.id])
    .sort((a, b) => a.name.localeCompare(b.name));
  for (let i = 0; i < mine.length; i += PER_SHEET)
    sheets.push({
      name: `rare-${hero}-${String(i / PER_SHEET + 1).padStart(2, '0')}`,
      hero,
      ids: mine.slice(i, i + PER_SHEET).map((c) => c.id),
    });
}

function prompt(sh: Sheet): string {
  const rows = sh.ids.length;
  const lines = sh.ids.map((id, i) => {
    const c = db.cards[id]!;
    const f = fx[id]!;
    return `Row ${i + 1}: ${c.name.toUpperCase()} (plays ${WHERE[f.at]}): ${f.row}`;
  });
  return [
    `Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: ${rows} different card effects, no text.`,
    'The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).',
    '',
    `LAYOUT (critical): a wide landscape image holding ${rows} rows of EXACTLY 6 frames each, 6 across and ${rows} down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.`,
    'THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.',
    'EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, faces, hands, cards or scenery.',
    `PALETTE: ${REALM_STYLE[realmOf(sh.hero)] ?? REALM_STYLE.neutral}. Keep every row in this world's colours, but give each row its own main shape and motion: they must not look alike.`,
    '',
    'THE EFFECTS, one per row, top row first (the names are only to explain the idea; never write them):',
    ...lines,
    '',
    'NEGATIVE: text, letters, numbers, runes that look like writing, captions, labels, UI, card frames, borders, grid lines, watermark, logo, photorealism, soft fog, characters, faces, hands, gore.',
  ].join('\n');
}

const total = sheets.reduce((n, s) => n + s.ids.length, 0);
const byHero = ORDER.map((h) => ({
  h,
  n: sheets.filter((s) => s.hero === h).length,
  cards: sheets.filter((s) => s.hero === h).reduce((n, s) => n + s.ids.length, 0),
})).filter((x) => x.n > 0);

const md = [
  '# Rare card effects: prompts for ChatGPT (generated by `pnpm fxprompts:rare`: do not edit by hand)',
  '',
  `Every Rare gets its own painted effect, played when the card is played, so the Rares stop looking alike (DECISIONS #567). ${total} cards on ${sheets.length} sheets, four effects to a sheet, six frames each. To change an effect, edit its line in \`docs/card-art/rare-fx.json\` and run \`pnpm fxprompts:rare\` again.`,
  '',
  missing.length
    ? `**Rares with no effect described yet (${missing.length}):** ${missing.join(', ')}. Add them to \`docs/card-art/rare-fx.json\`.`
    : '**Every Rare has an effect described.**',
  '',
  '## How to use',
  '1. Attach the Valeria image (`assets-src/heroes/_source/Sunlit Paladin with Shield and Sword.png`) and `assets-src/icons/icons-01.png` as style anchors, the same as the other effect sheets, and paste ONE prompt.',
  '2. Do one sheet first and judge it in the game before the rest: tell me when `rare-knight-01` is in and I will wire it up, so you can see whether the style works when played.',
  '3. Check: 4 rows of 6 frames in an even grid, frames lined up within a row (nothing jumps), frame 1 small, the middle biggest, frame 6 nearly gone, plain magenta behind, no text. If one row is wrong, regenerate the whole sheet: it is cut by position.',
  '4. Save each one as `assets-src/fx/rare/<sheet name>.png` (for example `rare-knight-01.png`) and tell me which are in. The row order of every sheet is in `docs/card-art/rare-fx-sheets.json`.',
  '',
  '**Keep it ours:** never attach screenshots of another game or name a game or artist in a prompt (Golden rule 6).',
  '',
  '| Class | Cards | Sheets |',
  '|---|---|---|',
  ...byHero.map((x) => `| ${className(x.h)} | ${x.cards} | ${x.n} |`),
  '',
  ...sheets.flatMap((sh) => [
    `## \`${sh.name}.png\` (${className(sh.hero)})`,
    '',
    `Order: ${sh.ids.map((id) => db.cards[id]!.name).join(', ')}.`,
    '',
    '```',
    prompt(sh),
    '```',
    '',
  ]),
].join('\n');

writeFileSync(OUT, md);
writeFileSync(SHEETS, JSON.stringify(sheets, null, 1) + '\n');
console.log(`Wrote docs/rare-fx-prompts.md (${total} cards, ${sheets.length} sheets)`);
if (unknown.length) console.log(`Not a Rare any more (ignored): ${unknown.join(', ')}`);
if (missing.length) {
  console.error(`Rares with no effect described: ${missing.join(', ')}`);
  process.exitCode = 1;
}
