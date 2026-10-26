// Who you are, at the top right of the home page: your username, or a short nudge to choose one. Opening it lets you change the
// name and sign in or out (signing in keeps your decks on any device). The name is the one the boards and the Arena show.
//
// When the game ships on Steam the name will come from the player's Steam profile (DECISIONS #254): this chip is where it shows,
// and the "change" form is the part that goes away there.

import { useEffect, useRef, useState } from 'react';
import { getName, hasUsername } from '../pvp/config';
import { NameClaim } from '../pvp/NameClaim';
import { AccountBox } from '../pvp/AccountBox';
import type { Me } from '../pvp/vaultSync';

export function PlayerChip(props: { me: Me; onSignedOut: () => void }) {
  const [name, setName] = useState<string | null>(() => (hasUsername() ? getName() : null));
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // the panel closes on Escape or a click anywhere else
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent): void => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', key);
    };
  }, [open]);

  return (
    <div className="playerchip" ref={box}>
      {name ? (
        <button
          type="button"
          className="playerchip__me"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(!open)}
        >
          <span className="playerchip__initial" aria-hidden>
            {name.slice(0, 1).toUpperCase()}
          </span>
          <b>{name}</b>
          <span className="playerchip__caret" aria-hidden>
            ▾
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="playerchip__ask"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(!open)}
        >
          Choose a username
        </button>
      )}
      {open && (
        <div className="playerchip__panel" role="dialog" aria-label="Your profile">
          <p className="playerchip__lead">
            {name
              ? 'This is the name on the leaderboards and in the Arena. No two players share one.'
              : 'Pick the name the leaderboards and your Arena opponents will see. No two players share one.'}
          </p>
          <NameClaim
            label="Username"
            button={name ? 'Change username' : 'Save username'}
            onDone={(n) => {
              setName(n);
              setOpen(false);
            }}
          />
          {(props.me.signedIn || props.me.available) && (
            <div className="playerchip__account">
              <AccountBox me={props.me} to="home" onSignedOut={props.onSignedOut} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
