// The hand: a fan of cards along the bottom. Hover lifts a card; click or drag plays it. A card with no target (or only
// one legal target) plays as soon as you release it above the hand: no arrow, no menus. A card with several possible
// targets is dropped on one, or clicked and then aimed with the pointer.

import { AimArrow } from './AimArrow';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CardDef, CardInst, CombatDb, LiveDamage } from '@sr/combat';
import { fanLayout, HAND_SINK } from '../hand/fanLayout';
import { FightCard } from './FightCard';

export interface HandCard {
  inst: CardInst;
  def: CardDef;
  /** affordable and has a legal target right now */
  playable: boolean;
  /** unit ids it may target (empty = it takes no target) */
  targets: string[];
  /** each smallest set of companions that could be released (scrapped) to make room, when the card's summons do not fit */
  releases: string[][];
  /** aim it by hand even when only one target is legal (a card that does something drastic to one of your allies) */
  aim?: boolean;
  /** what it costs now (a cost change or Unbound), when different from the printed one */
  cost?: number;
}

const needsAim = (c: HandCard): boolean => c.aim === true || c.targets.length > 1;

/** The keywords another card gave this copy in the fight (Wraith Strike, Bone Snap, Echo of the Dead), for its text. */
function instNote(inst: CardInst, def: CardDef): string | null {
  const parts: string[] = [];
  if (inst.ethereal && !def.ethereal) parts.push('Fleeting.');
  if (inst.retain && !def.retain) parts.push('Hold.');
  if (inst.replay) parts.push(`Replay ${inst.replay}.`);
  return parts.length ? parts.join(' ') : null;
}

export interface FightHandProps {
  db: CombatDb;
  cards: HandCard[];
  /** what each card would really deal right now, by card instance (see previewCardDamage) */
  live?: ReadonlyMap<string, ReadonlyMap<number, LiveDamage>>;
  cardWidth: number;
  /** nothing can be played (enemy turn, animations that must finish, game over) */
  locked: boolean;
  /** the card currently chosen for aiming, if any */
  selectedId: string | null;
  /** unit id under a client point, or null */
  unitAt: (clientX: number, clientY: number, among?: ReadonlySet<string>) => string | null;
  onPlay: (card: HandCard, target: string | null) => void;
  onSelect: (card: HandCard | null) => void;
  /** highlight these units while a card is being dragged (null = none) */
  onDragTargets: (ids: ReadonlySet<string> | null, card?: HandCard | null) => void;
  onRefuse: (card: HandCard) => void;
  /** the card under the pointer (or null), and where it rests, so a tooltip can sit beside it */
  onHover: (card: HandCard | null, rect?: DOMRect) => void;
  /** the centre (client px) of the figure the card is aimed at, for the arrow to lock onto */
  lockAt?: { x: number; y: number } | null;
}

interface Drag {
  id: string;
  x: number;
  y: number;
  moved: boolean;
  startX: number;
  startY: number;
}

/**
 * How far in from each side of the screen the corner widgets (Mana and the draw pile, End turn and the discard pile, the battle log) reach
 * into the hand's band. The fan keeps inside this, so a full hand is not hidden under them.
 */
function cornerReserve(handHeight: number): number {
  const mid = window.innerWidth / 2;
  const top = window.innerHeight - handHeight;
  let reserve = 0;
  for (const el of document.querySelectorAll(
    '.fight__mana, .fight__potions, .fight__end, .pile, .fight__log',
  )) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.bottom < top) continue; // (not drawn, or above the hand)
    reserve = Math.max(reserve, r.left + r.width / 2 < mid ? r.right : window.innerWidth - r.left);
  }
  // (a little room beyond the widget: the end cards of the fan lean outwards)
  return reserve > 0 ? reserve + handHeight * 0.18 : 0;
}

