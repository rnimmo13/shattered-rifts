// The battle log panel: a scrollable history of the fight, newest at the bottom. It follows the newest line unless the player has
// scrolled up to read something, and it can be folded away. A Cards button opens a small panel beside it with the actual cards that
// were played or triggered, so a card that flashed past can be read again; it sits next to the log and never covers the duel.

import { useEffect, useRef, useState } from 'react';
import type { CombatDb } from '@sr/combat';
import { FightCard } from './FightCard';
import type { LogLine } from './logLines';

/** How many of the latest cards the Cards panel keeps. */
const CARD_LIMIT = 120;

export function BattleLog(props: { lines: readonly LogLine[]; db: CombatDb }) {
  // (folded on a phone, where the screen is better spent on the board)
  const [open, setOpen] = useState(() => window.innerHeight >= 600);
  const [cardsOpen, setCardsOpen] = useState(false);
  /** a card clicked in the panel, shown larger */
  const [zoom, setZoom] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLOListElement>(null);
  /** the player is reading older lines: do not yank them to the bottom */
  const reading = useRef(false);

  useEffect(() => {
    const el = box.current;
    if (el && open && !reading.current) el.scrollTop = el.scrollHeight;
  }, [props.lines, open]);

  // the cards of the fight so far, in the order they were played (oldest first, newest at the right)
  const cards = props.lines.filter((l) => l.card && props.db.cards[l.card]).slice(-CARD_LIMIT);
  // the strip opens at the newest card (the right end) and follows new ones; scroll left to read back
  const total = cards.length;
  useEffect(() => {
    const el = strip.current;
    if (el && cardsOpen) el.scrollLeft = el.scrollWidth;
  }, [cardsOpen, total]);

  useEffect(() => {
    if (!cardsOpen) return;
    const on = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setCardsOpen(false);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [cardsOpen]);

  const shown = zoom !== null ? cards.find((l) => l.id === zoom) : undefined;

  return (
    <>
      <aside className={`fight__log${open ? '' : ' is-folded'}`} aria-label="Battle log">
        <div className="fight__logHeadRow">
          <button
            type="button"
            className="fight__logHead"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span>Battle log</span>
            <small aria-hidden>{open ? '–' : '+'}</small>
          </button>
          <button
            type="button"
            className={`fight__logCardsBtn${cardsOpen ? ' is-on' : ''}`}
            aria-expanded={cardsOpen}
            onClick={() => {
              setCardsOpen(!cardsOpen);
              setZoom(null);
            }}
          >
            Cards{cards.length ? ` (${cards.length})` : ''}
          </button>
        </div>
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
            {props.lines.length === 0 && (
              <p className="fight__logEmpty">Nothing has happened yet.</p>
            )}
            {props.lines.map((l) => (
              <p key={l.id} className={`fight__logLine fight__logLine--${l.tone}`}>
                {l.text}
              </p>
            ))}
          </div>
        )}
      </aside>
      {cardsOpen && (
        <section className="fight__logCards" aria-label="Cards played this fight">
          <header>
            <b>Cards played, oldest to newest</b>
            <button type="button" aria-label="Close" onClick={() => setCardsOpen(false)}>
              ×
            </button>
          </header>
          {cards.length === 0 && <p className="fight__logEmpty">No cards yet.</p>}
          {shown?.card && props.db.cards[shown.card] && (
            <div className="fight__logZoom">
              <FightCard db={props.db} def={props.db.cards[shown.card]!} width={280} />
              <p className={`fight__logLine--${shown.tone}`}>{shown.text}</p>
            </div>
          )}
          <ol className="fight__logCardList" ref={strip}>
            {cards.map((l, n) => (
              <li key={l.id}>
                <button
                  type="button"
                  className={`fight__logCard fight__logCard--${l.tone}${zoom === l.id ? ' is-zoom' : ''}`}
                  title={l.text}
                  onClick={() => setZoom(zoom === l.id ? null : l.id)}
                >
                  <FightCard db={props.db} def={props.db.cards[l.card as string]!} width={150} />
                  <small>
                    <b>{n + 1}.</b> {l.text}
                  </small>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
