import { DEBUFFS, type CardDef, type CombatState, type Side } from '@sr/combat';

/** Direct cleansing effects only: never guess outcomes of conditional or random effects. */
export function cleansePreview(card: CardDef, state: CombatState, side: Side): string | null {
  const ops = card.effects.filter((o) => o.op === 'cleanse' && o.to === 'self');
  if (!ops.length) return null;
  const hero = state.sides[side].units.find((u) => u.kind === 'hero');
  if (!hero) return null;
  const names: Record<string, string> = { seared: 'Bleed', doom: 'Fate' };
  const changes = DEBUFFS.flatMap((st) => {
    const have = hero.statuses[st] ?? 0;
    if (!have) return [];
    let after = have;
    for (const op of ops)
      if (op.op === 'cleanse' && st !== 'fracture') {
        after -= op.all
          ? after
          : Math.min(after, Math.max(op.amount, Math.ceil((after * (op.pct ?? 0)) / 100)));
      }
    return [
      `${names[st] ?? st.charAt(0).toUpperCase() + st.slice(1)} ${have} → ${after}${st === 'fracture' ? ' (cannot be cleansed)' : ''}`,
    ];
  });
  return changes.length ? changes.join('; ') : 'No debuffs to cleanse.';
}
