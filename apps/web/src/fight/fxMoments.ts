// Which painted effect a moment of the fight plays (DECISIONS #522). Pure: the player is fxPlayer.ts, the strips are public/art/fx, cut by
// tools/pack-icons.ps1 from the sheets in docs/animation-prompts.md. Presentation only: nothing here touches the rules.

import { SHATTER_AT, type CombatEvent, type PotionDef, type StatusId } from '@sr/combat';
import type { AttackKind } from './attackStyles';

export const FX_IDS = [
  'potion-drink',
  'potion-heal',
  'potion-shatter',
  'potion-explode',
  'debuff-exposed',
  'debuff-faltering',
  'debuff-brittle',
  'debuff-shocked',
  'fate-lands',
  'fate-kills',
  'fracture',
  'shatter',
  'tick-bleed',
  'tick-burn',
  'tick-hangover',
  'tick-static',
  'buff-might',
  'buff-primed',
  'buff-thorns',
  'buff-shielded',
  'barrier-gain',
  'barrier-hit',
  'barrier-break',
  'plating',
  'hit-slash',
  'hit-heavy',
  'hit-pierce',
  'hit-crit',
  'trail-draw',
  'trail-discard',
  'card-burn',
  'card-arrive',
  'unit-summon',
  'unit-death',
  'unit-phase',
  'unit-rest',
] as const;
export type FxId = (typeof FX_IDS)[number];

const STATUS_FX: Partial<Record<StatusId, FxId>> = {
  exposed: 'debuff-exposed',
  faltering: 'debuff-faltering',
  brittle: 'debuff-brittle',
  stunned: 'debuff-shocked',
  doom: 'fate-lands',
  fracture: 'fracture',
  seared: 'tick-bleed',
  burn: 'tick-burn',
  hangover: 'tick-hangover',
  might: 'buff-might',
  vigor: 'buff-primed',
  thorns: 'buff-thorns',
  shielded: 'buff-shielded',
  plating: 'plating',
};

/** What a status plays when it lands on a unit: enough Fracture to Shatter is its own moment. */
export function statusFx(status: StatusId, amount: number, total: number): FxId | null {
  if (status === 'fracture' && Math.floor(total / SHATTER_AT) > Math.floor((total - amount) / SHATTER_AT))
    return 'shatter';
  return STATUS_FX[status] ?? null;
}

/** HP lost at which a blow counts as heavy, and as the biggest kind. */
export const HEAVY_HIT = 10;
export const CRIT_HIT = 25;

/** What a blow plays where it lands: its weight first, then how it was struck. */
export function hitFx(lost: number, kind?: AttackKind): FxId {
  if (lost >= CRIT_HIT) return 'hit-crit';
  if (lost >= HEAVY_HIT) return 'hit-heavy';
  return kind === 'shoot' || kind === 'throw' ? 'hit-pierce' : 'hit-slash';
}

/** A potion thrown over every enemy, with no one target picked. */
export const potionHitsAllFoes = (p: PotionDef | undefined): boolean =>
  p?.effects.some((o) => 'to' in o && o.to === 'allFoes') ?? false;

/** What using a potion plays: thrown ones break on the target (a damaging one explodes), the rest are drunk. */
export function potionFx(p: PotionDef | undefined, aimed: boolean): FxId {
  if (p?.effects.some((o) => o.op === 'damage')) return 'potion-explode';
  return aimed || potionHitsAllFoes(p) ? 'potion-shatter' : 'potion-drink';
}

const TICKS: Partial<Record<StatusId, FxId>> = {
  seared: 'tick-bleed',
  burn: 'tick-burn',
  hangover: 'tick-hangover',
};

/** If the damage at `i` is a stack ticking (Bleed and Burn lose their stack after it, Hangover clears before it), which one. */
export function tickOf(all: readonly CombatEvent[], i: number): { status: StatusId; fx: FxId } | null {
  const e = all[i];
  if (e?.type !== 'damage' || e.source !== null) return null;
  const down = (n: CombatEvent | undefined): { status: StatusId; fx: FxId } | null => {
    if (n?.type !== 'status' || n.target !== e.target || n.amount >= 0) return null;
    const fx = TICKS[n.status];
    return fx ? { status: n.status, fx } : null;
  };
  const before = down(all[i - 1]);
  if (before) return before;
  // (what the loss sets off, a hero's Traps and triggers, can come between the damage and its stack going down)
  for (let j = i + 1; j < all.length; j++) {
    const n = all[j];
    if (!n || n.type === 'damage' || n.type === 'act' || n.type === 'play' || n.type === 'turnEnd') break;
    if (n.type === 'status' && n.target === e.target) return down(n);
  }
  return null;
}

/** Total damage at which an enemy's intent is shown as the huge blade. */
export const BIG_INTENT = 20;

/** The painted picture for an intent mark: an attack says how it comes (one blow, several, or a huge one). */
export function intentPic(icon: string, damage: number | null, hits: number): string {
  if (icon !== 'attack') return `intent-${icon}`;
  if ((damage ?? 0) * Math.max(1, hits) >= BIG_INTENT) return 'intent-big';
  return hits > 1 ? 'intent-multi' : 'intent-attack';
}

/** The painted crest of an Ascendancy (`knight:blood-knight` is crest-knight-blood-knight). */
export const crestPic = (ascendancyId: string): string => `crest-${ascendancyId.replace(':', '-')}`;
/** The painted crest of a class itself (`knight` is crest-knight; the class-01 sheet). */
export const classCrestPic = (hero: string): string => `crest-${hero}`;
