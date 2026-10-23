// The hand: a fan of cards along the bottom. Hover lifts a card; click or drag plays it. A card with no target (or only
// one legal target) plays as soon as you release it above the hand: no arrow, no menus. A card with several possible
// targets is dropped on one, or clicked and then aimed with the pointer.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CardDef, CardInst, CombatDb } from '@sr/combat';
import { fanLayout, HAND_SINK } from '../hand/fanLayout';
import { FightCard } from './FightCard';

export interface HandCard {
  inst: CardInst;
  def: CardDef;
  /** affordable and has a legal target right now */
  playable: boolean;
  /** unit ids it may target (empty = it takes no target) */
  targets: string[];
  /** aim it by hand even when only one target is legal (a card that does something drastic to one of your allies) */
  aim?: boolean;
}

const needsAim = (c: HandCard): boolean => c.aim === true || c.targets.length > 1;

export interface FightHandProps {
  db: CombatDb;
  cards: HandCard[];
  cardWidth: number;
  /** nothing can be played (enemy turn, animations that must finish, game over) */
  locked: boolean;
  /** the card currently chosen for aiming, if any */
  selectedId: string | null;
  /** unit id under a client point, or null */
  unitAt: (clientX: number, clientY: number) => string | null;
  onPlay: (card: HandCard, target: string | null) => void;
  onSelect: (card: HandCard | null) => void;
  /** highlight these units while a card is being dragged (null = none) */
  onDragTargets: (ids: ReadonlySet<string> | null, card?: HandCard | null) => void;
  onRefuse: (card: HandCard) => void;
  onHover: (card: HandCard | null) => void;
}

interface Drag {
  id: string;
  x: number;
  y: number;
  moved: boolean;
  startX: number;
  startY: number;
}

export function FightHand(p: FightHandProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const propsRef = useRef(p);
  useEffect(() => {
    propsRef.current = p;
  });

  const n = p.cards.length;
  const focusIdx = drag
    ? p.cards.findIndex((c) => c.inst.id === drag.id)
    : p.selectedId
      ? p.cards.findIndex((c) => c.inst.id === p.selectedId)
      : hover;
  const slots = fanLayout(n, {
    cardWidth: p.cardWidth,
    maxSpread: Math.min(window.innerWidth * 0.72, p.cardWidth * 0.8 * 9),
    focus: drag ? null : focusIdx !== null && focusIdx >= 0 ? focusIdx : null,
  });

  const aboveHand = (y: number): boolean => y < window.innerHeight - p.cardWidth * 1.5;

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const moved = d.moved || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 7;
      const nd = { ...d, x: e.clientX, y: e.clientY, moved };
      dragRef.current = nd;
      setDrag(nd);
      if (moved && !d.moved) {
        const c = propsRef.current.cards.find((x) => x.inst.id === d.id);
        if (c) propsRef.current.onDragTargets(new Set(c.targets), c);
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      propsRef.current.onDragTargets(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      if (!d) return;
      const pr = propsRef.current;
      const c = pr.cards.find((x) => x.inst.id === d.id);
      if (!c) return;
      if (!d.moved) {
        // a click
        if (!c.playable) return pr.onRefuse(c);
        if (!needsAim(c)) return pr.onPlay(c, c.targets[0] ?? null);
        return pr.onSelect(pr.selectedId === c.inst.id ? null : c);
      }
      if (!aboveHand(e.clientY)) return; // dropped back on the hand: cancel
      if (!c.playable) return pr.onRefuse(c);
      if (!needsAim(c)) return pr.onPlay(c, c.targets[0] ?? null);
      const over = pr.unitAt(e.clientX, e.clientY);
      if (over && c.targets.includes(over)) return pr.onPlay(c, over);
      pr.onSelect(c); // dropped in the open with several targets: go on to aim it
    };
    const onCancel = () => {
      dragRef.current = null;
      setDrag(null);
      propsRef.current.onDragTargets(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
    // the handlers read everything through refs; only the start of a drag should (re)bind them
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  const w = p.cardWidth;
  return (
    <div className="fhand" style={{ '--cw': `${w}px` } as CSSProperties}>
      {p.cards.map((c, i) => {
        const s = slots[i];
        if (!s) return null;
        const dragging = drag?.id === c.inst.id && drag.moved;
        const sel = p.selectedId === c.inst.id;
        const style: CSSProperties = {
          width: w,
          height: w * 1.4,
          zIndex: dragging ? 500 : s.z,
          transform: `translate(calc(-50% + ${s.x}px), ${s.y + w * HAND_SINK}px) rotate(${s.rot}deg) scale(${s.scale})`,
        };
        if (dragging && drag) {
          style.position = 'fixed';
          style.left = drag.x;
          style.top = drag.y;
          style.bottom = 'auto';
          style.transform = 'translate(-50%, -50%) scale(1.12) rotate(0deg)';
          style.transition = 'none';
          style.pointerEvents = 'none';
        }
        return (
          <div
            key={c.inst.id}
            className={`fhand__slot${dragging ? ' is-dragging' : ''}${sel ? ' is-selected' : ''}${c.playable && !p.locked ? ' is-playable' : ''}`}
            style={style}
            onPointerEnter={() => {
              setHover(i);
              p.onHover(c);
            }}
            onPointerLeave={() => {
              setHover((h) => (h === i ? null : h));
              p.onHover(null);
            }}
            onPointerDown={(e) => {
              if (p.locked || e.button !== 0) return;
              e.preventDefault();
              const d: Drag = {
                id: c.inst.id,
                x: e.clientX,
                y: e.clientY,
                moved: false,
                startX: e.clientX,
                startY: e.clientY,
              };
              dragRef.current = d;
              setDrag(d);
            }}
          >
            <FightCard
              db={p.db}
              def={c.def}
              width={w}
              playable={c.playable && !p.locked}
              dimmed={!c.playable}
              {...(c.inst.bonus ? { bonus: c.inst.bonus } : {})}
            />
          </div>
        );
      })}
    </div>
  );
}
