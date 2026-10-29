// The Spellblade's Obsidian Blade on the battle screen (DECISIONS #417): its two enchantment positions, in a panel of their own in that
// side's column, oldest first. Each shows its kind as a mark and a word (it reads without colour), an empty one a dotted ring. The card
// being aimed shows what it would do to them. Presentation only: the enchantments come from the combat view.

import type { Enchant } from '@sr/combat';
import { tipAttrs } from '../ui/tip';

export const ENCHANT_LOOK: Record<Enchant, { glyph: string; name: string; text: string }> = {
  ember: {
    glyph: '♨',
    name: 'Ember',
    text: 'When discharged: the attack deals 3 more damage on its first hit.',
  },
  glass: {
    glyph: '◇',
    name: 'Glass',
    text: 'When discharged: once the attack is done, 2 damage to every enemy (a shard, not an attack).',
  },
  ward: { glyph: '⛨', name: 'Ward', text: 'When discharged: gain 3 Barrier at once.' },
};

export function EnchantSlots(props: {
  enchants: readonly Enchant[];
  /** what the card under the pointer would do: discharge one or both, or imbue a kind */
  preview?: { discharge?: 1 | 2; imbue?: Enchant[] } | null;
}) {
  const slots = [props.enchants[0] ?? null, props.enchants[1] ?? null];
  const spends = props.preview?.discharge ?? 0;
  return (
    <div
      className="enchants"
      role="group"
      aria-label={`Obsidian Blade: ${props.enchants.length ? props.enchants.map((k) => ENCHANT_LOOK[k].name).join(' and ') : 'no enchantments'}`}
      {...tipAttrs({
        kicker: 'Obsidian Blade',
        title: `${props.enchants.length} of 2 enchantments`,
        text: 'Spells Imbue an enchantment (with both positions taken, you choose which one it replaces). Blade attacks Discharge them: Ember adds 3 to the first hit, Glass breaks for 2 on every enemy after the attack, Ward gives 3 Barrier. They last until spent or the fight ends.',
      })}
    >
      {slots.map((k, i) => {
        // (a discharge of both, or of the one there is, spends this; a discharge of one with two different asks)
        const spent = !!k && (spends >= 2 || (spends === 1 && props.enchants.length === 1));
        return (
          <span
            key={i}
            className={`enchant${k ? ` enchant--${k}` : ' is-empty'}${spent ? ' is-spent' : ''}`}
            {...(k
              ? tipAttrs({
                  kicker: 'Enchantment',
                  title: ENCHANT_LOOK[k].name,
                  text: ENCHANT_LOOK[k].text,
                })
              : {})}
          >
            <b aria-hidden="true">{k ? ENCHANT_LOOK[k].glyph : '·'}</b>
            <small>{k ? ENCHANT_LOOK[k].name : 'empty'}</small>
          </span>
        );
      })}
    </div>
  );
}
