import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeSave, parseSave, SaveCompatibilityError, type SaveData } from './saveData.js';

/** One account's canonical file plus the previous complete revision. Steam Auto-Cloud syncs these. */
export class SaveStore {
  private current: SaveData | null = null;
  private loaded = false;
  readonly file: string;
  readonly backup: string;
  constructor(
    readonly folder: string,
    readonly owner: string,
  ) {
    this.file = join(folder, 'save-v1.json');
    this.backup = join(folder, 'save-v1.previous.json');
  }
  load(): SaveData | null {
    if (this.loaded) return this.current;
    const errors: unknown[] = [];
    for (const file of [this.file, this.backup]) {
      if (!existsSync(file)) continue;
      try {
        this.current = parseSave(readFileSync(file, 'utf8'), this.owner);
        this.loaded = true;
        return this.current;
      } catch (error) {
        if (error instanceof SaveCompatibilityError) throw error;
        errors.push(error);
      }
    }
    if (errors.length)
      throw new Error(
        'Both desktop saves are unreadable. They were preserved; restore a backup before playing.',
      );
    this.loaded = true;
    return null;
  }
  save(raw: unknown): SaveData {
    const before = this.load();
    const next = makeSave(this.owner, raw, before?.earned ?? [], Date.now());
    if (next.checksum === before?.checksum) return before;
    mkdirSync(this.folder, { recursive: true });
    // Rotate only a validated revision, never a corrupt current file over a good backup.
    if (before) this.atomic(this.backup, JSON.stringify(before));
    this.atomic(this.file, JSON.stringify(next));
    this.current = next;
    return next;
  }
  private atomic(file: string, text: string): void {
    const temporary = `${file}.tmp`;
    writeFileSync(temporary, text, { encoding: 'utf8', flush: true });
    renameSync(temporary, file);
  }
}
