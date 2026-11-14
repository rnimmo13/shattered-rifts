// #/roadmap: the public roadmap (Robert, 2026-11-14, DECISIONS #803), shown straight from ROADMAP.md so there is one copy to keep up to
// date. Only what that file uses is read: headings, bullets (a line starting "  " carries on the bullet above), paragraphs, **bold** and
// *italics*. Its title above the first line of dashes is not shown (the page has its own).
// Editing ROADMAP.md: the whole file ships in the website's code, so write nothing there that is not for players. Keep it honest and
// plain; the only date is the Early Access target Robert set (early 2027); the patch notes carry the detail.

import type { ReactNode } from 'react';
import roadmapText from '../../../../ROADMAP.md?raw';

/** **bold** and *italics* inside a line */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let at = 0;
  let k = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    out.push(m[1] !== undefined ? <b key={k++}>{m[1]}</b> : <i key={k++}>{m[2]}</i>);
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

type Block = { kind: 'h1' | 'h2' | 'p'; text: string } | { kind: 'list'; items: string[] };

/** The roadmap's blocks, from the first line of dashes on (horizontal rules are dropped). */
export function roadmapBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^-{3,}\s*$/.test(l));
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  const flush = (): void => {
    if (para.length) blocks.push({ kind: 'p', text: para.join(' ') });
    para = [];
    if (list) blocks.push({ kind: 'list', items: list });
    list = null;
  };
  for (const raw of lines.slice(start + 1)) {
    const line = raw.trimEnd();
    if (!line.trim() || /^-{3,}$/.test(line.trim())) {
      flush();
    } else if (line.startsWith('#')) {
      flush();
      const level = /^#+/.exec(line)![0].length;
      blocks.push({ kind: level <= 1 ? 'h1' : 'h2', text: line.replace(/^#+\s*/, '') });
    } else if (line.startsWith('- ')) {
      if (para.length) {
        blocks.push({ kind: 'p', text: para.join(' ') });
        para = [];
      }
      (list ??= []).push(line.slice(2));
    } else if (list && /^\s+\S/.test(line)) {
      list[list.length - 1] += ' ' + line.trim();
    } else {
      if (list) flush();
      para.push(line.trim());
    }
  }
  flush();
  return blocks;
}

const BLOCKS = roadmapBlocks(roadmapText);

export function RoadmapScreen() {
  return (
    <main className="learn roadmap">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="learn__title">Roadmap</h1>
      {BLOCKS.map((b, i) =>
        b.kind === 'list' ? (
          <ul key={i} className="roadmap__list">
            {b.items.map((it, j) => (
              <li key={j}>{inline(it)}</li>
            ))}
          </ul>
        ) : b.kind === 'p' ? (
          <p key={i} className="learn__note">
            {inline(b.text)}
          </p>
        ) : (
          <h2 key={i} className="roadmap__head">
            {inline(b.text)}
          </h2>
        ),
      )}
      <p className="learn__note roadmap__more">
        <a href="#/patch-notes">See the patch notes</a> for what changed most recently.
      </p>
    </main>
  );
}
