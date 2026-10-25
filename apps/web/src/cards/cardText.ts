// Rules text uses **bold** for keywords, and [[up:8:6]] / [[down:4:6]] for a number a sanctified roll changed (now 8, was 6).
// Split it into runs so React can render it without innerHTML.

export interface TextRun {
  text: string;
  bold: boolean;
  /** a number a sanctified roll changed: which way, and what it was */
  roll?: { dir: 'up' | 'down'; was: string };
}

const MARK = /(\*\*|\[\[(?:up|down):\d+:\d+\]\])/;

export function parseRules(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let bold = false;
  for (const p of text.split(MARK)) {
    if (!p) continue;
    if (p === '**') {
      bold = !bold;
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
