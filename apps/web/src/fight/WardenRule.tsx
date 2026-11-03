// A Warden's rule (DECISIONS #528): shown in full as the fight starts, then, once read, folded down to its name, which opens it
// again (DECISIONS #562). It used to stay a whole sentence under the title, and on a phone it covered the enemies' intents.

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { splitRule } from './ruleText';

const KEY = 'sr.rulesRead';

/** The rules read this session: a retry of the same Warden starts folded. */
function readBefore(name: string): boolean {
  try {
    return (JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as string[]).includes(name);
  } catch {
    return false;
  }
}
function markRead(name: string): void {
  try {
    const seen = JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as string[];
    if (!seen.includes(name)) sessionStorage.setItem(KEY, JSON.stringify([...seen, name]));
  } catch {
    /* storage can be unavailable (private windows): it simply opens again next fight */
  }
}

/**
 * The rule's name as a button on the line under the title, and, while open, the rule in full. The card goes to the page's top
 * level: the title is placed with a translate, which would hold a fixed card inside it.
 */
export function WardenRule({ rule, portrait }: { rule: string; portrait: boolean }) {
  const { name, text } = splitRule(rule);
  const [open, setOpen] = useState(() => !readBefore(name));
  const close = (): void => {
    markRead(name);
    setOpen(false);
  };
  return (
    <>
      <button
        type="button"
        className={`fight__stakes fight__stakes--info fight__rulePill${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls="warden-rule"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span aria-hidden>⚑</span> {name}
      </button>
      {open &&
        createPortal(
          <div
            id="warden-rule"
            className={`fight__ruleCard${portrait ? ' is-portrait' : ''}`}
            role="note"
          >
            <span className="fight__ruleKicker">Warden rule</span>
            <b>{name}</b>
            <p>{text}</p>
            <button type="button" className="btn btn--small btn--primary" onClick={close}>
              <span>Got it</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
