// Rules text uses **bold** for keywords. Split it into runs so React can render it without innerHTML.

export interface TextRun {
  text: string;
  bold: boolean;
}

export function parseRules(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split('**');
  parts.forEach((p, i) => {
    if (p) runs.push({ text: p, bold: i % 2 === 1 });
  });
  return runs;
}
