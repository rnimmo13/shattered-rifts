// What a potion looks like and says: the colour of its liquid, from what it does, and its tooltip.

import type { PotionDef } from '@sr/combat';
import type { TipContent } from '../ui/tip';

/** The colour of the liquid, from what the potion does. */
export function liquidOf(p: PotionDef): string {
  const ops = p.effects;
  if (ops.some((o) => o.op === 'damage')) return '#ff6a52';
  if (ops.some((o) => o.op === 'heal')) return '#4fe08f';
  if (ops.some((o) => o.op === 'barrier')) return '#5ac8ff';
  if (ops.some((o) => o.op === 'mana')) return '#b99aff';
  if (ops.some((o) => o.op === 'draw')) return '#ffe27a';
  if (ops.some((o) => o.op === 'status' && o.status === 'might')) return '#ffa347';
  if (
    ops.some(
      (o) => o.op === 'status' && ['exposed', 'faltering', 'stunned', 'seared'].includes(o.status),
    )
  )
    return '#d78bff';
  return '#e8e0b0';
}

export const potionTip = (p: PotionDef, hint?: string): TipContent => ({
  kicker: `Potion (${p.rarity})`,
  title: p.name,
  tone: 'potion',
  text: p.text,
  ...(hint ? { hint } : {}),
});
