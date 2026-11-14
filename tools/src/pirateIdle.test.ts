import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';
import { expect, it } from 'vitest';

it.each(['heroes-sheets', 'heroes-sheets-lite'])(
  'keeps Pirate Captain idle grip stable in %s',
  async (quality) => {
    const dir = fileURLToPath(
      new URL(
        `../../apps/web/public/art/${quality}/skins/drunkard-pirate-captain/`,
        import.meta.url,
      ),
    );
    const man = JSON.parse(readFileSync(join(dir, 'sprites.json'), 'utf8')) as {
      pages: string[];
      clips: { idle: { count: number; frames: number[][] } };
    };
    expect(man.clips.idle.count).toBe(48);
    const { data, info } = await sharp(join(dir, man.pages[0]!))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Invisible RGB may vary in transparent atlas pixels; only visible RGBA matters.
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] === 0) data.fill(0, i, i + 4);
    const first = man.clips.idle.frames[0]!;
    for (const frame of man.clips.idle.frames) {
      expect(frame[0]).toBe(0);
      expect(frame.slice(3)).toEqual(first.slice(3));
      // The hand below the tumbler/cigar: no shimmer from per-frame lossy encoding or resampling.
      for (let y = Math.round(frame[4]! * 0.29); y < Math.round(frame[4]! * 0.37); y++) {
        const x0 = Math.round(frame[3]! * 0.8),
          x1 = Math.round(frame[3]! * 0.9);
        const at = ((frame[2]! + y) * info.width + frame[1]! + x0) * 4;
        const base = ((first[2]! + y) * info.width + first[1]! + x0) * 4;
        expect(
          data.subarray(at, at + (x1 - x0) * 4).equals(data.subarray(base, base + (x1 - x0) * 4)),
        ).toBe(true);
      }
    }
  },
);
