// A button that copies a link (a replay, or a match to watch); where the clipboard cannot be written, the link is shown to copy by hand.

import { useState } from 'react';
import { copyLink } from './matchHistory';
import './ranks.css';

export function ShareLink(props: { link: string; label: string; small?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'shown'>('idle');
  return (
    <span className="sharelink">
      <button
        className={`btn${props.small === false ? '' : ' btn--small'}`}
        onClick={() => {
          void copyLink(props.link).then((ok) => {
            setState(ok ? 'copied' : 'shown');
            if (ok) window.setTimeout(() => setState('idle'), 1800);
          });
        }}
      >
        <span>{state === 'copied' ? 'Link copied' : props.label}</span>
      </button>
      {state === 'shown' && (
        <input
          readOnly
          value={props.link}
          aria-label="The link to copy"
          onFocus={(e) => e.currentTarget.select()}
          autoFocus
        />
      )}
    </span>
  );
}
