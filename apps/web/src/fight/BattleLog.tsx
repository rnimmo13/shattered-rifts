// The battle log panel: a scrollable history of the fight, newest at the bottom. It follows the newest line unless the player has
// scrolled up to read something, and it can be folded away.

import { useEffect, useRef, useState } from 'react';
import type { LogLine } from './logLines';

export function BattleLog(props: { lines: readonly LogLine[] }) {
  // (folded on a phone, where the screen is better spent on the board)
  const [open, setOpen] = useState(() => window.innerHeight >= 600);
  const box = useRef<HTMLDivElement>(null);
  /** the player is reading older lines: do not yank them to the bottom */
  const reading = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (el && open && !reading.current) el.scrollTop = el.scrollHeight;
  }, [props.lines, open]);

  return (
    <aside className={`fight__log${open ? '' : ' is-folded'}`} aria-label="Battle log">
      <button
        type="button"
        className="fight__logHead"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>Battle log</span>
        <small aria-hidden>{open ? '\u2013' : '+'}</small>
      </button>
      {open && (
        <div
          ref={box}
          className="fight__logBody"
          role="log"
          aria-live="off"
          onScroll={(e) => {
            const el = e.currentTarget;
            reading.current = el.scrollHeight - el.scrollTop - el.clientHeight > 24;
          }}
        >
          {props.lines.length === 0 && <p className="fight__logEmpty">Nothing has happened yet.</p>}
          {props.lines.map((l) => (
            <p key={l.id} className={`fight__logLine fight__logLine--${l.tone}`}>
              {l.text}
            </p>
          ))}
        </div>
      )}
    </aside>
  );
}
