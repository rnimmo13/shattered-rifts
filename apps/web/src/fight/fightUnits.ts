// Which units a fight can show, so their figures are fetched before it opens (preloadFightArt) and no others: the units standing at
// the start, and every unit the cards, units, heroes, Boons, potions, runes and totems in it can bring in, followed through (a card
// that summons a unit whose move summons another). Read from the data, so a new card or enemy needs nothing here.

import type { CombatDb, CombatState } from '@sr/combat';

/** a card id as the data files it: an upgrade ("strike+"), a sanctified ("hi~strike") or engraved ("hold^strike") card is its base */
const cardBase = (id: string): string =>
  id
    .replace(/^(hi|lo)~/, '')
    .replace(/^[a-z]+\^/, '')
    .replace(/\+$/, '');

export function fightUnits(db: CombatDb, state: CombatState): Set<string> {
  const units = new Set<string>();
  const seen = new Set<string>();
  const queue: unknown[] = [state];
  const tables: [string, Record<string, unknown> | undefined][] = [
    ['card', db.cards],
    ['hero', db.heroes],
    ['ascended', db.ascended],
    ['boon', db.boons],
    ['potion', db.potions],
    ['rune', db.runes],
    ['totem', db.totems],
  ];
  const visit = (s: string): void => {
    for (const id of new Set([s, s.replace(/\+$/, '')])) {
      const unit = db.units[id];
      if (unit && !seen.has(`unit:${id}`)) {
        seen.add(`unit:${id}`);
        units.add(id);
        queue.push(unit);
      }
    }
    for (const [kind, table] of tables) {
      if (!table) continue;
      for (const id of new Set([s, cardBase(s)])) {
        const def = Object.hasOwn(table, id) ? table[id] : undefined;
        if (def === undefined || seen.has(`${kind}:${id}`)) continue;
        seen.add(`${kind}:${id}`);
        queue.push(def);
        // (an upgrade's own effects too, when it is filed apart)
        const up = Object.hasOwn(table, `${id}+`) ? table[`${id}+`] : undefined;
        if (up !== undefined) queue.push(up);
      }
    }
  };
  // (a card that finds a card ("discover") picks by kind from the pool of the hero playing it and Neutral, never by id: every card it
  // could find is followed too, as the engine chooses them, a little more widely so none is missed)
  const heroes = new Set(
    (['a', 'b'] as const).map((s) => state.sides[s]?.hero).filter((h): h is string => !!h),
  );
  const discovered = new Set<string>();
  const discover = (raw: { kind?: unknown; neutral?: unknown }): void => {
    const op = {
      kind: typeof raw.kind === 'string' ? raw.kind : undefined,
      neutral: !!raw.neutral,
    };
    const key = `${op.kind ?? '*'}|${op.neutral ? 'n' : 'h'}`;
    if (discovered.has(key)) return;
    discovered.add(key);
    for (const c of Object.values(db.cards)) {
      const owner = c.hero ?? 'neutral';
      if (op.neutral ? owner !== 'neutral' : owner !== 'neutral' && !heroes.has(owner)) continue;
      if (op.kind && c.kind !== op.kind) continue;
      visit(c.id);
    }
  };
  const walked = new Set<object>();
  while (queue.length > 0) {
    const v = queue.pop();
    if (typeof v === 'string') visit(v);
    else if (v && typeof v === 'object') {
      if (walked.has(v)) continue;
      walked.add(v);
      const node = v as { op?: unknown; kind?: unknown; neutral?: unknown };
      if (node.op === 'discover') discover(node);
      for (const x of Array.isArray(v) ? v : Object.values(v)) queue.push(x);
    }
  }
  return units;
}
