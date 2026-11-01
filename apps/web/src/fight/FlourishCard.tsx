// A card that has just been played, shown in the right-hand column by the discard pile so both players can read it: it appears, stays for a good
// while, then flies to the discard pile (your cards) or off toward the opponent's side (theirs). Several can be on show at once,
// each on its own clock. Pure presentation: the fight never waits for it.

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { CardDef, CombatDb } from '@sr/combat';
import { FightCard } from './FightCard';
import { bump, centreOf, flyCard, fxStill, playFx, trailBetween } from './fxPlayer';

export interface Flourish {
  id: number;
  def: CardDef;
  /** one of mine (it goes to my discard pile) or the opponent's */
  mine: boolean;
  /** the card instance, when it was played from a hand */
  card?: string;
  /** a Trap springing: it flips up as it appears */
  flip?: boolean;
  /** it is going to the Consumed pile: it burns up where it stands, and its embers go to the pile */
  burn?: boolean;
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
  const flight = useRef<Animation | null>(null);
  const leaveTimer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const reduced = fxStill();
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
    // (the sideways fan is on the wrapper, so it can move while the card is on show: see the return)
    const rest = 'translate(0px, 0) scale(1)';
    const anim = el.animate(
      [
        {
          opacity: 0,
          transform: flourish.flip && !reduced
            ? 'perspective(900px) rotateY(95deg) scale(0.9)'
            : 'translate(0px, 120px) scale(0.7)',
          easing: 'ease-out',
        },
        { opacity: 1, transform: rest, offset: tIn / total },
        { opacity: 1, transform: rest, offset: (tIn + tHold) / total, easing: 'ease-in' },
        { opacity: 0.2, transform: `translate(${dx}px, ${dy}px) scale(${end})` },
      ],
      { duration: total, fill: 'forwards' },
    );
    flight.current = anim;
    anim.onfinish = () => {
      if (pile) {
        bump(pile);
        const at = centreOf(pile);
        if (at) playFx('card-arrive', at, { size: 130, dur: 360 });
      }
      onDone(flourish.id);
    };
    // (a dust trail as it goes: only if it is really going to the pile)
    if (pile && !reduced)
      leaveTimer.current = window.setTimeout(() => {
        const a = centreOf(el);
        const b = centreOf(pile);
        if (!a || !b) return;
        trailBetween('trail-discard', a, b, FLOURISH_OUT);
      }, tIn + tHold);
    return () => {
      window.clearTimeout(leaveTimer.current);
      anim.cancel();
    };
    // (one animation per card: it is started once, when the card appears)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the card burns up where it stands (the frame holds it for a moment, then it is gone), and the embers settle on the pile
  useEffect(() => {
    if (!flourish.burn) return;
    window.clearTimeout(leaveTimer.current);
    const el = inner.current;
    const anim = flight.current;
    if (!el || !anim) return;
    const at = centreOf(el);
    const k = Math.max(0.4, speed);
    if (at) playFx('card-burn', at, { size: el.offsetWidth * 1.5, dur: 620 });
    // (it stays where it is, even if it had already set off for the discard pile)
    anim.onfinish = null;
    anim.pause();
    const pile =
      document.querySelector('.pile--exhaust') ?? document.querySelector('.pile--discard');
    const out = el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 320 / k,
      delay: 120 / k,
      fill: 'forwards',
    });
    out.onfinish = () => {
      const to = centreOf(pile);
      if (at && to) flyCard(at, to, { dur: 300, size: 14, arc: 40, onArrive: () => bump(pile) });
      onDone(flourish.id);
    };
    return () => out.cancel();
    // (the burn starts once)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flourish.burn]);

  return (
    // older cards slide aside as newer ones arrive (the wrapper's translate follows the offset; the card's own animation is a transform)
    <div
      className="fight__flourish"
      aria-hidden
      style={{ translate: `${offset}px 0`, transition: 'translate 200ms ease-out' }}
    >
      <div ref={inner} className="fight__flourishCard" style={{ opacity: 0 }}>
        <FightCard db={props.db} def={flourish.def} width={props.width} />
      </div>
    </div>
  );
}
