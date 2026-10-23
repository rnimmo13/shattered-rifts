// One tooltip layer for the whole game. Any element opts in with data attributes (see tipAttrs), so there are no wrapper
// elements to disturb layout and no per-element state. The tooltip is drawn in a portal, never takes the pointer (so it cannot
// flicker the thing under it), stays inside the screen, and flips below an element when there is no room above.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TipContent } from './tip';

interface Open {
  el: HTMLElement;
  content: TipContent;
  rect: DOMRect;
}

const parse = (raw: string | null): TipContent | null => {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as TipContent;
    return typeof c.title === 'string' ? c : null;
  } catch {
    return null;
  }
};

/** Mount once, near the root of the app. */
export function TooltipLayer() {
  const [open, setOpen] = useState<Open | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const show = (el: HTMLElement): void => {
      const content = parse(el.getAttribute('data-tip'));
      if (!content) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setPos(null);
        setOpen({ el, content, rect: el.getBoundingClientRect() });
      }, 80);
    };
    const hide = (): void => {
      window.clearTimeout(timer.current);
      setOpen(null);
      setPos(null);
    };
    const over = (e: Event): void => {
      const el = (e.target as Element | null)?.closest?.('[data-tip]') as HTMLElement | null;
      if (el) show(el);
    };
    const out = (e: Event): void => {
      const from = (e.target as Element | null)?.closest?.('[data-tip]');
      const to = ((e as PointerEvent).relatedTarget as Element | null)?.closest?.('[data-tip]');
      if (from && from !== to) hide();
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    document.addEventListener('focusin', over);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    // the element can be replaced while the pointer is still over where it was: close if it is gone
    const watch = window.setInterval(() => {
      setOpen((o) => (o && !o.el.isConnected ? null : o));
    }, 250);
    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      document.removeEventListener('focusin', over);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('pointerdown', hide);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      window.clearInterval(watch);
      window.clearTimeout(timer.current);
    };
  }, []);

  // measure the tooltip, then put it above the element (below if there is no room), inside the screen
  useLayoutEffect(() => {
    if (!open || !box.current) return;
    const b = box.current.getBoundingClientRect();
    const gap = 10;
    const margin = 8;
    const r = open.rect;
    let top = r.top - b.height - gap;
    if (top < margin) top = r.bottom + gap;
    if (top + b.height > window.innerHeight - margin)
      top = Math.max(margin, window.innerHeight - b.height - margin);
    let left = r.left + r.width / 2 - b.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - b.width - margin));
    setPos({ left, top });
  }, [open]);

  if (!open) return null;
  const c = open.content;
  return createPortal(
    <div
      ref={box}
      className={`tip tip--${c.tone ?? 'plain'}`}
      role="tooltip"
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
    >
      {c.kicker && <small className="tip__kicker">{c.kicker}</small>}
      <b className="tip__title">{c.title}</b>
      {c.text && <p className="tip__text">{c.text}</p>}
      {c.lines?.map((l) => (
        <p key={l.title} className="tip__line">
          <b>{l.title}</b> {l.text}
        </p>
      ))}
      {c.hint && <small className="tip__hint">{c.hint}</small>}
    </div>,
    document.body,
  );
}
