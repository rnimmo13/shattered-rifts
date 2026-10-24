// Sign in with Google: the account owns the saved decks, so they follow the player to any browser without a Vault code. Only the
// game's own address can sign in (the session is a cookie); no name or email is kept, see docs/11_PVP.md.

import { useState } from 'react';
import { signInUrl, signOut, type Me } from './vaultSync';

export function AccountBox(props: { me: Me; onSignedOut: () => void }) {
  const [busy, setBusy] = useState(false);
  const { me } = props;
  if (me.signedIn)
    return (
      <section className="pvp__account" aria-label="Account">
        <span>Signed in with Google. Your decks are saved to your account.</span>
        <button
          type="button"
          className="btn btn--small"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void signOut().then(props.onSignedOut);
          }}
        >
          <span>Sign out</span>
        </button>
      </section>
    );
  if (!me.available) return null;
  return (
    <section className="pvp__account" aria-label="Account">
      <span>Sign in to keep your decks on any device. We keep no name or email.</span>
      <a className="btn btn--small" href={signInUrl()}>
        <span>Sign in with Google</span>
      </a>
    </section>
  );
}
