// The Roadmap page reads ROADMAP.md (DECISIONS #803): its sections come through, and the file's title above the first rule does not.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { roadmapBlocks } from './RoadmapScreen';

const md = readFileSync(resolve(__dirname, '../../../../ROADMAP.md'), 'utf8');

describe('the roadmap page', () => {
  const blocks = roadmapBlocks(md);
  it('shows every section of ROADMAP.md, each with its bullets', () => {
    const heads = blocks.filter((b) => b.kind === 'h2').map((b) => ('text' in b ? b.text : ''));
    expect(heads.some((h) => h.startsWith('Playable now'))).toBe(true);
    expect(heads).toContain('Planned');
    expect(heads).toContain('Good to know');
    expect(blocks.filter((b) => b.kind === 'list').length).toBeGreaterThanOrEqual(4);
  });
  it("leaves out the file's title and keeps a bullet's continued line", () => {
    const all = JSON.stringify(blocks);
    expect(all).not.toContain('Shattered Rifts: Roadmap');
    expect(all).toContain('Your decks and progress are kept');
  });
});
