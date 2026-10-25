// On a small screen the hero stands close to the potion belt, and a label above their head (the stance banner, a player's name tag in
// the Arena) would sit on top of it. After each draw the label is measured against the belt: if they touch, it slides right, just far
// enough to clear it.

import { useLayoutEffect, type RefObject } from 'react';

export function useClearOfBelt(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const belt = document.querySelector('.fight__potions');
    const shifted = parseFloat(el.style.marginLeft) || 0;
    if (!belt) {
      if (shifted) el.style.marginLeft = '';
      return;
    }
    const b = el.getBoundingClientRect();
    const p = belt.getBoundingClientRect();
    const touchesRow = b.top < p.bottom + 6 && b.bottom > p.top - 6;
    const natural = b.left - shifted; // where it would stand with no shift
    const need = touchesRow && natural < p.right + 8 ? p.right + 8 - natural : 0;
    if (Math.abs(need - shifted) > 0.5) el.style.marginLeft = need ? `${need}px` : '';
  });
}
