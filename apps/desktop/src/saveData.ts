import { createHash } from 'node:crypto';

export const HEROES = [
  'knight',
  'engineer',
  'hunter',
  'trickster',
  'assassin',
  'shaman',
  'monk',
  'spellblade',
  'necromancer',
  'drunkard',
] as const;
export const ACHIEVEMENTS = [
  { id: 'FIRST_VICTORY', name: 'First Blood', description: 'Win a campaign battle.' },
  { id: 'ASCENDANT', name: 'Ascendant', description: 'Choose an Ascendancy.' },
  ...[1, 5, 10, 15, 20].map((tier) => ({
    id: `TIER_${tier}`,
    name: `Rift Tier ${tier}`,
    description: `Clear Rift Tier ${tier}.`,
  })),
  ...HEROES.map((hero) => ({
    id: `CLASS_${hero.toUpperCase()}`,
    name: `${hero === 'assassin' ? 'Rogue' : hero[0]!.toUpperCase() + hero.slice(1)} Initiate`,
    description: `Clear Tier I as the ${hero === 'assassin' ? 'Rogue' : hero}.`,
  })),
  { id: 'ALL_CLASSES', name: 'Riftwalker', description: 'Clear Tier I with all ten classes.' },
];
const IDS = new Set(ACHIEVEMENTS.map((a) => a.id));
const KEYS = new Set([
  'sr.run.v2',
  'sr.runs.v3',
  'sr.run.active',
  'sr.runs.gone',
  'sr.runConflictCopies',
  'sr.runRecoveryCopies',
  'sr.runRecoveryBeforeRestore',
  'sr.runRecoveryRestored',
  'sr.runHistory',
  'sr.runHistory.removed',
  'sr-vault-v1',
  'sr-vault-code',
  'sr.matchHistory',
  'sr.balanceSamples.v1',
  'sr.balanceSalt.v1',
  'sr.pendingDrops',
  'sr-cosmetics',
  'sr.hero',
  'sr.sound',
  'sr.effects',
  'sr.tips.seen',
  'sr.tips.on',
  'sr.patchNotesSeen',
  'sr.mapInkIndex',
  'sr.mapInkColor',
]);
export const cloudKey = (key: string): boolean =>
  KEYS.has(key) ||
  ['sr.fightlog:', 'sr.ghostlog:', 'sr.duel.started:', 'sr.mapInk.'].some((p) => key.startsWith(p));
export const MAX_SAVE_BYTES = 16 * 1024 * 1024;
const object = (v: unknown): Record<string, unknown> | null =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

export function cleanEntries(raw: unknown): Record<string, string> {
  const source = object(raw);
  if (!source || Object.keys(source).length > 4000) throw new Error('Invalid desktop save data');
  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (!cloudKey(key)) continue;
    if (typeof value !== 'string') throw new Error('Invalid save value');
    entries[key] = value;
  }
  if (Buffer.byteLength(JSON.stringify(entries)) > MAX_SAVE_BYTES)
    throw new Error('Desktop save is too large');
  return entries;
}
export interface SaveData {
  version: 1;
  owner: string;
  savedAt: number;
  entries: Record<string, string>;
  earned: string[];
  checksum: string;
}
/** Incompatible data must be preserved, never replaced by an older backup on downgrade/account switch. */
export class SaveCompatibilityError extends Error {}
const digest = (entries: Record<string, string>, earned: string[]): string =>
  createHash('sha256').update(JSON.stringify({ entries, earned })).digest('hex');

export function achievementsFor(
  entries: Record<string, string>,
  previous: string[] = [],
): string[] {
  const earned = new Set(previous.filter((id) => IDS.has(id)));
  const progress = (v: unknown, history: boolean): void => {
    const r = object(v);
    if (!r) return;
    const hero = history ? r.hero : r.character;
    const stats = history ? r : object(r.stats);
    const won = stats?.duelsWon;
    if (!HEROES.includes(hero as (typeof HEROES)[number]) || typeof won !== 'number' || won < 1)
      return;
    earned.add('FIRST_VICTORY');
    if (typeof r.ascendancy === 'string') earned.add('ASCENDANT');
    if (typeof r.tier !== 'number' || !Number.isInteger(r.tier) || r.tier < 1 || r.tier > 20)
      return;
    const cleared =
      r.tier -
      ((history ? r.end === 'banked' : ['loopCleared', 'banked'].includes(String(r.phase)))
        ? 0
        : 1);
    for (const tier of [1, 5, 10, 15, 20]) if (cleared >= tier) earned.add(`TIER_${tier}`);
    if (cleared >= 1) earned.add(`CLASS_${String(hero).toUpperCase()}`);
  };
  try {
    const slots: unknown = JSON.parse(entries['sr.runs.v3'] ?? '[]');
    if (Array.isArray(slots))
      for (const slot of slots) {
        const text = object(slot)?.text;
        if (typeof text === 'string') {
          try {
            progress(JSON.parse(text), false);
          } catch {
            /* unreadable run */
          }
        }
      }
    const history: unknown = JSON.parse(entries['sr.runHistory'] ?? '[]');
    if (Array.isArray(history)) for (const record of history) progress(record, true);
  } catch {
    /* preserve saves from newer versions without interpreting their progress */
  }
  if (HEROES.every((h) => earned.has(`CLASS_${h.toUpperCase()}`))) earned.add('ALL_CLASSES');
  return [...earned].sort();
}
export function makeSave(owner: string, raw: unknown, previous: string[], now: number): SaveData {
  const entries = cleanEntries(raw);
  const earned = achievementsFor(entries, previous);
  return { version: 1, owner, savedAt: now, entries, earned, checksum: digest(entries, earned) };
}
export function parseSave(text: string, owner: string): SaveData {
  if (Buffer.byteLength(text) > MAX_SAVE_BYTES + 65536)
    throw new Error('Desktop save is too large');
  const data = object(JSON.parse(text));
  if (
    data &&
    ((data.version !== undefined && data.version !== 1) ||
      (typeof data.owner === 'string' && data.owner !== owner))
  )
    throw new SaveCompatibilityError(
      'This desktop save belongs to another account or a newer game version.',
    );
  if (
    !data ||
    data.version !== 1 ||
    data.owner !== owner ||
    !Number.isFinite(data.savedAt) ||
    !Array.isArray(data.earned)
  )
    throw new Error('Unsupported, corrupt or wrong-account desktop save');
  const entries = cleanEntries(data.entries);
  if (!data.earned.every((id) => typeof id === 'string'))
    throw new Error('Invalid achievement data');
  const earned = data.earned;
  if (data.checksum !== digest(entries, earned)) throw new Error('Desktop save checksum failed');
  if (earned.some((id) => !IDS.has(id)))
    throw new SaveCompatibilityError('This desktop save requires a newer game version.');
  return {
    version: 1,
    owner,
    savedAt: data.savedAt as number,
    entries,
    earned,
    checksum: data.checksum,
  };
}
