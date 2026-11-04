import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import { LORE_CHAPTERS, LORE_WORLDS } from './lore';

describe('illustrated lore and class homes', () => {
  it('gives every class exactly one canonical home, with no native class in the Far Rifts', () => {
    const heroes = LORE_WORLDS.flatMap((world) => world.heroes);
    expect(heroes.toSorted()).toEqual(Object.keys(RIFTWALKERS).toSorted());
    expect(new Set(heroes).size).toBe(10);
    expect(LORE_WORLDS.find((world) => world.id === 'beyond')?.heroes).toEqual([]);
    expect(LORE_WORLDS.find((world) => world.id === 'midden')?.note).toContain('No Warden');
    for (const id of heroes)
      expect(
        existsSync(resolve(import.meta.dirname, `../../public/art/figures/hero-${id}.png`)),
      ).toBe(true);
  });
  it('ships every requested illustration and responsive preview, without linking missing art', () => {
    const root = resolve(import.meta.dirname, '../../../..');
    const brief = readFileSync(resolve(root, 'docs/lore-prompts.md'), 'utf8');
    const requested = [...brief.matchAll(/^\d+\. \*\*([^*]+\.png)\*\*/gm)].map((match) =>
      match[1]!.replace('.png', ''),
    );
    const used = [
      'key-art',
      'key-art-clean',
      ...LORE_CHAPTERS.flatMap((chapter) => chapter.panels.map((panel) => panel.image)),
      ...LORE_WORLDS.map((world) => world.image),
    ];
    expect(used.toSorted()).toEqual(requested.toSorted());
    expect(used).toHaveLength(26);
    for (const name of used)
      for (const suffix of ['', '-small'])
        expect(existsSync(resolve(root, `apps/web/public/art/lore/${name}${suffix}.webp`))).toBe(
          true,
        );
  });
});
