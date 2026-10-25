// A symbol for what a Boon does.

import type { BoonDef } from '@sr/combat';

/** A symbol for what the Boon does (its first name letter if nothing fits). */
export function glyphOf(b: BoonDef): string {
  if (b.mana) return '✦';
  if (b.handSize) return '▤';
  if (b.maxHp) return '♥';
  if (b.healAfterFight) return '✚';
  if (b.shardsPerFight) return '◈';
  const ops = [...(b.fightStart ?? []), ...(b.turnStart ?? [])];
  if (ops.some((o) => o.op === 'barrier')) return '⛨';
  if (ops.some((o) => o.op === 'status' && o.status === 'thorns')) return '✱';
  if (ops.some((o) => o.op === 'status' && o.status === 'might')) return '⚔';
  if (ops.some((o) => o.op === 'draw')) return '▤';
  if (ops.some((o) => o.op === 'status' && o.status === 'shielded')) return '◎';
  if (ops.some((o) => o.op === 'status' && o.status === 'exposed')) return '◉';
  if (ops.some((o) => o.op === 'status' && o.status === 'faltering')) return '⬇';
  return b.name.charAt(0);
}
