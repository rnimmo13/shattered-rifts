// A card that has just been played, shown in the right-hand column by the discard pile so both players can read it: it appears, stays for a good
// while, then flies to the discard pile (your cards) or off toward the opponent's side (theirs). Several can be on show at once,
// each on its own clock. Pure presentation: the fight never waits for it.

import { useLayoutEffect, useRef } from 'react';
import type { CardDef, CombatDb } from '@sr/combat';
import { FightCard } from './FightCard';

export interface Flourish {
  id: number;
  def: CardDef;
  /** one of mine (it goes to my discard pile) or the opponent's */
  mine: boolean;
}

/** Milliseconds at normal speed: coming in, staying, and leaving. */
export const FLOURISH_IN = 320;
export const FLOURISH_HOLD = 1700;
export const FLOURISH_OUT = 650;

export function FlourishCard(props: {
  db: CombatDb;
  flourish: Flourish;
  width: number;
  /** the fight's speed setting (faster fights show the card for less time) */
  speed: number;
  /** sideways nudge so cards played close together do not sit exactly on top of each other */
  offset: number;
  onDone: (id: number) => void;
}) {
  const { flourish, speed, offset, onDone } = props;
  const inner = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const k = Math.max(0.4, speed);
    const tIn = (reduced ? 120 : FLOURISH_IN) / k;
    const tHold = FLOURISH_HOLD / k;
    const tOut = (reduced ? 200 : FLOURISH_OUT) / k;
    const total = tIn + tHold + tOut;
    // where it flies: to my discard pile on screen, or up and away toward the other side
    const here = el.getBoundingClientRect();
    const pile = flourish.mine ? document.querySelector('.pile--discard') : null;
    let dx = 280;
    let dy = -220;
    let end = 0.35;
    if (pile) {
      const p = pile.getBoundingClientRect();
      dx = p.left + p.width / 2 - (here.left + here.width / 2);
      dy = p.top + p.height / 2 - (here.top + here.height / 2);
      end = 0.18;
    }
    const rest = `translate(${offset}px, 0) scale(1)`;
    const anim = el.animate(
      [
        { opacity: 0, transform: `translate(${offset}px, 120px) scale(0.7)`, easing: 'ease-out' },
        { opacity: 1, transform: rest, offset: tIn / total },
        { opacity: 1, transform: rest, offset: (tIn + tHold) / total, easing: 'ease-in' },
        { opacity: 0.2, transform: `translate(${offset + dx}px, ${dy}px) scale(${end})` },
      ],
      { duration: total, fill: 'forwards' },
    );
    anim.onfinish = () => onDone(flourish.id);
    return () => anim.cancel();
    // (one animation per card: it is started once, when the card appears)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fight__flourish" aria-hidden>
      <div ref={inner} className="fight__flourishCard" style={{ opacity: 0 }}>
        <FightCard db={props.db} def={flourish.def} width={props.width} />
      </div>
    </div>
  );
}
