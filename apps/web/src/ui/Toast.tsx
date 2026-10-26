// A message to the player (green good news, red bad news, plain information) that sits above everything else on the screen and can
// always be dismissed. Every toast goes into one stack at the top of the page (a portal on <body>), so a map, a deck or a fight
// never covers it, and two at once sit one under the other instead of on top of each other.

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './toast.css';

let root: HTMLElement | null = null;
/** The stack all toasts go into (made once). */
function stack(): HTMLElement {
  if (root && document.body.contains(root)) return root;
  root = document.createElement('div');
  root.className = 'toasts';
  document.body.appendChild(root);
  return root;
}

export function Toast(props: {
  tone?: 'good' | 'bad' | 'info';
  /** dismissing it: the owner forgets the message (without one, the toast hides itself) */
  onDismiss?: () => void;
  role?: 'alert' | 'status';
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const tone = props.tone ?? 'bad';
  return createPortal(
    <div
      className={`toast toast--${tone}`}
      role={props.role ?? (tone === 'bad' ? 'alert' : 'status')}
    >
      <div className="toast__body">{props.children}</div>
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss"
        onClick={() => (props.onDismiss ? props.onDismiss() : setHidden(true))}
      >
        ×
      </button>
    </div>,
    stack(),
  );
}

/** A coloured notice that stays where it is on a page (an error box with a Retry button), with a dismiss button. */
export function Notice(props: {
  tone?: 'good' | 'bad';
  className?: string;
  /** a dismissed notice shows again when this changes (a new message, another try) */
  showAgain?: unknown;
  children: ReactNode;
}) {
  const [dismissed, setDismissed] = useState<{ at: unknown } | null>(null);
  if (dismissed && dismissed.at === props.showAgain) return null;
  const setHidden = (_: true): void => setDismissed({ at: props.showAgain });
  return (
    <div
      className={`notice notice--dismissable${props.tone ? ` notice--${props.tone}` : ''}${props.className ? ` ${props.className}` : ''}`}
      role={props.tone === 'bad' ? 'alert' : 'status'}
    >
      <div className="notice__body">{props.children}</div>
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss"
        onClick={() => setHidden(true)}
      >
        ×
      </button>
    </div>
  );
}
