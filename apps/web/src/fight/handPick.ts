// A choice of cards from the hand (discard, Defer, Consume...) is made on the hand itself, with no window and no Confirm (DECISIONS #473).

import type { CombatDb, PendingView } from '@sr/combat';
import { ENCHANT_LOOK } from './enchantLook';
import { totemLook } from './totemLook';

/** Is this a choice among cards the player can see in the hand? Anything else (Foresee, the draw pile, totems) keeps the window. */
export function isHandPick(p: PendingView, hand: readonly string[]): boolean {
  if (p.kind === 'scry' || p.from === 'draw') return false;
  if (p.charges || p.spirits || p.forms) return false;
  return p.pool.length > 0 && p.pool.every((c) => hand.includes(c.id));
}

/** The cards of a discard that gain from it: one with Premeditate comes back next turn at 0 Mana. */
export function premeditateIn(p: PendingView, db: CombatDb): string[] {
  if (p.kind !== 'discard') return [];
  return p.pool.filter((c) => c.sly !== undefined || db.cards[c.card]?.sly).map((c) => c.id);
}

/** What a click on a card does: it is marked (or unmarked), and the choice is sent as soon as no more cards can be chosen. */
export function pickStep(
  chosen: readonly string[],
  id: string,
  p: { pool: readonly string[]; max: number },
): { chosen: string[]; submit: boolean } {
  if (!p.pool.includes(id)) return { chosen: [...chosen], submit: false };
  if (chosen.includes(id)) return { chosen: chosen.filter((x) => x !== id), submit: false };
  const next = [...chosen, id];
  return { chosen: next, submit: next.length >= p.max };
}

/** The sentence that asks for a choice. */
export function prompt(p: PendingView): string {
  if (p.kind === 'enchant')
    return `Your blade is full: choose the enchantment ${p.incoming ? ENCHANT_LOOK[p.incoming].name : 'the new one'} replaces.`;
  if (p.kind === 'discharge') return 'Choose the enchantment to discharge.';
  if (p.kind === 'recast') return 'Choose what your newest enchantment becomes.';
  if (p.kind === 'plantKind') return 'Choose the spirit to plant.';
  if (p.kind === 'commandPick') return 'Choose the totem whose spirit acts.';
  if (p.kind === 'form')
    return 'Choose a new form (your progress this turn starts again), or keep the one you are in.';
  if (p.kind === 'plantAt') {
    const nm = p.planting ? totemLook(p.planting).name : 'the totem';
    return p.min === 0
      ? `Your totems are all planted: choose the one ${article(nm)} ${nm} replaces, or keep them all.`
      : `Choose where to plant ${article(nm)} ${nm} (a totem there is replaced).`;
  }
  const many = p.max > 1 ? `${p.max} cards` : 'a card';
  // (the most a choice can take shrinks to the cards there are: "up to 1 card")
  const upTo = `${p.max} ${p.max > 1 ? 'cards' : 'card'}`;
  if (p.kind === 'scry') return 'Choose a card to draw. The rest are discarded.';
  if (p.kind === 'copy') return 'Choose a card: copies of it come to your hand next turn.';
  if (p.kind === 'defer')
    return p.min === 0
      ? `Defer up to ${upTo}: ${p.max > 1 ? 'they come' : 'it comes'} back next turn costing 1 less.`
      : `Choose ${many} to defer: ${p.max > 1 ? 'they come' : 'it comes'} back next turn costing 1 less.`;
  if (p.kind === 'topdeck' && p.from === 'draw')
    return `Choose ${many} from your draw pile to put on top of it.`;
  if (p.kind === 'topdeck') return `Put ${many} on top of your draw pile.`;
  if (p.kind === 'transform')
    return p.min === 0 ? `Transform up to ${upTo}.` : `Transform ${many}.`;
  const verb = p.kind === 'discard' ? 'Discard' : 'Consume';
  if (p.min === 0) return `${verb} up to ${upTo}.`;
  return `${verb} ${many}.`;
}

const article = (w: string): string => (/^[aeiou]/i.test(w) ? 'an' : 'a');
