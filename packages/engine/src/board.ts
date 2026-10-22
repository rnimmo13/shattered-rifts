// Board maintenance that depends on statics: variable backrow size (Rift: The Hollow Veil).

import { emit, moveCard, player, type Rt } from './rt';
import { liveStatics } from './stats';

/** Grows or shrinks each backrow to its slot count; cards in removed slots are destroyed. */
export function syncBackrow(rt: Rt): void {
  for (const p of [0, 1] as const) {
    let want = rt.s.rules.backrowSlots;
    for (const st of liveStatics(rt)) {
      if (st.controller === p && st.modifier.type === 'backrowSlots') {
        want = Math.max(want, st.modifier.total);
      }
    }
    const ps = player(rt, p);
    while (ps.backrow.length < want) ps.backrow.push(null);
    while (ps.backrow.length > want) {
      const id = ps.backrow[ps.backrow.length - 1];
      const c = id ? rt.s.cards[id] : undefined;
      const free = ps.backrow.findIndex((x, i) => i < want && x === null);
      if (id && c && free >= 0) {
        ps.backrow[free] = id; // a slot is free: the card shifts over instead of being destroyed
      } else if (id && c) {
        const cardId = c.cardId;
        moveCard(rt, id, 'void');
        emit(rt, { type: 'cardDestroyed', id, cardId, player: p });
      }
      ps.backrow.pop();
    }
  }
}
