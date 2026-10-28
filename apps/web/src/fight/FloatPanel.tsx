// A battle-screen panel the player can move, resize and fold (the Auras lists, the battle log). It starts where the screen's own
// layout puts it; dragged by its title bar it floats where it is dropped (fixed to the window, kept on screen), and the corner
// resizes it. Where it was left is remembered in this browser only; a double-click on the title bar puts it back. Presentation
// only: nothing here touches the game.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/** Where a moved panel sits: its top left as a share of the window (so it stays on screen at any size), and its size in px. */
interface Spot {
  fx: number;
  fy: number;
  w?: number;
  h?: number;
  folded?: boolean;
}

const KEY = (id: string): string => `sr.panel.${id}`;

function load(id: string): Spot | null {
  try {
    const raw = localStorage.getItem(KEY(id));
    return raw ? (JSON.parse(raw) as Spot) : null;
  } catch {
    return null;
  }
}
function save(id: string, spot: Spot | null): void {
  try {
    if (spot) localStorage.setItem(KEY(id), JSON.stringify(spot));
    else localStorage.removeItem(KEY(id));
  } catch {
    /* (private window, or storage blocked: the panel just forgets) */
  }
}

export function FloatPanel(props: {
  /** remembered by this name */
  id: string;
  title: ReactNode;
  /** the class the panel wears where it starts (its place in the screen's layout) */
  className?: string;
  /** something to the right of the title (a button) */
  extra?: ReactNode;
  /** folded when first shown (the player's own choice is remembered after) */
  startFolded?: boolean;
  children: ReactNode;
}) {
  const [spot, setSpot] = useState<Spot | null>(() => load(props.id));
  const [folded, setFolded] = useState<boolean>(
    () => load(props.id)?.folded ?? !!props.startFolded,
  );
  const box = useRef<HTMLElement>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  /** the press that just ended moved the panel: its click must not fold it */
  const dragged = useRef(false);
  /** where the drag has got to (the render's `spot` can be one move behind) */
  const latest = useRef<Spot | null>(null);

  const keep = useCallback(
    (next: Spot | null, fold = folded): void => {
      setSpot(next);
      save(
        props.id,
        next ? { ...next, folded: fold } : fold ? { fx: -1, fy: -1, folded: fold } : null,
      );
    },
    [props.id, folded],
  );
  // (a spot of -1 only remembers the fold: the panel stays in the layout)
  const placed = spot && spot.fx >= 0 ? spot : null;

  // the corner resize: a press that starts on the grip (the bottom-right corner) arms it, and the size the panel has when the press
  // ends is remembered (a size that only grew with its content is never saved)
  const resizing = useRef(false);
  const onPanelDown = (e: React.PointerEvent): void => {
    const el = box.current;
    if (!el || folded) return;
    const r = el.getBoundingClientRect();
    resizing.current = e.clientX > r.right - 18 && e.clientY > r.bottom - 18;
  };
  useEffect(() => {
    const done = (): void => {
      if (!resizing.current) return;
      resizing.current = false;
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      keep({
        fx: placed?.fx ?? r.left / window.innerWidth,
        fy: placed?.fy ?? r.top / window.innerHeight,
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    };
    // (the release can land anywhere: the grip is dragged past the panel's edge)
    window.addEventListener('pointerup', done);
    return () => window.removeEventListener('pointerup', done);
  }, [placed, keep]);

  // a smaller window never strands a panel off screen
  useEffect(() => {
    const onResize = (): void => setSpot((s) => (s ? { ...s } : s));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onDown = (e: React.PointerEvent): void => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button:not(.fpanel__title)')) return;
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false };
    dragged.current = false;
  };
  const onMove = (e: React.PointerEvent): void => {
    const d = drag.current;
    const el = box.current;
    if (!d || !el) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(window.innerWidth - r.width, e.clientX - d.dx));
    const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - d.dy));
    if (!d.moved && Math.abs(x - r.left) + Math.abs(y - r.top) < 4) return;
    if (!d.moved) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    d.moved = true;
    const next: Spot = {
      fx: x / window.innerWidth,
      fy: y / window.innerHeight,
      w: placed?.w ?? Math.round(r.width),
      ...(placed?.h !== undefined ? { h: placed.h } : {}),
    };
    latest.current = next;
    setSpot(next);
  };
  const onUp = (): void => {
    const d = drag.current;
    drag.current = null;
    dragged.current = !!d?.moved;
    if (d?.moved && latest.current) keep(latest.current);
  };

  const style: React.CSSProperties | undefined = placed
    ? {
        position: 'fixed',
        left: Math.min(placed.fx * window.innerWidth, window.innerWidth - 120),
        top: Math.min(placed.fy * window.innerHeight, window.innerHeight - 40),
        right: 'auto',
        bottom: 'auto',
        width: placed.w,
        ...(placed.h !== undefined && !folded ? { height: placed.h, maxHeight: 'none' } : {}),
      }
    : undefined;

  return (
    <section
      ref={box}
      className={`fpanel${placed ? ' is-moved' : ''}${folded ? ' is-folded' : ''} ${props.className ?? ''}`}
      style={style}
      onPointerDown={onPanelDown}
    >
      <header
        className="fpanel__head"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onDoubleClick={(e) => {
          // (a double-click on the Cards button is two clicks of that button, not "put it back")
          if ((e.target as HTMLElement).closest('button:not(.fpanel__title)')) return;
          keep(null);
        }}
        title="Drag to move, drag the corner to resize, double-click to put it back"
      >
        <button
          type="button"
          className="fpanel__title"
          aria-expanded={!folded}
          onClick={() => {
            if (dragged.current) return;
            const next = !folded;
            setFolded(next);
            save(
              props.id,
              placed ? { ...placed, folded: next } : next ? { fx: -1, fy: -1, folded: next } : null,
            );
          }}
        >
          <span>{props.title}</span>
          <small aria-hidden>{folded ? '+' : '–'}</small>
        </button>
        {props.extra}
      </header>
      {!folded && <div className="fpanel__body">{props.children}</div>}
    </section>
  );
}
