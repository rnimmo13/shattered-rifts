import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardDef } from '@sr/engine';
import { Card } from '../cards/Card';
import { fanLayout } from './fanLayout';
import { isPlayable } from './dropRules';
import { TargetingArrow, type ArrowState } from './TargetingArrow';
import type { Point } from './arrowGeometry';
import './hand.css';

export interface HandCard {
  uid: string;
  def: CardDef;
}

export interface Probe {
  valid: boolean;
  /** where the arrow should land (a slot centre, client px) */
  snap?: Point;
}

export interface HandProps {
  cards: readonly HandCard[];
  mana: number;
  /** is this point a valid drop for this card? (the scene hit-tests; the engine decides rules later) */
  probe: (def: CardDef, x: number, y: number) => Probe;
  onDragStart?: (def: CardDef) => void;
  onDragEnd?: () => void;
  onPlay: (card: HandCard, x: number, y: number) => void;
  /** called when the player tries to drag a card they can't afford */
  onRefuse?: (card: HandCard) => void;
  /** sound hook stubs (wired in the juice pass) */
  onSound?: (name: 'hover' | 'pickup' | 'drop' | 'refuse' | 'deal') => void;
}

/** How far above the hand a dragged card must travel before it "arms" and becomes an arrow origin. */
const ARM_RISE = 150;

