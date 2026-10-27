// Lists that follow a player from device to device (DECISIONS #318): the run history and the Arena match history. Each item has an
// id and a time; the server's copy and a device's are merged by id (the newer copy of an item wins), newest first, up to the list's
// limit. An item the player removed is remembered as removed, so another device does not bring it back. Pure: browser and server.

/** Every list that is kept in the player's Vault, with how many items it keeps and the largest item it takes (bytes of JSON). */
export const SYNCED_LISTS = {
  /** ended runs (the newest keep their last fight, a few KB of moves) */
  history: { keep: 40, maxItem: 80_000, withFight: 12 },
  /** Arena games kept as replays (the replay itself is on the server) */
  matches: { keep: 60, maxItem: 2_000 },
} as const;

export type ListName = keyof typeof SYNCED_LISTS;

/** An item of a synced list: whatever the list holds, with an id and a time. */
export type ListItem = { id: string; at: number } & Record<string, unknown>;

/** The most removed ids remembered per list. */
export const MAX_REMOVED = 200;

export const isListName = (v: unknown): v is ListName =>
  typeof v === 'string' && Object.hasOwn(SYNCED_LISTS, v);

/** Whatever arrived as items of this list: anything malformed or too big is left out. */
export function cleanListItems(name: ListName, raw: unknown): ListItem[] {
  if (!Array.isArray(raw)) return [];
  const max = SYNCED_LISTS[name].maxItem;
  return (raw as unknown[]).flatMap((v): ListItem[] => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return [];
    const r = v as Record<string, unknown>;
    const id = r['id'];
    const at = r['at'];
    if (typeof id !== 'string' || id.length === 0 || id.length > 64) return [];
    if (typeof at !== 'number' || !Number.isFinite(at) || at < 0) return [];
    if (JSON.stringify(v).length > max) return [];
    return [v as ListItem];
  });
}

/** Removed ids as they arrived: strings of a sensible length, at most MAX_REMOVED (the newest last). */
export function cleanRemoved(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = (raw as unknown[]).filter(
    (x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 64,
  );
  return [...new Set(ids)].slice(-MAX_REMOVED);
}

/**
 * Bring two copies of a list together: one item per id (the newer copy wins; a tie keeps `mine`), none that was removed, newest
 * first, at most the list's limit.
 */
export function mergeList(
  name: ListName,
  mine: readonly ListItem[],
  theirs: readonly ListItem[],
  removed: readonly string[],
): ListItem[] {
  const gone = new Set(removed);
  const best = new Map<string, ListItem>();
  for (const item of [...mine, ...theirs]) {
    if (gone.has(item.id)) continue;
    const have = best.get(item.id);
    if (!have || item.at > have.at) best.set(item.id, item);
  }
  const spec: { keep: number; withFight?: number } = SYNCED_LISTS[name];
  return [...best.values()]
    .sort((a, b) => b.at - a.at)
    .slice(0, spec.keep)
    .map((item, i) => {
      // (only the newest few keep their last fight, so the list stays small: DECISIONS #318)
      if (spec.withFight === undefined || i < spec.withFight || !('lastFight' in item)) return item;
      const { lastFight: _gone, ...rest } = item;
      void _gone;
      return rest;
    });
}
