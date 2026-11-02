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

/** How long a finger rests on something before its tip shows. */
const LONG_PRESS_MS = 450;

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
  /** the tip showing was opened by a long press (it stays when the finger lifts) */
  const held = useRef(false);
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
      // (a tip a long press opened stays up when the finger lifts: the next touch anywhere closes it)
      if (held.current && (e as PointerEvent).pointerType === 'touch') return;
      const from = (e.target as Element | null)?.closest?.('[data-tip]');
      const to = ((e as PointerEvent).relatedTarget as Element | null)?.closest?.('[data-tip]');
      if (from && from !== to) hide();
    };
    // a touch screen has no hover: a long press on anything with a tip shows it, as a mouse resting on it would (Robert, 2026-11-02),
    // and the press does nothing else (the click after it is swallowed). The hand's cards have a long press of their own (lift to read).
    const press = {
      timer: 0,
      x: 0,
      y: 0,
      on: false,
      fire: null as null | (() => void),
      swallow: null as null | ((ev: Event) => void),
    };
    const cancelPress = (): void => {
      window.clearTimeout(press.timer);
      press.on = false;
      press.fire = null;
    };
    const unswallow = (): void => {
      if (press.swallow) window.removeEventListener('click', press.swallow, true);
      press.swallow = null;
    };
    const down = (e: PointerEvent): void => {
      held.current = false;
      hide();
      cancelPress();
      // (a long press that ended with no click must not eat the next tap's)
      unswallow();
      // (only a finger: a mouse hovers, and a pen's press and hold is its own right click)
      if (e.pointerType !== 'touch') return;
      const target = e.target as Element | null;
      // (a touch anywhere else closes a focused element's own tip: the board takes no focus, so nothing else would)
      const focused = document.activeElement as HTMLElement | null;
      if (focused?.hasAttribute('data-press-focus') && !focused.contains(target)) focused.blur();
      // (an element whose own tip shows on hover or focus, as an enemy's intent does, is focused instead)
      const own = target?.closest?.('[data-press-focus]') as HTMLElement | null;
      const el = own ?? (target?.closest?.('[data-tip]') as HTMLElement | null);
      if (!el || el.closest('.fhand')) return;
      const content = own ? null : parse(el.getAttribute('data-tip'));
      if (!own && !content) return;
      press.x = e.clientX;
      press.y = e.clientY;
      press.on = true;
      press.fire = (): void => {
        cancelPress();
        held.current = true;
        navigator.vibrate?.(10);
        if (own || !content) {
          own?.focus({ preventScroll: true });
          return;
        }
        setPos(null);
        setOpen({ el, content, rect: el.getBoundingClientRect() });
      };
      press.timer = window.setTimeout(() => press.fire?.(), LONG_PRESS_MS);
    };
    const move = (e: PointerEvent): void => {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) cancelPress();
    };
    const up = (): void => {
      cancelPress();
      if (!held.current) return;
      // (the press read a tip: the tap it ends must not also press the button under it)
      unswallow();
      const swallow = (ev: Event): void => {
        ev.preventDefault();
        ev.stopPropagation();
        unswallow();
      };
      press.swallow = swallow;
      window.addEventListener('click', swallow, true);
      window.setTimeout(() => press.swallow === swallow && unswallow(), 400);
    };
    // (nor open the browser's own menu: a browser that sees the long press first, as Chrome does at about 400 ms, shows the tip then)
    const menu = (e: Event): void => {
      if (!held.current && !press.on) return;
      e.preventDefault();
      press.fire?.();
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    document.addEventListener('focusin', over);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', down);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', cancelPress);
    document.addEventListener('contextmenu', menu);
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
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', cancelPress);
      document.removeEventListener('contextmenu', menu);
      cancelPress();
      unswallow();
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