function useCardWidth(): number {
  const [w, setW] = useState(() => calc());
  useEffect(() => {
    const on = () => setW(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}
const calc = () => Math.round(Math.max(130, Math.min(230, window.innerWidth * 0.115)));

export function Hand(props: HandProps) {
  const { cards, mana, probe, onPlay, onRefuse, onDragStart, onDragEnd, onSound } = props;
  const cardW = useCardWidth();
  const anchor = useRef<HTMLDivElement>(null);
  const elOf = (uid: string) =>
    anchor.current?.querySelector<HTMLElement>(`[data-uid="${uid}"] .card`) ?? null;
  const dragRef = useRef(false);
  const endRef = useRef(onDragEnd);
  const [hover, setHover] = useState<string | null>(null);
  const [dragState, setDrag] = useState<{
    uid: string;
    x: number;
    y: number;
    armed: boolean;
    origin: Point;
  } | null>(null);
  const drag = dragState && cards.some((c) => c.uid === dragState.uid) ? dragState : null;
  const [arrowState, setArrow] = useState<{ from: Point; to: Point; state: ArrowState } | null>(
    null,
  );
  const [entered, setEntered] = useState<ReadonlySet<string>>(new Set());
  const [refuse, setRefuse] = useState<string | null>(null);

  // deal-in: each new card flies up from below, staggered
  useEffect(() => {
    const fresh = cards.filter((c) => !entered.has(c.uid));
    if (fresh.length === 0) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers = fresh.map((c, i) =>
      window.setTimeout(
        () => {
          setEntered((prev) => new Set(prev).add(c.uid));
          onSound?.('deal');
        },
        reduce ? 0 : 60 + i * 90,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [cards, entered, onSound]);

  useEffect(() => {
    endRef.current = onDragEnd;
    dragRef.current = drag !== null;
  });
  // a dragged card that vanishes (re-deal) or an unmount mid-drag must not leave the scene lit
  useEffect(() => {
    if (dragState && !drag) onDragEnd?.();
  }, [dragState, drag, onDragEnd]);
  useEffect(
    () => () => {
      if (dragRef.current) endRef.current?.();
    },
    [],
  );

  const focusUid = drag ? drag.uid : hover;
  const focusIdx = focusUid ? cards.findIndex((c) => c.uid === focusUid) : -1;
  const layout = useMemo(
    () =>
      fanLayout(cards.length, {
        cardWidth: cardW,
        maxSpread: Math.min(window.innerWidth * 0.62, cardW * 6.4),
        focus: drag?.armed ? null : focusIdx >= 0 ? focusIdx : null,
      }),
    [cards.length, cardW, focusIdx, drag?.armed],
  );

  const originOf = useCallback((): Point => {
    const r = anchor.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.bottom } : { x: 0, y: 0 };
  }, []);

  // tilt toward the cursor (3D perspective) + light position for the foil
  const tilt = (uid: string, e: React.PointerEvent) => {
    const el = elOf(uid);
    if (!el || drag) return;
    const r = el.getBoundingClientRect();
    const mx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const my = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    el.style.setProperty('--mx', mx.toFixed(3));
    el.style.setProperty('--my', my.toFixed(3));
    el.style.transform = `perspective(700px) rotateX(${((0.5 - my) * 16).toFixed(2)}deg) rotateY(${((mx - 0.5) * 18).toFixed(2)}deg)`;
  };
  const untilt = (uid: string) => {
    const el = elOf(uid);
    if (!el) return;
    el.style.setProperty('--mx', '0.5');
    el.style.setProperty('--my', '0.5');
    el.style.transform = '';
  };

  const startDrag = (card: HandCard, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!isPlayable(card.def, mana)) {
      setRefuse(card.uid);
      onRefuse?.(card);
      onSound?.('refuse');
      window.setTimeout(() => setRefuse((u) => (u === card.uid ? null : u)), 380);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    untilt(card.uid);
    setDrag({ uid: card.uid, x: e.clientX, y: e.clientY, armed: false, origin: originOf() });
    onDragStart?.(card.def);
    onSound?.('pickup');
  };

  const moveDrag = (card: HandCard, e: React.PointerEvent) => {
    if (!drag || drag.uid !== card.uid) return tilt(card.uid, e);
    const o = drag.origin;
    const armed = drag.armed || o.y - e.clientY > ARM_RISE + cardW * 0.4;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, armed });
    if (armed) {
      const p = probe(card.def, e.clientX, e.clientY);
      const from: Point = { x: o.x, y: o.y - cardW * 1.55 };
      setArrow({
        from,
        to: p.valid && p.snap ? p.snap : { x: e.clientX, y: e.clientY },
        state: p.valid ? 'valid' : 'invalid',
      });
    } else setArrow(null);
  };

  const endDrag = (card: HandCard, e: React.PointerEvent, cancelled = false) => {
    if (!drag || drag.uid !== card.uid) return;
    const wasArmed = drag.armed;
    setDrag(null);
    setArrow(null);
    onDragEnd?.();
    if (!cancelled && wasArmed && probe(card.def, e.clientX, e.clientY).valid) {
      onSound?.('drop');
      onPlay(card, e.clientX, e.clientY);
    }
  };

  const o = drag?.origin ?? { x: 0, y: 0 };
  return (
    <>
      <div className="hand" ref={anchor} style={{ height: cardW * 1.4 }}>
        {cards.map((card, i) => {
          const s = layout[i];
          if (!s) return null;
          const dragging = drag?.uid === card.uid;
          const isIn = entered.has(card.uid);
          // the dragged card follows the cursor until armed, then parks above the hand as the arrow's origin
          let x = s.x;
          let y = s.y;
          let rot = s.rot;
          let scale = s.scale;
          if (dragging) {
            if (drag.armed) {
              x = 0;
              y = -cardW * 1.55 + cardW * 0.7;
              rot = 0;
              scale = 0.78;
            } else {
              x = drag.x - o.x;
              y = drag.y - o.y + cardW * 0.7;
              rot = 0;
              scale = 1.12;
            }
          }
          if (!isIn) {
            x = 0;
            y = cardW * 1.4;
            rot = 0;
            scale = 0.5;
          }
          const playable = isPlayable(card.def, mana);
          return (
            <div
              key={card.uid}
              data-uid={card.uid}
              role="button"
              tabIndex={0}
              aria-label={`${card.def.name}, cost ${card.def.cost}${playable ? '' : ', not enough Mana'}`}
              aria-disabled={!playable}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && playable) {
                  e.preventDefault();
                  onSound?.('drop');
                  onPlay(card, 0, 0);
                }
              }}
              className={`hand__slot${dragging ? ' is-dragging' : ''}${refuse === card.uid ? ' is-refused' : ''}${isIn ? '' : ' is-dealing'}`}
              style={{
                width: cardW,
                transform: `translate(calc(-50% + ${x}px), ${y}px) rotate(${rot}deg) scale(${scale})`,
                zIndex: dragging ? 200 : s.z,
                opacity: isIn ? 1 : 0,
              }}
              onPointerEnter={() => {
                if (drag) return;
                setHover(card.uid);
                onSound?.('hover');
              }}
              onPointerLeave={() => {
                setHover((h) => (h === card.uid ? null : h));
                if (!dragging) untilt(card.uid);
              }}
              onPointerDown={(e) => startDrag(card, e)}
              onPointerMove={(e) => moveDrag(card, e)}
              onPointerUp={(e) => endDrag(card, e)}
              onPointerCancel={(e) => endDrag(card, e, true)}
            >
              <Card def={card.def} width={cardW} playable={playable} dimmed={!playable} />
            </div>
          );
        })}
      </div>
      {drag && arrowState && <TargetingArrow {...arrowState} />}
    </>
  );
}
