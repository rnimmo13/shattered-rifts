// Rules text uses **bold** for keywords, [[up:8:6]] / [[down:4:6]] for a number a sanctified roll changed (now 8, was 6), and
// [[live:up:14]] (or down, same, calc; a range is "3-9") for what a card in your hand would really deal right now.
// Split it into runs so React can render it without innerHTML.

export interface TextRun {
  text: string;
  bold: boolean;
  /** a number a sanctified roll changed: which way, and what it was */
  roll?: { dir: 'up' | 'down'; was: string };
  /** a damage number worked out for right now: higher or lower than printed, the same, or a formula's result */
  live?: 'up' | 'down' | 'same' | 'calc';
}

const MARK = /(\*\*|\[\[(?:up|down):\d+:\d+\]\]|\[\[live:(?:up|down|same|calc):\d+(?:-\d+)?\]\])/;

export function parseRules(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let bold = false;
  for (const p of text.split(MARK)) {
    if (!p) continue;
    if (p === '**') {
      bold = !bold;
      continue;
    }
    const lv = /^\[\[live:(up|down|same|calc):(\d+(?:-\d+)?)\]\]$/.exec(p);
    if (lv) {
      runs.push({
        text: (lv[2] as string).replace('-', '–'),
        bold,
        live: lv[1] as NonNullable<TextRun['live']>,
      });
      continue;
    }
    const m = /^\[\[(up|down):(\d+):(\d+)\]\]$/.exec(p);
    if (m)
      runs.push({
        text: m[2] as string,
        bold,
        roll: { dir: m[1] as 'up' | 'down', was: m[3] as string },
      });
    else runs.push({ text: p, bold });
  }
  return runs;
}

/**
 * The text of a sanctified card with every number its roll changed marked against the plain card's text (`base`): "Deal 8 damage"
 * against "Deal 6 damage" gives "Deal [[up:8:6]] damage". Numbers are compared in order; if the two texts do not have the same count of
 * numbers (a wording that changed with the number), the text is returned as it is.
 */
export function markRollDiff(rolled: string, base: string): string {
  const nums = (s: string): string[] => s.match(/\d+/g) ?? [];
  const a = nums(rolled);
  const b = nums(base);
  if (a.length !== b.length) return rolled;
  let i = 0;
  return rolled.replace(/\d+/g, (n) => {
    const was = b[i++] as string;
    if (n === was) return n;
    return `[[${Number(n) > Number(was) ? 'up' : 'down'}:${n}:${was}]]`;
  });
}

/**
 * What a sanctified roll did to a card's numbers, for the notes beside a hovered card: "Rolled 25% stronger: damage 6 → 8,
 * Barrier 5 → 6." Each changed number is named by the word after it on the plain card. Null for a card without a roll, or when the
 * two texts cannot be lined up number for number.
 */
export function rollNote(
  rolled: string,
  base: string,
  dir: 1 | -1,
): { name: string; text: string } | null {
  const clean = (s: string): string => s.replace(/\*\*/g, '');
  const find = (s: string): { n: string; word: string }[] =>
    [...clean(s).matchAll(/(\d+)(?:%)?\s*([A-Za-z]+)?/g)].map((m) => ({
      n: m[1] as string,
      word: m[2] ?? '',
    }));
  const a = find(rolled);
  const b = find(base);
  if (a.length !== b.length) return null;
  const changes = a
    .map((x, i) => ({ now: x.n, was: (b[i] as { n: string; word: string }).n, word: x.word }))
    .filter((x) => x.now !== x.was)
    .map((x) => `${x.word ? `${x.word} ` : ''}${x.was} → ${x.now}`);
  if (changes.length === 0) return null;
  return {
    name: 'Sanctified',
    text: `Rolled 25% ${dir > 0 ? 'stronger' : 'weaker'} at the Sanctum: ${changes.join(', ')}.`,
  };
}