export function FightHand(p: FightHandProps) {
  const [hovered, setHover] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  /** each card's invisible stand-in, for the rect a tooltip sits beside */
  const hitRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** where the cards rest (x from the hand's centre) and how wide they are, for the pointer test */
  const restRef = useRef<{ xs: number[]; w: number; pitch: number }>({ xs: [], w: 0, pitch: 0 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  /** on a touch screen a first tap only lifts a card to read it; the card previewed this way plays on the next tap */
  const previewRef = useRef<string | null>(null);
  const propsRef = useRef(p);
  useEffect(() => {
    propsRef.current = p;
  });

  // a previewed card is forgotten when the hand changes or can no longer be played
  useEffect(() => {
    previewRef.current = null;
  }, [p.cards, p.locked]);

  // tapping anywhere but the hand puts a previewed card back
  useEffect(() => {
    const away = (e: PointerEvent): void => {
      if (previewRef.current === null) return;
      if ((e.target as HTMLElement | null)?.closest('.fhand__hit')) return;
      previewRef.current = null;
      setHover(null);
      propsRef.current.onHover(null);
    };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  }, []);

  const n = p.cards.length;
  // (a hand that shrinks under the hovered card lets it go)
  const hover = hovered !== null && hovered < n ? hovered : null;
  const focusIdx = drag
    ? p.cards.findIndex((c) => c.inst.id === drag.id)
    : p.selectedId
      ? p.cards.findIndex((c) => c.inst.id === p.selectedId)
      : hover;
  // the widest the fan may spread: not past the corner widgets (but never so tight that the cards pile onto one another)
  // (a side never gives up more than a quarter of the screen, and the fan is never squeezed below three card widths)
  const reserve = Math.min(cornerReserve(p.cardWidth * 1.4 + 10), window.innerWidth * 0.25);
  const clear = window.innerWidth - 2 * reserve - p.cardWidth;
  const layout = {
    cardWidth: p.cardWidth,
    maxSpread: Math.max(
      p.cardWidth * 3,
      Math.min(window.innerWidth * 0.72, p.cardWidth * 0.8 * 9, clear),
    ),
  };
  const slots = fanLayout(n, {
    ...layout,
    focus: drag ? null : focusIdx !== null && focusIdx >= 0 ? focusIdx : null,
  });
  // where each card rests when nothing is lifted: the pointer is tested against THIS, so a card that lifts or grows
  // never moves out from under the pointer (which made it twitch up and down)
  const rest = fanLayout(n, { ...layout, focus: null });
  const restNow = {
    xs: rest.map((r) => r.x),
    w: p.cardWidth,
    pitch:
      rest.length > 1
        ? Math.abs((rest[1] as { x: number }).x - (rest[0] as { x: number }).x)
        : p.cardWidth,
  };
  useEffect(() => {
    hoverRef.current = hover;
    restRef.current = restNow;
  });

  // (DECISIONS #444) a mouse hovers the card whose resting centre is nearest along the fan, not whichever tilted, overlapping box
  // the pointer is in: the lifted card no longer holds on past its own edge, and a neighbour takes over at the midpoint between
  // them (with a little slack so the hover does not flicker on the line). The lifted card's raised top still counts as on it.
  useEffect(() => {
    const onMove = (e: PointerEvent): void => {
      if (e.pointerType === 'touch' || dragRef.current) return;
      const { xs, w, pitch } = restRef.current;
      const cur = hoverRef.current;
      let next: number | null = null;
      if (xs.length > 0) {
        const x = e.clientX - window.innerWidth / 2;
        const h = w * 1.4;
        const bandTop = window.innerHeight - h * 0.97;
        // the lifted card reaches higher, over its own width only
        const liftTop = window.innerHeight - h * 1.75;
        const curX = cur !== null ? xs[cur] : undefined;
        const onLifted =
          curX !== undefined && e.clientY >= liftTop && Math.abs(x - curX) <= (w * 1.28) / 2;
        const inFan =
          e.clientY >= bandTop &&
          x >= (xs[0] as number) - w / 2 &&
          x <= (xs[xs.length - 1] as number) + w / 2;
        if (inFan) {
          let best = 0;
          for (let i = 1; i < xs.length; i++)
            if (Math.abs(x - (xs[i] as number)) < Math.abs(x - (xs[best] as number))) best = i;
          next =
            curX !== undefined &&
            Math.abs(x - curX) <= Math.abs(x - (xs[best] as number)) + pitch * 0.12
              ? cur
              : best;
        } else if (onLifted) next = cur;
      }
      if (next === cur) return;
      setHover(next);
      const pr = propsRef.current;
      const c = next !== null ? pr.cards[next] : undefined;
      if (c) pr.onHover(c, hitRefs.current[next as number]?.getBoundingClientRect());
      else pr.onHover(null);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // (the top of the resting hand: a card let go above it plays, and an aimed card turns into the arrow there, DECISIONS #444)
  const handTop = window.innerHeight - p.cardWidth * 1.35;
  const aboveHand = (y: number): boolean => y < handTop;
  /**
   * A card that is aimed (several targets), dragged up out of the hand towards the enemies, turns into the targeting arrow: the
   * card waits, lifted, above its place, and an arrow runs from it to the pointer, so the figure under the pointer is plain to see.
   */
  // (it waited until nearly two card heights up before, so the arrow came late)
  const aimLine = handTop;
  const aimingCard = (() => {
    if (!drag?.moved || drag.y >= aimLine) return null;
    const c = p.cards.find((x) => x.inst.id === drag.id);
    return c && c.playable && needsAim(c) ? c : null;
  })();

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
        if (e.pointerType === 'touch' && previewRef.current !== c.inst.id) {
          // (a finger hides what it touches: the first tap lifts the card and shows it, tapping it again plays it)
          previewRef.current = c.inst.id;
          return;
        }
        previewRef.current = null;
        if (!c.playable) return pr.onRefuse(c);
        if (!needsAim(c)) return pr.onPlay(c, c.targets[0] ?? null);
        return pr.onSelect(pr.selectedId === c.inst.id ? null : c);
      }
      if (!aboveHand(e.clientY)) return; // dropped back on the hand: cancel
      if (!c.playable) return pr.onRefuse(c);
      if (!needsAim(c)) return pr.onPlay(c, c.targets[0] ?? null);
      const over = pr.unitAt(e.clientX, e.clientY, new Set(c.targets));
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
    <div
      className={`fhand${focusIdx !== null && focusIdx >= 0 ? ' is-focused' : ''}`}
      style={{ '--cw': `${w}px` } as CSSProperties}
    >
      {p.cards.map((c, i) => {
        const s = slots[i];
        const r0 = rest[i];
        if (!s || !r0) return null;
        const dragging = drag?.id === c.inst.id && drag.moved;
        const sel = p.selectedId === c.inst.id;
        const style: CSSProperties = {
          width: w,
          height: w * 1.4,
          zIndex: dragging ? 500 : s.z,
          transform: `translate(calc(-50% + ${s.x}px), ${s.y + w * HAND_SINK}px) rotate(${s.rot}deg) scale(${s.scale})`,
        };
        if (dragging && drag && aimingCard?.inst.id === c.inst.id) {
          // aiming: the card waits above where it was picked up, and the arrow does the pointing
          style.position = 'fixed';
          style.left = drag.startX;
          style.top = window.innerHeight - w * 1.4 * 0.95;
          style.bottom = 'auto';
          style.transform = 'translate(-50%, -50%) scale(1.12) rotate(0deg)';
          style.transition = 'left 0.12s, top 0.12s';
          style.pointerEvents = 'none';
        } else if (dragging && drag) {
          style.position = 'fixed';
          style.left = drag.x;
          style.top = drag.y;
          style.bottom = 'auto';
          style.transform = 'translate(-50%, -50%) scale(1.12) rotate(0deg)';
          style.transition = 'none';
          style.pointerEvents = 'none';
        }
        // an invisible stand-in at the resting spot takes the pointer; the card you see just follows the layout
        const hitStyle: CSSProperties = {
          width: w,
          height: w * 1.4,
          zIndex: hover === i ? 300 : r0.z,
          transform: `translate(calc(-50% + ${r0.x}px), ${r0.y + w * HAND_SINK}px) rotate(${r0.rot}deg)`,
        };
        return (
          <div key={c.inst.id} className="fhand__pair">
            <div
              className={`fhand__slot${dragging ? ' is-dragging' : ''}${sel ? ' is-selected' : ''}${c.playable && !p.locked ? ' is-playable' : ''}`}
              style={style}
            >
              <FightCard
                db={p.db}
                def={c.def}
                width={w}
                playable={c.playable && !p.locked}
                dimmed={!c.playable}
                {...(c.inst.bonus ? { bonus: c.inst.bonus } : {})}
                {...(c.cost !== undefined && c.cost !== c.def.cost ? { cost: c.cost } : {})}
                {...(p.live?.has(c.inst.id) ? { live: p.live.get(c.inst.id)! } : {})}
                {...(instNote(c.inst, c.def) ? { note: instNote(c.inst, c.def)! } : {})}
              />
            </div>
            <div
              className={`fhand__hit${dragging ? ' is-dragging' : ''}`}
              style={dragging ? { ...hitStyle, pointerEvents: 'none' } : hitStyle}
              ref={(el) => {
                hitRefs.current[i] = el;
              }}
              onPointerEnter={(e) => {
                // (a mouse's hover follows the pointer along the fan, above; a finger lifts the card it touches)
                if (e.pointerType !== 'touch') return;
                setHover(i);
                p.onHover(c, e.currentTarget.getBoundingClientRect());
              }}
              onPointerLeave={(e) => {
                // a finger leaves the moment it lifts: the card it chose stays lifted until the player taps elsewhere
                if (e.pointerType !== 'touch' || previewRef.current === c.inst.id) return;
                setHover((h) => (h === i ? null : h));
                p.onHover(null);
              }}
              onPointerDown={(e) => {
                if (p.locked || e.button !== 0) return;
                e.preventDefault();
                // a mouse picks up the card that is lifted, whichever stand-in is under the pointer
                const picked =
                  e.pointerType !== 'touch' && hover !== null ? (p.cards[hover] ?? c) : c;
                const d: Drag = {
                  id: picked.inst.id,
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
              {hover === i && !drag && <span className="fhand__zone" aria-hidden />}
            </div>
          </div>
        );
      })}
      {aimingCard && drag && (
        <AimArrow
          className="fhand__arrow"
          from={{ x: drag.startX, y: window.innerHeight - w * 1.4 * 1.5 }}
          to={{ x: drag.x, y: drag.y }}
          lock={p.lockAt ?? null}
        />
      )}
    </div>
  );
}
