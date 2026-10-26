import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import { PATCH_NOTES } from './patchNotes';

describe('the patch notes', () => {
  it('start with the version being built, newest first, each with something in it', () => {
    expect(PATCH_NOTES[0]?.version).toBe(pkg.version);
    const n = (v: string): number[] => v.split('.').map(Number);
    for (let i = 1; i < PATCH_NOTES.length; i++) {
      const [a, b] = [n(PATCH_NOTES[i - 1]!.version), n(PATCH_NOTES[i]!.version)];
      expect(a[0]! * 1e6 + a[1]! * 1e3 + a[2]!).toBeGreaterThan(b[0]! * 1e6 + b[1]! * 1e3 + b[2]!);
    }
    for (const p of PATCH_NOTES) {
      expect(p.notes.length).toBeGreaterThan(0);
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('say nothing about server limits or checks (nothing to game)', () => {
    const text = JSON.stringify(PATCH_NOTES).toLowerCase();
    for (const w of [
      'per day',
      'rate limit',
      'anti-',
      'farm',
      'exploit',
      'hash',
      'server checks',
      'counted only',
    ])
      expect(text, w).not.toContain(w);
  });
});
