import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { SaveStore } from './saveStore';

const roots: string[] = [];
const store = (owner = 'standalone') => {
  const folder = mkdtempSync(join(tmpdir(), 'sr-save-test-'));
  roots.push(folder);
  return new SaveStore(folder, owner);
};
afterEach(() => {
  for (const path of roots.splice(0)) {
    if (
      !resolve(path).startsWith(resolve(tmpdir()) + '\\sr-save-test-') &&
      !resolve(path).startsWith(resolve(tmpdir()) + '/sr-save-test-')
    )
      throw new Error('Unexpected test cleanup path');
    rmSync(path, { recursive: true, force: true });
  }
});
describe('atomic desktop saves and recovery', () => {
  it('migrates a first snapshot and restores the exact canonical state in a new process/store', () => {
    const s = store();
    expect(s.load()).toBeNull();
    s.save({ 'sr.runs.v3': '["first"]', 'sr-vault-v1': '[]' });
    s.save({ 'sr.runs.v3': '["next"]' });
    expect(new SaveStore(s.folder, 'standalone').load()?.entries).toEqual({
      'sr.runs.v3': '["next"]',
    });
    expect(JSON.parse(readFileSync(s.backup, 'utf8'))).toMatchObject({
      entries: { 'sr.runs.v3': '["first"]' },
    });
  });
  it('uses the last valid revision when the current file is corrupt, then repairs safely', () => {
    const s = store();
    s.save({ 'sr.runs.v3': '["good"]' });
    s.save({ 'sr.runs.v3': '["later"]' });
    writeFileSync(s.file, 'broken');
    const restarted = new SaveStore(s.folder, 'standalone');
    expect(restarted.load()?.entries['sr.runs.v3']).toBe('["good"]');
    restarted.save({ 'sr.runs.v3': '["recovered"]' });
    expect(new SaveStore(s.folder, 'standalone').load()?.entries['sr.runs.v3']).toBe(
      '["recovered"]',
    );
  });
  it('refuses to replace unknown or wrong-account data with an empty save', () => {
    const s = store('one');
    s.save({ 'sr.runs.v3': '["safe"]' });
    const before = readFileSync(s.file, 'utf8');
    expect(() => new SaveStore(s.folder, 'two').save({})).toThrow();
    expect(readFileSync(s.file, 'utf8')).toBe(before);
    writeFileSync(s.file, 'broken');
    expect(() => new SaveStore(s.folder, 'one').save({})).toThrow();
    expect(readFileSync(s.file, 'utf8')).toBe('broken');
  });
  it('does not downgrade a future save even when an older valid backup exists', () => {
    const s = store();
    s.save({ 'sr.runs.v3': '["old"]' });
    s.save({ 'sr.runs.v3': '["new"]' });
    const future = JSON.stringify({
      ...(JSON.parse(readFileSync(s.file, 'utf8')) as object),
      version: 2,
    });
    writeFileSync(s.file, future);
    expect(() => new SaveStore(s.folder, 'standalone').save({})).toThrow();
    expect(readFileSync(s.file, 'utf8')).toBe(future);
  });
});
